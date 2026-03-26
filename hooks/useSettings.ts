import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

export const DEFAULT_SETTINGS = {
  agencyName: 'AgencyOS Global',
  agencyDomain: 'https://agencyos.io',
  agencyLegalName: 'AgencyOS Solutions Inc.',
  theme: 'dark',
  accentColor: 'blue',
  uiDensity: 'comfortable',
  sidebarState: 'expanded',
  showRevenue: true,
  showTasks: true,
  showActivity: true,
  showInvoices: true,
  chartStyle: 'area',
  aiDefaultMode: 'Strategic',
  aiTemperature: 0.7,
  aiMultimodal: true,
  aiGrounding: false,
  defaultTaskPriority: 'Medium',
  defaultTaskType: 'Operational',
  timeIncrement: 15,
  defaultBillable: true,
  currency: 'USD',
  defaultProbability: 20,
  autoArchiveDeals: false,
  invoicePrefix: 'INV-',
  taxRate: 0,
  autoDispatchInvoices: false,
  fiscalYearStart: '01',
  mfaEnabled: true,
  sessionTimeout: 60,
  systemSounds: true,
  browserNotifs: true,
  dataRetentionDays: 90
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('config')
        .eq('owner_id', user.uid)
        .single();

      if (data) {
        // Merge with defaults to ensure new keys are present if schema updates
        const merged = { ...DEFAULT_SETTINGS, ...data.config };
        setSettings(merged);
        
        // Sync to local storage for legacy/synchronous access
        localStorage.setItem('agencyos_global_config', JSON.stringify(merged));
        
        // Dispatch event for immediate UI updates elsewhere
        window.dispatchEvent(new CustomEvent('agencyos_config_updated', { detail: merged }));
      } else {
        // No settings found (new user), use defaults
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateSettings = async (newSettings: any) => {
    if (!user) return;
    
    // Optimistic Update
    setSettings(newSettings);
    
    // Sync Local
    localStorage.setItem('agencyos_global_config', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('agencyos_config_updated', { detail: newSettings }));

    // Persist to DB
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        owner_id: user.uid, 
        config: newSettings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'owner_id' });

    if (error) {
        console.error('Error saving settings to DB:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    const handleConfigUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };
    
    window.addEventListener('agencyos_config_updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('agencyos_config_updated', handleConfigUpdate);
    };
  }, [fetchSettings]);

  return { settings, loading, updateSettings };
};
