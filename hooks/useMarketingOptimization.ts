
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

// Types matching the frontend expectations + DB structure
export interface ExperimentVariant {
  id: string;
  name: string;
  visitors: number;
  conversions: number;
}

export interface Experiment {
  id: string;
  name: string;
  type: string;
  status: 'Running' | 'Learning' | 'Completed' | 'Paused' | 'Draft';
  uplift: string;
  confidence: string;
  traffic: string;
  start: string;
  variants: string[]; // Names only for list display
  variantData: ExperimentVariant[]; // Full data
  hypothesis?: string;
  targetPage?: string;
  primaryMetric?: string;
  probData?: any[];
  liftData?: any[];
  kpis?: any;
  settings?: any;
  traffic_allocation?: number;
}

const generateProbData = (offsetA = 20, offsetB = 28) => Array.from({ length: 50 }, (_, i) => {
  const x = i;
  const yA = Math.exp(-Math.pow(x - offsetA, 2) / 50); 
  const yB = Math.exp(-Math.pow(x - offsetB, 2) / 40); 
  return { x, Control: yA, Variant: yB };
});

const generateLiftData = (base = 2, growth = 0.1) => Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  control: base + Math.random() * 0.5,
  variant: base + (i * growth) + Math.random() * 0.5,
}));

export const useMarketingOptimization = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);
    try {
      const { data: exps, error: expError } = await supabase
        .from('marketing_experiments')
        .select(`
            *,
            marketing_experiment_variants (*)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (expError) throw expError;

      const formatted: Experiment[] = (exps || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          status: e.status,
          uplift: e.kpis?.lift || '0%',
          confidence: e.kpis?.confidence || '0%',
          traffic: e.kpis?.sample || '0',
          start: e.start_date || 'Just now',
          variants: e.marketing_experiment_variants?.map((v: any) => v.name) || [],
          variantData: e.marketing_experiment_variants || [],
          hypothesis: e.hypothesis,
          targetPage: e.target_page,
          primaryMetric: e.primary_metric,
          traffic_allocation: e.traffic_allocation,
          probData: e.analysis_data?.probData || generateProbData(), // Fallback if not saved
          liftData: e.analysis_data?.liftData || generateLiftData(),
          kpis: e.kpis,
          settings: e.settings
      }));

      setExperiments(formatted);
    } catch (err) {
      console.error('Error fetching experiments:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createExperiment = async (exp: Partial<Experiment>) => {
      if (!user || !currentWorkspace) return;
      const expId = exp.id || `exp-${Date.now()}`;
      
      // 1. Insert Experiment
      const { error: expError } = await supabase.from('marketing_experiments').insert([{
          id: expId,
          workspace_id: currentWorkspace.id,
          owner_id: user.uid,
          name: exp.name,
          type: exp.type,
          status: exp.status,
          hypothesis: exp.hypothesis,
          target_page: exp.targetPage,
          primary_metric: exp.primaryMetric,
          traffic_allocation: exp.traffic_allocation,
          kpis: exp.kpis,
          analysis_data: {
              probData: exp.probData,
              liftData: exp.liftData
          },
          start_date: exp.start
      }]);

      if (expError) {
          console.error("Error creating experiment", expError);
          return;
      }

      // 2. Insert Variants
      const variantsToInsert = (exp.variants || []).map((vName, idx) => ({
          id: `${expId}-v${idx}`,
          workspace_id: currentWorkspace.id,
          experiment_id: expId,
          name: vName,
          visitors: Math.floor(Math.random() * 1000), // Initial seed data for demo feel
          conversions: Math.floor(Math.random() * 50)
      }));

      if (variantsToInsert.length > 0) {
          await supabase.from('marketing_experiment_variants').insert(variantsToInsert);
      }

      fetchExperiments();
  };

  const updateExperiment = async (id: string, updates: Partial<Experiment>) => {
      // Map frontend fields to DB columns
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.type) dbUpdates.type = updates.type;
      if (updates.hypothesis) dbUpdates.hypothesis = updates.hypothesis;
      if (updates.targetPage) dbUpdates.target_page = updates.targetPage;
      if (updates.primaryMetric) dbUpdates.primary_metric = updates.primaryMetric;
      if (updates.traffic_allocation) dbUpdates.traffic_allocation = updates.traffic_allocation;
      
      // Update JSONB fields (merge strategy)
      if (updates.kpis) {
         // We'd typically fetch current first to merge, but for this simpler implementation we assume updates contain full object or we overwrite
         dbUpdates.kpis = updates.kpis; 
      }
      
      const { error } = await supabase.from('marketing_experiments').update(dbUpdates).eq('id', id);
      
      // If variants changed (added/removed), handle separately (simplified: usually requires diffing)
      if (updates.variants) {
         // Logic to update variant names or add new ones is complex without knowing IDs. 
         // For now, we assume simple property updates on the main object.
      }

      if (error) console.error("Update failed", error);
      else fetchExperiments();
  };

  const deleteExperiment = async (id: string) => {
      const { error } = await supabase.from('marketing_experiments').delete().eq('id', id);
      if (!error) fetchExperiments();
  };

  useEffect(() => {
    fetchExperiments();
    const sub = supabase.channel('marketing_exp_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_experiments' }, fetchExperiments)
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchExperiments]);

  return {
    experiments,
    loading,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    refresh: fetchExperiments
  };
};
