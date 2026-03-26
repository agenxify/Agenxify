
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { Ticket } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

export const useTickets = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data.map((t: any) => ({
        ...t,
        hourlyRate: t.hourly_rate
      }));
      
      setTickets(formattedData as Ticket[]);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const { checkSharedLimit } = usePlanEnforcement();

  const addTicket = async (ticket: Ticket) => {
    if (!user || !currentWorkspace) return;
    
    const canCreate = await checkSharedLimit('tickets', 'ticketsLimit');
    if (!canCreate) {
      alert(`Ticket limit reached. Upgrade your plan to create more tickets.`);
      return;
    }

    // Optimistic update
    setTickets(prev => [ticket, ...prev]);

    const payload: any = {
      ...ticket,
      workspace_id: currentWorkspace.id,
      owner_id: user.uid,
      // Ensure arrays are passed as arrays for JSONB
      attachments: ticket.attachments || [],
      history: ticket.history || []
    };
    if (payload.hourlyRate !== undefined) {
        payload.hourly_rate = payload.hourlyRate;
        delete payload.hourlyRate;
    }

    const { error } = await supabase.from('tickets').insert([payload]);

    if (error) {
      console.error('Error creating ticket:', error);
      fetchTickets(); // Revert on error
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    // Optimistic update
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    const payload: any = { ...updates };
    if (payload.hourlyRate !== undefined) {
        payload.hourly_rate = payload.hourlyRate;
        delete payload.hourlyRate;
    }

    const { error } = await supabase
      .from('tickets')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating ticket:', error);
      fetchTickets();
    }
  };

  const deleteTicket = async (id: string) => {
    // Optimistic update
    setTickets(prev => prev.filter(t => t.id !== id));

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ticket:', error);
      fetchTickets();
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchTickets();
    
    // Subscribe to realtime changes filtered by user
    const channel = supabase
      .channel('tickets_db_changes')
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tickets', 
          filter: currentWorkspace ? `workspace_id=eq.${currentWorkspace.id}` : undefined 
      }, () => {
          fetchTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets, user]);

  return { tickets, loading, addTicket, updateTicket, deleteTicket, refresh: fetchTickets };
};
