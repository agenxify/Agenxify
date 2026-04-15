
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Check, Database, Sparkles, UserPlus, 
  Globe, Shield, Zap, Search, LayoutGrid, CheckCircle2, Box,
  Crown, CreditCard, Loader2, X, AlertCircle, FileText
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
import { Invoice } from '../types.ts'; 
import { ALL_ADDONS } from '../constants.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useAgencySubscription } from '../hooks/useAgencySubscription';

const { useNavigate } = ReactRouterDom as any;

// Define which plans include which addons automatically
const PLAN_INCLUSIONS: Record<string, string[]> = {
  'free': [],
  'starter': [],
  'growth': [],
  'enterprise': [],
  'enterprise_plus': []
};

const Addons: React.FC = () => {
  const navigate = useNavigate();
  const { workspace, subscription, addons: purchasedAddons, addUnbilledCharge, loading } = useAgencySubscription();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedAddon, setSelectedAddon] = useState<any | null>(null);
  const [modalCycle, setModalCycle] = useState<'monthly' | 'annual'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Load Plan
  const [currentPlan, setCurrentPlan] = useState('free');

  // Load Purchased Addons
  // We use purchasedAddons from the hook directly now.

  useEffect(() => {
    if (subscription) {
      setCurrentPlan(subscription.plan_id || 'free');
    } else if (workspace) {
      setCurrentPlan(workspace.plan_id || 'free');
    }
  }, [subscription, workspace]);

  // Use Auth Context for user data
  const { user: currentUser } = useAuth();

  const initiatePurchase = (addon: any) => {
    if (loading || !workspace) return;
    setPurchaseSuccess(false);
    setSelectedAddon(addon);
  };

  const confirmPurchase = async () => {
    if (!selectedAddon || !workspace) return;
    setIsProcessing(true);

    try {
      const price = modalCycle === 'annual' ? selectedAddon.price : (selectedAddon.price / 12);
      const newCharge = {
        id: `charge-${Date.now()}`,
        name: selectedAddon.name,
        desc: `${selectedAddon.desc} (${modalCycle === 'annual' ? 'Annual' : 'Monthly'})`,
        amount: Number(price), 
        type: 'addon_purchase',
        addonId: selectedAddon.id,
        cycle: modalCycle,
        date: new Date().toISOString()
      };

      await addUnbilledCharge(newCharge);

      // Dispatch Events for Global Sync
      window.dispatchEvent(new Event('agencyos_config_updated'));
      window.dispatchEvent(new Event('storage'));
      
      setIsProcessing(false);
      setPurchaseSuccess(true);
      
      // Navigate to upcoming invoice to pay
      setTimeout(() => {
        setSelectedAddon(null);
        setPurchaseSuccess(false);
        navigate('/upcoming-invoice');
      }, 1000);
    } catch (err) {
      console.error("Purchase Error:", err);
      setIsProcessing(false);
      alert("Failed to initiate purchase. Please try again.");
    }
  };

  const includedInPlan = useMemo(() => PLAN_INCLUSIONS[currentPlan] || [], [currentPlan]);

  const filteredAddons = ALL_ADDONS.filter(addon => 
    addon.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    addon.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-40 relative overflow-x-hidden selection:bg-blue-500/30">
      
      {/* Styles */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pt-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
           <div>
              <button onClick={() => navigate('/personal-billing')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 group">
                 <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Billing
              </button>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
                 Expansion <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Modules.</span>
              </h1>
              <p className="text-xl text-zinc-400 font-medium max-w-xl leading-relaxed">
                 Extend your workspace capabilities with powerful integrations and capacity upgrades.
              </p>
           </div>
           
           <div className="relative group w-full md:w-96">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative flex items-center bg-[#0c0c0e] rounded-2xl border border-white/10 p-1">
                 <Search size={20} className="ml-4 text-zinc-500" />
                 <input 
                    className="w-full bg-transparent border-none outline-none text-white px-4 py-3 font-bold placeholder:text-zinc-600"
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {filteredAddons.map((addon, idx) => {
              const isIncluded = includedInPlan.includes(addon.id);
              const isPurchased = purchasedAddons.includes(addon.id);
              const isActive = isIncluded || isPurchased;

              return (
                <div 
                   key={addon.id} 
                   className={`
                      group relative bg-[#0c0c0e] rounded-[2.5rem] p-8 border border-zinc-800 hover:border-zinc-700 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl
                      ${isActive ? 'ring-1 ring-white/10' : ''}
                   `}
                   style={{ animationDelay: `${idx * 100}ms` }}
                >
                   {/* Status Badge */}
                   {isActive && (
                      <div className="absolute top-8 right-8 z-20">
                         {isIncluded ? (
                           <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                              <Crown size={12} /> Included in Plan
                           </div>
                         ) : (
                           <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                              <CheckCircle2 size={12} /> Active
                           </div>
                         )}
                      </div>
                   )}

                   {/* Hover Gradient Background */}
                   <div className={`absolute inset-0 bg-gradient-to-br ${addon.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />

                   {/* Icon */}
                   <div className="relative mb-8">
                      <div className={`w-20 h-20 rounded-[1.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                         <addon.icon size={36} className={`text-zinc-400 group-hover:text-white transition-colors duration-300`} />
                      </div>
                      {/* Background Icon Blob */}
                      <div className={`absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br ${addon.gradient} rounded-full blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                   </div>

                   <div className="relative z-10 mb-8 min-h-[100px]">
                      <h3 className="text-2xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                         {addon.name}
                      </h3>
                      <p className="text-sm font-medium text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                         {addon.desc}
                      </p>
                   </div>

                   <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Monthly</p>
                         <p className="text-3xl font-black text-white tracking-tight">
                            ${(addon.price / 12).toFixed(0)}<span className="text-lg text-zinc-600 font-bold">/mo</span>
                         </p>
                      </div>

                      {isActive ? (
                         <button className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-400 font-black text-xs uppercase tracking-widest hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all">
                            Manage
                         </button>
                      ) : (
                         <button 
                            onClick={() => initiatePurchase(addon)}
                            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-black/50 hover:scale-105 active:scale-95 transition-all bg-gradient-to-r ${addon.gradient} flex items-center gap-2`}
                         >
                            Add Module <Plus size={14} strokeWidth={3} />
                         </button>
                      )}
                   </div>
                </div>
              );
           })}
        </div>

        {filteredAddons.length === 0 && (
           <div className="flex flex-col items-center justify-center py-32 opacity-50">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                 <Box size={40} className="text-zinc-600" />
              </div>
              <h3 className="text-xl font-black text-white">No Modules Found</h3>
              <p className="text-zinc-500 text-sm font-medium mt-2">Try adjusting your search criteria.</p>
           </div>
        )}
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {selectedAddon && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isProcessing && !purchaseSuccess && setSelectedAddon(null)} />
           
           <div className="relative bg-[#0c0c0e] w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              
              {purchaseSuccess ? (
                 <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                       <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                          <Check size={32} strokeWidth={4} />
                       </div>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white">Added to Invoice</h3>
                       <p className="text-zinc-500 font-medium mt-2">Redirecting to payment terminal...</p>
                    </div>
                 </div>
              ) : (
                 <>
                    {/* Modal Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                       <h3 className="text-xl font-black text-white">Confirm Subscription</h3>
                       <button onClick={() => setSelectedAddon(null)} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/10 transition-colors"><X size={20}/></button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-8 space-y-8">
                       {/* Cycle Toggle */}
                       <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5">
                          <button 
                             onClick={() => setModalCycle('monthly')}
                             className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modalCycle === 'monthly' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                             Monthly
                          </button>
                          <button 
                             onClick={() => setModalCycle('annual')}
                             className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modalCycle === 'annual' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                             Annual
                          </button>
                       </div>

                       <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-zinc-900 border border-white/10 text-white shadow-lg`}>
                             <selectedAddon.icon size={32} className={`text-zinc-200`} />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-white">{selectedAddon.name}</h4>
                             <p className="text-xs text-zinc-500 font-medium">{selectedAddon.desc}</p>
                          </div>
                       </div>

                       <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5 space-y-4">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-zinc-400 font-medium">{modalCycle === 'annual' ? 'Annual' : 'Monthly'} Cost</span>
                             <span className="text-white font-bold">${modalCycle === 'annual' ? selectedAddon.price.toFixed(2) : (selectedAddon.price / 12).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-zinc-400 font-medium">Tax (Est.)</span>
                             <span className="text-white font-bold">$0.00</span>
                          </div>
                          <div className="h-px bg-white/10 my-2" />
                          <div className="flex justify-between items-center">
                             <span className="text-sm font-black text-white uppercase tracking-widest">Total Due ({modalCycle === 'annual' ? 'Annual' : 'Monthly'})</span>
                             <span className="text-2xl font-black text-blue-500">${modalCycle === 'annual' ? selectedAddon.price.toFixed(2) : (selectedAddon.price / 12).toFixed(2)}</span>
                          </div>
                       </div>

                       <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                             <p className="text-xs font-bold text-blue-400">Payment Required</p>
                             <p className="text-[10px] text-zinc-400 leading-relaxed">
                                You will be redirected to the invoice page to complete this payment. The addon will be active immediately upon payment.
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-8 border-t border-white/5 bg-zinc-900/50 flex gap-4">
                       <button 
                          onClick={() => setSelectedAddon(null)}
                          className="flex-1 py-4 rounded-xl border border-white/10 text-zinc-400 font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
                       >
                          Cancel
                       </button>
                       <button 
                          onClick={confirmPurchase}
                          disabled={isProcessing}
                          className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          {isProcessing ? (
                             <>Processing <Loader2 size={14} className="animate-spin" /></>
                          ) : (
                             <>Proceed to Pay <CreditCard size={14} /></>
                          )}
                       </button>
                    </div>
                 </>
              )}
           </div>
        </div>
      )}

    </div>
  );
};

export default Addons;
