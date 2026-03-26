import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  logo_url?: string;
  plan_id: string;
  billing_cycle: string;
  credits_balance: number;
  plan_start_date: string;
  created_at: string;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'team' | 'client';
  permissions: any;
  created_at: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (ws: Workspace) => void;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  getWorkspaceMembers: (workspaceId: string) => Promise<WorkspaceMember[]>;
  addWorkspaceMember: (workspaceId: string, email: string, role: 'team' | 'client') => Promise<void>;
  removeWorkspaceMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: 'team' | 'client') => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const isCreatingDefaultRef = useRef(false);

  const refreshWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch workspaces where user is owner
      const { data: ownedData, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.uid);

      if (ownedError) throw ownedError;

      // 2. Fetch workspaces where user is a member (by user_id OR email)
      // We join with workspaces to get details in one go
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(*)')
        .or(`user_id.eq.${user.uid},email.ilike.${user.email}`);
      
      if (memberError) throw memberError;

      const fetchedWorkspaces = ownedData || [];

      if (memberData && memberData.length > 0) {
          memberData.forEach(m => {
              if (m.workspaces) {
                  const ws = m.workspaces as any;
                  // Merge and remove duplicates
                  const wsId = Array.isArray(ws) ? ws[0]?.id : ws?.id;
                  if (wsId && !fetchedWorkspaces.find(existing => existing.id === wsId)) {
                      fetchedWorkspaces.push(Array.isArray(ws) ? ws[0] : ws);
                  }
              }
          });
      }
      
      if (fetchedWorkspaces.length === 0) {
        // Create default workspace if none exists
        if (isCreatingDefaultRef.current) return;
        
        // Double check with a fresh query to avoid race conditions between multiple calls
        const { data: existingOwned } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', user.uid)
          .limit(1);
          
        if (existingOwned && existingOwned.length > 0) {
          setWorkspaces(existingOwned);
          setCurrentWorkspaceState(existingOwned[0]);
          localStorage.setItem('agencyos_current_workspace_id', existingOwned[0].id);
          return;
        }

        isCreatingDefaultRef.current = true;
        
        try {
          // Fetch existing workspace or subscription to inherit plan and credits
          const { data: existingWs } = await supabase
            .from('workspaces')
            .select('plan_id, credits_balance, billing_cycle')
            .eq('owner_id', user.uid)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan_id, billing_cycle')
            .eq('owner_id', user.uid)
            .maybeSingle();

          const newId = crypto.randomUUID();
          const newWsData = {
               id: newId,
               owner_id: user.uid, 
               name: (user.name || 'User') + "'s Agency",
               plan_id: sub?.plan_id || existingWs?.plan_id || 'free',
               billing_cycle: sub?.billing_cycle || existingWs?.billing_cycle || 'monthly',
               credits_balance: existingWs?.credits_balance || 0 
          };
          
          const { error: createError } = await supabase
            .from('workspaces')
            .insert([newWsData]);
            
          if (createError) throw createError;
          
          // Ensure owner is in workspace_members and team_member
          await supabase.from('workspace_members').upsert([{
            workspace_id: newId,
            user_id: user.uid,
            email: user.email,
            role: 'owner',
            permissions: { all: 'edit' }
          }]);

          await supabase.from('team_member').upsert([{
            workspace_id: newId,
            id: user.uid,
            name: user.name || 'Admin',
            email: user.email,
            role: 'admin',
            avatar: user.avatar
          }]);

          const newWs: Workspace = {
              ...newWsData,
              billing_cycle: 'monthly',
              plan_start_date: new Date().toISOString(),
              created_at: new Date().toISOString()
          };
          
          setWorkspaces([newWs]);
          setCurrentWorkspaceState(newWs);
          localStorage.setItem('agencyos_current_workspace_id', newWs.id);
        } finally {
          isCreatingDefaultRef.current = false;
        }
      } else {
        setWorkspaces(fetchedWorkspaces);
        const savedId = localStorage.getItem('agencyos_current_workspace_id');
        const savedWs = fetchedWorkspaces.find(ws => ws.id === savedId);
        if (savedWs) {
          setCurrentWorkspaceState(savedWs);
        } else {
          setCurrentWorkspaceState(fetchedWorkspaces[0]);
          localStorage.setItem('agencyos_current_workspace_id', fetchedWorkspaces[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWorkspaces();
    
    const handleRefresh = () => {
      refreshWorkspaces();
    };
    
    window.addEventListener('agencyos_config_updated', handleRefresh);
    window.addEventListener('agencyos_workspace_updated', handleRefresh);
    
    return () => {
      window.removeEventListener('agencyos_config_updated', handleRefresh);
      window.removeEventListener('agencyos_workspace_updated', handleRefresh);
    };
  }, [refreshWorkspaces]);

  const setCurrentWorkspace = (ws: Workspace) => {
    setCurrentWorkspaceState(ws);
    localStorage.setItem('agencyos_current_workspace_id', ws.id);
    
    // Notify system of change
    window.dispatchEvent(new Event('agencyos_workspace_changed'));
  };

  const createWorkspace = async (name: string) => {
    if (!user) return null;
    try {
      // 1. Check workspace limit from subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('workspaces_limit, plan_id')
        .eq('owner_id', user.uid)
        .maybeSingle();
      
      const { data: existingWorkspaces, count } = await supabase
        .from('workspaces')
        .select('credits_balance', { count: 'exact' })
        .eq('owner_id', user.uid);

      // Get base limit from constants if not in sub
      const planId = sub?.plan_id || 'free';
      const { AVAILABLE_PLANS } = await import('../constants');
      const basePlan = AVAILABLE_PLANS.find(p => p.id === planId) || AVAILABLE_PLANS[0];
      const limit = sub?.workspaces_limit ?? basePlan.workspacesLimit;
      
      // Check for duplicate name
      const { data: existing } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.uid)
          .ilike('name', name.trim())
          .maybeSingle();

      if (existing) {
          alert(`A workspace with the name "${name}" already exists.`);
          return null;
      }

      if (limit !== -1 && count !== null && count >= limit) {
        alert(`Workspace limit reached (${limit}). Upgrade your plan to create more workspaces.`);
        return null;
      }

      const currentCredits = existingWorkspaces && existingWorkspaces.length > 0 
        ? existingWorkspaces[0].credits_balance 
        : 100;

      const newId = crypto.randomUUID();
      const newWsData = {
         id: newId,
         owner_id: user.uid, 
         name: name,
         plan_id: planId, // Inherit plan from owner
         credits_balance: currentCredits 
      };

      const { error } = await supabase
        .from('workspaces')
        .insert([newWsData]);
        
      if (error) throw error;

      // Ensure owner is in workspace_members and team_member
      await supabase.from('workspace_members').upsert([{
        workspace_id: newId,
        user_id: user.uid,
        email: user.email,
        role: 'owner',
        permissions: { all: 'edit' }
      }]);

      await supabase.from('team_member').upsert([{
        workspace_id: newId,
        id: user.uid,
        name: user.name || 'Admin',
        email: user.email,
        role: 'admin',
        avatar: user.avatar
      }]);
      
      const newWs: Workspace = {
          ...newWsData,
          billing_cycle: 'monthly',
          plan_start_date: new Date().toISOString(),
          created_at: new Date().toISOString()
      };
      
      await refreshWorkspaces();
      setCurrentWorkspace(newWs);
      return newWs;
    } catch (err) {
      console.error("Error creating workspace:", err);
    }
    return null;
  };

  const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      await refreshWorkspaces();
    } catch (err) {
      console.error("Error updating workspace:", err);
    }
  };

  const deleteWorkspace = async (id: string) => {
    if (!user || workspaces.length <= 1) return;
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      if (currentWorkspace?.id === id) {
        const nextWs = workspaces.find(ws => ws.id !== id);
        if (nextWs) setCurrentWorkspace(nextWs);
      }
      
      await refreshWorkspaces();
    } catch (err) {
      console.error("Error deleting workspace:", err);
    }
  };

  const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching members:", err);
      return [];
    }
  };

  const addWorkspaceMember = async (workspaceId: string, email: string, role: 'team' | 'client') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .insert([{
          workspace_id: workspaceId,
          email: email.toLowerCase(),
          role: role,
          permissions: role === 'team' ? { all: 'view' } : { requests: 'view' }
        }]);
      
      if (error) throw error;
    } catch (err) {
      console.error("Error adding member:", err);
      throw err;
    }
  };

  const removeWorkspaceMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    } catch (err) {
      console.error("Error removing member:", err);
      throw err;
    }
  };

  const updateMemberRole = async (memberId: string, role: 'team' | 'client') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
    } catch (err) {
      console.error("Error updating member role:", err);
      throw err;
    }
  };

  return (
    <WorkspaceContext.Provider value={{ 
      workspaces, 
      currentWorkspace, 
      setCurrentWorkspace, 
      loading, 
      refreshWorkspaces, 
      createWorkspace, 
      updateWorkspace, 
      deleteWorkspace,
      getWorkspaceMembers,
      addWorkspaceMember,
      removeWorkspaceMember,
      updateMemberRole
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
