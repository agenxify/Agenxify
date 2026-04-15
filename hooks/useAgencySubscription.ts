
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Invoice } from '../types';
import { AVAILABLE_PLANS } from '../constants';

export const useAgencySubscription = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // State mirrors DB columns
  const [workspace, setWorkspace] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [unbilledCharges, setUnbilledCharges] = useState<any[]>([]);
  const [topupCredits, setTopupCredits] = useState<any[]>([]);

  const calculateTotalCredits = useCallback((ws: any, purchasedAddons: any[], sub: any) => {
    const planId = sub?.plan_id || ws?.plan_id || 'free';
    const plan = AVAILABLE_PLANS.find(p => p.id === planId);
    const baseCredits = plan?.baseCredits || 0;
    
    // Use subscription.credits_balance as the shared source of truth
    // It now includes top-ups and addon credits via DB triggers
    return (sub?.credits_balance || 0) + baseCredits;
  }, []);

  const totalCredits = useMemo(() => {
    return calculateTotalCredits(workspace, addons, subscription);
  }, [workspace, addons, subscription, calculateTotalCredits]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Always fetch the primary workspace for billing purposes (the oldest one)
      const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.uid)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (wsError) {
          if (wsError.code === 'PGRST116') {
            const newId = crypto.randomUUID();
            const { data: newWs, error: createError } = await supabase
              .from('workspaces')
              .insert([{
                 id: newId,
                 owner_id: user.uid, 
                 name: (user.name || 'User') + "'s Agency",
                 plan_id: 'free',
                 credits_balance: 0 // Base credits are added in calculation
              }])
              .select()
              .single();
            
            if (createError) throw createError;
            setWorkspace(newWs);
            return fetchData();
          }
          throw wsError;
      }

      if (ws) {
          setWorkspace(ws);

          const [subRes, pmRes, histRes, addonsRes, unbilledRes, topupRes] = await Promise.all([
             supabase.from('subscriptions').select('*').eq('owner_id', user.uid).maybeSingle(),
             supabase.from('payment_methods').select('*').eq('owner_id', user.uid),
             supabase.from('billing_history').select('*').eq('owner_id', user.uid).order('date_issued', { ascending: false }),
             supabase.from('purchased_addons').select('addon_id, created_at, expires_at').eq('owner_id', user.uid).eq('status', 'active'),
             supabase.from('unbilled_charges').select('*').eq('owner_id', user.uid),
             supabase.from('topup_credits').select('*').eq('owner_id', user.uid).order('created_at', { ascending: false })
          ]);

          if (subRes.data) {
            setSubscription(subRes.data);
          } else if (!subRes.data && !subRes.error) {
            // If subscription doesn't exist, create it with free plan defaults
            const freePlan = AVAILABLE_PLANS.find(p => p.id === 'free')!;
            const { data: newSub } = await supabase.from('subscriptions').insert({
              workspace_id: ws.id,
              owner_id: user.uid,
              plan_id: freePlan.id,
              plan_name: freePlan.name,
              price: freePlan.price,
              billing_cycle: 'monthly',
              features: freePlan.features,
              seat_limit: freePlan.seatLimit,
              storage_limit_gb: freePlan.storageLimitGB,
              base_credits: freePlan.baseCredits,
              project_limit: freePlan.projectLimit,
              client_limit: freePlan.clientLimit,
              pipeline_limit: freePlan.pipelineLimit,
              bookings_limit: freePlan.bookingsLimit,
              services_limit: freePlan.servicesLimit,
              onboarding_limit: freePlan.onboardingLimit,
              pages_limit: freePlan.pagesLimit,
              invoices_limit: freePlan.invoicesLimit,
              estimates_limit: freePlan.estimatesLimit,
              tickets_limit: freePlan.ticketsLimit,
              marketing_emails_limit: freePlan.marketingEmailsLimit,
              workspaces_limit: freePlan.workspacesLimit
            }).select().single();
            
            setSubscription(newSub);
          }

          setPaymentMethods(pmRes.data || []);
          
          const mappedHistory = (histRes.data || []).map((inv: any) => ({
             id: inv.invoice_number,
             number: inv.invoice_number,
             date: new Date(inv.date_issued).toLocaleDateString(),
             amount: Number(inv.amount),
             status: inv.status,
             items: inv.line_items ? inv.line_items.map((i: any) => i.name).join(', ') : 'Service Charge'
          }));
          setBillingHistory(mappedHistory);
          const now = new Date();
          const activeAddons = (addonsRes.data || [])
            .filter((a: any) => !a.expires_at || new Date(a.expires_at) > now)
            .map((a: any) => ({
              id: a.addon_id,
              created_at: a.created_at
            }));
          setAddons(activeAddons);
          setUnbilledCharges(unbilledRes.data || []);
          setTopupCredits(topupRes.data || []);
      }
    } catch (err) {
      console.error("Error fetching subscription data:", err);
    } finally {
      setLoading(false);
    }
  }, [user, calculateTotalCredits]);

  // Actions
  const updatePlan = async (planId: string, cycle: 'monthly' | 'annual', amountPaid?: number) => {
      if (!workspace) return;
      
      const planDetails = AVAILABLE_PLANS.find(p => p.id === planId);
      if (!planDetails) return;

      const priceMultiplier = cycle === 'annual' ? 12 : 1;
      const amount = amountPaid !== undefined ? amountPaid : planDetails.price * priceMultiplier;

      // 1. Update the subscriptions table
      const subWorkspaceId = subscription?.workspace_id || workspace.id;
      const { error: subError } = await supabase.from('subscriptions').upsert({ 
          workspace_id: subWorkspaceId,
          owner_id: user.uid,
          plan_id: planDetails.id,
          plan_name: planDetails.name,
          price: planDetails.price,
          billing_cycle: cycle,
          features: planDetails.features,
          seat_limit: planDetails.seatLimit,
          storage_limit_gb: planDetails.storageLimitGB,
          base_credits: planDetails.baseCredits,
          project_limit: planDetails.projectLimit,
          client_limit: planDetails.clientLimit,
          pipeline_limit: planDetails.pipelineLimit,
          bookings_limit: planDetails.bookingsLimit,
          services_limit: planDetails.servicesLimit,
          onboarding_limit: planDetails.onboardingLimit,
          pages_limit: planDetails.pagesLimit,
          invoices_limit: planDetails.invoicesLimit,
          estimates_limit: planDetails.estimatesLimit,
          tickets_limit: planDetails.ticketsLimit,
          marketing_emails_limit: planDetails.marketingEmailsLimit,
          workspaces_limit: planDetails.workspacesLimit,
          updated_at: new Date().toISOString()
      }, { onConflict: 'owner_id' });
      
      if (subError) {
          console.error("Failed to update subscription:", subError);
          throw subError;
      }
      
      // 2. Update all workspaces billing cycle and plan
      const { error: wsError } = await supabase.from('workspaces').update({
          billing_cycle: cycle,
          plan_start_date: new Date().toISOString(),
          plan_id: planId
      }).eq('owner_id', user.uid);

      if (wsError) {
          console.error("Failed to update workspaces:", wsError);
          throw wsError;
      }
      
      // 3. Add to billing history
      if (amount > 0) {
          const invNum = `INV-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
          await supabase.from('billing_history').insert({
              workspace_id: subWorkspaceId,
              owner_id: user.uid,
              invoice_number: invNum,
              amount: amount,
              status: 'Paid',
              line_items: [{ name: `${planDetails.name} Plan (${cycle})`, amount: amount }],
              date_paid: new Date().toISOString()
          });
      }
      
      window.dispatchEvent(new CustomEvent('agencyos_credits_updated'));
      window.dispatchEvent(new CustomEvent('agencyos_workspace_updated'));
      await fetchData();
  };

  const addUnbilledCharge = async (charge: any) => {
      if (!workspace) return;
      
      const { error } = await supabase.from('unbilled_charges').insert({
          workspace_id: workspace.id,
          owner_id: user.uid,
          description: charge.desc || charge.description || charge.name,
          amount: charge.amount,
          type: charge.type || 'one_time',
          metadata: charge
      });
      
      if (error) throw error;
      await fetchData();
  };

  const removeUnbilledCharge = async (chargeId: string) => {
      if (!workspace) return;
      const { error } = await supabase.from('unbilled_charges').delete().eq('id', chargeId);
      if (error) throw error;
      await fetchData();
  };

  const addCredits = async (amount: number, cost: number) => {
      if (!user) return;
      
      // 1. Add record to unbilled charges
      const { error: unbilledError } = await supabase.from('unbilled_charges').insert({
          workspace_id: workspace?.id, // Reference current workspace if available
          owner_id: user.uid,
          description: `${amount} Credits Top-up`,
          amount: cost,
          type: 'credit_topup',
          metadata: { creditsValue: amount }
      });

      if (unbilledError) throw unbilledError;

      // 2. Add to topup_credits table - Database trigger will automatically update subscriptions.credits_balance
      const { error: topupError } = await supabase.from('topup_credits').insert({
          workspace_id: workspace?.id,
          owner_id: user.uid,
          amount: amount,
          cost: cost,
          status: 'active',
          metadata: { description: `${amount} Credits Top-up` }
      });

      if (topupError) throw topupError;

      window.dispatchEvent(new CustomEvent('agencyos_credits_updated'));
      await fetchData();
  };

  const addCreditsToBalance = async (amount: number) => {
      if (!user) return;
      
      // We record a topup with 0 cost for manual adjustments
      // Database trigger will automatically update subscriptions.credits_balance
      const { error: topupError } = await supabase.from('topup_credits').insert({
          workspace_id: workspace?.id,
          owner_id: user.uid,
          amount: amount,
          cost: 0,
          status: 'active',
          metadata: { description: `Manual Credit Adjustment`, type: 'manual' }
      });

      if (topupError) throw topupError;
      
      window.dispatchEvent(new CustomEvent('agencyos_credits_updated'));
      await fetchData();
  };

  const deductCredits = async (amount: number) => {
      if (!user) return;
      
      // Fetch latest subscription to avoid race conditions
      const { data: latestSub } = await supabase.from('subscriptions').select('credits_balance').eq('owner_id', user.uid).single();
      const currentCredits = latestSub?.credits_balance || 0;

      const { error } = await supabase.from('subscriptions').update({
          credits_balance: currentCredits - amount
      }).eq('owner_id', user.uid);

      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('agencyos_credits_updated'));
      await fetchData();
  };

  useEffect(() => {
      window.addEventListener('agencyos_credits_updated', fetchData);
      return () => window.removeEventListener('agencyos_credits_updated', fetchData);
  }, [fetchData]);

  const addAddon = async (addonId: string, price: number, cycle: 'monthly' | 'annual' = 'annual') => {
      if (!workspace) return;
      
      const expiresAt = new Date();
      if (cycle === 'annual') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { error } = await supabase.from('purchased_addons').insert({
          workspace_id: workspace.id,
          owner_id: user.uid,
          addon_id: addonId,
          status: 'active',
          billing_cycle: cycle,
          expires_at: expiresAt.toISOString()
      });
      
      if (error) throw error;
      
      // Add prorated charge logic here in real app
      await fetchData();
  };

  const addPaymentMethod = async (details: any) => {
      if (!workspace) return;
      const { error } = await supabase.from('payment_methods').insert({
          workspace_id: workspace.id,
          owner_id: user.uid,
          brand: details.brand,
          last4: details.last4,
          exp_month: details.exp_month,
          exp_year: details.exp_year,
          cardholder_name: details.holder,
          is_default: paymentMethods.length === 0 // First one is default
      });
      
      if (error && error.code === 'PGRST205') {
          // No specific localStorage for payment methods yet, but we could add one if needed
          console.warn("Table 'payment_methods' missing. Payment method not saved.");
      }
      
      await fetchData();
  };
  
  const generateInvoice = async (amount: number, items: any[]) => {
      if (!workspace) return;
      const invNum = `INV-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
      
      const { error: histError } = await supabase.from('billing_history').insert({
          workspace_id: subscription?.workspace_id || workspace.id,
          owner_id: user.uid,
          invoice_number: invNum,
          amount: amount,
          status: 'Paid',
          line_items: items,
          date_paid: new Date().toISOString()
      });

      if (histError) throw histError;
      
      // Clear unbilled
      const { error: delError } = await supabase.from('unbilled_charges').delete().eq('owner_id', user.uid);
      
      if (delError) throw delError;
      
      await fetchData();
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('agencyos_workspace_changed', fetchData);
    window.addEventListener('agencyos_config_updated', fetchData);
    window.addEventListener('agencyos_workspace_updated', fetchData);
    
    if (!user?.uid) {
      return () => {
        window.removeEventListener('agencyos_workspace_changed', fetchData);
        window.removeEventListener('agencyos_config_updated', fetchData);
        window.removeEventListener('agencyos_workspace_updated', fetchData);
      };
    }

    const channels = [
      supabase.channel('ws_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces', filter: `owner_id=eq.${user.uid}` }, fetchData).subscribe(),
      supabase.channel('pm_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods', filter: `owner_id=eq.${user.uid}` }, fetchData).subscribe(),
      supabase.channel('bh_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'billing_history', filter: `owner_id=eq.${user.uid}` }, fetchData).subscribe(),
      supabase.channel('pa_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'purchased_addons', filter: `owner_id=eq.${user.uid}` }, fetchData).subscribe(),
      supabase.channel('uc_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'unbilled_charges', filter: `owner_id=eq.${user.uid}` }, fetchData).subscribe(),
      supabase.channel('sub_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `owner_id=eq.${user.uid}` }, fetchData).subscribe(),
      supabase.channel('topup_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'topup_credits', filter: `owner_id=eq.${user.uid}` }, fetchData).subscribe()
    ];

    return () => {
      window.removeEventListener('agencyos_workspace_changed', fetchData);
      window.removeEventListener('agencyos_config_updated', fetchData);
      window.removeEventListener('agencyos_workspace_updated', fetchData);
      channels.forEach(c => supabase.removeChannel(c));
    };
  }, [fetchData, user?.uid]);

  return {
    workspace,
    subscription,
    paymentMethods,
    billingHistory,
    addons,
    unbilledCharges,
    topupCredits,
    totalCredits,
    loading,
    refresh: fetchData,
    updatePlan,
    addCredits,
    addAddon,
    addUnbilledCharge,
    removeUnbilledCharge,
    deductCredits,
    addCreditsToBalance,
    addPaymentMethod,
    generateInvoice
  };
};
