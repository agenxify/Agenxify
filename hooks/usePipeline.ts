
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { Pipeline, Lead } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';

// Helper for generating IDs compatible with text columns
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

export const usePipeline = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPipelines = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      // Fetch pipelines and their related leads in one query
      const { data, error } = await supabase
        .from('pipelines')
        .select(`
          *,
          leads (*)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      let formattedPipelines: Pipeline[] = [];

      // 1. Handle Empty State: Auto-create a pipeline if none exist
      if (!data || data.length === 0) {
         console.log("No pipelines found. Seeding default...");
         const defaultId = generateId('pipe');
         const defaultPipeline = {
            id: defaultId,
            workspace_id: currentWorkspace.id,
            name: 'General Pipeline',
            stages: ['Inbound', 'Discovery', 'Negotiation', 'Closed'],
            owner_id: user.uid
         };
         
         const { error: insertError } = await supabase.from('pipelines').insert([defaultPipeline]);
         if (insertError) throw insertError;
         
         formattedPipelines = [{ ...defaultPipeline, leads: [] }];
      } else {
         // 2. Transform existing data
         formattedPipelines = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            stages: typeof p.stages === 'string' ? JSON.parse(p.stages) : (p.stages || []),
            leads: (p.leads || []).map((l: any) => ({
               id: l.id,
               title: l.title || '',
               company: l.company || '',
               contact: l.contact || '',
               value: Number(l.value) || 0,
               stage: l.stage || '',
               probability: Number(l.probability) || 0,
               priority: l.priority || 'Medium',
               email: l.email || '',
               phone: l.phone || '',
               owner: l.owner || '',
               currency: l.currency || 'USD',
               label: l.label || 'None',
               sourceChannel: l.source_channel || '',
               sourceChannelId: l.source_channel_id || '',
               visibility: l.visibility || 'Team',
               expectedCloseDate: l.expected_close_date || '',
               createdAt: l.created_at
            }))
         }));
      }

      setPipelines(formattedPipelines);
    } catch (err) {
      console.error('Error fetching pipelines:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  // --- Pipeline Operations ---

  const addPipeline = async (name: string) => {
    if (!currentWorkspace) return;
    const newPipeline = {
      id: generateId('pipe'),
      workspace_id: currentWorkspace.id,
      name,
      stages: ['Inbound', 'Discovery', 'Negotiation', 'Closed'],
      owner_id: user?.uid
    };

    // Optimistic Update
    setPipelines(prev => [...prev, { ...newPipeline, leads: [] }]);

    const { error } = await supabase.from('pipelines').insert([newPipeline]);
    if (error) {
        console.error('Error creating pipeline', error);
        fetchPipelines(); // Revert
    }
  };

  const updatePipeline = async (id: string, updates: Partial<Pipeline>) => {
    // Optimistic Update
    setPipelines(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    const { error } = await supabase
      .from('pipelines')
      .update(updates)
      .eq('id', id);

    if (error) {
        console.error('Error updating pipeline', error);
        fetchPipelines();
    }
  };

  const deletePipeline = async (id: string) => {
    // Optimistic Update
    setPipelines(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase.from('pipelines').delete().eq('id', id);
    if (error) {
        console.error('Error deleting pipeline', error);
        fetchPipelines();
    }
  };

  // --- Lead Operations ---

  const addLead = async (pipelineId: string, lead: Lead) => {
    // Verify pipeline exists to prevent FK error
    if (!pipelines.find(p => p.id === pipelineId)) {
        console.error("Cannot add lead: Invalid Pipeline ID", pipelineId);
        return;
    }

    const leadId = lead.id || generateId('lead');

    // Optimistic Update
    setPipelines(prev => prev.map(p => {
        if(p.id === pipelineId) {
            return { ...p, leads: [{...lead, id: leadId}, ...p.leads] };
        }
        return p;
    }));

    const dbLead = {
        id: leadId,
        pipeline_id: pipelineId,
        workspace_id: currentWorkspace.id,
        title: lead.title,
        company: lead.company,
        contact: lead.contact,
        value: lead.value,
        stage: lead.stage,
        probability: lead.probability,
        priority: lead.priority,
        email: lead.email,
        phone: lead.phone,
        owner: lead.owner,
        currency: lead.currency,
        label: lead.label,
        source_channel: lead.sourceChannel,
        source_channel_id: lead.sourceChannelId,
        visibility: lead.visibility,
        expected_close_date: lead.expectedCloseDate,
        created_at: lead.createdAt || new Date().toISOString()
    };

    const { error } = await supabase.from('leads').insert([dbLead]);
    if (error) {
        console.error('Error adding lead', error);
        fetchPipelines();
    }
  };

  const updateLead = async (pipelineId: string, leadId: string, updates: Partial<Lead>) => {
    // Optimistic Update
    setPipelines(prev => prev.map(p => {
        if (p.id === pipelineId) {
            return {
                ...p,
                leads: p.leads.map(l => l.id === leadId ? { ...l, ...updates } : l)
            };
        }
        return p;
    }));

    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
    if (updates.probability !== undefined) dbUpdates.probability = updates.probability;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.owner !== undefined) dbUpdates.owner = updates.owner;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.sourceChannel !== undefined) dbUpdates.source_channel = updates.sourceChannel;
    if (updates.sourceChannelId !== undefined) dbUpdates.source_channel_id = updates.sourceChannelId;
    if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
    if (updates.expectedCloseDate !== undefined) dbUpdates.expected_close_date = updates.expectedCloseDate;

    const { error } = await supabase.from('leads').update(dbUpdates).eq('id', leadId);
    if (error) {
        console.error('Error updating lead', error);
        fetchPipelines();
    }
  };

  const deleteLead = async (pipelineId: string, leadId: string) => {
    // Optimistic Update
    setPipelines(prev => prev.map(p => {
        if (p.id === pipelineId) {
            return { ...p, leads: p.leads.filter(l => l.id !== leadId) };
        }
        return p;
    }));

    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (error) {
        console.error('Error deleting lead', error);
        fetchPipelines();
    }
  };

  useEffect(() => {
    fetchPipelines();
    
    // Subscriptions for realtime updates
    const pipelineSub = supabase.channel('pipelines-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pipelines' }, () => fetchPipelines())
        .subscribe();
    
    const leadsSub = supabase.channel('leads-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchPipelines())
        .subscribe();

    return () => {
        supabase.removeChannel(pipelineSub);
        supabase.removeChannel(leadsSub);
    };
  }, [fetchPipelines]);

  return {
    pipelines,
    loading,
    addPipeline,
    updatePipeline,
    deletePipeline,
    addLead,
    updateLead,
    deleteLead,
    refresh: fetchPipelines
  };
};
