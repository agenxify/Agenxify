
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Client } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

export const useClients = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkSharedLimit } = usePlanEnforcement();

  const fetchClients = useCallback(async () => {
    console.log("DEBUG: fetchClients called for user:", user?.uid, "workspace:", currentWorkspace?.id, "role:", user?.role);
    if (!user) {
        console.log("DEBUG: fetchClients returning early: no user");
        return;
    }
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (user.role !== 'client' && currentWorkspace) {
        query = query.eq('workspace_id', currentWorkspace.id);
      }

      const { data, error } = await query;

      if (error) {
          console.error("DEBUG: Supabase fetchClients error:", error);
          throw error;
      }
      
      console.log("DEBUG: fetchClients returned data:", data);

      // Map snake_case DB to camelCase
      const mapped: Client[] = await Promise.all((data || []).map(async (c: any) => {
        // Fetch user_id from team_member (since all users are added there by trigger)
        const { data: teamMemberData } = await supabase.from('team_member')
            .select('id')
            .ilike('email', c.email)
            .limit(1);
        
        const teamMember = teamMemberData?.[0];
        
        // Fetch page permissions and user_id for this client
        const { data: memberData } = await supabase.from('workspace_members')
            .select('id, user_id, permissions')
            .eq('workspace_id', c.workspace_id || currentWorkspace?.id) // Use client's workspace_id if available
            .ilike('email', c.email)
            .limit(1);

        const member = memberData?.[0];
        const modulePermissions = member?.permissions || {};
        const userId: string | null = member?.user_id || teamMember?.id || null;
        
        let allowedPageIds: string[] = [];
        if (member) {
            const { data: perms } = await supabase.from('page_permissions')
                .select('page_id')
                .eq('member_id', member.id);
            allowedPageIds = (perms || []).map(p => p.page_id);
        }

        return {
          id: c.id,
          userId: userId, // Added userId
          name: c.name,
          company: c.company,
          email: c.email,
          position: c.position,
          status: c.status,
          revenue: c.revenue,
          avatar: c.avatar,
          industry: c.industry,
          website: c.website,
          taxId: c.tax_id,
          phone: c.phone,
          address: c.address,
          size: c.size,
          budgetRange: c.budget_range,
          mainObjective: c.main_objective,
          assignedManager: c.assigned_manager,
          onboardingFlowId: c.onboarding_flow_id,
          modulePermissions: modulePermissions,
          allowedPageIds: allowedPageIds,
          dateAdded: new Date(c.created_at).toLocaleDateString(),
          created_at: c.created_at
        };
      }));

      setClients(mapped);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const upsertClient = async (client: Partial<Client>) => {
    if (!user || !currentWorkspace) return;

    // Generate ID if missing (Creation mode)
    const isNew = !client.id;
    const clientId = client.id || `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (isNew) {
      const canCreate = await checkSharedLimit('clients', 'clientLimit');
      if (!canCreate) {
        alert(`Client limit reached. Upgrade your plan to add more clients.`);
        return;
      }
    }

    // Map camelCase to snake_case for DB
    const payload: any = {
        workspace_id: currentWorkspace.id,
        name: client.name,
        company: client.company,
        email: client.email ? client.email.toLowerCase() : client.email,
        position: client.position,
        status: client.status,
        revenue: client.revenue,
        avatar: client.avatar,
        industry: client.industry,
        website: client.website,
        tax_id: client.taxId,
        phone: client.phone,
        address: client.address,
        size: client.size,
        budget_range: client.budgetRange,
        main_objective: client.mainObjective,
        assigned_manager: client.assignedManager,
        onboarding_flow_id: client.onboardingFlowId,
        module_permissions: client.modulePermissions,
        updated_at: new Date().toISOString()
    };

    if (isNew) {
        payload.id = clientId;
        payload.owner_id = user.uid;
    } else {
        payload.id = client.id;
    }

    // Optimistic Update
    setClients(prev => {
        const exists = prev.find(c => c.id === clientId);
        if (exists) {
            return prev.map(c => c.id === clientId ? { ...c, ...client, id: clientId } as Client : c);
        }
        return [{ ...client, id: clientId } as Client, ...prev];
    });

    const { data: clientData, error } = await supabase.from('clients').upsert(payload).select().maybeSingle();
    
    if (error) {
        console.error("Error saving client:", error);
        alert(`Failed to save client details: ${error.message}`);
        fetchClients(); // Revert
        return;
    } else if (!clientData) {
        console.warn("DEBUG: clientData is null after upsert. RLS might be blocking the update.");
        alert("Failed to save client details: You do not have permission to modify this client.");
        fetchClients(); // Revert
        return;
    }

    if (isNew && client.email) {
        // Also add to workspace_members to grant access
        const { data: member, error: memberError } = await supabase.from('workspace_members').upsert([{
            workspace_id: currentWorkspace.id,
            email: client.email.toLowerCase(),
            role: 'client',
            permissions: client.modulePermissions || { all: 'view' }
        }], { onConflict: 'workspace_id, email' }).select().maybeSingle();

        console.log("DEBUG: Upsert workspace member result:", { member, memberError });

        if (memberError) {
            console.error("Error upserting workspace member:", memberError);
            alert(`Failed to save client access: ${memberError.message}`);
        } else if (!member) {
            console.warn("DEBUG: member is null after upsert. RLS might be blocking SELECT.");
            alert("Client access was saved, but the database blocked reading it back. Page permissions cannot be updated.");
        }

        if (member && client.allowedPageIds && client.allowedPageIds.length > 0) {
            const permissions = client.allowedPageIds.map(pageId => ({
                page_id: pageId,
                member_id: member.id,
                can_view: true
            }));
            const { error: insertError } = await supabase.from('page_permissions').insert(permissions);
            if (insertError) {
                console.error("Error inserting new page permissions:", insertError);
                alert(`Failed to save page permissions: ${insertError.message}`);
            }
        }
    } else if (client.id && client.email) {
        // Update permissions for existing client
        // 1. Get or create member_id for this client
        const { data: member, error: memberError } = await supabase.from('workspace_members').upsert([{
            workspace_id: currentWorkspace.id,
            email: client.email.toLowerCase(),
            role: 'client',
            permissions: client.modulePermissions || { all: 'view' }
        }], { onConflict: 'workspace_id, email' }).select().maybeSingle();
        
        console.log("DEBUG: Upsert workspace member result (existing client):", { member, memberError });

        if (memberError) {
            console.error("Error upserting workspace member:", memberError);
            alert(`Failed to save client access: ${memberError.message}`);
        } else if (!member) {
            console.warn("DEBUG: member is null after upsert (existing client). RLS might be blocking SELECT.");
            alert("Client access was saved, but the database blocked reading it back. Page permissions cannot be updated.");
        }
        
        if (member) {
            // Update module permissions (already handled by upsert, but keeping this for safety if needed)
            if (client.modulePermissions) {
                await supabase.from('workspace_members')
                    .update({ permissions: client.modulePermissions })
                    .eq('id', member.id);
            }

            if (client.allowedPageIds !== undefined) {
                // 2. Delete old permissions
                const { error: deleteError } = await supabase.from('page_permissions').delete().eq('member_id', member.id);
                if (deleteError) {
                    console.error("Error deleting old page permissions:", deleteError);
                    alert(`Failed to update page permissions: ${deleteError.message}`);
                }
                
                // 3. Insert new permissions
                if (client.allowedPageIds.length > 0) {
                    const permissions = client.allowedPageIds.map(pageId => ({
                        page_id: pageId,
                        member_id: member.id,
                        can_view: true
                    }));
                    const { error: insertError } = await supabase.from('page_permissions').insert(permissions);
                    if (insertError) {
                        console.error("Error inserting new page permissions:", insertError);
                        alert(`Failed to save page permissions: ${insertError.message}`);
                    }
                }
            }
        }
    } else if (!client.email) {
        alert("Warning: Client email is required to save portal access and page permissions.");
    }
    
    if (error) {
        console.error("Error saving client:", error);
        fetchClients(); // Revert
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));

    // Check if ID is a valid UUID (v4)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
        const { error } = await supabase.rpc('delete_user_account', { target_user_id: id });
        if (error) {
            console.error("Error unlinking client account:", error);
            alert(`Failed to unlink client: ${error.message}. Please run the SQL script.`);
            // Fallback to delete from public table if RPC fails
            await supabase.from('clients').delete().eq('id', id);
            fetchClients();
        }
    } else {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) {
            console.error("Error deleting client:", error);
            fetchClients();
        }
    }
  };

  useEffect(() => {
    fetchClients();
    
    const channel = supabase
      .channel('clients_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, fetchClients)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchClients]);

  return {
    clients,
    loading,
    upsertClient,
    deleteClient,
    refresh: fetchClients
  };
};
