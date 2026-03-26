
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { Estimate } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

// Helper to map DB columns to Frontend Types
const mapFromDb = (data: any): any => {
  return {
    ...data,
    clientEmail: data.client_email,
    expiryDate: data.expiry_date,
    taxRate: data.tax_rate,
    // JSONB columns come back as objects automatically
    items: data.items || [],
  };
};

const mapToDb = (estimate: any, userId: string, workspaceId: string) => {
  return {
    id: estimate.id,
    workspace_id: workspaceId,
    owner_id: userId,
    client: estimate.client,
    client_email: estimate.clientEmail,
    amount: estimate.amount,
    date: estimate.date,
    expiry_date: estimate.expiryDate,
    status: estimate.status,
    notes: estimate.notes,
    terms: estimate.terms,
    tax_rate: estimate.taxRate,
    items: estimate.items // JSONB
  };
};

export const useEstimates = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkSharedLimit } = usePlanEnforcement();

  const fetchEstimates = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setEstimates((data || []).map(mapFromDb));
    } catch (err) {
      console.error('Error fetching estimates:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const upsertEstimate = async (estimateData: any) => {
    if (!user || !currentWorkspace) return false;

    const isNew = !estimates.find(e => e.id === estimateData.id);
    if (isNew) {
      const canCreate = await checkSharedLimit('estimates', 'estimatesLimit');
      if (!canCreate) {
        alert(`Estimate limit reached. Upgrade your plan to create more estimates.`);
        return false;
      }
    }

    // Optimistic Update
    setEstimates(prev => {
      const exists = prev.find(e => e.id === estimateData.id);
      if (exists) {
        return prev.map(e => e.id === estimateData.id ? { ...e, ...estimateData } : e);
      }
      return [estimateData, ...prev];
    });

    const payload = mapToDb(estimateData, user.uid, currentWorkspace.id);

    const { error } = await supabase.from('estimates').upsert(payload);
    
    if (error) {
      console.error('Error saving estimate:', error);
      fetchEstimates(); // Revert on error
      return false;
    }
    return true;
  };

  const updateEstimateStatus = async (id: string, status: string) => {
      setEstimates(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      
      const { error } = await supabase
        .from('estimates')
        .update({ status })
        .eq('id', id);

      if (error) {
          console.error("Error updating status", error);
          fetchEstimates();
      }
  };

  const deleteEstimate = async (id: string) => {
    setEstimates(prev => prev.filter(e => e.id !== id));
    
    const { error } = await supabase
      .from('estimates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting estimate:', error);
      fetchEstimates();
    }
  };

  useEffect(() => {
    fetchEstimates();
    
    const channel = supabase
      .channel('estimates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estimates' }, () => {
          fetchEstimates();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEstimates]);

  return {
    estimates,
    loading,
    fetchEstimates,
    upsertEstimate,
    deleteEstimate,
    updateEstimateStatus,
    refresh: fetchEstimates
  };
};
