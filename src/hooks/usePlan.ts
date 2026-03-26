
import { useState, useEffect, useMemo } from 'react';
import { AVAILABLE_PLANS } from '../../constants';
import { useAgencySubscription } from '../../hooks/useAgencySubscription';

export const usePlan = () => {
  const { subscription, workspace, loading } = useAgencySubscription();
  const [currentPlanId, setCurrentPlanId] = useState('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    if (subscription) {
      setCurrentPlanId(subscription.plan_id || 'free');
      setBillingCycle((subscription.billing_cycle as 'monthly' | 'annual') || 'monthly');
    } else if (workspace) {
      setCurrentPlanId(workspace.plan_id || 'free');
      setBillingCycle((workspace.billing_cycle as 'monthly' | 'annual') || 'monthly');
    }
  }, [subscription, workspace]);

  const plan = useMemo(() => {
    const basePlan = AVAILABLE_PLANS.find(p => p.id === currentPlanId) || AVAILABLE_PLANS[0];
    
    // If we have a subscription from the DB, use its limits as they might be customized
    if (subscription) {
      return {
        ...basePlan,
        seatLimit: subscription.seat_limit ?? basePlan.seatLimit,
        storageLimitGB: subscription.storage_limit_gb ?? basePlan.storageLimitGB,
        baseCredits: subscription.base_credits ?? basePlan.baseCredits,
        projectLimit: subscription.project_limit ?? basePlan.projectLimit,
        clientLimit: subscription.client_limit ?? basePlan.clientLimit,
        pipelineLimit: subscription.pipeline_limit ?? basePlan.pipelineLimit,
        bookingsLimit: subscription.bookings_limit ?? basePlan.bookingsLimit,
        servicesLimit: subscription.services_limit ?? basePlan.servicesLimit,
        onboardingLimit: subscription.onboarding_limit ?? basePlan.onboardingLimit,
        pagesLimit: subscription.pages_limit ?? basePlan.pagesLimit,
        invoicesLimit: subscription.invoices_limit ?? basePlan.invoicesLimit,
        estimatesLimit: subscription.estimates_limit ?? basePlan.estimatesLimit,
        ticketsLimit: subscription.tickets_limit ?? basePlan.ticketsLimit,
        marketingEmailsLimit: subscription.marketing_emails_limit ?? basePlan.marketingEmailsLimit,
        workspacesLimit: subscription.workspaces_limit ?? basePlan.workspacesLimit
      };
    }
    
    return basePlan;
  }, [currentPlanId, subscription]);

  const checkLimit = (currentCount: number, limit: number) => {
    if (limit === -1) return true; // Unlimited
    return currentCount < limit;
  };

  return {
    plan,
    currentPlanId,
    billingCycle,
    checkLimit,
    loading
  };
};
