
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { TimeEntry } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

export const useTimesheets = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formatted: TimeEntry[] = (data || []).map((e: any) => ({
          ...e,
          refType: e.ref_type,
          refId: e.ref_id,
          user: e.user_name, // map db column user_name to type user
          hourlyRate: e.hourly_rate
      }));

      setEntries(formatted);
    } catch (err) {
      console.error('Error fetching time entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addEntry = async (entry: TimeEntry) => {
    if (!currentWorkspace) return;
    setEntries(prev => [entry, ...prev]);

    const dbEntry = {
        id: entry.id || generateId('TE'),
        workspace_id: currentWorkspace.id,
        task: entry.task,
        project: entry.project,
        duration: entry.duration,
        date: entry.date,
        user_name: entry.user,
        ref_type: entry.refType,
        ref_id: entry.refId,
        billable: entry.billable,
        owner_id: user?.uid,
        hourly_rate: entry.hourlyRate
    };

    const { error } = await supabase.from('time_entries').insert([dbEntry]);
    if (error) {
        if (error.code === 'PGRST204' && error.message.includes('hourly_rate')) {
            console.warn('hourly_rate column missing. Please run the SQL migration.');
            // Retry without hourly_rate
            const { hourly_rate, ...fallbackEntry } = dbEntry;
            const { error: fallbackError } = await supabase.from('time_entries').insert([fallbackEntry]);
            if (fallbackError) {
                console.error('Error adding time entry (fallback):', fallbackError);
            }
        } else {
            console.error('Error adding time entry:', error);
        }
        fetchEntries();
    }
  };

  const updateEntry = async (id: string, updates: Partial<TimeEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

    const dbUpdates: any = { ...updates };
    if(updates.user) { dbUpdates.user_name = updates.user; delete dbUpdates.user; }
    if(updates.refType) { dbUpdates.ref_type = updates.refType; delete dbUpdates.refType; }
    if(updates.refId) { dbUpdates.ref_id = updates.refId; delete dbUpdates.refId; }
    if(updates.hourlyRate !== undefined) { dbUpdates.hourly_rate = updates.hourlyRate; delete dbUpdates.hourlyRate; }

    const { error } = await supabase.from('time_entries').update(dbUpdates).eq('id', id);
    if (error) {
        if (error.code === 'PGRST204' && error.message.includes('hourly_rate')) {
            console.warn('hourly_rate column missing. Please run the SQL migration.');
            // Retry without hourly_rate
            const { hourly_rate, ...fallbackUpdates } = dbUpdates;
            const { error: fallbackError } = await supabase.from('time_entries').update(fallbackUpdates).eq('id', id);
            if (fallbackError) {
                console.error('Error updating entry (fallback):', fallbackError);
            }
        } else {
            console.error('Error updating entry:', error);
        }
        fetchEntries();
    }
  };

  const deleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if(error) {
        console.error('Error deleting entry:', error);
        fetchEntries();
    }
  };

  useEffect(() => {
    fetchEntries();
    const sub = supabase.channel('timesheets-all')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'time_entries',
            filter: currentWorkspace ? `workspace_id=eq.${currentWorkspace.id}` : undefined
        }, () => fetchEntries())
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchEntries, currentWorkspace]);

  return { entries, loading, addEntry, updateEntry, deleteEntry, refresh: fetchEntries };
};
