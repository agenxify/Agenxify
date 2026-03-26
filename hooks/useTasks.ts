
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { Task } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

export const useTasks = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedTasks: Task[] = (data || []).map((t: any) => ({
          ...t,
          dueDate: t.due_date,
          dueTime: t.due_time,
          estimatedTime: t.estimated_time,
          spentTime: t.spent_time,
          refType: t.ref_type,
          refId: t.ref_id
      }));

      setTasks(formattedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const addTask = async (task: Task) => {
    if (!user || !currentWorkspace) return;
    // Optimistic
    setTasks(prev => [task, ...prev]);

    const dbTask = {
        id: task.id || generateId('TSK'),
        workspace_id: currentWorkspace.id,
        title: task.title,
        project: task.project,
        assignee: task.assignee,
        due_date: task.dueDate,
        due_time: task.dueTime,
        status: task.status,
        priority: task.priority,
        type: task.type,
        estimated_time: task.estimatedTime,
        spent_time: task.spentTime,
        description: task.description,
        ref_type: task.refType,
        ref_id: task.refId,
        checklist: task.checklist,
        tags: task.tags,
        owner_id: user.uid
    };

    const { error } = await supabase.from('tasks').insert([dbTask]);
    if (error) {
        console.error('Error adding task:', error);
        fetchTasks();
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!currentWorkspace) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    const dbUpdates: any = { ...updates };
    // Map camelCase to snake_case for specific fields
    if (updates.dueDate) { dbUpdates.due_date = updates.dueDate; delete dbUpdates.dueDate; }
    if (updates.dueTime) { dbUpdates.due_time = updates.dueTime; delete dbUpdates.dueTime; }
    if (updates.estimatedTime) { dbUpdates.estimated_time = updates.estimatedTime; delete dbUpdates.estimatedTime; }
    if (updates.spentTime) { dbUpdates.spent_time = updates.spentTime; delete dbUpdates.spentTime; }
    if (updates.refType) { dbUpdates.ref_type = updates.refType; delete dbUpdates.refType; }
    if (updates.refId) { dbUpdates.ref_id = updates.refId; delete dbUpdates.refId; }

    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).eq('workspace_id', currentWorkspace.id);
    if (error) {
        console.error('Error updating task:', error);
        fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    if (!currentWorkspace) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('workspace_id', currentWorkspace.id);
    if (error) {
         console.error('Error deleting task:', error);
         fetchTasks();
    }
  };

  useEffect(() => {
    fetchTasks();
    if (!currentWorkspace) return;
    // Subscribe only to user's tasks
    const sub = supabase.channel('tasks-user')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${currentWorkspace.id}` }, () => fetchTasks())
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchTasks, currentWorkspace]);

  return { tasks, loading, addTask, updateTask, deleteTask, refresh: fetchTasks };
};
