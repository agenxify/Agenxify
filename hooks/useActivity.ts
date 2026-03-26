
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { ActivityEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatRelativeTime } from '../utils/date';

export const useActivity = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch logs from Supabase
  const fetchActivity = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
          // Graceful degradation if column missing
          if (error.code === '42703') { // Undefined column
             console.warn("Database schema mismatch: 'owner_id' column missing in 'activity_logs'. Please run the migration in supabase/backend_fix.sql");
             // Retry without owner_id filter for dev/demo purposes if needed, or just return empty
             // For safety, we return empty to avoid leaking data if RLS isn't set up
             setEvents([]);
             return;
          }
          throw error;
      }

      // Map DB structure to Frontend Types
      const mappedEvents: ActivityEvent[] = (data || []).map((log: any) => ({
        id: log.id,
        type: log.type,
        user: log.user,
        userAvatar: log.user_avatar,
        action: log.action,
        target: log.target,
        time: formatRelativeTime(new Date(log.created_at)),
        timestamp: new Date(log.created_at),
        description: log.description,
        importance: log.importance,
        status: log.status
      }));

      setEvents(mappedEvents);
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Function to log a new activity (can be called from anywhere)
  const logActivity = async (
    type: ActivityEvent['type'], 
    action: string, 
    target: string, 
    description: string,
    importance: 'low' | 'medium' | 'high' = 'medium',
    customUser?: string,
    customAvatar?: string
  ) => {
    if (!user || !currentWorkspace) return;

    const payload = {
      workspace_id: currentWorkspace.id,
      owner_id: user.uid,
      type,
      user: customUser || user.name,
      user_avatar: customAvatar || user.avatar,
      action,
      target,
      description,
      importance,
      status: 'unread',
      time: formatRelativeTime(new Date()),
      created_at: new Date().toISOString()
    };

    // Optimistic Update
    const optimisticEvent: ActivityEvent = {
        id: `temp-${Date.now()}`,
        type,
        user: customUser || user.name,
        userAvatar: customAvatar || user.avatar,
        action,
        target,
        description,
        importance,
        status: 'unread',
        time: formatRelativeTime(new Date()),
        timestamp: new Date()
    };
    setEvents(prev => [optimisticEvent, ...prev]);

    // DB Insert
    try {
        const { error } = await supabase.from('activity_logs').insert([payload]);
        if (error) {
            // Check for missing column error on insert
            if (error.code === '42703') {
                 console.warn("Failed to log activity: Schema missing 'owner_id'. Skipping DB insert.");
            } else {
                 console.error("Failed to log activity:", error);
            }
        } else {
            fetchActivity(); // Refresh to get real ID
        }
    } catch (err) {
        console.error("Exception logging activity:", err);
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'read' } : e));
    
    const { error } = await supabase.from('activity_logs').update({ status: 'read' }).eq('id', id);
    if (error) console.error("Error marking read:", error);
  };

  const markAllAsRead = async () => {
    if (!user || !currentWorkspace) return;
    setEvents(prev => prev.map(e => ({ ...e, status: 'read' })));
    const { error } = await supabase.from('activity_logs')
        .update({ status: 'read' })
        .eq('workspace_id', currentWorkspace.id)
        .neq('status', 'read');
    if (error) console.error("Error marking all read:", error);
  };

  const deleteActivity = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('activity_logs').delete().eq('id', id);
    if (error) console.error("Error deleting activity:", error);
  };

  const clearAllActivities = async () => {
    if (!user || !currentWorkspace) return;
    setEvents([]);
    const { error } = await supabase.from('activity_logs')
        .delete()
        .eq('workspace_id', currentWorkspace.id);
    if (error) console.error("Error clearing all activities:", error);
  };

  // Initial load
  useEffect(() => {
    fetchActivity();
    
    // Optional: Real-time subscription
    if (!currentWorkspace) return;
    const channel = supabase
      .channel('activity_changes')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activity_logs', 
          filter: `workspace_id=eq.${currentWorkspace.id}` 
      }, (payload) => {
          const newLog = payload.new;
          const mapped: ActivityEvent = {
            id: newLog.id,
            type: newLog.type,
            user: newLog.user,
            userAvatar: newLog.user_avatar,
            action: newLog.action,
            target: newLog.target,
            time: formatRelativeTime(new Date(newLog.created_at)),
            timestamp: new Date(newLog.created_at),
            description: newLog.description,
            importance: newLog.importance,
            status: newLog.status
          };
          setEvents(prev => [mapped, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivity, user]);

  return { 
    events, 
    loading, 
    logActivity, 
    markAsRead, 
    markAllAsRead, 
    deleteActivity, 
    clearAllActivities,
    refresh: fetchActivity 
  };
};
