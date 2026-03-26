
import { useMemo } from 'react';
import { usePlan } from './usePlan';
import { ALL_ADDONS } from '../constants';
import { useAgencySubscription } from '../../hooks/useAgencySubscription';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';

export const usePlanEnforcement = () => {
  const { plan, currentPlanId } = usePlan();
  const { addons } = useAgencySubscription();
  const { user } = useAuth();

  const purchasedAddonIds = addons || [];
  const paidAddonIds = addons || []; // Assuming if it's in addons, it's active

  const hasAddon = (addonId: string) => {
    return purchasedAddonIds.includes(addonId) || currentPlanId === 'enterprise_plus';
  };

  const getLimit = (key: keyof typeof plan) => {
    let baseLimit = (plan[key] as number) || 0;
    
    // Addon boosts
    if (key === 'workspacesLimit' && hasAddon('extra_workspaces')) {
      baseLimit += 10;
    }
    if (key === 'seatLimit' && hasAddon('extra_seats')) {
      baseLimit += 5;
    }
    if (key === 'storageLimitGB' && hasAddon('storage_1tb')) {
      baseLimit += 1024;
    }
    if (key === 'baseCredits' && hasAddon('ai_pro')) {
      baseLimit += 50000;
    }

    return baseLimit;
  };

  const checkLimit = (key: keyof typeof plan, currentCount: number) => {
    const limit = getLimit(key);
    if (limit === -1) return true;
    return currentCount < limit;
  };

  const checkSharedLimit = async (tableName: string, limitKey: keyof typeof plan, filter?: { column: string, operator: 'eq' | 'neq' | 'in' | 'not.in', value: any }, sumColumn?: string) => {
    const limit = getLimit(limitKey);
    if (limit === -1) return true;
    if (!user) return false;

    if (sumColumn) {
        let query = supabase
          .from(tableName)
          .select(sumColumn)
          .eq('owner_id', user.uid);

        if (filter) {
            if (filter.operator === 'eq') query = query.eq(filter.column, filter.value);
            if (filter.operator === 'neq') query = query.neq(filter.column, filter.value);
            if (filter.operator === 'in') query = query.in(filter.column, filter.value);
            if (filter.operator === 'not.in') query = query.not('in', filter.column, filter.value);
        }

        const { data } = await query;
        const total = (data || []).reduce((acc: number, row: any) => acc + (Number(row[sumColumn]) || 0), 0);
        return total < limit;
    }

    // Get count from the target table across all workspaces using owner_id
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.uid);

    if (filter) {
        if (filter.operator === 'eq') query = query.eq(filter.column, filter.value);
        if (filter.operator === 'neq') query = query.neq(filter.column, filter.value);
        if (filter.operator === 'in') query = query.in(filter.column, filter.value);
        if (filter.operator === 'not.in') query = query.not('in', filter.column, filter.value);
    }

    const { count } = await query;

    return (count || 0) < limit;
  };

  return {
    plan,
    hasAddon,
    getLimit,
    checkLimit,
    checkSharedLimit,
    purchasedAddonIds,
    paidAddonIds
  };
};
