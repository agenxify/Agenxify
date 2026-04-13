
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, Check, Download, Plus, Shield, Zap, Clock, 
  CheckCircle2, AlertCircle, FileText, ChevronRight, MoreHorizontal,
  ArrowUpRight, Receipt, Building, Mail, Globe, Sparkles, ShieldCheck,
  Smartphone, BarChart3, PieChart, Layers, Database, UserPlus, Users,
  Settings2, RefreshCw, PenTool, Wallet, X, Star, Loader2, Lock, Building2,
  CalendarCheck, Package, Rocket, Calculator, TrendingUp, Crown
} from 'lucide-react';
import { MOCK_PROFILES, MOCK_PROJECTS, AVAILABLE_PLANS, ALL_ADDONS, MOCK_INVOICES, MOCK_REQUESTS } from '../constants';
import * as ReactRouterDom from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../supabase';
import { useTeam } from '../hooks/useTeam';
import { useAgencySubscription } from '../hooks/useAgencySubscription';
import { useStorage } from '../hooks/useStorage';
import { useRequests } from '../hooks/useRequests';
import { useSystemData } from '../hooks/useSystemData';
import { usePipeline } from '../hooks/usePipeline';
import { useBookings } from '../hooks/useBookings';
import { useOnboarding } from '../hooks/useOnboarding';
import { usePages } from '../hooks/usePages';
import { useInvoices } from '../hooks/useInvoices';
import { useEstimates } from '../hooks/useEstimates';
import { useTickets } from '../hooks/useTickets';
import { useCampaigns } from '../hooks/useCampaigns';
import { useAccountUsage } from '../hooks/useAccountUsage';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

const { useNavigate } = ReactRouterDom as any;

const PersonalBilling: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  
  // Real Data Hooks
  const { 
    workspace: subWorkspace, 
    subscription,
    billingHistory: realBillingHistory, 
    addons: activeAddonIds, 
    unbilledCharges: realUnbilledCharges,
    topupCredits,
    totalCredits: hookTotalCredits,
    loading: subLoading 
  } = useAgencySubscription();

  // Use subWorkspace from subscription hook as source of truth for billing details (has real-time listeners)
  const workspace = subWorkspace || currentWorkspace;
  
  const { usage: accountUsage, loading: usageLoading } = useAccountUsage();

  // Profile Sync State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('agencyos_profile_data');
    return saved ? JSON.parse(saved) : MOCK_PROFILES.find(p => p.id === 'current');
  });

  // Plan & Cycle State
  const currentPlanId = subscription?.plan_id || workspace?.plan_id || 'free';
  const billingCycle = (subscription?.billing_cycle || workspace?.billing_cycle || 'monthly') as 'monthly' | 'annual';

  // Addons State
  const purchasedAddons = activeAddonIds || [];

  // Unbilled Charges State (Pending Add-ons, Top-ups)
  const unbilledCharges = realUnbilledCharges || [];

  // Billing History State
  const billingHistory = realBillingHistory || [];

  // PDF Printing State
  const [printingInvoice, setPrintingInvoice] = useState<any | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [workspacesCount, setWorkspacesCount] = useState(0);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [billingInfo, setBillingInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('agencyos_billing_info');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse billing info", e);
    }
    return {
      companyName: currentUser?.name || 'Agency Admin',
      email: currentUser?.email || 'admin@agencyos.io',
      taxId: '',
      address: currentUser?.location || 'San Francisco, CA'
    };
  });

  // Sync billing info when user changes
  useEffect(() => {
    if (currentUser) {
      setBillingInfo(prev => ({
        ...prev,
        companyName: currentUser.name || prev.companyName,
        email: currentUser.email || prev.email,
        address: currentUser.location || prev.address
      }));
    }
  }, [currentUser]);

  // Fetch all workspaces count
  useEffect(() => {
    const fetchWorkspacesCount = async () => {
      if (!user) return;
      try {
        const { count, error } = await supabase
          .from('workspaces')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.uid);
        
        if (!error) setWorkspacesCount(count || 0);
      } catch (e) {
        console.error("Error fetching workspaces count", e);
      }
    };
    fetchWorkspacesCount();
  }, [user]);

  // --- Derived State for Invoice Printing ---
  const invoiceDisplayNum = printingInvoice ? (printingInvoice.number || printingInvoice.id) : '';
  const isEverythingPaid = printingInvoice?.status === 'Paid';
  
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    // Fallback parser if standard constructor fails (e.g. DD/MM/YYYY)
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
    return new Date();
  };

  const issueDate = printingInvoice ? parseDate(printingInvoice.date) : new Date();
  const dueDate = printingInvoice?.dueDate ? parseDate(printingInvoice.dueDate) : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const total = printingInvoice?.amount || 0;
  const subtotal = total; // Assuming tax inclusive or flat amount for history items
  
  const lineItems = printingInvoice ? [
    {
      name: printingInvoice.items || 'Agency Services',
      desc: 'Service Charge',
      qty: 1,
      amount: total
    }
  ] : [];
  // ------------------------------------------

  const currentPlan = useMemo(() => 
    AVAILABLE_PLANS.find(p => p.id === currentPlanId) || AVAILABLE_PLANS[0], 
  [currentPlanId]);

  // Derived Data
  const activeAddonsList = useMemo(() => {
    return ALL_ADDONS.filter(addon => purchasedAddons.some(pa => pa.id === addon.id)).map(addon => {
      const purchaseInfo = purchasedAddons.find(pa => pa.id === addon.id);
      const purchaseDate = purchaseInfo?.created_at ? new Date(purchaseInfo.created_at) : new Date();
      
      // All addons are annual
      const nextBilling = new Date(purchaseDate);
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      
      return {
        ...addon,
        purchaseDate,
        nextBillingDate: nextBilling.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
    });
  }, [purchasedAddons]);

  const addonsCost = useMemo(() => {
    return activeAddonsList.reduce((acc, addon) => acc + addon.price, 0);
  }, [activeAddonsList]);

  // Check if current month/cycle is paid
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Keys for checking paid status
  const planPaidKey = billingCycle === 'annual' 
    ? `agencyos_paid_plan_${year}` 
    : `agencyos_paid_plan_${year}_${month}`;
  
  const addonPaidKey = `agencyos_paid_addons_${year}_${month}`;

  const [isPlanPaid, setIsPlanPaid] = useState(() => {
      // Free plan is always "paid"
      if (currentPlanId === 'free') return true;
      return localStorage.getItem(planPaidKey) === 'true';
  });
  
  // Check for pending plan updates
  const [pendingPlan, setPendingPlan] = useState<any>(() => {
    try {
        return JSON.parse(localStorage.getItem('agencyos_pending_plan_update') || 'null');
    } catch { return null; }
  });

  // Check specifically which addons are paid for this cycle
  // We now assume that if it's in purchasedAddons from Supabase, it's paid
  const paidAddonIds = useMemo(() => purchasedAddons.map(pa => pa.id), [purchasedAddons]);

  useEffect(() => {
    const handleConfigUpdate = () => {
      if (currentPlanId === 'free') {
        setIsPlanPaid(true);
      } else {
        setIsPlanPaid(localStorage.getItem(planPaidKey) === 'true');
      }

      try {
        setPendingPlan(JSON.parse(localStorage.getItem('agencyos_pending_plan_update') || 'null'));
      } catch {
        setPendingPlan(null);
      }
    };

    window.addEventListener('agencyos_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('agencyos_config_updated', handleConfigUpdate);
  }, [currentPlanId, planPaidKey, addonPaidKey]);

  // --- Dynamic Date Calculations ---

  const nextBillingDate = useMemo(() => {
      // Get actual start date if stored
      const startDateStr = subscription?.plan_start_date || workspace?.plan_start_date;
      const start = startDateStr ? new Date(startDateStr) : new Date();
      const now = new Date();
      
      if (currentPlanId === 'free') {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 1);
        d.setDate(1);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      // If plan is not paid, it's due now
      if (!isPlanPaid) {
          return 'Due Now';
      }

      // Calculate next billing date based on start date and cycle
      const next = new Date(start);
      if (billingCycle === 'annual') {
          while (next <= now) {
              next.setFullYear(next.getFullYear() + 1);
          }
      } else {
          while (next <= now) {
              next.setMonth(next.getMonth() + 1);
          }
      }
      
      return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [isPlanPaid, billingCycle, currentPlanId, subscription, workspace]);

  const planRenewalDate = useMemo(() => {
      // Get actual start date if stored
      const startDateStr = subscription?.plan_start_date || workspace?.plan_start_date;
      const d = startDateStr ? new Date(startDateStr) : new Date();
      
      if (currentPlanId === 'free') return 'N/A';

      if (billingCycle === 'annual') {
        d.setFullYear(d.getFullYear() + 1);
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }, [billingCycle, currentPlanId, subscription, workspace]);


  // --- Invoice Logic for Dashboard Card ---
  
  const unpaidAddons = activeAddonsList.filter(addon => !paidAddonIds.includes(addon.id));
  const unpaidAddonsCost = unpaidAddons.reduce((acc, curr) => acc + curr.price, 0);
  const unbilledTotal = unbilledCharges.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Plan Cost (Annual vs Monthly)
  const effectiveCycle = pendingPlan ? pendingPlan.cycle : billingCycle;
  const planCost = effectiveCycle === 'annual' ? currentPlan.price * 12 : Math.round(currentPlan.price * 1.2);
  
  let displayAmount = 0;
  let statusLabel: string;
  let statusSub: string;
  let isAlertState: boolean;

  if (pendingPlan) {
      statusLabel = "Payment Pending";
      statusSub = "Complete Checkout";
      isAlertState = true;
      const targetPlan = AVAILABLE_PLANS.find(p => p.id === pendingPlan.id);
      if (targetPlan) {
          // Show the NET due (Plan Cost - Credit)
          const rawCost = pendingPlan.cycle === 'annual' ? targetPlan.price * 12 : targetPlan.price;
          const credit = pendingPlan.credit || 0;
          displayAmount = Math.max(0, rawCost - credit);
      }
      // Add unbilled and unpaid addons (e.g. user added an addon then changed plan)
      displayAmount += unbilledTotal + unpaidAddonsCost;
  } else if (!isPlanPaid && currentPlanId !== 'free') {
      // Scenario 1: Base Plan Not Paid
      displayAmount = planCost + unpaidAddonsCost + unbilledTotal;
      statusLabel = "Payment Pending";
      statusSub = `Due on ${nextBillingDate}`;
      isAlertState = false; 
  } else if (unpaidAddonsCost > 0 || unbilledTotal > 0) {
      // Scenario 2: Plan Paid, but Addons Added Afterwards or Unbilled Charges
      displayAmount = unpaidAddonsCost + unbilledTotal;
      statusLabel = "Payment Pending";
      statusSub = "Immediate Payment Required";
      isAlertState = true; 
  } else {
      // Scenario 3: Everything Paid
      displayAmount = billingCycle === 'monthly' ? planCost + addonsCost : addonsCost; 
      statusLabel = "Next Cycle";
      statusSub = `Auto-pay on ${nextBillingDate}`;
      isAlertState = false;
  }

  // Comprehensive Usage State
  const [usage, setUsage] = useState<Record<string, { used: number, total: number }>>({});

  useEffect(() => {
    const calculateUsage = () => {
        // Calculate Add-ons Limits dynamically from purchased list
        if (!accountUsage) return;

        let addonStorageGB = 0;
        let addonSeats = 0;
        let aiAddonCredits = 0;
        
        purchasedAddons.forEach((id: string) => {
            if (id === 'storage_1tb') addonStorageGB += 1024;
            if (id === 'extra_seats') addonSeats += 5;
            if (id === 'ai_pro') aiAddonCredits += 50000;
        });

        // 1. Storage
        const storageUsedGB = accountUsage.storageGB;

        // 2. Active Requests
        const activeRequestsCount = accountUsage.activeRequestsCount;

        // 3. Seats
        const seatsUsed = accountUsage.teamMembersCount;
        const totalSeats = currentPlan.seatLimit === -1 ? -1 : (currentPlan.seatLimit + addonSeats);

        // 4. Clients
        const clientsUsed = accountUsage.clientsCount;
        const totalClients = currentPlan.clientLimit;

        // 5. Credits
        const baseCredits = currentPlanId === 'free' ? 100 : currentPlan.baseCredits;
        const spent = accountUsage.creditsSpent;
        const totalCapacity = (baseCredits + aiAddonCredits);
        const availableBalance = hookTotalCredits;
        
        // 5. Pipelines
        const pipelinesUsed = accountUsage.pipelinesCount;

        // 6. Bookings (Event Types)
        const bookingsUsed = accountUsage.bookingsCount;

        // 7. Services
        const servicesUsed = accountUsage.servicesCount; 

        // 8. Onboarding Flows
        const onboardingUsed = accountUsage.onboardingCount;

        // 9. Pages
        const pagesUsed = accountUsage.pagesCount;

        // 10. Invoices
        const invoicesUsed = accountUsage.invoicesCount;

        // 11. Estimates
        const estimatesUsed = accountUsage.estimatesCount;

        // 12. Workspaces
        const workspacesUsed = accountUsage.workspacesCount;

         setUsage({
            seats: { used: seatsUsed, total: totalSeats },
            storage: { used: parseFloat(storageUsedGB.toFixed(2)), total: currentPlan.storageLimitGB + addonStorageGB },
            projects: { used: activeRequestsCount, total: currentPlan.projectLimit },
            clients: { used: clientsUsed, total: totalClients },
            pipelines: { used: pipelinesUsed, total: currentPlan.pipelineLimit },
            bookings: { used: bookingsUsed, total: currentPlan.bookingsLimit },
            services: { used: servicesUsed, total: currentPlan.servicesLimit },
            onboarding: { used: onboardingUsed, total: currentPlan.onboardingLimit },
            pages: { used: pagesUsed, total: currentPlan.pagesLimit },
            tickets: { used: accountUsage.ticketsCount, total: currentPlan.ticketsLimit },
            marketing: { used: accountUsage.campaignsCount, total: currentPlan.marketingEmailsLimit },
            invoices: { used: invoicesUsed, total: currentPlan.invoicesLimit },
            estimates: { used: estimatesUsed, total: currentPlan.estimatesLimit },
            workspaces: { used: workspacesUsed, total: currentPlan.workspacesLimit },
            credits: { used: spent, total: totalCapacity, available: availableBalance }
        });
    };

    calculateUsage();
  }, [
    currentPlan, 
    purchasedAddons, 
    accountUsage,
    hookTotalCredits
  ]);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) setCurrentUser(e.detail);
    };
    
    window.addEventListener('agencyos_profile_updated', handleProfileUpdate);
    
    return () => {
        window.removeEventListener('agencyos_profile_updated', handleProfileUpdate);
    };
  }, []);

  // Helper to calculate percentage safely
  const getPct = (used: number, total: number) => {
      if (total === -1) return 0; // Infinite
      if (total === 0) return 100;
      return Math.min(100, (used / total) * 100);
  };

  const handleDownloadInvoice = async (invoice: any) => {
      setPrintingInvoice(invoice);
      setIsGeneratingPdf(true);

      // Wait for hidden element to render with data
      setTimeout(async () => {
          const element = document.getElementById('hidden-invoice-template');
          if (element) {
              try {
                  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
                  const imgData = canvas.toDataURL('image/png');
                  
                  const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'a4'
                  });

                  const imgWidth = 210;
                  const pageHeight = 297;
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  
                  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                  pdf.save(`Receipt-${invoice.id}.pdf`);
              } catch (e) {
                  console.error("PDF Gen Error", e);
              }
          }
          setPrintingInvoice(null);
          setIsGeneratingPdf(false);
      }, 100);
  };

  // Metric Configuration
  const metricConfigs = [
    { key: 'seats', label: 'Seats', icon: UserPlus, color: 'bg-cyan-500', path: '/team' },
    { key: 'storage', label: 'Storage (GB)', icon: Database, color: 'bg-indigo-500', path: '/storage' },
    { key: 'projects', label: 'Active Requests', icon: Layers, color: 'bg-emerald-500', path: '/requests' },
    { key: 'clients', label: 'Clients Added', icon: Users, color: 'bg-blue-500', path: '/clients' },
    { key: 'pipelines', label: 'Pipelines', icon: TrendingUp, color: 'bg-orange-500', path: '/pipeline' },
    { key: 'bookings', label: 'Booking Types', icon: CalendarCheck, color: 'bg-rose-500', path: '/bookings' },
    { key: 'services', label: 'Services', icon: Package, color: 'bg-blue-500', path: '/services' },
    { key: 'onboarding', label: 'Onboarding Flows', icon: Rocket, color: 'bg-purple-500', path: '/onboarding' },
    { key: 'pages', label: 'Pages', icon: FileText, color: 'bg-pink-500', path: '/pages' },
    { key: 'tickets', label: 'Support Tickets', icon: AlertCircle, color: 'bg-rose-600', path: '/tickets' },
    { key: 'marketing', label: 'Marketing Campaigns', icon: Mail, color: 'bg-amber-500', path: '/marketing' },
    { key: 'invoices', label: 'Invoices Issued', icon: CreditCard, color: 'bg-teal-500', path: '/billing' },
    { key: 'estimates', label: 'Estimates Created', icon: Calculator, color: 'bg-lime-500', path: '/estimates' },
    { key: 'workspaces', label: 'Workspaces', icon: Building, color: 'bg-slate-500', path: '/workspaces' },
  ];

  if (workspaceLoading || subLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Billing Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-24 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Billing & Subscription</h2>
          <p className="text-slate-500 dark:text-zinc-500 font-medium mt-2">Manage your workspace plan, usage limits, and financial details.</p>
        </div>
        <div className="flex items-center gap-3">
           {/* Preferences button removed as requested */}
           <button 
             onClick={() => navigate('/billing/plans')}
             className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
           >
             <ArrowUpRight size={16} /> Upgrade
           </button>
        </div>
      </div>

      {pendingPlan && (
         <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between animate-in slide-in-from-top-4">
             <div className="flex items-center gap-4">
                 <div className="p-3 bg-white/20 rounded-xl">
                     <Zap size={24} />
                 </div>
                 <div>
                     <h3 className="text-lg font-black uppercase tracking-wide">Upgrade Pending</h3>
                     <p className="text-xs font-medium text-blue-100">Plan change initiated. Complete checkout to activate new limits.</p>
                 </div>
             </div>
             <button onClick={() => navigate('/upcoming-invoice')} className="px-6 py-3 bg-white text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors">
                 Complete Payment
             </button>
         </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Invoice - Clickable */}
        <div 
          onClick={() => navigate('/upcoming-invoice')}
          className={`bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 ${isAlertState ? 'border-amber-500/50 hover:border-amber-500 shadow-amber-500/10' : 'border-slate-200 dark:border-zinc-800 hover:border-blue-500/30'}`}
        >
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><FileText size={80}/></div>
           <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="relative z-10">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                 <div className={`p-2.5 rounded-xl transition-colors ${isAlertState ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                   {isAlertState ? <AlertCircle size={20}/> : <Receipt size={20} />}
                 </div>
                 <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isAlertState ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500 group-hover:text-blue-500'}`}>
                    {statusLabel}
                 </span>
               </div>
               <ArrowUpRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0" />
             </div>
             <div className="flex items-baseline gap-1">
               <span className={`text-3xl font-black ${isAlertState ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>${displayAmount.toFixed(2)}</span>
               <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">/ USD</span>
             </div>
             <p className={`text-xs font-medium mt-2 ${isAlertState ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {statusSub}
             </p>
             <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Base: ${pendingPlan ? (pendingPlan.cycle === 'annual' ? (AVAILABLE_PLANS.find(p => p.id === pendingPlan.id)?.price || 0) * 12 : (AVAILABLE_PLANS.find(p => p.id === pendingPlan.id)?.price || 0)) : (statusLabel === "Next Cycle" ? (billingCycle === 'monthly' ? planCost : 0) : (isPlanPaid ? 0 : planCost))}</span>
                <span>Add-ons: ${addonsCost + unbilledTotal}</span>
             </div>
           </div>
        </div>
        {/* ... Rest of the file unchanged ... */}
        {/* Current Balance/Credits */}
        <div 
          onClick={() => navigate('/billing/topup')}
          className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-purple-500/30 transition-all"
        >
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Zap size={80}/></div>
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                 <Wallet size={20} />
               </div>
               <span className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Available Credits</span>
             </div>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black text-slate-900 dark:text-white">{Math.max(0, usage.credits?.available || 0).toLocaleString()}</span>
               <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">CR</span>
             </div>
             <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-2">Plan: {currentPlan.baseCredits.toLocaleString()} + Top-up</p>
             <button 
               onClick={(e) => { e.stopPropagation(); navigate('/billing/topup'); }}
               className="mt-4 w-full py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
             >
               Top Up Balance
             </button>
           </div>
        </div>

        {/* Payment Method - Credit Card Visual */}
        <div 
          onClick={() => navigate('/billing/payment-methods')}
          className="bg-slate-900 dark:bg-black p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group border border-slate-800 dark:border-zinc-800 cursor-pointer hover:border-slate-700 transition-colors"
        >
           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform"><CreditCard size={80}/></div>
           
           <div className="relative z-10 h-full flex flex-col justify-between min-h-[140px]">
             <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                   <ShieldCheck size={18} />
                 </div>
                 <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Primary Method</span>
               </div>
               <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Active</span>
             </div>
             
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-5 bg-white/20 rounded flex items-center justify-center text-[8px] font-black tracking-tighter">VISA</div>
                 <span className="text-lg font-mono tracking-wider">•••• 4242</span>
               </div>
               <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Cardholder</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">{currentUser?.name || 'Agency Admin'}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Expires</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">12/28</p>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Analytics & History */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Usage Metrics - Full List */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                   <BarChart3 size={20} className="text-blue-500" /> Resource Consumption
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">Realtime Telemetry</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {metricConfigs.map(({ key, label, icon: Icon, color }) => {
                   const u = usage[key] || { used: 0, total: 10 };
                   const pct = getPct(u.used, u.total);
                   
                   return (
                     <div key={key} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                           <span className="flex items-center gap-2"><Icon size={14} className="text-slate-400" /> {label}</span>
                           <span>{u.used} {u.total === -1 ? '' : `/ ${u.total}`} {u.total === -1 ? 'Unlimited' : ''}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-black rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} 
                             style={{ width: `${u.total === -1 ? 100 : pct}%` }}
                           />
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>

          {/* Billing History */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                   <Clock size={20} className="text-slate-400" /> Transaction History
                </h3>
                {/* Download button removed as requested */}
             </div>
             
             <div className="overflow-x-auto -mx-8 px-8">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">
                     <th className="py-4 pr-4">Invoice</th>
                     <th className="py-4 px-4">Date</th>
                     <th className="py-4 px-4">Amount</th>
                     <th className="py-4 px-4">Status</th>
                     <th className="py-4 pl-4 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                   {billingHistory.map((item) => (
                     <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                       <td className="py-4 pr-4">
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                             <FileText size={16}/>
                           </div>
                           <div>
                             <p className="text-xs font-bold text-slate-900 dark:text-white">{item.items || 'Service Charge'}</p>
                             <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{item.id}</p>
                           </div>
                         </div>
                       </td>
                       <td className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-zinc-400">{item.date}</td>
                       <td className="py-4 px-4 font-black text-slate-900 dark:text-white">${item.amount.toFixed(2)}</td>
                       <td className="py-4 px-4">
                         <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide border ${
                           item.status === 'Paid' 
                             ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' 
                             : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
                         }`}>
                           {item.status}
                         </span>
                       </td>
                       <td className="py-4 pl-4 text-right">
                         <button 
                            onClick={() => handleDownloadInvoice(item)}
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1 ml-auto"
                            disabled={isGeneratingPdf}
                         >
                           {printingInvoice?.id === item.id && isGeneratingPdf ? (
                             <>Generating <Loader2 size={10} className="animate-spin" /></>
                           ) : (
                             <>PDF <ArrowUpRight size={10} /></>
                           )}
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          {/* Top-up History */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                   <Zap size={20} className="text-purple-500" /> Credit Top-up History
                </h3>
             </div>
             
             <div className="overflow-x-auto -mx-8 px-8">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800">
                     <th className="py-4 pr-4">Description</th>
                     <th className="py-4 px-4">Date</th>
                     <th className="py-4 px-4">Credits</th>
                     <th className="py-4 px-4">Cost</th>
                     <th className="py-4 pl-4 text-right">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                   {topupCredits.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs italic">No top-up history found.</td>
                     </tr>
                   ) : (
                     topupCredits.map((item) => (
                       <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                         <td className="py-4 pr-4">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                               <Zap size={16}/>
                             </div>
                             <div>
                               <p className="text-xs font-bold text-slate-900 dark:text-white">{item.metadata?.description || `${item.amount.toLocaleString()} Credits Top-up`}</p>
                               <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{item.id}</p>
                             </div>
                           </div>
                         </td>
                         <td className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-zinc-400">
                           {new Date(item.created_at).toLocaleDateString()}
                         </td>
                         <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                           {item.amount.toLocaleString()} CR
                         </td>
                         <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                           ${Number(item.cost).toFixed(2)}
                         </td>
                         <td className="py-4 pl-4 text-right">
                           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide border ${
                             item.status === 'active' 
                               ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' 
                               : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-slate-100 dark:border-zinc-800'
                           }`}>
                             {item.status}
                           </span>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* Right Column: Plan & Settings */}
        <div className="space-y-8">
          
          {/* Plan Selection Blocks */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Plan Overview</h4>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">Select to Upgrade</span>
             </div>
             <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_PLANS.map((plan) => {
                   const isActive = plan.id === currentPlanId;
                   const isPending = pendingPlan?.id === plan.id;
                   
                   return (
                      <button 
                        key={plan.id}
                        onClick={() => navigate('/billing/plans')}
                        onDoubleClick={() => navigate(`/billing/plans/${plan.id}`)}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group ${
                           isActive 
                              ? `bg-gradient-to-br ${plan.color} border-transparent shadow-lg shadow-blue-500/20 scale-105 z-10` 
                              : 'bg-slate-50 dark:bg-black/40 border-slate-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800'
                        }`}
                      >
                         <div className={`mb-2 transition-transform duration-500 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-600'}`}>
                            {plan.id === 'free' && <Zap size={16} />}
                            {plan.id === 'starter' && <Zap size={16} />}
                            {plan.id === 'growth' && <Star size={16} />}
                            {plan.id === 'enterprise' && <Crown size={16} />}
                         </div>
                         <p className={`text-[8px] font-black uppercase tracking-tighter text-center leading-none ${isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-500'}`}>
                            {plan.name}
                         </p>
                         
                         {isActive && (
                            <div className="absolute -top-1 -right-1 bg-white text-blue-600 rounded-full p-0.5 shadow-md">
                               <Check size={8} strokeWidth={4} />
                            </div>
                         )}
                         {isPending && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-md animate-pulse">
                               <Clock size={8} strokeWidth={4} />
                            </div>
                         )}
                      </button>
                   );
                })}
             </div>
          </div>

          {/* Plan Card */}
          <div className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${currentPlan.color} p-8 text-white shadow-xl shadow-blue-500/20 group transition-all duration-500`}>
             <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <Sparkles size={180} />
             </div>
             
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                      <Zap size={24} className="text-yellow-300" fill="currentColor" />
                   </div>
                   <div className={`flex bg-white/20 backdrop-blur-md rounded-full px-3 py-1 items-center ${isPlanPaid && !pendingPlan ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                         {isPlanPaid && !pendingPlan ? 'Active' : 'Payment Due'}
                      </span>
                   </div>
                </div>
                
                <h3 className="text-3xl font-black mb-1">{currentPlan.name} Plan</h3>
                <p className="text-white/80 font-medium text-sm mb-8">{pendingPlan ? 'Pending Upgrade...' : `Renewing on ${planRenewalDate}`}</p>
                
                <div className="space-y-3 mb-8">
                   {currentPlan.features.slice(0, 3).map((feat, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-bold">
                         <div className="p-1 rounded-full bg-emerald-400/20 text-emerald-300"><Check size={12} strokeWidth={4} /></div>
                         {feat}
                      </div>
                   ))}
                </div>

                <button onClick={() => navigate('/billing/plans')} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg active:scale-95">
                   Change Plan
                </button>
             </div>
          </div>

          {/* Add-ons */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
             <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Plus size={20} className="text-slate-400" /> Active Add-ons
             </h4>
             <div className="space-y-4">
                {activeAddonsList.map(addon => {
                   const isPaid = paidAddonIds.includes(addon.id);
                   return (
                   <div key={addon.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-xl bg-${addon.theme}-500/10 text-${addon.theme}-500`}>
                            <addon.icon size={18} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{addon.name}</p>
                            <p className={`text-[10px] font-bold ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                               {isPaid ? `Next Billing: ${addon.nextBillingDate}` : 'Payment Due'}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-slate-900 dark:text-white">${addon.price}/yr</p>
                         <button onClick={() => navigate('/billing/addons')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
                      </div>
                   </div>
                   );
                })}
                
                {activeAddonsList.length === 0 && <p className="text-xs text-slate-500 dark:text-zinc-500 text-center py-2">No active add-ons</p>}

                <button 
                  onClick={() => navigate('/billing/addons')}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
                >
                   Browse Catalog
                </button>
             </div>
          </div>

          {/* Billing Details */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                   <Building size={20} className="text-slate-400" /> Billing Info
                </h4>
                <button 
                  onClick={() => {
                    if (isEditingBilling) {
                      localStorage.setItem('agencyos_billing_info', JSON.stringify(billingInfo));
                    }
                    setIsEditingBilling(!isEditingBilling);
                  }}
                  className={`p-2 rounded-xl transition-colors ${isEditingBilling ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400'}`}
                >
                   {isEditingBilling ? <Check size={16} /> : <PenTool size={16} />}
                </button>
             </div>
             
             <div className="space-y-4">
                <div className="group">
                   <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Company Name</p>
                   {isEditingBilling ? (
                     <input 
                       type="text" 
                       value={billingInfo.companyName}
                       onChange={(e) => setBillingInfo({...billingInfo, companyName: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                     />
                   ) : (
                     <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{billingInfo.companyName}</p>
                   )}
                </div>
                <div className="group">
                   <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Billing Email</p>
                   {isEditingBilling ? (
                     <input 
                       type="email" 
                       value={billingInfo.email}
                       onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                     />
                   ) : (
                     <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                        {billingInfo.email} <CheckCircle2 size={12} className="text-emerald-500 shrink-0"/>
                     </p>
                   )}
                </div>
                <div className="group">
                   <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Tax ID / VAT</p>
                   {isEditingBilling ? (
                     <input 
                       type="text" 
                       placeholder="Enter Tax ID"
                       value={billingInfo.taxId}
                       onChange={(e) => setBillingInfo({...billingInfo, taxId: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                     />
                   ) : (
                     <p className={`text-sm font-bold ${billingInfo.taxId ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-600 italic'}`}>
                       {billingInfo.taxId || 'Not configured'}
                     </p>
                   )}
                </div>
                <div className="group">
                   <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Address</p>
                   {isEditingBilling ? (
                     <textarea 
                       rows={2}
                       value={billingInfo.address}
                       onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                     />
                   ) : (
                     <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 leading-relaxed">
                        {billingInfo.address}
                     </p>
                   )}
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Hidden Invoice Template for PDF Generation */}
      {printingInvoice && (
        <div id="hidden-invoice-template" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', color: '#000000', padding: '40px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}>
          {/* ... existing template logic ... */}
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '50px', height: '50px', backgroundColor: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  </div>
                  <div>
                      <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#2563eb', lineHeight: 1 }}>AgencyOS</h1>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#64748b' }}>123 Innovation Dr.<br/>San Francisco, CA 94103</p>
                  </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '32px', margin: 0, color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>INVOICE</h2>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', marginTop: '5px' }}>#{invoiceDisplayNum}</p>
                  {isEverythingPaid && (
                      <div style={{ marginTop: '10px', color: '#10b981', fontWeight: 'bold', border: '2px solid #10b981', padding: '5px 10px', borderRadius: '5px', display: 'inline-block', fontSize: '12px', textTransform: 'uppercase' }}>
                          PAID IN FULL
                      </div>
                  )}
              </div>
          </div>

          {/* Bill To & Details Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '50px', gap: '40px' }}>
              <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>BILL TO</p>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#0f172a' }}>{billingInfo.companyName}</h3>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{billingInfo.email}</p>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{billingInfo.address}</p>
                  {billingInfo.taxId && (
                      <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', marginTop: '10px' }}>Tax ID: {billingInfo.taxId}</p>
                  )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>ISSUE DATE</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{issueDate.toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>DUE DATE</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{dueDate.toLocaleDateString()}</span>
                  </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>BILLING CYCLE</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', textTransform: 'capitalize' }}>{billingCycle}</span>
                  </div>
              </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
              <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '15px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', width: '50%' }}>DESCRIPTION</th>
                      <th style={{ padding: '15px 10px', textAlign: 'center', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>QTY</th>
                      <th style={{ padding: '15px 10px', textAlign: 'right', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>AMOUNT</th>
                  </tr>
              </thead>
              <tbody>
                  {lineItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '15px 10px' }}>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{item.name}</p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{item.desc}</p>
                          </td>
                          <td style={{ padding: '15px 10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>{item.qty}</td>
                          <td style={{ padding: '15px 10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>${item.amount.toFixed(2)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' }}>
              <div style={{ width: '250px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>Subtotal</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>Tax (0%)</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>$0.00</span>
                  </div>
                  <div style={{ height: '2px', backgroundColor: '#e2e8f0', marginBottom: '15px' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>TOTAL</span>
                      <span style={{ fontSize: '24px', fontWeight: '900', color: '#2563eb' }}>${total.toFixed(2)}</span>
                  </div>
              </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '30px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>Thank you for your business.</p>
              <p style={{ fontSize: '10px', color: '#94a3b8' }}>Securely processed by AgencyOS. Questions? Contact support@agencyos.io</p>
          </div>
       </div>
      )}

    </div>
  );
};

export default PersonalBilling;
