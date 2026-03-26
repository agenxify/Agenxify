
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

export const useAccountUsage = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        storageRes,
        requestsRes,
        teamRes,
        projectsRes,
        clientsRes,
        pipelinesRes,
        bookingsRes,
        servicesRes,
        onboardingRes,
        pagesRes,
        invoicesRes,
        estimatesRes,
        ticketsRes,
        campaignsRes,
        workspacesRes
      ] = await Promise.all([
        supabase.from('storage_files').select('size').eq('owner_id', user.uid),
        supabase.from('requests').select('id, status, credits_consumed').eq('owner_id', user.uid),
        supabase.from('team_member').select('id, role').eq('owner_id', user.uid),
        supabase.from('projects').select('id').eq('owner_id', user.uid),
        supabase.from('clients').select('id').eq('owner_id', user.uid),
        supabase.from('pipelines').select('id').eq('owner_id', user.uid),
        supabase.from('event_types').select('id').eq('owner_id', user.uid),
        supabase.from('services').select('id').eq('owner_id', user.uid),
        supabase.from('onboarding_flows').select('id').eq('owner_id', user.uid),
        supabase.from('pages').select('id, deleted').eq('owner_id', user.uid),
        supabase.from('invoices').select('id').eq('owner_id', user.uid),
        supabase.from('estimates').select('id').eq('owner_id', user.uid),
        supabase.from('tickets').select('id').eq('owner_id', user.uid),
        supabase.from('marketing_campaigns').select('id').eq('owner_id', user.uid),
        supabase.from('workspaces').select('id', { count: 'exact', head: true }).eq('owner_id', user.uid)
      ]);

      const storageUsedKB = (storageRes.data || []).reduce((acc, f) => acc + Number(f.size), 0);
      const storageUsedGB = storageUsedKB / (1024 * 1024);

      const activeRequests = (requestsRes.data || []).filter(r => r.status !== 'Completed');
      const creditsSpent = (requestsRes.data || []).reduce((acc, r) => acc + (r.credits_consumed || 0), 0);

      const teamMembersCount = (teamRes.data || []).filter(m => m.role !== 'owner' && m.role !== 'admin').length;

      const pagesCount = (pagesRes.data || []).filter(p => !p.deleted).length;

      setUsage({
        storageGB: storageUsedGB,
        activeRequestsCount: activeRequests.length,
        creditsSpent,
        teamMembersCount,
        projectsCount: (projectsRes.data || []).length,
        clientsCount: (clientsRes.data || []).length,
        pipelinesCount: (pipelinesRes.data || []).length,
        bookingsCount: (bookingsRes.data || []).length,
        servicesCount: (servicesRes.data || []).length,
        onboardingCount: (onboardingRes.data || []).length,
        pagesCount,
        invoicesCount: (invoicesRes.data || []).length,
        estimatesCount: (estimatesRes.data || []).length,
        ticketsCount: (ticketsRes.data || []).length,
        campaignsCount: (campaignsRes.data || []).length,
        workspacesCount: workspacesRes.count || 0
      });
    } catch (err) {
      console.error("Error fetching account usage:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, refresh: fetchUsage };
};
