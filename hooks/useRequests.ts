
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Request, ChecklistItem, RequestTimeEntry, FileAttachment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

export interface LogEntry {
  id: string;
  request_id: string;
  user: string;
  avatar: string;
  action: string;
  timestamp: string; // Display string or ISO
  type: 'comment' | 'status' | 'system' | 'file';
  content?: string;
  attachment?: FileAttachment;
  created_at: string;
}

export const useRequests = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { checkSharedLimit } = usePlanEnforcement();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform JSONB columns back to objects if needed
      const formattedData = data.map((r: any) => ({
        ...r,
        files: r.files || [],
        checklist: r.checklist || [],
        timesheets: r.timesheets || [],
        dueDate: r.due_date,
        updatedAt: r.updated_at,
        assignedTo: r.assigned_to,
        creditsConsumed: Number(r.credits_consumed),
        creditsTotal: Number(r.credits_total),
        orgNotes: r.org_notes,
        hourlyRate: r.hourly_rate
      }));

      setRequests(formattedData as Request[]);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addRequest = async (request: Request) => {
    if (!user || !currentWorkspace) return false;
    
    // 1. Check project limit across all workspaces
    const canCreate = await checkSharedLimit('requests', 'projectLimit', { column: 'status', operator: 'neq', value: 'Completed' });
    if (!canCreate) {
      alert(`Active project limit reached across all your workspaces. Upgrade your plan to create more projects.`);
      return false;
    }

    // Optimistic update
    setRequests(prev => [request, ...prev]);

    const { error } = await supabase.from('requests').insert([{
      id: request.id,
      workspace_id: currentWorkspace.id,
      owner_id: user.uid,
      title: request.title,
      client: request.client,
      service: request.service,
      project: request.project,
      assigned_to: request.assignedTo,
      status: request.status,
      priority: request.priority,
      due_date: request.dueDate,
      updated_at: request.updatedAt,
      description: request.description,
      credits_consumed: request.creditsConsumed,
      credits_total: request.creditsTotal,
      files: request.files || [],
      checklist: request.checklist || [],
      timesheets: request.timesheets || [],
      org_notes: request.orgNotes || '',
      hourly_rate: request.hourlyRate
    }]);

    if (error) {
      console.error('Error adding request:', error);
      fetchRequests(); // Revert on error
      return false;
    }
    return true;
  };

  const updateRequest = async (id: string, updates: Partial<Request>) => {
    // Optimistic Update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    // Prepare Payload: Map camelCase to snake_case AND remove camelCase keys
    const payload: any = { ...updates };

    if (updates.dueDate !== undefined) {
        payload.due_date = updates.dueDate;
        delete payload.dueDate;
    }
    if (updates.updatedAt !== undefined) {
        payload.updated_at = updates.updatedAt;
        delete payload.updatedAt;
    }
    if (updates.assignedTo !== undefined) {
        payload.assigned_to = updates.assignedTo;
        delete payload.assignedTo;
    }
    if (updates.creditsConsumed !== undefined) {
        payload.credits_consumed = updates.creditsConsumed;
        delete payload.creditsConsumed;
    }
    if (updates.creditsTotal !== undefined) {
        payload.credits_total = updates.creditsTotal;
        delete payload.creditsTotal;
    }
    if (updates.orgNotes !== undefined) {
        payload.org_notes = updates.orgNotes;
        delete payload.orgNotes;
    }
    if (updates.hourlyRate !== undefined) {
        payload.hourly_rate = updates.hourlyRate;
        delete payload.hourlyRate;
    }

    const { error } = await supabase
      .from('requests')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating request:', error);
      fetchRequests(); // Revert optimistic update on error
    }
  };

  const deleteRequest = async (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting request:', error);
      fetchRequests();
    }
  };

  // --- Logs Sub-system ---
  const fetchRequestLogs = async (requestId: string): Promise<LogEntry[]> => {
      const { data, error } = await supabase
        .from('request_logs')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });
      
      if(error) {
          console.error("Error fetching logs", error);
          return [];
      }
      return data.map((l: any) => ({
          ...l,
          timestamp: new Date(l.created_at).toLocaleString(), // Format for UI
          user: l.user_name,
          avatar: l.user_avatar
      }));
  };

  const addRequestLog = async (log: Omit<LogEntry, 'created_at' | 'timestamp'>) => {
      if (!currentWorkspace) return;
      const { error } = await supabase.from('request_logs').insert([{
          id: log.id,
          workspace_id: currentWorkspace.id,
          request_id: log.request_id,
          user_name: log.user,
          user_avatar: log.avatar,
          action: log.action,
          type: log.type,
          content: log.content,
          attachment: log.attachment
      }]);
      if(error) console.error("Error adding log", error);
  };

  useEffect(() => {
    fetchRequests();
    // Subscribe to changes filtered by owner in RLS ideally, but here we can filter incoming events if needed
    // However, channel filter syntax is limited for 'postgres_changes' to simple equality on columns.
    // Assuming backend RLS enforces security, we just listen.
    const channel = supabase
      .channel('requests_db_changes')
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'requests', 
          filter: currentWorkspace ? `workspace_id=eq.${currentWorkspace.id}` : undefined 
      }, () => {
          fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests, user]);

  return { 
    requests, 
    loading, 
    addRequest, 
    updateRequest, 
    deleteRequest, 
    refresh: fetchRequests,
    fetchRequestLogs,
    addRequestLog
  };
};
