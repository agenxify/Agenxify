
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import { Service } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

// Helper to generate ID if needed (though Supabase usually handles UUIDs, text IDs are used in this app)
const generateId = () => `s-${Date.now()}`;

export const useServices = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkSharedLimit } = usePlanEnforcement();

  const fetchServices = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB columns to Frontend Interface
      const mappedServices: Service[] = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        type: s.type,
        pricingType: s.pricing_type,
        price: s.price,
        image: s.image,
        creditsIncluded: s.credits_included,
        hoursIncluded: s.hours_included,
        // Merge any extended metadata stored in JSONB column
        ...(s.metadata || {})
      }));

      setServices(mappedServices);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  const getServiceById = async (id: string): Promise<any | null> => {
    if (!currentWorkspace) return null;
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type,
        pricingType: data.pricing_type,
        price: data.price,
        image: data.image,
        creditsIncluded: data.credits_included,
        hoursIncluded: data.hours_included,
        ...(data.metadata || {})
      };
    } catch (err) {
      console.error(`Error fetching service ${id}:`, err);
      return null;
    }
  };

  const addService = async (serviceData: any) => {
    if (!user || !currentWorkspace) return;

    const canCreate = await checkSharedLimit('services', 'servicesLimit');
    if (!canCreate) {
      alert(`Service limit reached. Upgrade your plan to create more services.`);
      return;
    }
    
    // Separate core fields from metadata
    const { 
      id, name, description, type, pricingType, price, image, creditsIncluded, hoursIncluded, 
      ...meta 
    } = serviceData;

    const payload = {
      id: id || generateId(),
      workspace_id: currentWorkspace.id,
      owner_id: user.uid,
      name,
      description,
      type,
      pricing_type: pricingType,
      price,
      image,
      credits_included: creditsIncluded,
      hours_included: hoursIncluded,
      metadata: meta, // Store rich data (gallery, phases, seo, etc) here
      created_at: new Date().toISOString()
    };

    // Optimistic Update
    setServices(prev => [serviceData as Service, ...prev]);

    const { error } = await supabase.from('services').upsert([payload]);
    if (error) {
      console.error('Error creating service:', error);
      fetchServices(); // Revert
    }
  };

  const updateService = async (id: string, serviceData: any) => {
    if (!currentWorkspace) return;
    // Optimistic Update
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...serviceData } : s));

    const { 
      name, description, type, pricingType, price, image, creditsIncluded, hoursIncluded, 
      ...meta 
    } = serviceData;

    const payload: any = {
      name,
      description,
      type,
      price,
      image,
      metadata: meta
    };

    if (pricingType !== undefined) payload.pricing_type = pricingType;
    if (creditsIncluded !== undefined) payload.credits_included = creditsIncluded;
    if (hoursIncluded !== undefined) payload.hours_included = hoursIncluded;

    const { error } = await supabase.from('services').update(payload).eq('id', id).eq('workspace_id', currentWorkspace.id);
    if (error) {
      console.error('Error updating service:', error);
      fetchServices();
    }
  };

  const deleteService = async (id: string) => {
    if (!currentWorkspace) return;
    setServices(prev => prev.filter(s => s.id !== id));
    
    const { error } = await supabase.from('services').delete().eq('id', id).eq('workspace_id', currentWorkspace.id);
    if (error) {
      console.error('Error deleting service:', error);
      fetchServices();
    }
  };

  useEffect(() => {
    fetchServices();
    
    if (!currentWorkspace) return;

    const channel = supabase
      .channel('services_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `workspace_id=eq.${currentWorkspace.id}` }, () => {
          fetchServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchServices, currentWorkspace]);

  return { 
    services, 
    loading, 
    addService, 
    updateService, 
    deleteService, 
    getServiceById,
    refresh: fetchServices 
  };
};
