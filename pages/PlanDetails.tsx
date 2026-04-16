import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Check, Sparkles, Star, Zap, Shield, Globe, Users, Database,
  Infinity as InfinityIcon, Crown, ChevronRight, AlertCircle, Rocket,
  Workflow, Activity, HardDrive, Target, Clock, ShieldCheck, Mail
} from 'lucide-react';
import { AVAILABLE_PLANS } from '../constants';
import { motion } from 'framer-motion';
import { useAgencySubscription } from '../hooks/useAgencySubscription';

import { DODO_PLANS } from '../src/constants/dodo';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const PlanDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const { workspace, subscription } = useAgencySubscription();
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const plan = AVAILABLE_PLANS.find(p => p.id === planId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [planId]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black mb-4">Plan Not Found</h1>
        <button onClick={() => navigate('/billing/plans')} className="text-blue-500 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Plans
        </button>
      </div>
    );
  }

  const price = billingCycle === 'annual' ? plan.price : Math.round(plan.price * 1.2);
  const isEnterprisePlus = plan.id === 'enterprise';

  const renderLimit = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    if (value === -1) return <span className="flex items-center gap-1"><InfinityIcon size={14} /> Unlimited</span>;
    if (value === 0) return 'None';
    return value;
  };

  const getIcon = () => {
    switch (plan.id) {
      case 'free': return <Zap size={48} className="text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.5)]" />;
      case 'starter': return <Zap size={48} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />;
      case 'growth': return <Star size={48} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />;
      case 'enterprise': return <Crown size={48} className="text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.5)]" />;
      default: return <Sparkles size={48} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
  };

  const floatVariants = {
    animate: {
      y: [0, -10, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const getCurrentPlanIndex = () => AVAILABLE_PLANS.findIndex(p => p.id === (subscription?.plan_id || workspace?.plan_id || 'free'));
  const getTargetPlanIndex = (id: string) => AVAILABLE_PLANS.findIndex(p => p.id === id);

  const calculateCredit = () => {
     const currentPlanId = subscription?.plan_id || workspace?.plan_id || 'free';
     if (currentPlanId === 'free') return 0;
     
     const planStartDate = subscription?.plan_start_date || workspace?.plan_start_date;
     const start = planStartDate ? new Date(planStartDate) : new Date();
     const now = new Date();
     
     const currentPlanObj = AVAILABLE_PLANS.find(p => p.id === currentPlanId);
     if (!currentPlanObj) return 0;

     const currentCycle = subscription?.billing_cycle || workspace?.billing_cycle || 'monthly';
     const currentPrice = currentCycle === 'annual' ? currentPlanObj.price * 12 : currentPlanObj.price;
     
     let totalDurationMs: number;
     if (currentCycle === 'annual') {
        totalDurationMs = 365 * 24 * 60 * 60 * 1000;
     } else {
        totalDurationMs = 30 * 24 * 60 * 60 * 1000;
     }

     const elapsedMs = now.getTime() - start.getTime();
     if (elapsedMs >= totalDurationMs) return 0;
     
     const remainingRatio = 1 - (elapsedMs / totalDurationMs);
     return Math.max(0, currentPrice * remainingRatio);
  };

  const currentPlanId = subscription?.plan_id || workspace?.plan_id || 'free';
  const currentCycle = subscription?.billing_cycle || workspace?.billing_cycle || 'monthly';
  const currentIndex = getCurrentPlanIndex();
  const targetIndex = getTargetPlanIndex(plan?.id || 'free');
  
  const isCurrent = plan?.id === currentPlanId;
  let isDowngrade = false;
  let buttonText = `Select ${plan?.name} Plan`;

  if (isCurrent && billingCycle === currentCycle) {
      buttonText = "Current Plan";
  } else if (targetIndex < currentIndex) {
      buttonText = "Contact to Downgrade";
      isDowngrade = true;
  } else if (currentCycle === 'annual' && billingCycle === 'monthly') {
      buttonText = "Unavailable (Annual Active)";
      isDowngrade = true;
  } else if (isCurrent) {
      buttonText = "Update Cycle";
  }

  const handleSelectPlan = async () => {
    if (!plan || isDowngrade || (isCurrent && billingCycle === currentCycle) || isRedirecting) return;
    
    setIsRedirecting(true);
    try {
      // Get the correct Dodo Product ID based on plan and cycle
      let productId = '';
      if (planId === 'starter') {
        productId = billingCycle === 'annual' ? DODO_PLANS.STARTER.ANNUALLY : DODO_PLANS.STARTER.MONTHLY;
      } else if (planId === 'growth') {
        productId = billingCycle === 'annual' ? DODO_PLANS.GROWTH.ANNUALLY : DODO_PLANS.GROWTH.MONTHLY;
      } else if (planId === 'enterprise') {
        productId = billingCycle === 'annual' ? DODO_PLANS.ENTERPRISE.ANNUALLY : DODO_PLANS.ENTERPRISE.MONTHLY;
      }

      if (!productId) {
        throw new Error("Invalid plan selection");
      }

      // Create checkout session via backend
      const response = await axios.post('/api/billing/create-checkout-session', {
        productId,
        userId: user?.uid,
        email: user?.email,
        workspaceId: workspace?.id,
        metadata: {
          purchaseType: 'subscription',
          planId: planId,
          billingCycle: billingCycle
        }
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout Redirect Error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white pb-40 relative overflow-x-hidden selection:bg-blue-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 animate-pulse bg-${plan.accent}-600`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 animate-pulse bg-${plan.accent}-900`} style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] left-[20%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 relative z-10">
        <button 
          onClick={() => navigate('/billing/plans')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12 group"
        >
          <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Back to Plans</span>
        </button>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div 
                variants={floatVariants}
                animate="animate"
                className={`w-24 h-24 rounded-3xl flex items-center justify-center bg-gradient-to-br ${plan.color} bg-opacity-10 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10">
                  {getIcon()}
                </div>
              </motion.div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={`text-5xl md:text-6xl font-black tracking-tighter ${isEnterprisePlus ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400' : 'text-white'}`}>
                    {plan.name}
                  </h1>
                  {plan.popular && (
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Popular</span>
                  )}
                </div>
                <p className="text-xl text-zinc-400 font-medium">{plan.desc}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? `bg-${plan.accent}-600 text-white shadow-lg` : 'text-zinc-500 hover:text-white'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${billingCycle === 'annual' ? `bg-${plan.accent}-600 text-white shadow-lg` : 'text-zinc-500 hover:text-white'}`}
                >
                  Annual
                </button>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-5xl font-black text-white">${price}</span>
                  <span className="text-sm font-bold text-zinc-500">/ mo</span>
                </div>
                {billingCycle === 'annual' && price > 0 && (
                  <p className="text-xs text-rose-500 font-bold mt-1">Billed ${price * 12} yearly</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Core Features Overview */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-black text-white mb-1">Team & Clients</h3>
              <p className="text-sm text-zinc-400 font-medium mb-4">Scale your agency roster.</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Team Members</span>
                  <span className="font-bold text-white">{renderLimit(plan.seatLimit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Clients</span>
                  <span className="font-bold text-white">{renderLimit(plan.clientLimit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Workspaces</span>
                  <span className="font-bold text-white">{renderLimit(plan.workspacesLimit)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                <Activity size={20} />
              </div>
              <h3 className="text-lg font-black text-white mb-1">Operations</h3>
              <p className="text-sm text-zinc-400 font-medium mb-4">Manage projects and requests.</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Requests</span>
                  <span className="font-bold text-white">{renderLimit(plan.projectLimit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Tickets</span>
                  <span className="font-bold text-white">{renderLimit(plan.ticketsLimit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Pipelines</span>
                  <span className="font-bold text-white">{renderLimit(plan.pipelineLimit)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/10 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-black text-white mb-1">AI & Storage</h3>
              <p className="text-sm text-zinc-400 font-medium mb-4">Power up with AI credits.</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">AI Credits</span>
                  <span className="font-bold text-white">{plan.baseCredits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Storage</span>
                  <span className="font-bold text-white">{plan.storageLimitGB < 1 ? `${plan.storageLimitGB * 1000} MB` : `${plan.storageLimitGB} GB`}</span>
                </div>
                {isEnterprisePlus && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Security</span>
                    <span className="font-bold text-rose-400">Advanced SSO</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Comprehensive Feature List */}
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -z-10" />
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <Workflow size={24} className={`text-${plan.accent}-400`} /> Comprehensive Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Column 1 */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Rocket size={14} /> Core Platform
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Workspaces</span>
                      <span className="font-bold text-white">{renderLimit(plan.workspacesLimit)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Storage Capacity</span>
                      <span className="font-bold text-white">{plan.storageLimitGB < 1 ? `${plan.storageLimitGB * 1000} MB` : `${plan.storageLimitGB} GB`}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Pages</span>
                      <span className="font-bold text-white">{renderLimit(plan.pagesLimit)}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={14} /> Client Management
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Active Clients</span>
                      <span className="font-bold text-white">{renderLimit(plan.clientLimit)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Team Members</span>
                      <span className="font-bold text-white">{renderLimit(plan.seatLimit)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Onboarding Forms</span>
                      <span className="font-bold text-white">{renderLimit(plan.onboardingLimit)}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target size={14} /> Sales & Marketing
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Pipelines</span>
                      <span className="font-bold text-white">{renderLimit(plan.pipelineLimit)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Marketing Access</span>
                      <span className="font-bold text-white">{plan.marketingEmailsLimit > 0 ? 'Full Access' : 'None'}</span>
                    </li>
                    {plan.marketingEmailsLimit > 0 && (
                      <li className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">Email Marketing</span>
                        <span className="font-bold text-white">{plan.marketingEmailsLimit} Campaigns</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity size={14} /> Service Delivery
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Requests</span>
                      <span className="font-bold text-white">{renderLimit(plan.projectLimit)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Tickets</span>
                      <span className="font-bold text-white">{renderLimit(plan.ticketsLimit)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Services</span>
                      <span className="font-bold text-white">{renderLimit(plan.servicesLimit)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Booking Forms</span>
                      <span className="font-bold text-white">{renderLimit(plan.bookingsLimit)}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Database size={14} /> Billing & Finance
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Invoices</span>
                      <span className="font-bold text-white">{renderLimit(plan.invoicesLimit)}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">Estimates</span>
                      <span className="font-bold text-white">{renderLimit(plan.estimatesLimit)}</span>
                    </li>
                  </ul>
                </div>

                {isEnterprisePlus && (
                  <div>
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldCheck size={14} /> Enterprise Security
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">SSO (SAML)</span>
                        <span className="font-bold text-rose-400"><Check size={16} /></span>
                      </li>
                      <li className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">Audit Logs</span>
                        <span className="font-bold text-rose-400"><Check size={16} /></span>
                      </li>
                      <li className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">Advanced Permissions</span>
                        <span className="font-bold text-rose-400"><Check size={16} /></span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Action Area */}
          <motion.div variants={itemVariants} className="flex justify-center flex-col items-center gap-4">
            <button 
              onClick={handleSelectPlan}
              disabled={isDowngrade || (isCurrent && billingCycle === currentCycle) || isRedirecting}
              className={`px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-3 ${
                isDowngrade || (isCurrent && billingCycle === currentCycle) || isRedirecting
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' 
                  : `hover:scale-105 active:scale-95 bg-gradient-to-r ${plan.color} text-white`
              }`}
            >
              {isRedirecting ? (
                <>
                  <Activity size={18} className="animate-pulse" />
                  Redirecting...
                </>
              ) : buttonText}
            </button>
            {isRedirecting && (
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Launching Secure Payment Portal...</p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlanDetails;
