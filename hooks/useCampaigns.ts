
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export interface EmailBlock {
  id: string;
  type: string;
  content: any;
  styles: Record<string, any>;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'Sending' | 'Scheduled' | 'Draft' | 'Completed';
  progress: number;
  sent: number;
  open: string;
  click: string;
  date: string;
  subject: string;
  preheader: string;
  audience: string;
  blocks: EmailBlock[];
  smartSend: boolean;
  abTest: boolean;
  updatedAt?: string;
}

export const useCampaigns = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formatted: Campaign[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        subject: c.subject,
        preheader: c.preheader,
        audience: c.audience,
        date: new Date(c.updated_at).toLocaleDateString(),
        updatedAt: c.updated_at,
        // JSONB Fields
        blocks: c.content || [], 
        // Stats are stored in a jsonb column 'stats'
        progress: c.stats?.progress || 0,
        sent: c.stats?.sent || 0,
        open: c.stats?.open || '-',
        click: c.stats?.click || '-',
        // Settings are stored in a jsonb column 'settings'
        smartSend: c.settings?.smartSend || false,
        abTest: c.settings?.abTest || false,
      }));

      setCampaigns(formatted);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const saveCampaign = async (campaign: Partial<Campaign>) => {
    if (!user || !currentWorkspace) return;

    // Optimistic Update
    setCampaigns(prev => {
        const exists = prev.find(c => c.id === campaign.id);
        if (exists) {
            return prev.map(c => c.id === campaign.id ? { ...c, ...campaign } as Campaign : c);
        }
        return [campaign as Campaign, ...prev];
    });

    const payload = {
        id: campaign.id,
        workspace_id: currentWorkspace.id,
        owner_id: user.uid,
        name: campaign.name,
        status: campaign.status,
        subject: campaign.subject,
        preheader: campaign.preheader,
        audience: campaign.audience,
        content: campaign.blocks, // Maps to 'content' jsonb column
        settings: {
            smartSend: campaign.smartSend,
            abTest: campaign.abTest
        },
        stats: {
            progress: campaign.progress,
            sent: campaign.sent,
            open: campaign.open,
            click: campaign.click
        },
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('marketing_campaigns').upsert(payload);
    if (error) {
        console.error("Error saving campaign:", error);
        fetchCampaigns(); // Revert on error
    }
  };

  const deleteCampaign = async (id: string) => {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
      if (error) {
          console.error("Error deleting campaign:", error);
          fetchCampaigns();
      }
  };

  useEffect(() => {
    fetchCampaigns();
    const sub = supabase.channel('campaigns_realtime')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'marketing_campaigns',
            filter: currentWorkspace ? `workspace_id=eq.${currentWorkspace.id}` : undefined
        }, fetchCampaigns)
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchCampaigns]);

  return { campaigns, loading, saveCampaign, deleteCampaign, refresh: fetchCampaigns };
};
