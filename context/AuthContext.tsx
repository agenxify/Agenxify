import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types.ts';
import { supabase } from '../supabase.ts';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  isAuthorized: (requiredRole?: UserRole | UserRole[]) => boolean;
  hasPermission: (moduleId: string) => boolean;
  canEdit: (moduleId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: Synchronize Supabase Auth User with our Database Profile
  const syncProfile = async (sessionUser: any, workspaceIdOverride?: string): Promise<UserProfile> => {
      const basicProfile: UserProfile = {
          uid: sessionUser.id,
          email: sessionUser.email || '',
          name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
          role: 'team', 
          avatar: sessionUser.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${sessionUser.id}`,
          lastLogin: sessionUser.last_sign_in_at || new Date().toISOString(),
          allowedPageIds: []
      };

      try {
          let currentWorkspaceId = workspaceIdOverride || localStorage.getItem('agencyos_current_workspace_id');

          // If no workspace ID, try to find the first workspace where they are an owner or a member
          if (!currentWorkspaceId) {
              const { data: ownedWorkspaces } = await supabase
                  .from('workspaces')
                  .select('id')
                  .eq('owner_id', sessionUser.id)
                  .order('created_at', { ascending: true })
                  .limit(1);
              
              if (ownedWorkspaces && ownedWorkspaces.length > 0) {
                  currentWorkspaceId = ownedWorkspaces[0].id;
              } else {
                  // Check memberships
                  const { data: memberships } = await supabase
                      .from('workspace_members')
                      .select('workspace_id')
                      .or(`user_id.eq.${sessionUser.id},email.ilike.${sessionUser.email}`)
                      .order('created_at', { ascending: true })
                      .limit(1);
                  
                  if (memberships && memberships.length > 0) {
                      currentWorkspaceId = memberships[0].workspace_id;
                  }
              }

              if (currentWorkspaceId) {
                  localStorage.setItem('agencyos_current_workspace_id', currentWorkspaceId);
              }
          }

          console.log(`[Auth] Syncing profile for ${sessionUser.email} in workspace ${currentWorkspaceId}`);

          // 1. Get workspace membership for current workspace
          if (currentWorkspaceId) {
              // Try by user_id first, then by email as fallback (for unlinked invites)
              let { data: memberData } = await supabase
                  .from('workspace_members')
                  .select('id, role, permissions')
                  .eq('user_id', sessionUser.id)
                  .eq('workspace_id', currentWorkspaceId)
                  .maybeSingle();
              
              if (!memberData && sessionUser.email) {
                  const { data: emailMember } = await supabase
                      .from('workspace_members')
                      .select('id, role, permissions')
                      .ilike('email', sessionUser.email)
                      .eq('workspace_id', currentWorkspaceId)
                      .maybeSingle();
                  memberData = emailMember;
              }

              if (memberData) {
                  // Link user_id if missing
                  if (!memberData.user_id && sessionUser.id) {
                      console.log(`Linking user_id ${sessionUser.id} to workspace_member ${memberData.id}`);
                      await supabase
                          .from('workspace_members')
                          .update({ user_id: sessionUser.id })
                          .eq('id', memberData.id);
                      
                      // Also update team_member if it exists with a random UUID
                      if (memberData.role !== 'client') {
                          const { data: teamData } = await supabase
                              .from('team_member')
                              .select('id')
                              .ilike('email', sessionUser.email!)
                              .eq('workspace_id', currentWorkspaceId)
                              .maybeSingle();
                          
                          if (teamData && teamData.id !== sessionUser.id) {
                              // We can't easily change the primary key 'id' if it's used elsewhere,
                              // but we can try to upsert with the correct ID and delete the old one,
                              // or just add a user_id column if we had one.
                              // Since 'id' is the PK and used as userId in the app, let's try to fix it.
                              console.log(`Attempting to sync team_member ID for ${sessionUser.email}`);
                              // Note: This might fail if RLS is strict or if there are FKs.
                              // A better way is to have a separate user_id column, but let's try to update the existing one if possible.
                          }
                      }
                  }

                  let name = basicProfile.name;
                  let avatar = basicProfile.avatar;
                  let organization = '';
                  let modulePermissions = memberData.permissions || {};
                  let allowedPageIds: string[] = [];

                  // Fetch page permissions
                  const { data: pagePerms } = await supabase
                      .from('page_permissions')
                      .select('page_id')
                      .eq('member_id', memberData.id);
                  
                  if (pagePerms && pagePerms.length > 0) {
                      allowedPageIds = pagePerms.map(p => p.page_id);
                  }

                  if (memberData.role === 'client') {
                      const { data: clientData } = await supabase
                          .from('clients')
                          .select('*')
                          .ilike('email', sessionUser.email)
                          .eq('workspace_id', currentWorkspaceId)
                          .maybeSingle();
                      
                      if (clientData) {
                          name = clientData.name || name;
                          avatar = clientData.avatar || avatar;
                          organization = clientData.company || organization;
                          // Only overwrite if clientData has actual permissions defined
                          if (clientData.module_permissions && Object.keys(clientData.module_permissions).length > 0) {
                              modulePermissions = clientData.module_permissions;
                          }
                      }
                  } else {
                      const { data: teamData } = await supabase
                          .from('team_member')
                          .select('*')
                          .ilike('email', sessionUser.email)
                          .eq('workspace_id', currentWorkspaceId)
                          .maybeSingle();
                          
                      if (teamData) {
                          name = teamData.name || name;
                          avatar = teamData.avatar || avatar;
                          organization = teamData.department || organization;
                          // Only overwrite if teamData has actual permissions defined
                          if (teamData.module_permissions && Object.keys(teamData.module_permissions).length > 0) {
                              modulePermissions = teamData.module_permissions;
                          }
                      }
                  }

                  const finalProfile = {
                      ...basicProfile,
                      name,
                      avatar,
                      organization,
                      role: memberData.role === 'owner' ? 'admin' : (memberData.role as UserRole),
                      isAdmin: memberData.role === 'owner' || memberData.role === 'admin',
                      isOwner: memberData.role === 'owner', // If their role in workspace_members is 'owner', they are the owner
                      modulePermissions,
                      allowedPageIds
                  };
                  console.log(`[Auth] Profile synced for ${sessionUser.email}:`, {
                      role: finalProfile.role,
                      isAdmin: finalProfile.isAdmin,
                      isOwner: finalProfile.isOwner,
                      allowedPageIds: finalProfile.allowedPageIds
                  });
                  return finalProfile;
              }

              // 2. If no membership found, check if they are the owner of the workspace directly
              const { data: workspaceData } = await supabase
                  .from('workspaces')
                  .select('owner_id')
                  .eq('id', currentWorkspaceId)
                  .maybeSingle();
              
              if (workspaceData && workspaceData.owner_id === sessionUser.id) {
                  return {
                      ...basicProfile,
                      role: 'admin',
                      isAdmin: true,
                      isOwner: true,
                      modulePermissions: { all: 'edit' } as any
                  };
              }
          }

          // 3. Fallback: If no workspace context or membership, return basic profile with 'team' role
          // We no longer search across ALL workspaces to avoid permission leakage.
          return basicProfile;

      } catch (err) {
          console.warn("Profile Sync Skipped (Using Basic Auth):", err);
          return basicProfile;
      }
  };

  useEffect(() => {
    const handleWorkspaceChange = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const profile = await syncProfile(data.session.user);
        setUser(profile);
      }
    };

    window.addEventListener('agencyos_workspace_changed', handleWorkspaceChange);
    return () => window.removeEventListener('agencyos_workspace_changed', handleWorkspaceChange);
  }, []);

  useEffect(() => {
  let mounted = true;

  const initialize = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!mounted) return;

      if (data.session?.user) {
        // SET BASIC USER IMMEDIATELY
        const basicUser = {
          uid: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.email?.split('@')[0] || 'User',
          role: 'team',
          avatar: `https://i.pravatar.cc/150?u=${data.session.user.id}`,
          lastLogin: new Date().toISOString(),
          allowedPageIds: []
        };

        setUser(basicUser);
        setLoading(false);

        // SYNC PROFILE IN BACKGROUND (DON'T BLOCK UI)
        syncProfile(data.session.user)
          .then(profile => {
            if (mounted) setUser(profile);
          })
          .catch((err) => {
            console.warn("Background Sync Error:", err);
          });

      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
      localStorage.removeItem('agencify-auth-token');
      if (mounted) setLoading(false);
    }
  };

  initialize();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setLoading(false);

        syncProfile(session.user)
          .then(async profile => {
            if (mounted) setUser(profile);
            
            // Link any pending workspace invitations by email
            if (session.user.email) {
                await supabase.from('workspace_members')
                    .update({ user_id: session.user.id })
                    .ilike('email', session.user.email)
                    .is('user_id', null);
            }
          })
          .catch((err) => {
             console.warn("Auth State Sync Error:", err);
          });
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  );

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
  };

  const signup = async (email: string, pass: string, name: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
          role: role, 
          avatar_url: `https://i.pravatar.cc/150?u=${Date.now()}`
        }
      }
    });
    if (error) {
      console.error("Signup error details:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
  };

  const sendMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAuthorized = (requiredRole?: UserRole | UserRole[]) => {
    if (!user) return false;
    if (!requiredRole) return true;
    if (Array.isArray(requiredRole)) return requiredRole.includes(user.role);
    return user.role === requiredRole;
  };

  const hasPermission = (moduleId: string) => {
    if (!user) return false;
    
    // Workspace owner has full access to everything
    if (user.isOwner) return true;
    
    // Clients should never see the pages management module
    if (user.role === 'client' && moduleId === 'pages') return false;
    
    // Admins have full access to modules (except potentially restricted ones)
    if (user.isAdmin) return true;
    
    const perms = user.modulePermissions || {};
    
    const checkPerm = (perm: any) => {
        if (Array.isArray(perm)) {
            return perm.includes('view') || perm.includes('edit');
        }
        return perm === 'view' || perm === 'edit';
    };

    if (perms['all'] && checkPerm(perms['all'])) return true;
    
    return checkPerm(perms[moduleId]);
  };

  const canEdit = (moduleId: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const perms = user.modulePermissions || {};
    
    const checkEdit = (perm: any) => {
        if (Array.isArray(perm)) {
            return perm.includes('edit');
        }
        return perm === 'edit';
    };

    if (perms['all'] && checkEdit(perms['all'])) return true;
    
    return checkEdit(perms[moduleId]);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, resetPassword, sendMagicLink, logout, updateUser, isAuthorized, hasPermission, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};