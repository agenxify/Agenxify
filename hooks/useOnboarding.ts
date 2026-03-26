import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { OnboardingFlow } from '../types.ts';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

export type { OnboardingFlow };

export const useOnboarding = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkSharedLimit } = usePlanEnforcement();
  
  // Analytics State
  const [analytics, setAnalytics] = useState<{
      chartData: any[];
      velocityData: any[];
      totalViews: number;
      totalResponses: number;
  }>({ chartData: [], velocityData: [], totalViews: 0, totalResponses: 0 });

  // Fetch all flows for the dashboard
  const fetchFlows = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      
      let dbFlows: any[] = [];
      const { data, error } = await supabase
        .from('onboarding_flows')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch failed, using local storage:', error);
        dbFlows = JSON.parse(localStorage.getItem('agencyos_onboarding_flows_v2') || '[]');
      } else {
        dbFlows = data || [];
      }
      
      const mapped = dbFlows.map((f: any) => ({
        ...f,
        updatedAt: new Date(f.updated_at).toLocaleDateString(), 
        steps: typeof f.steps === 'string' ? JSON.parse(f.steps) : (f.steps || []),
        branding: typeof f.branding === 'string' ? JSON.parse(f.branding) : (f.branding || {})
      }));

      setFlows(mapped);
    } catch (err) {
      console.error('Error fetching flows:', err);
      // Final fallback
      const local = JSON.parse(localStorage.getItem('agencyos_onboarding_flows_v2') || '[]');
      setFlows(local.map((f: any) => ({ 
        ...f, 
        updatedAt: new Date(f.updated_at).toLocaleDateString(),
        steps: typeof f.steps === 'string' ? JSON.parse(f.steps) : (f.steps || []),
        branding: typeof f.branding === 'string' ? JSON.parse(f.branding) : (f.branding || {})
      })));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch Analytics for Dashboard
  const fetchAnalytics = useCallback(async (timeRange: string = '7d') => {
      console.log("DEBUG: fetchAnalytics called for workspace:", currentWorkspace?.id, "timeRange:", timeRange);
      if (!user || !currentWorkspace) return;
      
      const now = new Date();
      const startDate = new Date();
      
      if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
      else if (timeRange === '90d') startDate.setDate(now.getDate() - 90);
      
      const isoStart = startDate.toISOString();

      try {
          // Fetch Forms Created
          const { data: flows } = await supabase
              .from('onboarding_flows')
              .select('created_at')
              .eq('workspace_id', currentWorkspace.id)
              .gte('created_at', isoStart);

          // Aggregate Data by Day
          const dailyMap = new Map<string, { formsCreated: number }>();
          
          // Init buckets
          const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
          for (let i = 0; i < days; i++) {
              const d = new Date();
              d.setDate(now.getDate() - (days - 1 - i));
              const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              dailyMap.set(key, { formsCreated: 0 });
          }

          // Fill Forms Created
          (flows || []).forEach((f: any) => {
              const d = new Date(f.created_at);
              const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              if (dailyMap.has(key)) {
                  dailyMap.get(key)!.formsCreated++;
              }
          });

          const chartData = Array.from(dailyMap.entries()).map(([name, val]) => ({
              name,
              formsCreated: val.formsCreated
          }));

          // Velocity (Forms per day)
          const velocityData = chartData.map(d => ({ value: d.formsCreated }));

          setAnalytics({
              chartData,
              velocityData,
              totalViews: 0, // Not used anymore
              totalResponses: flows?.length || 0 // Total Forms Created
          });

      } catch (e) {
          console.error("Analytics Error", e);
      }
  }, [user, currentWorkspace]);

  // Fetch a single flow by ID (for Builder and Client View)
  const fetchFlowById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('onboarding_flows')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Error fetching flow from DB, trying local:', err);
      const localFlows = JSON.parse(localStorage.getItem('agencyos_onboarding_flows_v2') || '[]');
      return localFlows.find((f: any) => f.id === id) || null;
    }
  }, []);

  const saveFlow = useCallback(async (flow: Partial<OnboardingFlow>) => {
    if (!user || !currentWorkspace) return;
    
    const isNew = !flow.id || !flows.find(f => f.id === flow.id);
    if (isNew) {
      const canCreate = await checkSharedLimit('onboarding_flows', 'onboardingLimit');
      if (!canCreate) {
        alert(`Onboarding form limit reached. Upgrade your plan to create more forms.`);
        return;
      }
    }

    const payload = {
      id: flow.id,
      workspace_id: currentWorkspace.id,
      owner_id: user.uid,
      name: flow.name,
      status: flow.status,
      type: flow.type,
      steps: flow.steps,
      branding: flow.branding,
      updated_at: new Date().toISOString()
    };

    setFlows(prev => {
        const idx = prev.findIndex(f => f.id === flow.id);
        if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...prev[idx], ...flow, updatedAt: 'Just now' } as OnboardingFlow;
            return next;
        }
        return [{ ...flow, updatedAt: 'Just now' } as OnboardingFlow, ...prev];
    });

    const { error } = await supabase.from('onboarding_flows').upsert(payload);
    
    if (error) {
        console.error('Error saving flow to DB, saving locally:', error);
        const localFlows = JSON.parse(localStorage.getItem('agencyos_onboarding_flows_v2') || '[]');
        const idx = localFlows.findIndex((f: any) => f.id === flow.id);
        if (idx >= 0) {
            localFlows[idx] = { ...localFlows[idx], ...payload };
        } else {
            localFlows.unshift(payload);
        }
        localStorage.setItem('agencyos_onboarding_flows_v2', JSON.stringify(localFlows));
    }
  }, [user]);

  const deleteFlow = useCallback(async (id: string) => {
    setFlows(prev => prev.filter(f => f.id !== id));
    
    const { error } = await supabase.from('onboarding_flows').delete().eq('id', id);
    
    if (error) {
        console.error('Error deleting from DB, deleting locally:', error);
    }
    
    // Always try to delete from local storage as well to keep sync
    const localFlows = JSON.parse(localStorage.getItem('agencyos_onboarding_flows_v2') || '[]');
    const newLocalFlows = localFlows.filter((f: any) => f.id !== id);
    localStorage.setItem('agencyos_onboarding_flows_v2', JSON.stringify(newLocalFlows));
  }, []);

  // Increment View Count (Public facing) - Now logs a real row
  const incrementView = useCallback(async (id: string) => {
    if (!currentWorkspace) return;
    // 1. Log the view event
    await supabase.from('onboarding_views').insert({ 
        workspace_id: currentWorkspace.id,
        flow_id: id 
    });
    
    // 2. Update the counter on the flow for list display
    const { error } = await supabase.rpc('increment_flow_view', { flow_id: id });
    if (error) console.warn("Could not increment view count RPC", error);
  }, []);

  // Submit Response (Client facing)
  const submitResponse = useCallback(async (flowId: string, submissionData: any, clientName: string) => {
      if (!currentWorkspace) return;
      const { error: subError } = await supabase.from('onboarding_submissions').insert({
          workspace_id: currentWorkspace.id,
          flow_id: flowId,
          client_name: clientName,
          data: submissionData,
          created_at: new Date().toISOString()
      });
      
      if (subError) throw subError;

      const current = await fetchFlowById(flowId);
      if(current) {
         await supabase.from('onboarding_flows').update({ 
             responses: (current.responses || 0) + 1,
             completion: 100
         }).eq('id', flowId);
      }
  }, [fetchFlowById]);

  useEffect(() => {
    fetchFlows();
    if (!currentWorkspace) return;
    
    const channel = supabase.channel('onboarding_db')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_flows', filter: `workspace_id=eq.${currentWorkspace.id}` }, fetchFlows)
        .subscribe();
        
    return () => {
        supabase.removeChannel(channel);
    };
  }, [fetchFlows, currentWorkspace]);

  return {
    flows,
    analytics,
    loading,
    fetchFlows,
    fetchAnalytics,
    fetchFlowById,
    saveFlow,
    deleteFlow,
    incrementView,
    submitResponse
  };
};
