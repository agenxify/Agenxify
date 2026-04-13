
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Check, Sparkles, Star, Zap, Shield, Globe, Users, Database,
  Infinity as InfinityIcon, Crown, ChevronRight, AlertCircle
} from 'lucide-react';
import { AVAILABLE_PLANS } from '../constants';
import * as ReactRouterDom from 'react-router-dom';
import { useAgencySubscription } from '../hooks/useAgencySubscription';

const { useNavigate } = ReactRouterDom as any;

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { workspace, subscription, loading } = useAgencySubscription();
  // Always default to annual view for marketing purposes unless user has active monthly
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  
  // Current Active Plan
  const [currentPlanId, setCurrentPlanId] = useState('free');
  
  // Current Active Cycle for that plan
  const [currentCycle, setCurrentCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    if (subscription) {
      setCurrentPlanId(subscription.plan_id || 'free');
      setCurrentCycle((subscription.billing_cycle as 'monthly' | 'annual') || 'monthly');
    } else if (workspace) {
      setCurrentPlanId(workspace.plan_id || 'free');
      setCurrentCycle((workspace.billing_cycle as 'monthly' | 'annual') || 'monthly');
    }
  }, [subscription, workspace]);

  // Start date of current plan (to calculate credit)
  const [planStartDate, setPlanStartDate] = useState(() => {
     const saved = subscription?.plan_start_date || workspace?.plan_start_date;
     return saved ? new Date(saved) : new Date();
  });
  
  // Load initial state
  useEffect(() => {
     setBillingCycle(currentCycle);
  }, []);

  const getCurrentPlanIndex = () => AVAILABLE_PLANS.findIndex(p => p.id === currentPlanId);
  const getTargetPlanIndex = (id: string) => AVAILABLE_PLANS.findIndex(p => p.id === id);

  const getTierStyles = (id: string) => {
    switch (id) {
      case 'free':
        return {
          container: "bg-white/5 border-white/10 hover:border-white/20",
          button: "bg-zinc-800 text-white hover:bg-zinc-700",
          icon: "text-zinc-400 bg-zinc-900/50",
          glow: "bg-zinc-500"
        };
      case 'starter':
        return {
          container: "bg-blue-900/10 border-blue-500/20 hover:border-blue-500/40 hover:shadow-blue-500/10",
          button: "bg-blue-600 text-white hover:bg-blue-500",
          icon: "text-blue-400 bg-blue-500/10",
          glow: "bg-blue-500"
        };
      case 'growth':
        return {
          container: "bg-indigo-900/10 border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-indigo-500/10",
          button: "bg-indigo-600 text-white hover:bg-indigo-500",
          icon: "text-indigo-400 bg-indigo-500/10",
          glow: "bg-indigo-500"
        };
      case 'pro':
        return {
          container: "bg-purple-900/10 border-purple-500/30 hover:border-purple-500/50 hover:shadow-purple-500/20",
          button: "bg-purple-600 text-white hover:bg-purple-500",
          icon: "text-purple-400 bg-purple-500/10",
          glow: "bg-purple-500"
        };
      case 'enterprise':
        return {
          container: "bg-black border-transparent relative overflow-hidden group/rgb",
          // Updated to a gradient button
          button: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.4)] border-none",
          icon: "text-white bg-white/20 backdrop-blur-md",
          glow: "bg-white"
        };
      default:
        return { container: "", button: "", icon: "", glow: "" };
    }
  };

  const renderLimit = (value: number) => {
    if (value === -1) return <InfinityIcon size={14} className="inline-block" />;
    return value;
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-40 relative overflow-x-hidden">
      <style>{`
        @keyframes flow-rgb {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-flow-rgb {
          background-size: 300% 300%;
          animation: flow-rgb 4s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .premium-card:hover .premium-glow {
          opacity: 1;
        }
      `}</style>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[150px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[150px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] left-[20%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      <div className="max-w-[1800px] mx-auto px-6 pt-10 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16 space-y-6">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Upgrade Your Agency OS</span>
           </div>
           
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
              Choose Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 animate-flow-rgb">Power Level</span>
           </h1>
           
           <p className="text-lg text-zinc-400 max-w-2xl font-medium leading-relaxed">
              Scale your operations with infrastructure designed for high-velocity teams. 
              Unlock advanced neural engines, unlimited storage, and priority support.
           </p>

           <div className="flex items-center p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${billingCycle === 'annual' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                Annual
                {billingCycle !== 'annual' && (
                  <span className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full shadow-lg">SAVE 20%</span>
                )}
              </button>
           </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
           {AVAILABLE_PLANS.map((plan, index) => {
              const isCurrent = plan.id === currentPlanId;
              const styles = getTierStyles(plan.id);
              const price = billingCycle === 'annual' ? plan.price : Math.round(plan.price * 1.2); 
              const isEnterprisePlus = plan.id === 'enterprise';
              const currentIndex = getCurrentPlanIndex();
              const targetIndex = getTargetPlanIndex(plan.id);
              
              // Determine button state
              let buttonText: string;
              let isDowngrade = false;
              
              if (isCurrent && billingCycle === currentCycle) {
                  buttonText = "Current Plan";
              } else if (targetIndex < currentIndex) {
                  buttonText = "Contact to Downgrade";
                  isDowngrade = true;
              } else if (currentCycle === 'annual' && billingCycle === 'monthly') {
                  buttonText = "Unavailable (Annual Active)";
                  isDowngrade = true; // Treat cycle switch as restriction
              } else if (isCurrent) {
                  buttonText = "Update Cycle"; // e.g. Monthly to Annual
              } else {
                  buttonText = "Upgrade";
              }

              return (
                    <div 
                  key={plan.id}
                  onDoubleClick={() => navigate(`/billing/plans/${plan.id}`)}
                  className={`
                    relative rounded-[2.5rem] p-8 flex flex-col h-full border backdrop-blur-md transition-all duration-500 group premium-card
                    ${styles.container}
                    ${isCurrent ? 'ring-2 ring-white shadow-[0_0_50px_rgba(255,255,255,0.1)]' : 'shadow-xl'}
                    ${isDowngrade ? 'opacity-80 grayscale' : ''}
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                   {/* Enterprise+ Special Effects */}
                   {isEnterprisePlus && (
                      <>
                        <div className="absolute -inset-[2px] bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-flow-rgb -z-10" />
                        <div className="absolute inset-[1px] bg-black rounded-[2.4rem] z-0" />
                        <div className="absolute top-0 right-0 p-12 opacity-20 pointer-events-none z-10 animate-spin-slow">
                           <Crown size={120} strokeWidth={1} />
                        </div>
                      </>
                   )}

                   {/* Plan Glow Effect */}
                   {!isEnterprisePlus && (
                     <div className={`absolute -inset-px rounded-[2.5rem] bg-gradient-to-b from-${styles.glow}/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md -z-10`} />
                   )}

                   <div className="relative z-10 flex flex-col h-full">
                      {/* Icon & Name */}
                      <div className="flex justify-between items-start mb-6">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${styles.icon}`}>
                            {plan.id === 'free' && <Zap size={24} />}
                            {plan.id === 'starter' && <Zap size={24} />}
                            {plan.id === 'growth' && <Star size={24} />}
                            {plan.id === 'pro' && <Shield size={24} />}
                            {plan.id === 'enterprise' && <Crown size={24} />}
                         </div>
                         {plan.popular && (
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">Popular</span>
                         )}
                         {isCurrent && (
                            <span className="px-3 py-1 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">Active</span>
                         )}
                      </div>

                      <div className="mb-8">
                         <h3 className={`text-2xl font-black mb-2 ${isEnterprisePlus ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500' : 'text-white'}`}>{plan.name}</h3>
                         <p className="text-xs font-medium text-zinc-500 h-8 line-clamp-2">{(plan as any).desc}</p>
                      </div>

                      <div className="mb-8 pb-8 border-b border-white/5">
                         <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-white">${price}</span>
                            <span className="text-xs font-bold text-zinc-500">/ mo</span>
                         </div>
                         {billingCycle === 'annual' && price > 0 && (
                            <p className="text-[10px] text-emerald-500 font-bold mt-2">Billed ${price * 12} yearly</p>
                         )}
                      </div>

                      <div className="space-y-4 flex-1 mb-8">
                         <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Core Capabilities</p>
                         {plan.features.slice(0, isEnterprisePlus ? 12 : 6).map((feat, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-zinc-300 font-medium">
                               <Check size={14} className={`mt-0.5 shrink-0 ${isEnterprisePlus ? 'text-yellow-400' : 'text-blue-500'}`} strokeWidth={3} />
                               <span className="leading-tight">{feat}</span>
                            </div>
                         ))}
                         
                         {/* Stats Grid for Plan */}
                         <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-white/5">
                             <div className="bg-white/5 rounded-xl p-3 text-center">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Seats</p>
                                <p className="text-lg font-black text-white">{renderLimit(plan.seatLimit)}</p>
                             </div>
                             <div className="bg-white/5 rounded-xl p-3 text-center">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Projects</p>
                                <p className="text-lg font-black text-white">{renderLimit(plan.projectLimit)}</p>
                             </div>
                             <div className="bg-white/5 rounded-xl p-3 text-center col-span-2 flex items-center justify-between px-6">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">AI Credits</p>
                                <p className="text-lg font-black text-white">{plan.baseCredits >= 1000 ? (plan.baseCredits / 1000) + 'k' : plan.baseCredits}</p>
                             </div>
                             <div className="bg-white/5 rounded-xl p-3 text-center col-span-2 flex items-center justify-between px-6">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Storage</p>
                                <p className="text-lg font-black text-white">{plan.storageLimitGB} GB</p>
                             </div>
                         </div>
                      </div>

                      <button 
                         onClick={() => {
                            if (!isDowngrade && !(isCurrent && billingCycle === currentCycle)) {
                               navigate(`/billing/plans/${plan.id}`);
                            }
                         }}
                         disabled={isDowngrade || (isCurrent && billingCycle === currentCycle)}
                         className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg group relative overflow-hidden ${styles.button} ${(isDowngrade || (isCurrent && billingCycle === currentCycle)) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                      >
                         <span className="relative z-10 flex items-center justify-center gap-2">
                            {buttonText} {!(isDowngrade || (isCurrent && billingCycle === currentCycle)) && <ChevronRight size={14} />}
                         </span>
                         {isEnterprisePlus && !(isDowngrade || (isCurrent && billingCycle === currentCycle)) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                         )}
                      </button>
                   </div>
                </div>
              );
           })}
        </div>

        {/* Enterprise Contact */}
        <div className="mt-20 p-12 bg-zinc-900/50 border border-white/5 rounded-[3rem] text-center max-w-4xl mx-auto backdrop-blur-sm relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-purple-900/10" />
           <div className="relative z-10 space-y-6">
              <h3 className="text-3xl font-black text-white">Need Custom Infrastructure?</h3>
              <p className="text-zinc-400 max-w-lg mx-auto">For organizations requiring dedicated shards, private cloud deployment, or SLA guarantees, contact our solutions engineering team.</p>
              <div className="flex justify-center gap-4">
                 <button onClick={() => window.open('https://cal.id/vexel-studios/sales', '_blank')} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg">Contact Sales</button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Plans;
