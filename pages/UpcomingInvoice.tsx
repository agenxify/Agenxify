
import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowLeft, Download, ShieldCheck, CreditCard, 
  Calendar, CheckCircle2, Building2, Zap,
  Printer, Share2, Lock, Clock, Loader2,
  FileText, ArrowRight, Globe, Check
} from 'lucide-react';
import { AVAILABLE_PLANS, ALL_ADDONS, CREDIT_PACKAGES, MOCK_PROFILES, MOCK_INVOICES } from '../constants';
import * as ReactRouterDom from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAgencySubscription } from '../hooks/useAgencySubscription';

const { useNavigate } = ReactRouterDom as any;

// --- ACCESS CONTROL FLAG ---
// Set this to false to restore access to the page
const IS_ACCESS_DENIED = false; 

const UpcomingInvoice: React.FC = () => {
  const navigate = useNavigate();

  if (IS_ACCESS_DENIED) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-rose-500/30 shadow-2xl shadow-rose-500/10">
              <Lock className="w-10 h-10 text-rose-500" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Access Denied</h1>
            <div className="h-1 w-12 bg-rose-500 mx-auto rounded-full" />
            <p className="text-zinc-400 text-sm leading-relaxed font-medium px-4">
              This section is currently restricted. Please contact your system administrator to request access or verify your permissions.
            </p>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => navigate('/personal-billing')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              <ArrowLeft size={16} strokeWidth={3} />
              Return to Safety
            </button>
          </div>
          
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest pt-8">
            Error Code: 403_FORBIDDEN_RESTRICTED
          </p>
        </div>
      </div>
    );
  }

  const { workspace, subscription, unbilledCharges: realUnbilledCharges, addons: realAddons, generateInvoice, updatePlan, addAddon, removeUnbilledCharge, addCreditsToBalance, loading: subLoading, refresh } = useAgencySubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'preparing' | 'ready'>('idle');

  // --- Realtime Date Logic ---
  const issueDate = useMemo(() => new Date(), []);
  
  // Billing Cycle State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  
  // Payment Status States
  const [isPlanPaid, setIsPlanPaid] = useState(false);
  const [purchasedAddonsIds, setPurchasedAddonsIds] = useState<string[]>([]);
  const [paidAddonIds, setPaidAddonIds] = useState<string[]>([]);
  
  // Pending Plan State
  const [pendingPlan, setPendingPlan] = useState<any>(null);

  const currentPlanId = workspace?.plan_id || 'free';

  // Sync Data Function
  const refreshData = () => {
    // 1. Pending Plan First to determine cycle
    let pending = null;
    try {
        pending = JSON.parse(localStorage.getItem('agencyos_pending_plan_update') || 'null');
        if (pending && !pending.dodoProductId) {
            const plan = AVAILABLE_PLANS.find(p => p.id === pending.id);
            if (plan) {
                pending.dodoProductId = pending.cycle === 'annual' ? plan.dodo_product_id_annual : plan.dodo_product_id_monthly;
            }
        }
        setPendingPlan(pending);
    } catch { setPendingPlan(null); }

    // 2. Billing Cycle (Prioritize pending plan cycle)
    const cycle = pending?.cycle || subscription?.billing_cycle || 'monthly';
    setBillingCycle(cycle);

    // 3. Purchased Addons
    setPurchasedAddonsIds(realAddons || []);

    // 4. Paid Status Keys
    const year = issueDate.getFullYear();
    const month = issueDate.getMonth();
    const pKey = cycle === 'annual' ? `agencyos_paid_plan_${year}` : `agencyos_paid_plan_${year}_${month}`;
    const aKey = `agencyos_paid_addons_${year}_${month}`;

    // 5. Plan Paid Status
    setIsPlanPaid(currentPlanId === 'free' || localStorage.getItem(pKey) === 'true');

    // 6. Paid Addons for current cycle
    try {
      setPaidAddonIds(JSON.parse(localStorage.getItem(aKey) || '[]'));
    } catch { setPaidAddonIds([]); }

    // 7. Refresh Hook Data
    if (refresh) refresh();
  };

  const unbilledCharges = realUnbilledCharges || [];

  // Initial Load & Event Listeners
  useEffect(() => {
    refreshData();
    window.addEventListener('agencyos_config_updated', refreshData);
    window.addEventListener('storage', refreshData); // Listen for cross-tab or same-tab storage changes
    return () => {
      window.removeEventListener('agencyos_config_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, [issueDate]);

  // Due Date (Dynamic based on cycle)
  const dueDate = useMemo(() => {
    const d = new Date(issueDate);
    const cycle = pendingPlan ? pendingPlan.cycle : billingCycle;
    if (cycle === 'annual') {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return d;
  }, [issueDate, billingCycle, pendingPlan]);

  // Calculate Next Billing Cycle String
  const nextBillingDate = useMemo(() => {
    const d = new Date(issueDate);
    const cycle = pendingPlan ? pendingPlan.cycle : billingCycle;
    if (cycle === 'annual') {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [issueDate, billingCycle, pendingPlan]);

  // --- Data Retrieval ---
  const currentUser = useMemo(() => {
    try {
      const saved = localStorage.getItem('agencyos_profile_data');
      return saved ? JSON.parse(saved) : MOCK_PROFILES.find(p => p.id === 'current');
    } catch { return MOCK_PROFILES[0]; }
  }, []);

  const plan = AVAILABLE_PLANS.find(p => p.id === currentPlanId) || AVAILABLE_PLANS[0]; // Default to first (Free)

  const billingInfo = useMemo(() => {
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
  }, [currentUser]);

  // --- Invoice Logic Engine ---
  
  // 1. Identify what is pending
  // We now assume that if it's in purchasedAddons from Supabase, it's paid
  // But for the "Upcoming Invoice", we might want to show what's about to be billed
  const pendingAddons = useMemo(() => {
    // If everything is paid, we show the next cycle's addons
    if (isPlanPaid && unbilledCharges.length === 0 && !pendingPlan) {
      return [];
    }
    // Otherwise, we show addons that were just added (unbilled)
    return ALL_ADDONS.filter(addon => 
      unbilledCharges.some(c => c.type === 'addon' && c.metadata?.addonId === addon.id)
    );
  }, [isPlanPaid, unbilledCharges, pendingPlan]);

  // 2. Identify what is fully paid (for next cycle preview)
  const allActiveAddons = useMemo(() => {
    return ALL_ADDONS.filter(addon => realAddons.some(pa => pa.id === addon.id)).map(addon => {
      const purchaseInfo = realAddons.find(pa => pa.id === addon.id);
      return {
        ...addon,
        purchaseDate: purchaseInfo?.created_at ? new Date(purchaseInfo.created_at) : new Date()
      };
    });
  }, [realAddons]);

  // 3. Determine View Mode
  const isEverythingPaid = isPlanPaid && unbilledCharges.length === 0 && !pendingPlan;

  // 4. Build Line Items
  const lineItems = useMemo(() => {
      const items = [];
      
      if (isEverythingPaid) {
          // Preview Mode: Show Full Next Bill
          if (billingCycle === 'monthly' && plan.id !== 'free') {
             items.push({
                name: `${plan.name} Subscription`,
                desc: `Monthly platform access fee (Next Cycle)`,
                qty: 1,
                amount: Math.round(plan.price * 1.2)
             });
          } else if (billingCycle === 'annual' && plan.id !== 'free') {
             items.push({
                name: `${plan.name} Subscription`,
                desc: `Annual platform access fee (Next Cycle)`,
                qty: 1,
                amount: plan.price * 12
             });
          }

          allActiveAddons.forEach(addon => {
              items.push({
                  name: addon.name,
                  desc: `${addon.desc} (Annual Renewal)`,
                  qty: 1,
                  amount: addon.price 
              });
          });
          
          if (items.length === 0) {
             items.push({ name: "No Upcoming Charges", desc: "Your next billing date is far away.", qty: 0, amount: 0 });
          }

      } else {
          // Payment Mode: Show only what is due
          
          if (pendingPlan) {
               const targetPlan = AVAILABLE_PLANS.find(p => p.id === pendingPlan.id);
               if (targetPlan) {
                   const isTrial = pendingPlan.isTrial;
                   const rawCost = isTrial ? 0 : (pendingPlan.cycle === 'annual' ? targetPlan.price * 12 : Math.round(targetPlan.price * 1.2));
                   
                   // Line 1: New Plan Cost
                   items.push({
                       name: isTrial ? `Trial: ${targetPlan.name} Plan` : `Upgrade: ${targetPlan.name} Plan`,
                       desc: isTrial ? '14-Day Free Trial (No Credit Card)' : `${pendingPlan.cycle === 'annual' ? 'Annual' : 'Monthly'} Subscription (Starts Now)`,
                       qty: 1,
                       amount: rawCost
                   });

                   // Line 2: Prorated Credit (if any)
                   if (pendingPlan.credit > 0) {
                       items.push({
                           name: 'Unused Time Credit',
                           desc: 'Prorated refund for previous plan duration',
                           qty: 1,
                           amount: -pendingPlan.credit // Negative amount to reduce total
                       });
                   }
               }
          } else if (!isPlanPaid && plan.id !== 'free') {
              const price = billingCycle === 'annual' ? plan.price * 12 : Math.round(plan.price * 1.2); 
              items.push({
                  name: `${plan.name} Subscription`,
                  desc: `${billingCycle === 'annual' ? 'Annual (12 Months)' : 'Monthly'} platform access fee`,
                  qty: 1,
                  amount: price
              });
          }

          // Add unbilled charges (e.g. Top-ups, Addons)
          unbilledCharges.forEach(charge => {
              const name = charge.name || charge.metadata?.name || charge.description || 'Charge';
              const desc = charge.desc || charge.metadata?.desc || charge.description || 'One-time Charge';
              items.push({
                  name: name,
                  desc: desc,
                  qty: 1,
                  amount: Number(charge.amount) || 0
              });
          });
      }
      return items;
  }, [isEverythingPaid, isPlanPaid, allActiveAddons, plan, billingCycle, unbilledCharges, pendingPlan]);

  // --- Totals ---
  const subtotal = lineItems.reduce((acc, item) => acc + item.amount, 0);
  const total = Math.max(0, subtotal); // Ensure no negative invoices

  // Invoice Number (Display)
  const invoiceDisplayNum = `INV-${issueDate.getFullYear()}${String(issueDate.getMonth() + 1).padStart(2, '0')}${String(issueDate.getDate()).padStart(2, '0')}`;

  // --- Actions ---

  const handleRemoveItem = async (type: string, id?: string) => {
    if (type === 'plan') {
      localStorage.removeItem('agencyos_pending_plan_update');
    } else if (type === 'unpaid_plan') {
      await updatePlan('free', 'monthly');
      localStorage.removeItem('agencyos_paid_plan_' + new Date().getFullYear() + '_' + new Date().getMonth());
      localStorage.removeItem('agencyos_paid_plan_' + new Date().getFullYear());
    } else if (type === 'unbilled' && id) {
      await removeUnbilledCharge(id);
    } else if (type === 'addon') {
      const purchased = JSON.parse(localStorage.getItem('agencyos_purchased_addons') || '[]');
      const newPurchased = purchased.filter((a: string) => a !== id);
      localStorage.setItem('agencyos_purchased_addons', JSON.stringify(newPurchased));
    }
    
    window.dispatchEvent(new Event('agencyos_config_updated'));
    window.dispatchEvent(new Event('storage'));
    refreshData();
  };

  const handlePayNow = (itemToPay?: any) => {
    if (total <= 0 && !pendingPlan?.isTrial && !itemToPay) return;
    setIsProcessing(true);
    
    // Determine what we are paying for
    let priceId = '';
    const metadata: any = {
        workspace_id: workspace?.id,
        user_id: workspace?.owner_id
    };

    if (itemToPay) {
        // Paying for a specific unbilled charge
        priceId = itemToPay.metadata?.dodoProductId || itemToPay.dodoProductId;
        
        // Fallback to constants if missing in metadata
        if (!priceId) {
            if (itemToPay.type === 'addon_purchase') {
                const addon = ALL_ADDONS.find(a => a.id === itemToPay.metadata?.addonId || a.id === itemToPay.addonId);
                if (addon) {
                    priceId = itemToPay.metadata?.cycle === 'annual' || itemToPay.cycle === 'annual' 
                        ? addon.dodo_product_id_annual 
                        : addon.dodo_product_id_monthly;
                }
            } else if (itemToPay.type === 'credit_topup') {
                const pkg = CREDIT_PACKAGES.find(p => p.credits === itemToPay.metadata?.creditsValue || p.credits === itemToPay.creditsValue);
                if (pkg) priceId = pkg.dodo_product_id;
            }
        }

        metadata.type = itemToPay.type;
        metadata.addonId = itemToPay.metadata?.addonId || itemToPay.addonId;
        metadata.cycle = itemToPay.metadata?.cycle || itemToPay.cycle;
        metadata.creditsValue = itemToPay.metadata?.creditsValue || itemToPay.creditsValue;
    } else if (pendingPlan) {
        priceId = pendingPlan.dodoProductId;
        
        // Fallback to constants if missing
        if (!priceId) {
            const plan = AVAILABLE_PLANS.find(p => p.id === pendingPlan.id);
            if (plan) {
                priceId = pendingPlan.cycle === 'annual' ? plan.dodo_product_id_annual : plan.dodo_product_id_monthly;
            }
        }

        metadata.type = 'plan_upgrade';
        metadata.planId = pendingPlan.id;
        metadata.cycle = pendingPlan.cycle;
    } else if (unbilledCharges.length > 0) {
        const firstCharge = unbilledCharges[0];
        priceId = firstCharge.metadata?.dodoProductId || firstCharge.dodoProductId;

        // Fallback to constants if missing in metadata
        if (!priceId) {
            if (firstCharge.type === 'addon_purchase') {
                const addon = ALL_ADDONS.find(a => a.id === firstCharge.metadata?.addonId || a.id === firstCharge.addonId);
                if (addon) {
                    priceId = firstCharge.metadata?.cycle === 'annual' || firstCharge.cycle === 'annual' 
                        ? addon.dodo_product_id_annual 
                        : addon.dodo_product_id_monthly;
                }
            } else if (firstCharge.type === 'credit_topup') {
                const pkg = CREDIT_PACKAGES.find(p => p.credits === firstCharge.metadata?.creditsValue || p.credits === firstCharge.creditsValue);
                if (pkg) priceId = pkg.dodo_product_id;
            }
        }

        metadata.type = firstCharge.type;
        metadata.addonId = firstCharge.metadata?.addonId || firstCharge.addonId;
        metadata.cycle = firstCharge.metadata?.cycle || firstCharge.cycle;
        metadata.creditsValue = firstCharge.metadata?.creditsValue || firstCharge.creditsValue;
    }

    if (!priceId) {
        setIsProcessing(false);
        alert("Missing Product ID for this item. Please ensure Dodo Product IDs are configured in the dashboard and constants.");
        return;
    }

    // Build Metadata Query String
    const metadataStr = Object.entries(metadata)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `metadata[${k}]=${encodeURIComponent(String(v))}`)
        .join('&');

    // Standard Dodo Payments Buy Button URL with quantity=1
    const checkoutUrl = `https://checkout.dodopayments.com/buy/${priceId}?quantity=1&client_reference_id=${workspace?.id}&email=${workspace?.owner_email}&${metadataStr}`;

    window.location.href = checkoutUrl;
  };

  const processMockPayment = async () => {
    const transactionId = `${invoiceDisplayNum}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTransaction = {
        id: transactionId,
        number: invoiceDisplayNum,
        client: currentUser.name || 'Agency Admin',
        clientEmail: currentUser.email,
        amount: total,
        date: issueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'Paid',
        items: lineItems.map(i => i.name).join(', ')
    };

    try {
        const storedHistory = localStorage.getItem('agencyos_invoices');
        const existingHistory = storedHistory ? JSON.parse(storedHistory) : MOCK_INVOICES;
        const updatedHistory = [newTransaction, ...existingHistory];
        localStorage.setItem('agencyos_invoices', JSON.stringify(updatedHistory));
    } catch (e) {
        console.error("Failed to update invoice history", e);
    }

    // Apply Plan Update if exists
    const pending = JSON.parse(localStorage.getItem('agencyos_pending_plan_update') || 'null');
    
    let pKey; 
    
    if (pending) {
        // Commit Plan Change
        const targetPlan = AVAILABLE_PLANS.find(p => p.id === pending.id);
        const rawCost = targetPlan ? (pending.cycle === 'annual' ? targetPlan.price * 12 : targetPlan.price) : 0;
        const amountPaid = Math.max(0, rawCost - (pending.credit || 0));

        await updatePlan(pending.id, pending.cycle, amountPaid).catch(console.error);

        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        pKey = pending.cycle === 'annual' 
           ? `agencyos_paid_plan_${year}` 
           : `agencyos_paid_plan_${year}_${month}`;
        
        localStorage.setItem(pKey, 'true');
        localStorage.removeItem('agencyos_pending_plan_update');
    } else {
         const year = issueDate.getFullYear();
         const month = issueDate.getMonth();
         pKey = billingCycle === 'annual' ? `agencyos_paid_plan_${year}` : `agencyos_paid_plan_${year}_${month}`;
         
         if (!isPlanPaid) {
             localStorage.setItem(pKey, 'true');
             await updatePlan(currentPlanId, billingCycle).catch(console.error);
         }
    }

    const aKey = `agencyos_paid_addons_${issueDate.getFullYear()}_${issueDate.getMonth()}`;
    const newlyPaidIds = pendingAddons.map(a => a.id);
    const updatedPaidIds = [...paidAddonIds, ...newlyPaidIds];
    
    const newAddons: { id: string, cycle: 'monthly' | 'annual' }[] = [];
    unbilledCharges.forEach((c: any) => {
       if (c.type === 'addon_purchase') {
           const addonId = c.metadata?.addonId || c.addonId;
           const cycle = c.metadata?.cycle || c.cycle || 'annual';
           if (addonId) newAddons.push({ id: addonId, cycle });
       }
    });

    if (newAddons.length > 0) {
        for (const addon of newAddons) {
            await addAddon(addon.id, 0, addon.cycle).catch(console.error);
        }
        const currentPaidIds = JSON.parse(localStorage.getItem(aKey) || '[]');
        const finalPaidIds = Array.from(new Set([...currentPaidIds, ...newAddons.map(a => a.id), ...newlyPaidIds]));
        localStorage.setItem(aKey, JSON.stringify(finalPaidIds));
    } else {
         localStorage.setItem(aKey, JSON.stringify(updatedPaidIds));
    }

    await generateInvoice(total, lineItems).catch(console.error);
    window.dispatchEvent(new Event('agencyos_config_updated'));
    window.dispatchEvent(new Event('storage'));
    refreshData();
    setIsProcessing(false);
    setShowConfetti(true);
  };

  const handleDownload = async () => {
    const element = document.getElementById('hidden-invoice-template');
    if (!element) return;
    setDownloadState('preparing');
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Invoice-${invoiceDisplayNum}.pdf`);
      setDownloadState('ready');
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch (err) {
      console.error(err);
      setDownloadState('idle');
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (subLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-zinc-400">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pb-20 relative overflow-x-hidden font-sans selection:bg-blue-500/30">
       
       <style>{`
         @keyframes blob {
           0% { transform: translate(0px, 0px) scale(1); }
           33% { transform: translate(30px, -50px) scale(1.1); }
           66% { transform: translate(-20px, 20px) scale(0.9); }
           100% { transform: translate(0px, 0px) scale(1); }
         }
         .animate-blob {
           animation: blob 10s infinite;
         }
         .animation-delay-2000 { animation-delay: 2s; }
         .animation-delay-4000 { animation-delay: 4s; }
         
         @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
         }
         .confetti {
            position: fixed;
            width: 10px;
            height: 10px;
            background-color: #f00;
            animation: confetti-fall 3s linear forwards;
            z-index: 9999;
         }
       `}</style>

       {/* Confetti Effect */}
       {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100]">
             {Array.from({ length: 50 }).map((_, i) => (
                <div 
                   key={i}
                   className="confetti"
                   style={{
                      left: `${Math.random() * 100}vw`,
                      backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)],
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${Math.random() * 2 + 2}s`
                   }}
                />
             ))}
          </div>
       )}

       {/* Background Ambience */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden no-print">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob animation-delay-4000" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
       </div>

       <div className="max-w-[1400px] mx-auto px-6 pt-12 relative z-10 print-padding">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 no-print">
             <button onClick={() => navigate('/personal-billing')} className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all group w-fit">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-all shadow-lg">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase tracking-wider">Return to</p>
                    <p className="text-sm font-black text-white">Billing Dashboard</p>
                </div>
             </button>

             <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownload}
                  disabled={downloadState === 'preparing'}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 border border-white/10"
                >
                    {downloadState === 'preparing' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={3} />} 
                    <span>{downloadState === 'preparing' ? 'Generating...' : 'Download PDF'}</span>
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">
             
             {/* Main Invoice Card (Visible UI) */}
             <div className="xl:col-span-8">
                <div id="invoice-paper" className="invoice-paper bg-white text-slate-900 rounded-[2rem] shadow-2xl overflow-hidden relative transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
                   
                   {/* Watermark for Paid */}
                   {isEverythingPaid && (
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-8 border-emerald-500/30 text-emerald-500/30 text-[10rem] font-black uppercase tracking-widest -rotate-12 p-12 rounded-3xl pointer-events-none select-none z-0 animate-in zoom-in duration-500 backdrop-blur-[1px]">
                           PAID
                       </div>
                   )}

                   {/* Invoice Top Bar */}
                   <div className="bg-slate-50 border-b border-slate-100 p-10 md:p-12 flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                      <div className="flex items-start gap-4">
                         <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Zap size={24} fill="currentColor" />
                         </div>
                         <div>
                            <h2 className="font-black text-2xl tracking-tight text-slate-900">AgencyOS</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">123 Innovation Dr.<br/>San Francisco, CA 94103</p>
                         </div>
                      </div>
                      <div className="text-left md:text-right">
                         <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">INVOICE</h1>
                         <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">#{invoiceDisplayNum}</p>
                         
                         <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50">
                            <div className={`w-2 h-2 rounded-full ${isEverythingPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                {isEverythingPaid ? 'Paid in Full' : 'Payment Pending'}
                            </span>
                         </div>
                      </div>
                   </div>

                   {/* Bill To / Details */}
                   <div className="p-10 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bill To</p>
                         <h3 className="font-bold text-xl text-slate-900">{currentUser.name || 'Agency Administrator'}</h3>
                         <p className="text-slate-500 text-sm mt-1">{currentUser.email}</p>
                         <p className="text-slate-500 text-sm">{currentUser.location || 'United States'}</p>
                         
                         {currentUser.organization && (
                            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                                <Building2 size={14} /> {currentUser.organization}
                            </div>
                         )}
                      </div>
                      <div className="space-y-6">
                         <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Issue Date</span>
                            <span className="text-sm font-bold text-slate-900">{issueDate.toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Due Date</span>
                            <span className={`text-sm font-bold ${isEverythingPaid ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {isEverythingPaid ? 'Paid ' + issueDate.toLocaleDateString() : dueDate.toLocaleDateString()}
                            </span>
                         </div>
                         <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Billing Cycle</span>
                            <span className="text-sm font-bold text-slate-900 capitalize">{pendingPlan ? pendingPlan.cycle : billingCycle}</span>
                         </div>
                      </div>
                   </div>

                   {/* Line Items */}
                   <div className="px-10 md:px-12 pb-8 relative z-10">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="border-b-2 border-slate-100">
                               <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[50%]">Description</th>
                               <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                               <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {lineItems.map((item, idx) => (
                               <tr key={idx} className="group">
                                  <td className="py-6">
                                     <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                     <p className="text-xs text-slate-500 mt-1 font-medium">{item.desc}</p>
                                  </td>
                                  <td className="py-6 text-center font-bold text-slate-600 text-sm">{item.qty}</td>
                                  <td className="py-6 text-right">
                                     <div className="flex flex-col items-end gap-1">
                                        <span className={`font-bold text-sm ${item.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                                        </span>
                                        {item.amount > 0 && !isEverythingPaid && (
                                           <button 
                                              onClick={() => {
                                                 if (item.name.includes('Upgrade') || item.name.includes('Trial')) {
                                                    handlePayNow();
                                                 } else {
                                                    const charge = unbilledCharges.find(c => (c.name || c.description || c.metadata?.name) === item.name);
                                                    if (charge) handlePayNow(charge);
                                                 }
                                              }}
                                              className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-1 no-print"
                                           >
                                              Pay Now <CreditCard size={10} />
                                           </button>
                                        )}
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>

                   {/* Totals */}
                   <div className="bg-slate-50 p-10 md:p-12 flex justify-end relative z-10">
                      <div className="w-full max-w-sm space-y-4">
                         <div className="flex justify-between text-sm">
                            <span className="font-bold text-slate-500">Subtotal</span>
                            <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="font-bold text-slate-500">Tax (0%)</span>
                            <span className="font-bold text-slate-900">$0.00</span>
                         </div>
                         <div className="h-px bg-slate-200 my-4" />
                         <div className="flex justify-between items-end">
                            <span className="font-black text-slate-900 text-lg uppercase tracking-tight">Total Due</span>
                            <div className="text-right">
                                <span className={`font-black text-4xl tracking-tighter ${isEverythingPaid ? 'text-emerald-600' : 'text-blue-600'}`}>${total.toFixed(2)}</span>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">USD</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Footer Badge */}
                   <div className="bg-[#0f172a] p-6 text-center relative z-10">
                      <div className="inline-flex items-center gap-3 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                         <Lock size={12} /> Secure 256-bit Encryption
                         <span className="w-1 h-1 bg-white/20 rounded-full" />
                         <Globe size={12} /> Global Payment Network
                      </div>
                   </div>
                </div>
             </div>

             {/* Right Sidebar: Payment Actions */}
             <div className="xl:col-span-4 space-y-6 no-print">
                
                {/* Status Card */}
                <div className={`rounded-[2.5rem] p-8 border transition-all duration-500 ${
                    isEverythingPaid 
                    ? 'bg-emerald-900/10 border-emerald-500/20' 
                    : 'bg-zinc-900 border-zinc-800'
                }`}>
                   <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isEverythingPaid ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                         {isEverythingPaid ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                      </div>
                      <div>
                         <p className={`text-sm font-black ${isEverythingPaid ? 'text-emerald-500' : 'text-white'}`}>
                             {isEverythingPaid ? 'Payment Complete' : 'Payment Pending'}
                         </p>
                         <p className="text-xs text-zinc-500 font-bold mt-0.5">
                             {isEverythingPaid ? 'Thank you for your business.' : `Due ${dueDate.toLocaleDateString()}`}
                         </p>
                      </div>
                   </div>
                   
                   {isEverythingPaid ? (
                       <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                           <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/10">
                               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Next Billing Cycle</p>
                               <p className="text-sm font-bold text-emerald-100 flex items-center gap-2">
                                   <Calendar size={14} /> {nextBillingDate}
                               </p>
                           </div>
                           <button onClick={() => navigate('/personal-billing')} className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
                               <FileText size={14} /> View History
                           </button>
                       </div>
                   ) : (
                       <div className="space-y-6">
                           <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full w-2/3 bg-amber-500 rounded-full animate-pulse" />
                           </div>
                           <button 
                              onClick={handlePayNow}
                              disabled={isProcessing}
                              className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/50"
                           >
                              {isProcessing ? (
                                  <>Processing <Loader2 size={16} className="animate-spin" /></>
                              ) : (
                                  <>Pay Securely <ArrowRight size={16} /></>
                              )}
                           </button>
                           <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-wide">
                              Encrypted via Stripe
                           </p>
                       </div>
                   )}
                </div>

                {/* Cart Block */}
                {!isEverythingPaid && (
                   <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
                      <div className="flex justify-between items-center mb-6">
                         <h4 className="text-sm font-bold text-white">Your Cart</h4>
                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{lineItems.length} Items</span>
                      </div>
                      <div className="space-y-4">
                         {pendingPlan && (
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                               <div>
                                  <p className="text-xs font-bold text-white">Plan Upgrade</p>
                                  <p className="text-[10px] text-zinc-500">{pendingPlan.id}</p>
                               </div>
                               <button onClick={() => handleRemoveItem('plan')} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400">Remove</button>
                            </div>
                         )}
                         {!pendingPlan && !isPlanPaid && plan.id !== 'free' && (
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                               <div>
                                  <p className="text-xs font-bold text-white">{plan.name} Subscription</p>
                                  <p className="text-[10px] text-zinc-500">Unpaid Plan</p>
                               </div>
                               <button onClick={() => handleRemoveItem('unpaid_plan')} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400">Remove</button>
                            </div>
                         )}
                         {pendingAddons.map(addon => (
                            <div key={addon.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                               <div>
                                  <p className="text-xs font-bold text-white">{addon.name}</p>
                                  <p className="text-[10px] text-zinc-500">Add-on</p>
                               </div>
                               <button onClick={() => handleRemoveItem('addon', addon.id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400">Remove</button>
                            </div>
                         ))}
                         {unbilledCharges.map((charge, idx) => (
                            <div key={charge.id || idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                               <div>
                                  <p className="text-xs font-bold text-white">{charge.name || charge.metadata?.name || charge.description}</p>
                                  <p className="text-[10px] text-zinc-500">{charge.type === 'credit_topup' ? 'AI Credits' : (charge.type === 'addon_purchase' ? 'Add-on' : 'Charge')}</p>
                               </div>
                               <button onClick={() => handleRemoveItem('unbilled', charge.id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400">Remove</button>
                            </div>
                         ))}
                         {!pendingPlan && (isPlanPaid || plan.id === 'free') && pendingAddons.length === 0 && unbilledCharges.length === 0 && (
                            <div className="text-center p-4">
                               <p className="text-xs text-zinc-500">Cart is empty</p>
                            </div>
                         )}
                      </div>
                   </div>
                )}

                {/* Payment Method - Interactive Visual */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                   
                   <div className="flex justify-between items-center mb-8 relative z-10">
                      <h4 className="text-sm font-bold text-white">Payment Method</h4>
                      <button onClick={() => navigate('/billing/payment-methods')} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Change</button>
                   </div>
                   
                   {/* Glassmorphism Card */}
                   <div className="aspect-[1.586/1] w-full rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
                      
                      <div className="flex justify-between items-start relative z-10">
                         <div className="w-10 h-6 bg-white/10 rounded border border-white/10" />
                         <span className="font-mono text-xs text-white/50 tracking-widest">DEBIT</span>
                      </div>
                      
                      <div className="relative z-10">
                         <p className="font-mono text-xl tracking-widest text-white mb-1">•••• •••• •••• 4242</p>
                      </div>

                      <div className="flex justify-between items-end relative z-10">
                         <div>
                            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Cardholder</p>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">{currentUser.name || 'AGENCY ADMIN'}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-0.5 text-right">Expires</p>
                            <p className="text-xs font-bold text-white">12/28</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Security Note */}
                <div className="p-6 rounded-[2rem] bg-blue-900/10 border border-blue-500/20 flex gap-4 items-start">
                   <ShieldCheck size={24} className="text-blue-500 shrink-0 mt-0.5" />
                   <div>
                      <p className="text-xs font-bold text-blue-100 mb-1">Bank-Grade Security</p>
                      <p className="text-[10px] leading-relaxed text-blue-200/60 font-medium">
                         Your payment is processed securely via Stripe. We do not store your full card details on our servers.
                      </p>
                   </div>
                </div>

             </div>
          </div>
       </div>

       {/* --- HIDDEN INVOICE TEMPLATE FOR PDF GENERATION --- */}
       <div id="hidden-invoice-template" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', color: '#000000', padding: '40px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}>
          
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
                          <td style={{ padding: '15px 10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                             {item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                          </td>
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

    </div>
  );
};

export default UpcomingInvoice;
