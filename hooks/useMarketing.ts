
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export interface Segment {
  id: string;
  name: string;
  type: 'Dynamic' | 'Static' | 'AI Predicted';
  filters: any[];
  tags: string[];
  color: string;
  count?: number;
  growth?: string;
  updatedAt?: string;
}

export interface MarketingContact {
  id: string;
  name: string;
  email: string;
  company: string;
  revenue: number;
  status: string;
  source: string;
  lastSeen: string;
  avatar: string;
}

export interface DirectContact {
  id: string;
  name: string;
  email: string;
  selected: boolean;
}

export const useMarketing = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [directContacts, setDirectContacts] = useState<DirectContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);
    try {
      const [segRes, contRes, dirRes] = await Promise.all([
        supabase.from('marketing_segments').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
        supabase.from('marketing_contacts').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false }),
        supabase.from('direct_marketing_contacts').select('*').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false })
      ]);

      if (segRes.error) throw segRes.error;
      if (contRes.error) throw contRes.error;
      if (dirRes.error) throw dirRes.error;

      // Map DB to Frontend
      const loadedContacts: MarketingContact[] = (contRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name || 'Unknown',
        email: c.email || '',
        company: c.company || '',
        revenue: Number(c.revenue),
        status: c.status || 'Lead',
        source: c.source || 'Manual',
        lastSeen: c.last_seen ? new Date(c.last_seen).toLocaleDateString() : 'N/A',
        avatar: c.avatar || `https://i.pravatar.cc/150?u=${c.id}`
      }));

      const loadedSegments: Segment[] = (segRes.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        filters: s.filters || [],
        tags: s.tags || [],
        color: s.color || 'from-blue-500 to-cyan-500',
        updatedAt: s.updated_at
      }));

      const loadedDirectContacts: DirectContact[] = (dirRes.data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          selected: d.selected
      }));

      setContacts(loadedContacts);
      setDirectContacts(loadedDirectContacts);
      
      // Calculate counts based on filters locally
      const segmentsWithCounts = loadedSegments.map(seg => {
         let count: number;
         if (seg.filters && seg.filters.length > 0) {
             count = loadedContacts.filter(contact => {
                 return seg.filters.every((f: any) => {
                     const val = String(f.value).toLowerCase();
                     const field = f.field.toLowerCase(); 
                     
                     if (field.includes('revenue')) {
                         return contact.revenue >= parseFloat(val);
                     }
                     if (field.includes('status')) {
                         return contact.status.toLowerCase() === val;
                     }
                     // Default text match
                     return JSON.stringify(contact).toLowerCase().includes(val);
                 });
             }).length;
         } else {
             count = loadedContacts.length;
         }
         return { 
             ...seg, 
             count, 
             growth: `+${(Math.random() * 10).toFixed(1)}%` // Mock growth for UI visual
         };
      });

      setSegments(segmentsWithCounts);

    } catch (e) {
      console.error("Marketing fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const addSegment = async (segment: Partial<Segment>) => {
     if (!user || !currentWorkspace) return;
     const newId = `seg-${Date.now()}`;
     const payload = {
        id: newId,
        workspace_id: currentWorkspace.id,
        owner_id: user.uid,
        name: segment.name,
        type: segment.type,
        filters: segment.filters,
        tags: segment.tags,
        color: segment.color,
        updated_at: new Date().toISOString()
     };
     
     const { error } = await supabase.from('marketing_segments').insert([payload]);
     if (!error) fetchData();
  };

  const updateSegment = async (id: string, updates: Partial<Segment>) => {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name) payload.name = updates.name;
      if (updates.type) payload.type = updates.type;
      if (updates.filters) payload.filters = updates.filters;
      if (updates.tags) payload.tags = updates.tags;

      const { error } = await supabase.from('marketing_segments').update(payload).eq('id', id);
      if (!error) fetchData();
  };

  const deleteSegment = async (id: string) => {
      const { error } = await supabase.from('marketing_segments').delete().eq('id', id);
      if (!error) fetchData();
  };

  const importContacts = async (newContacts: MarketingContact[]) => {
      if (!user || !currentWorkspace) return;
      const payload = newContacts.map(c => ({
          id: c.id,
          workspace_id: currentWorkspace.id,
          owner_id: user.uid,
          name: c.name,
          email: c.email,
          company: c.company,
          revenue: c.revenue,
          status: c.status,
          source: c.source,
          avatar: c.avatar,
          last_seen: new Date().toISOString()
      }));

      const { error } = await supabase.from('marketing_contacts').upsert(payload);
      if (!error) fetchData();
  };

  // --- Direct Contacts Methods ---
  const addDirectContact = async (contact: { name: string; email: string; selected?: boolean }) => {
      if (!user || !currentWorkspace) return;
      const newId = `dc-${Date.now()}`;
      // Optimistic update
      setDirectContacts(prev => [{ ...contact, id: newId, selected: contact.selected ?? true }, ...prev]);
      
      const { error } = await supabase.from('direct_marketing_contacts').insert([{
          id: newId,
          workspace_id: currentWorkspace.id,
          owner_id: user.uid,
          name: contact.name,
          email: contact.email,
          selected: contact.selected ?? true
      }]);
      
      if (error) {
          console.error("Error adding direct contact", error);
          fetchData(); // Revert
      }
  };

  const deleteDirectContact = async (id: string) => {
      setDirectContacts(prev => prev.filter(c => c.id !== id));
      const { error } = await supabase.from('direct_marketing_contacts').delete().eq('id', id);
      if (error) fetchData();
  };

  const toggleDirectContactSelection = async (id: string) => {
      const contact = directContacts.find(c => c.id === id);
      if (!contact) return;
      
      const newSelected = !contact.selected;
      
      setDirectContacts(prev => prev.map(c => c.id === id ? { ...c, selected: newSelected } : c));
      
      await supabase.from('direct_marketing_contacts').update({ selected: newSelected }).eq('id', id);
  };

  const toggleAllDirectContacts = async (selectAll: boolean) => {
      setDirectContacts(prev => prev.map(c => ({ ...c, selected: selectAll })));
      if (user && currentWorkspace) {
         await supabase.from('direct_marketing_contacts')
            .update({ selected: selectAll })
            .eq('workspace_id', currentWorkspace.id);
      }
  };

  useEffect(() => {
    fetchData();
    const sub1 = supabase.channel('mkt-seg').on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_segments' }, fetchData).subscribe();
    const sub2 = supabase.channel('mkt-con').on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_contacts' }, fetchData).subscribe();
    const sub3 = supabase.channel('mkt-dir').on('postgres_changes', { event: '*', schema: 'public', table: 'direct_marketing_contacts' }, fetchData).subscribe();
    return () => { 
        supabase.removeChannel(sub1); 
        supabase.removeChannel(sub2); 
        supabase.removeChannel(sub3);
    };
  }, [fetchData]);

  return { 
    segments, 
    contacts, 
    directContacts, 
    loading, 
    addSegment, 
    updateSegment, 
    deleteSegment, 
    importContacts, 
    addDirectContact, 
    deleteDirectContact, 
    toggleDirectContactSelection, 
    toggleAllDirectContacts,
    refresh: fetchData 
  };
};
