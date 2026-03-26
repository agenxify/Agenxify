
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

export const useTeam = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { getLimit, checkSharedLimit } = usePlanEnforcement();

  const fetchMembers = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_member') // Singular table name
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB to Frontend Profile type
      const mapped: Profile[] = await Promise.all((data || []).map(async (m: any) => {
        // Fetch the user_id from workspace_members which is linked during login
        const { data: memberData } = await supabase.from('workspace_members')
            .select('id, user_id, role, permissions')
            .eq('workspace_id', currentWorkspace.id)
            .ilike('email', m.email)
            .maybeSingle();
            
        const member = memberData;
        const userId: string | null = member?.user_id || null; 
        const isAdmin = member?.role === 'owner' || member?.role === 'admin';
        const modulePermissions = member?.permissions || {};
        
        let allowedPageIds: string[] = [];
        if (member) {
            const { data: perms } = await supabase.from('page_permissions')
                .select('page_id')
                .eq('member_id', member.id);
            allowedPageIds = (perms || []).map(p => p.page_id);
        }

        return {
          id: m.id,
          userId: userId, // Added userId
          name: m.name,
          role: m.role || 'Member',
          department: m.department,
          avatar: m.avatar || `https://i.pravatar.cc/150?u=${m.id}`,
          email: m.email,
          phone: m.phone || '',
          bio: m.bio,
          location: m.location,
          joinDate: new Date(m.joined_at).toLocaleDateString(),
          status: m.status || 'Offline',
          skills: m.skills || [],
          stats: m.stats || { projects: 0, tasks: 0, activity: 0 },
          // Extra fields used in editing
          isDraft: m.is_draft,
          manager: m.manager,
          level: m.level,
          contractType: m.contract_type,
          salary: m.salary,
          startDate: m.start_date,
          modulePermissions: modulePermissions,
          allowedPageIds: allowedPageIds,
          isAdmin: isAdmin
        };
      }));

      setMembers(mapped);
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const addMember = async (member: Partial<Profile> & any) => {
    if (!user || !currentWorkspace) return;

    const canCreate = await checkSharedLimit('team_member', 'seatLimit');
    if (!canCreate) {
      alert(`Seat limit reached across all your workspaces. Upgrade your plan to add more team members.`);
      return;
    }

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const newMember = { ...member, id: tempId };
    setMembers(prev => [newMember, ...prev]);

    const payload = {
        workspace_id: currentWorkspace.id,
        owner_id: user.uid,
        name: member.name,
        email: member.email ? member.email.toLowerCase() : member.email,
        role: member.role,
        department: member.department,
        avatar: member.avatar,
        location: member.location,
        timezone: member.timezone,
        bio: member.bio,
        skills: member.skills,
        manager: member.manager,
        level: member.level,
        contract_type: member.contractType,
        salary: member.salary,
        start_date: member.startDate,
        is_draft: member.isDraft || false,
        socials: { 
            twitter: member.twitter || '', 
            github: member.github || '', 
            linkedin: member.linkedin || '' 
        }
    };

    const { error } = await supabase.from('team_member').insert([payload]);
    
    // Also add to workspace_members to grant access
    const { data: memberData, error: memberError } = await supabase.from('workspace_members').upsert([{
        workspace_id: currentWorkspace.id,
        email: member.email.toLowerCase(),
        role: member.isAdmin ? 'admin' : 'team',
        permissions: member.isAdmin ? { all: 'edit' } : (member.modulePermissions || { all: 'view' })
    }], { onConflict: 'workspace_id, email' }).select().maybeSingle();
    
    if (memberData && member.allowedPageIds && member.allowedPageIds.length > 0) {
        const permissions = member.allowedPageIds.map((pageId: string) => ({
            page_id: pageId,
            member_id: memberData.id,
            can_view: true
        }));
        await supabase.from('page_permissions').insert(permissions);
    }
    
    if (error) {
        console.error("Error adding member:", error);
        fetchMembers(); // Revert
    } else {
        fetchMembers(); // Refresh to get real ID
    }
  };

  const updateMember = async (id: string, updates: Partial<Profile> & any) => {
    // Optimistic
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));

    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.role) payload.role = updates.role;
    if (updates.department) payload.department = updates.department;
    if (updates.email) payload.email = updates.email;
    if (updates.avatar) payload.avatar = updates.avatar;
    if (updates.skills) payload.skills = updates.skills;
    if (updates.status) payload.status = updates.status;
    if (updates.manager) payload.manager = updates.manager;
    if (updates.level) payload.level = updates.level;
    if (updates.contractType) payload.contract_type = updates.contractType;
    if (updates.salary) payload.salary = updates.salary;

    const { error } = await supabase.from('team_member').update(payload).eq('id', id);
    
    // Sync with workspace_members for actual access control
    const oldEmail = members.find(m => m.id === id)?.email;
    const targetEmail = oldEmail || updates.email;
    
    if (targetEmail) {
        const updatePayload: any = {
            permissions: updates.isAdmin ? { all: 'edit' } : (updates.modulePermissions || {}),
            role: updates.isAdmin ? 'admin' : 'team'
        };
        if (updates.email && updates.email !== oldEmail) {
            updatePayload.email = updates.email;
        }
        
        await supabase.from('workspace_members')
            .update(updatePayload)
            .eq('workspace_id', currentWorkspace.id)
            .ilike('email', targetEmail);
    }
    
    if (updates.allowedPageIds) {
        // Find member_id using the old email since we might have just updated it
        const memberEmail = updates.email || oldEmail;
        
        if (memberEmail) {
            const { data: member } = await supabase.from('workspace_members')
                .select('id')
                .eq('workspace_id', currentWorkspace.id)
                .ilike('email', memberEmail)
                .maybeSingle();
            
            if (member) {
                const { error: deleteError } = await supabase.from('page_permissions').delete().eq('member_id', member.id);
                if (deleteError) {
                    console.error("Error deleting old page permissions:", deleteError);
                    alert(`Failed to update team page permissions: ${deleteError.message}`);
                }
                
                if (updates.allowedPageIds.length > 0) {
                    const permissions = updates.allowedPageIds.map((pageId: string) => ({
                        page_id: pageId,
                        member_id: member.id,
                        can_view: true
                    }));
                    const { error: insertError } = await supabase.from('page_permissions').insert(permissions);
                    if (insertError) {
                        console.error("Error inserting new page permissions:", insertError);
                        alert(`Failed to save team page permissions: ${insertError.message}`);
                    }
                }
            }
        }
    }
    
    if (error) {
        console.error("Error updating member:", error);
        fetchMembers();
    }
  };

  const deleteMember = async (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));

    // Check if ID is a valid UUID (v4)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
        const { error } = await supabase.rpc('delete_user_account', { target_user_id: id });
        if (error) {
            console.error("Error unlinking user account:", error);
            alert(`Failed to unlink user: ${error.message}. Please run the SQL script.`);
            // Fallback to delete from public table if RPC fails
            await supabase.from('team_member').delete().eq('id', id);
            fetchMembers();
        }
    } else {
        const { error } = await supabase.from('team_member').delete().eq('id', id);
        if (error) fetchMembers();
    }
  };

  useEffect(() => {
    fetchMembers();
    const sub = supabase.channel('team_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_member' }, fetchMembers)
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchMembers]);

  return { members, loading, addMember, updateMember, deleteMember, refresh: fetchMembers };
};
