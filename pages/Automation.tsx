
import React, { useEffect, useRef, useState } from 'react';
import { 
  Zap, Cpu, Workflow, Brain, Rocket, 
  ShieldCheck, Sparkles, Network, Globe, 
  Lock, ArrowRight, MessageSquare, Target,
  ChevronRight, ArrowUpRight, Check, X,
  Activity, BarChart, Settings, Play,
  Pause, Plus, Search, Filter, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Import MOCK_PROFILES to resolve the reference error in the team support section
import { MOCK_PROFILES } from '../constants';

import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

const Automation: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { hasAddon } = usePlanEnforcement();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  // Auto-unlock if user has the addon
  useEffect(() => {
    if (hasAddon('ai_automation_access')) {
      setIsUnlocked(true);
    }
  }, [hasAddon]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      containerRef.current.style.setProperty('--rx', `${-y * 15}deg`);
      containerRef.current.style.setProperty('--ry', `${x * 15}deg`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleVerifyCode = () => {
    if (accessCode.toUpperCase() === 'GETEARLYACCESSNOW') {
      setIsUnlocked(true);
      setShowCodeInput(false);
      setError('');
    } else {
      setError('Invalid access protocol. Verification failed.');
    }
  };

  if (isUnlocked) {
    return (
      <div className="w-full min-h-full bg-slate-50 dark:bg-black rounded-[3rem] p-8 md:p-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <Workflow size={24} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Automation Hub</h1>
              </div>
              <p className="text-slate-500 dark:text-zinc-500 font-medium">Design and deploy autonomous agents and workflows.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
                <Settings size={16} /> Configuration
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                <Plus size={16} /> Create Agent
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Agents', value: '12', icon: Brain, color: 'blue' },
              { label: 'Tasks Executed', value: '1,284', icon: Activity, color: 'emerald' },
              { label: 'Success Rate', value: '99.8%', icon: Check, color: 'purple' },
              { label: 'Compute Saved', value: '420h', icon: Zap, color: 'amber' },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Workflows */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity size={20} className="text-blue-500" /> Active Workflows
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'Lead Qualification Swarm', status: 'Running', type: 'Sales', load: 85 },
                    { name: 'Content Distribution Protocol', status: 'Idle', type: 'Marketing', load: 0 },
                    { name: 'Customer Support Triaging', status: 'Running', type: 'Support', load: 42 },
                    { name: 'Invoice Reconciliation', status: 'Scheduled', type: 'Finance', load: 0 },
                  ].map((wf, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-blue-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${wf.status === 'Running' ? 'bg-emerald-500/10 text-emerald-500 animate-pulse' : 'bg-slate-200 dark:bg-zinc-800 text-slate-400'}`}>
                          {wf.status === 'Running' ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{wf.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{wf.type}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${wf.status === 'Running' ? 'text-emerald-500' : 'text-slate-500'}`}>{wf.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {wf.load > 0 && (
                          <div className="hidden md:block w-32">
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1">
                              <span>Load</span>
                              <span>{wf.load}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${wf.load}%` }} />
                            </div>
                          </div>
                        )}
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: Recent Logs */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <BarChart size={20} className="text-purple-500" /> System Logs
                </h3>
                <div className="space-y-6">
                  {[
                    { time: '2m ago', msg: 'Agent-04 completed lead scoring', type: 'success' },
                    { time: '15m ago', msg: 'Workflow "Content Dist" paused', type: 'info' },
                    { time: '1h ago', msg: 'API connection reset by peer', type: 'error' },
                    { time: '3h ago', msg: 'New agent "Finance-Bot" initialized', type: 'success' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        log.type === 'success' ? 'bg-emerald-500' : 
                        log.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">{log.msg}</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">
                  View Full Audit Trail
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-black rounded-[3rem] overflow-hidden flex flex-col items-center justify-center p-6 md:p-16 lg:p-24 selection:bg-blue-600/30 relative border border-white/5 shadow-2xl">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glitch {
          0% { text-shadow: 0.05em 0 0 #ff00ff, -0.05em -0.025em 0 #00ffff, -0.025em 0.05em 0 #ff00ff; }
          14% { text-shadow: 0.05em 0 0 #ff00ff, -0.05em -0.025em 0 #00ffff, -0.025em 0.05em 0 #ff00ff; }
          15% { text-shadow: -0.05em -0.025em 0 #ff00ff, 0.025em 0.025em 0 #00ffff, -0.05em -0.05em 0 #ff00ff; }
          49% { text-shadow: -0.05em -0.025em 0 #ff00ff, 0.025em 0.025em 0 #00ffff, -0.05em -0.05em 0 #ff00ff; }
          50% { text-shadow: 0.025em 0.05em 0 #ff00ff, 0.05em 0 0 #00ffff, 0.05em -0.05em 0 #ff00ff; }
          99% { text-shadow: 0.025em 0.05em 0 #ff00ff, 0.05em 0 0 #00ffff, 0.05em -0.05em 0 #ff00ff; }
          100% { text-shadow: -0.025em 0 0 #ff00ff, -0.025em -0.025em 0 #00ffff, -0.025em -0.05em 0 #ff00ff; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .glitch-text { animation: glitch 500ms infinite; }
        .tilt-card {
          transition: transform 0.2s ease-out;
          transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
        }
      `}</style>

      <div 
        ref={containerRef}
        className="relative z-10 w-full max-w-5xl flex flex-col items-center tilt-card"
      >
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full mb-10 animate-in slide-in-from-top-4 duration-1000">
           <Zap size={14} className="text-blue-500 animate-pulse" fill="currentColor" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Project: Neural Orchestration</span>
        </div>

        {/* Hero Text */}
        <div className="text-center mb-16 space-y-6">
           <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-white drop-shadow-2xl">
              COMING <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-pulse">SOON.</span>
           </h1>
           <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-xl mx-auto leading-relaxed animate-in fade-in duration-1000 delay-300">
              The world's first autonomous agency operating core. Zero-touch workflows powered by next-gen neural models.
           </p>
        </div>

        {/* Feature Roadmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-in slide-in-from-bottom-8 duration-1000 delay-500">
           {[
             { title: 'Neural Swarms', icon: Brain, desc: 'Multi-agent AI teams working in sync across your mission queue.', color: 'text-purple-400' },
             { title: 'Auto-Fiscal Settlement', icon: Cpu, desc: 'Automated invoice generation and payment verification on delivery.', color: 'text-blue-400' },
             { title: 'Protocol Synthesis', icon: Network, desc: 'Turn complex documents into living, executable agency workflows.', color: 'text-emerald-400' },
           ].map((feature, i) => (
             <div key={i} className="bg-[#0c0c0e] border border-white/5 p-8 rounded-[3rem] shadow-2xl group hover:border-blue-500/50 transition-all duration-500 flex flex-col h-full">
                <div className={`p-4 bg-zinc-900 rounded-2xl w-fit mb-6 shadow-xl border border-white/5 transition-transform group-hover:scale-110 group-hover:rotate-6 ${feature.color}`}>
                   <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">{feature.desc}</p>
             </div>
           ))}
        </div>

        {/* Full Details Section */}
        <div className="mt-20 w-full grid grid-cols-1 md:grid-cols-2 gap-10 text-left animate-in fade-in duration-1000 delay-600">
            <div className="space-y-6">
                <h4 className="text-sm font-black text-blue-500 uppercase tracking-[0.4em]">Development Roadmap</h4>
                <ul className="space-y-4">
                    {[
                        'AI-Native Project Scoping Engine',
                        'Real-time Multi-tenant Global Sync',
                        'Decentralized Asset Proofing Protocol',
                        'Smart-Contract Billing Enforcement'
                    ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-4 text-zinc-400">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 shadow-[0_0_8px_rgba(37,99,235,1)]" />
                            <span className="text-sm font-bold">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-6">
                <h4 className="text-sm font-black text-purple-500 uppercase tracking-[0.4em]">Team Support Protocol</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                    We are scaling our engineering swarms to ensure a high-integrity release. Support our efforts by joining the whitelist or providing tactical feedback via the help center.
                </p>
                <div className="flex gap-4">
                   <div className="flex -space-x-3">
                      {MOCK_PROFILES.slice(0, 4).map((p, i) => (
                         <img key={i} src={p.avatar} className="w-8 h-8 rounded-full border-2 border-black" alt="" />
                      ))}
                   </div>
                   <span className="text-[10px] font-black uppercase text-zinc-600 self-center">Synced with 42 core developers</span>
                </div>
            </div>
        </div>

        {/* Support CTA */}
        <div className="mt-20 p-1 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-[3rem] animate-in fade-in duration-1000 delay-700 w-full">
          <div className="bg-[#09090b] px-10 py-10 rounded-[2.9rem] flex flex-col md:flex-row items-center gap-10">
             <div className="flex-1 space-y-2 text-center md:text-left">
                <h4 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 justify-center md:justify-start">
                  Support Our Team <Rocket size={24} className="text-blue-500" />
                </h4>
                <p className="text-sm text-zinc-400 font-medium">Early access grants for premium workspace owners. Help us fast-track the release.</p>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/billing/addons')}
                  className="px-8 py-4 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                  Buy AI Optimization Access
                </button>
                <button 
                  onClick={() => setShowCodeInput(true)}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  GET EARLY ACCESS <ArrowRight size={14} />
                </button>
             </div>
          </div>
        </div>

        {/* Code Entry Modal Overlay */}
        {showCodeInput && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0c0c0e] border border-white/10 p-10 rounded-[3rem] max-w-md w-full shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
              <button 
                onClick={() => setShowCodeInput(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Verification Required</h3>
                <p className="text-sm text-zinc-500 font-medium">Enter your tactical access protocol to unlock the orchestration core.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value);
                      setError('');
                    }}
                    placeholder="PROTOCOL CODE"
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-center font-black text-white tracking-[0.3em] uppercase focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">{error}</p>}
                
                <button 
                  onClick={handleVerifyCode}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all"
                >
                  Verify Protocol
                </button>
              </div>

              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest text-center">
                Encrypted Session • Node: {Math.random().toString(36).substring(7).toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {/* Global Security Badge */}
        <div className="mt-16 flex items-center gap-8 opacity-20 no-print">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
              <ShieldCheck size={14} /> Encrypted Dev
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
              <Globe size={14} /> Global Node Sync
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
              <ShieldCheck size={14} /> Vault Guarded
           </div>
        </div>
      </div>
    </div>
  );
};

export default Automation;
