
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export interface UsageMetrics {
  projects: number;
  seats: number;
  pipelines: number;
  bookings: number;
  services: number;
  onboarding: number;
  pages: number;
  invoices: number;
  estimates: number;
  requests: number;
  storage: number;
  credits: number;
}

export const useUsage = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/billing/usage?userId=${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch usage metrics');
      const data = await response.json();
      setUsage(data);
    } catch (err: any) {
      console.error('Error fetching usage:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, error, refresh: fetchUsage };
};
