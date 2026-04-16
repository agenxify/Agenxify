
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Zap, Wallet, CreditCard, CheckCircle2, TrendingUp, Sparkles, Check,
  Crown, Star, Shield, Cpu, Lock, Loader2
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
import { AVAILABLE_PLANS } from '../constants';
import { useAgencySubscription } from '../hooks/useAgencySubscription';

const { useNavigate } = ReactRouterDom as any;

// Enhanced package configuration with specific visual themes
const CREDIT_PACKAGES = [
  { 
    id: 'small', 
    credits: 500, 
    price: 5, 
    label: 'Starter Boost', 
    popular: false, 
    icon: Zap,
    description: 'Essential fuel for quick tasks.',
    styles: {
      container: "bg-zinc-900/40 border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900/60",
      iconBox: "bg-zinc-800 text-zinc-400 group-hover:text-blue-400 group-hover:bg-blue-500/10",
      text: "text-zinc-400 group-hover:text-zinc-200",
      price: "text-white",
      badge: null,
      button: "bg-zinc-800 text-zinc-400 group-hover:bg-blue-600 group-hover:text-white"
    }
  },
  { 
    id: 'medium', 
    credits: 1500, 
    price: 12, 
    label: 'Growth Pack', 
    popular: true, 
    save: '20%', 
    icon: Star,
    description: 'Optimal balance for scaling teams.',
    styles: {
      container: "bg-indigo-900/10 border-indigo-500/20 hover:border-indigo-400/50 hover:bg-indigo-900/20 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)]",
      iconBox: "bg-indigo-500/10 text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/20",
      text: "text-indigo-200/60 group-hover:text-indigo-100",
      price: "text-indigo-100",
      badge: "bg-indigo-500 text-white",
      button: "bg-indigo-600 text-white hover:bg-indigo-500"
    }
  },
  { 
    id: 'large', 
    credits: 5000, 
    price: 35, 
    label: 'Power User', 
    popular: false, 
    save: '30%', 
    icon: Shield,
    description: 'Heavy duty capacity for pros.',
    styles: {
      container: "bg-rose-900/10 border-rose-500/20 hover:border-rose-400/50 hover:bg-rose-900/20 hover:shadow-[0_0_30px_-10px_rgba(244,63,94,0.3)]",
      iconBox: "bg-rose-500/10 text-rose-400 group-hover:text-rose-300 group-hover:bg-rose-500/20",
      text: "text-rose-200/60 group-hover:text-rose-100",
      price: "text-rose-100",
      badge: "bg-rose-500 text-white",
      button: "bg-rose-600 text-white hover:bg-rose-500"
    }
  },
  { 
    id: 'enterprise', 
    credits: 20000, 
    price: 120, 
    label: 'Agency Scale', 
    popular: false, 
    save: '40%', 
    icon: Crown,
    description: 'Maximum throughput architecture.',
    styles: {
      container: "bg-black border-transparent relative overflow-hidden group/rgb ring-1 ring-white/10",
      iconBox: "bg-white/10 text-white backdrop-blur-md",
      text: "text-zinc-400 group-hover:text-white",
      price: "text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-400",
      badge: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white box-shadow-lg",
      button: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110"
    }
  },
];

import { DODO_CREDITS } from '../src/constants/dodo';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const TopUp: React.FC = () => {
  const navigate = useNavigate();
  const { workspace, subscription, addons, addCredits, totalCredits, loading } = useAgencySubscription();
  const { user } = useAuth();
  const currentPlanId = subscription?.plan_id || workspace?.plan_id || 'free';
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>('medium');
  const [isProcessing, setIsProcessing] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Balance...</p>
      </div>
    );
  }

  const selectedPkg = CREDIT_PACKAGES.find(p => p.id === selectedPackageId);

  const currentBalance = totalCredits;

  const handlePurchase = async () => {
    if (!selectedPkg || !workspace || isProcessing) return;
    setIsProcessing(true);
    
    try {
        let productId = '';
        if (selectedPackageId === 'small') productId = DODO_CREDITS.STARTER_BOOST;
        else if (selectedPackageId === 'medium') productId = DODO_CREDITS.GROWTH_PACK;
        else if (selectedPackageId === 'large') productId = DODO_CREDITS.POWER_USER;
        else if (selectedPackageId === 'enterprise') productId = DODO_CREDITS.AGENCY_SCALE;

        if (!productId) throw new Error("Invalid package selected");

        const response = await axios.post('/api/billing/create-checkout-session', {
            productId,
            userId: user?.uid,
            email: user?.email,
            workspaceId: workspace?.id,
            metadata: {
                purchaseType: 'credits',
                packageId: selectedPackageId
            }
        });

        if (response.data.url) {
            window.location.href = response.data.url;
        } else {
            throw new Error("No checkout URL received");
        }
    } catch (err: any) {
        console.error("Top-up Error:", err);
        const errorMessage = err.response?.data?.error || err.message || "Unknown error";
        alert(`Failed to initiate payment: ${errorMessage}. Please try again.`);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-40 relative overflow-x-hidden font-sans selection:bg-blue-500/30">
       <style>{`
        @keyframes flow-rgb {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-flow-rgb {
          background-size: 300% 300%;
          animation: flow-rgb 4s ease infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
      
       {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pt-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
                <button onClick={() => navigate('/personal-billing')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Billing
                </button>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">
                  Credit <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Refuel.</span>
                </h1>
                <p className="text-xl text-zinc-400 font-medium max-w-xl leading-relaxed">
                  Purchase on-demand capacity for AI generation, automated workflows, and premium API calls. Credits never expire.
                </p>
            </div>
            
            <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="px-4 py-2">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current Balance</p>
                   <p className="text-xl font-black text-white tabular-nums">{currentBalance.toLocaleString()}</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                   <Zap size={20} className="text-white fill-white" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Packages Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {CREDIT_PACKAGES.map((pkg, idx) => {
                    const isSelected = selectedPackageId === pkg.id;
                    const isEnterprise = pkg.id === 'enterprise';
                    
                    return (
                        <div 
                            key={pkg.id}
                            onClick={() => setSelectedPackageId(pkg.id)}
                            className={`
                                relative p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-500 group overflow-hidden min-h-[280px] flex flex-col
                                ${isSelected ? 'ring-2 ring-offset-2 ring-offset-black ring-blue-500 transform scale-[1.02]' : ''}
                                ${pkg.styles.container}
                            `}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Enterprise Special Effects */}
                            {isEnterprise && (
                                <>
                                   <div className="absolute -inset-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-[2.5rem] blur opacity-40 group-hover:opacity-80 transition-all duration-1000 animate-flow-rgb" />
                                   <div className="absolute inset-[1px] bg-black rounded-[2.4rem] z-0" />
                                   <div className="absolute -right-10 -top-10 text-white/5 animate-spin-slow z-0">
                                      <Cpu size={200} />
                                   </div>
                                </>
                            )}

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${pkg.styles.iconBox} shadow-lg`}>
                                        <pkg.icon size={28} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                       {pkg.popular && (
                                           <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${pkg.styles.badge || 'bg-white text-black'}`}>
                                               Most Popular
                                           </span>
                                       )}
                                       {pkg.save && (
                                           <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wide">
                                               Save {pkg.save}
                                           </span>
                                       )}
                                       {isSelected && (
                                           <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                              <Check size={14} strokeWidth={4} />
                                           </div>
                                       )}
                                    </div>
                                </div>

                                <div className="mb-auto">
                                    <h3 className={`text-5xl font-black mb-2 tracking-tighter ${isEnterprise ? 'text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500' : 'text-white'}`}>
                                       {pkg.credits.toLocaleString()}
                                    </h3>
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-4">{pkg.label}</p>
                                    <p className={`text-xs font-medium leading-relaxed max-w-[80%] ${pkg.styles.text}`}>
                                       {pkg.description}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-end">
                                    <div className="flex flex-col">
                                       <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">One-time payment</span>
                                       <span className={`text-3xl font-black ${pkg.styles.price}`}>${pkg.price}</span>
                                    </div>
                                    <button className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 ${pkg.styles.button}`}>
                                       Select
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary & Checkout - Sticky Terminal */}
            <div className="lg:col-span-4 sticky top-6 animate-in slide-in-from-right duration-700">
                <div className="bg-[#0c0c0e] border border-zinc-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                    {/* RGB Border Top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 animate-flow-rgb" />
                    
                    {/* Background Glint */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-inner">
                              <Wallet size={24} className="text-white" />
                           </div>
                           <h3 className="text-xl font-black text-white">Checkout</h3>
                        </div>
                        <div className="px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                           <Lock size={12} className="text-zinc-500" />
                        </div>
                    </div>

                    <div className="space-y-6 mb-8 relative z-10">
                        <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 space-y-4">
                           <div className="flex justify-between items-center text-sm">
                               <span className="font-bold text-zinc-400">Package</span>
                               <span className="font-black text-white">{selectedPkg?.label}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                               <span className="font-bold text-zinc-400">Credits</span>
                               <span className="font-black text-white flex items-center gap-2">
                                   <Zap size={14} className="text-yellow-400 fill-yellow-400"/> {selectedPkg?.credits.toLocaleString()}
                               </span>
                           </div>
                           <div className="h-px bg-zinc-800" />
                           <div className="flex justify-between items-center">
                               <span className="font-bold text-zinc-400">Total</span>
                               <span className="text-3xl font-black text-white tracking-tight">${selectedPkg?.price}</span>
                           </div>
                        </div>

                        <div className="bg-blue-600/5 p-4 rounded-2xl border border-blue-600/20 flex items-center gap-4 cursor-pointer hover:bg-blue-600/10 transition-colors" onClick={() => navigate('/billing/payment-methods')}>
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                               <CreditCard size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black text-white">Visa •••• 4242</p>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Primary Method</p>
                            </div>
                            <button className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Change</button>
                        </div>
                    </div>

                    <button 
                        onClick={handlePurchase}
                        disabled={isProcessing}
                        className={`w-full py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.25em] transition-all ${isProcessing ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95'} flex items-center justify-center gap-3 relative overflow-hidden`}
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Zap size={16} className="fill-white" />
                                Confirm Top-up
                            </>
                        )}
                    </button>
                    
                    <div className="mt-8 flex items-center justify-center gap-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="h-6 w-12 bg-white/20 rounded" /> {/* Mock Logo */}
                        <div className="h-6 w-12 bg-white/20 rounded" /> {/* Mock Logo */}
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Secure TLS 1.3</p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TopUp;
