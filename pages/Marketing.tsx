import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Target, BarChart3, Megaphone, TrendingUp, Filter, Plus, 
  Search, MoreHorizontal, ArrowUpRight, ArrowDownRight, 
  Calendar, Layers, Zap, MousePointer2, Eye, LayoutGrid, 
  List, CheckCircle2, AlertCircle, Play, Pause, Image as ImageIcon,
  DollarSign, Globe, Users, Activity, Command, Bell, Share2, 
  Download, RefreshCw, Smartphone, Monitor, Mail, MessageSquare,
  Settings, Sparkles, FileText, Send, BrainCircuit
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { useCurrency } from '../context/CurrencyContext';
import { useMarketingAnalytics } from '../hooks/useMarketingAnalytics';
import { useActivity } from '../hooks/useActivity';
import { useAuth } from '../context/AuthContext.tsx';

import { useMarketingPlan } from '../src/hooks/useMarketingPlan';
import { UpgradeModal } from '../components/UpgradeModal';
import { useCampaigns } from '../hooks/useCampaigns';

const Marketing: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { campaigns } = useCampaigns();
  const { isUpgradeModalOpen, setIsUpgradeModalOpen, featureName, checkMarketingLimit } = useMarketingPlan();
  
  // Hooks for Real Data
  const [timeRange, setTimeRange] = useState('30d');
  const { revenueData, kpis, loading, refresh } = useMarketingAnalytics(timeRange, 'All Regions');
  const { events } = useActivity();
  const { canEdit } = useAuth();
  const { format } = useCurrency();

  // Local State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Extract Specific KPIs from Backend Data
  const revKpi = useMemo(() => kpis.find(k => k.id === 'rev') || { val: 0, prefix: '$' }, [kpis]);
  const pipeKpi = useMemo(() => kpis.find(k => k.id === 'pipe') || { val: 0, prefix: '$', change: '0%' }, [kpis]);
  const clientKpi = useMemo(() => kpis.find(k => k.id === 'clients') || { val: 0, prefix: '', change: '0' }, [kpis]);

  // Map Activity Log to Alerts
  const alerts = useMemo(() => {
    return events.slice(0, 10).map(e => ({
        id: e.id,
        type: e.importance === 'high' ? 'critical' : e.importance === 'medium' ? 'success' : 'info',
        msg: `${e.user} ${e.action} ${e.target}`,
        time: e.time
    }));
  }, [events]);

  // --- High Sensitivity 3D Tilt Component ---
  const TiltCard = ({ children, className = "", onClick, style }: any) => {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      
      const dx = (x - cx) / (rect.width / 2);
      const dy = (y - cy) / (rect.height / 2);

      // Extreme sensitivity: 20deg max rotation for dramatic effect
      ref.current.style.setProperty('--rx', `${-dy * 20}deg`);
      ref.current.style.setProperty('--ry', `${dx * 20}deg`);
    };

    const handleMouseLeave = () => {
      if (!ref.current) return;
      ref.current.style.setProperty('--rx', `0deg`);
      ref.current.style.setProperty('--ry', `0deg`);
    };

    return (
      <div 
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`relative transition-transform duration-100 ease-out will-change-transform ${className}`}
        style={{ 
          transform: 'perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry))',
          transformStyle: 'preserve-3d',
          ...style 
        }}
      >
        {children}
      </div>
    );
  };

  // --- Global Mouse Tracking for Spotlights ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const MODULES = [
    { id: 'automation', label: 'Automation', path: '/marketing/automation', icon: Zap, color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
    { id: 'segmentation', label: 'Audience', path: '/marketing/segmentation', icon: Target, color: 'text-pink-400', gradient: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30' },
    { id: 'email', label: 'Campaigns', path: '/marketing/email', icon: Mail, color: 'text-blue-400', gradient: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30' },
    { id: 'analytics', label: 'Analytics', path: '/marketing/analytics', icon: BarChart3, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30' },
    { id: 'optimization', label: 'Optimization', path: '/marketing/optimization', icon: Activity, color: 'text-purple-400', gradient: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/30' },
  ];

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-[#000000] text-white font-sans overflow-hidden p-6 selection:bg-blue-500/30"
    >
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} featureName={featureName} />
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes flow-rgb {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-flow-rgb {
          background-size: 400% 400%;
          animation: flow-rgb 3s ease infinite;
        }
        .spotlight-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: inherit;
          padding: 1.5px;
          background: radial-gradient(
            800px circle at var(--mouse-x) var(--mouse-y),
            rgba(255, 255, 255, 0.15),
            transparent 40%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 10;
        }
        .bg-grid-pattern {
            background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
        }
      `}</style>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-grid-pattern z-0 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      
      <div className="w-full mx-auto space-y-8 relative z-10">
        
        {/* Top Bar: System Status */}
        <div className="flex items-center justify-between py-2 border-b border-white/5 mb-6 backdrop-blur-sm sticky top-0 z-50 bg-black/20">
           <div className="flex items-center gap-6 text-[10px] font-mono text-zinc-500 overflow-hidden">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> SYSTEM ONLINE</span>
              <span className="opacity-20">|</span>
              <span className="flex items-center gap-2 text-blue-400"><Globe size={10}/> GLOBAL CDN: 24ms</span>
              <span className="opacity-20">|</span>
              <span className="flex items-center gap-2"><Users size={10}/> ACTIVE NODES: 4,209</span>
           </div>
           <div className="flex items-center gap-4">
               <button onClick={handleRefresh} className={`text-zinc-500 hover:text-white transition-colors ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}><RefreshCw size={14}/></button>
               <button className="text-zinc-500 hover:text-white transition-colors"><Bell size={14}/></button>
           </div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-8 pb-8 border-b border-white/5 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="relative z-10 space-y-4">
              <h1 className="text-7xl font-black tracking-tighter leading-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent drop-shadow-2xl pb-2 pr-2">
                 Marketing OS
              </h1>
              <div className="flex items-center gap-3">
                 <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600/20 text-blue-400 border border-blue-500/30 backdrop-blur-md">Enterprise Node</span>
                 <p className="text-zinc-500 font-medium text-sm tracking-wide">Unified Campaign Orchestration Layer</p>
              </div>
           </div>
           
           {/* RGB Glow Search Box */}
           <div className="relative group w-full xl:w-auto">
              {/* RGB Gradient Layer */}
              <div className="absolute -inset-[3px] bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 animate-flow-rgb" />
              
              <div className="relative flex items-center gap-4 bg-[#0c0c0e] p-2 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="relative group w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                      <input 
                        type="text" 
                        placeholder="Ask AI Copilot..." 
                        className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-12 py-3 text-xs font-bold text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-zinc-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                        <span className="text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded text-zinc-500 border border-white/5">⌘K</span>
                      </div>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <button 
                      onClick={() => {
                          if (!canEdit('marketing')) {
                              alert("Access Denied: You do not have permission to create campaigns");
                              return;
                          }
                          navigate('/marketing/email');
                      }} 
                      className="group relative px-6 py-3 bg-blue-600 text-white rounded-xl overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105 active:scale-95"
                  >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
                      <div className="flex items-center gap-2 relative z-10">
                        <Plus size={16} strokeWidth={3} />
                        <span className="text-xs font-black uppercase tracking-widest">Create</span>
                      </div>
                  </button>
              </div>
           </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-8">
           
           {/* Left Sidebar: Nav & Feed */}
           <div className="col-span-12 lg:col-span-3 space-y-8 h-full flex flex-col">
              
              {/* Navigation Modules */}
              <div className="grid grid-cols-1 gap-3">
                 {MODULES.map((mod, i) => (
                    <TiltCard 
                      key={mod.id}
                      onClick={() => navigate(mod.path)}
                      className={`group cursor-pointer relative overflow-hidden rounded-[1.5rem] border ${mod.border} bg-[#0c0c0e] hover:bg-zinc-900 transition-all duration-300`}
                    >
                       <div className={`absolute inset-0 bg-gradient-to-r ${mod.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                       <div className="relative z-10 p-5 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-xl bg-black/40 ${mod.color} border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                <mod.icon size={20} />
                             </div>
                             <div>
                                <h4 className={`text-sm font-black uppercase tracking-wide text-white group-hover:tracking-widest transition-all duration-300`}>{mod.label}</h4>
                                <p className="text-[9px] text-zinc-500 font-bold">Active Module</p>
                             </div>
                          </div>
                          <ArrowUpRight size={16} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                       </div>
                    </TiltCard>
                 ))}
              </div>

              {/* Live Feed */}
              <div className="flex-1 bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]">
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                       <Activity size={14} className="text-blue-500 animate-pulse" /> Live Pulse
                    </h3>
                    <button className="text-[9px] font-bold text-zinc-600 hover:text-white transition-colors">REALTIME</button>
                 </div>
                 
                 <div className="space-y-3 relative z-10 overflow-y-auto no-scrollbar flex-1 pr-1">
                    {alerts.map((alert, i) => (
                       <div key={alert.id} className="group p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all cursor-default animate-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="flex gap-3">
                             <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0 ${alert.type === 'critical' ? 'bg-rose-500 text-rose-500' : alert.type === 'success' ? 'bg-emerald-500 text-emerald-500' : 'bg-blue-500 text-blue-500'}`} />
                             <div>
                                <p className="text-xs font-bold text-zinc-200 leading-snug group-hover:text-white transition-colors">{alert.msg}</p>
                                <p className="text-[9px] font-mono text-zinc-600 mt-1.5">{alert.time}</p>
                             </div>
                          </div>
                       </div>
                    ))}
                    {alerts.length === 0 && (
                       <div className="text-center py-10 text-zinc-700 font-bold text-[10px] uppercase tracking-widest">
                          No active alerts
                       </div>
                    )}
                 </div>
                 
                 {/* Decorative Scanline */}
                 <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[2.5rem]">
                    <div className="absolute left-0 right-0 h-[2px] bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)] animate-[scan-line_4s_linear_infinite]" />
                 </div>
              </div>
           </div>

           {/* MAIN CONTENT: Visualization & Actions */}
           <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
              
              {/* Primary Chart - Spotlight Effect - Expanded */}
              <div className="spotlight-card relative bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 shadow-2xl overflow-hidden group h-[500px] flex flex-col">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Activity size={200} />
                 </div>
                 
                 <div className="flex items-center justify-between mb-8 relative z-20">
                    <div>
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] mb-1">Gross Revenue (Real-time)</p>
                       <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-xl">
                          {format(revKpi.val)}
                       </h2>
                    </div>
                    <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                       {['7d', '30d', '90d', 'YTD'].map(r => (
                          <button 
                             key={r} 
                             onClick={() => setTimeRange(r)}
                             className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${timeRange === r ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                          >
                             {r}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex-1 w-full relative z-20 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                             <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} dy={10} minTickGap={40} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} />
                          <Tooltip 
                             contentStyle={{backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                             itemStyle={{fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em'}}
                             cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fill="url(#colorVis)" activeDot={{r: 6, strokeWidth: 0, fill: '#fff'}} animationDuration={1500} name="Total Rev" />
                          <Area type="monotone" dataKey="retainer" stroke="#10b981" strokeWidth={3} fill="url(#colorConv)" activeDot={{r: 6, strokeWidth: 0, fill: '#fff'}} animationDuration={1500} name="Recurring" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Secondary Metrics & Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Pipeline Value */}
                 <TiltCard className="bg-[#0c0c0e]/80 border border-white/5 rounded-[2.5rem] p-8 hover:border-emerald-500/30 transition-all group cursor-default shadow-xl relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform"><Target size={80}/></div>
                    <div className="relative z-10 pointer-events-none">
                       <div className="flex justify-between items-start mb-6">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform shadow-lg border border-emerald-500/20"><Target size={24}/></div>
                          <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">{pipeKpi.change}</span>
                       </div>
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pipeline Value</p>
                       <p className="text-4xl font-black text-white mt-1">{format(pipeKpi.val)}</p>
                    </div>
                 </TiltCard>

                 {/* Active Clients */}
                 <TiltCard className="bg-[#0c0c0e]/80 border border-white/5 rounded-[2.5rem] p-8 hover:border-purple-500/30 transition-all group cursor-default shadow-xl relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform"><MousePointer2 size={80}/></div>
                    <div className="relative z-10 pointer-events-none">
                       <div className="flex justify-between items-start mb-6">
                          <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 group-hover:scale-110 transition-transform shadow-lg border border-purple-500/20"><Users size={24}/></div>
                          <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">{clientKpi.change}</span>
                       </div>
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Clients</p>
                       <p className="text-4xl font-black text-white mt-1">{clientKpi.val}</p>
                    </div>
                 </TiltCard>

                 {/* Quick Actions (Moved here) */}
                 <div className="bg-[#0c0c0e]/80 border border-white/5 rounded-[2.5rem] p-6 space-y-2 flex-1 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-2">Quick Deploy</p>
                    {[
                       { label: 'New Campaign', icon: Megaphone, color: 'text-rose-400', hover: 'hover:bg-rose-500/10 hover:border-rose-500/20', path: '/marketing/email', limitKey: 'projectLimit' as any, limitName: 'New Campaigns', tableName: 'marketing_campaigns' },
                       { label: 'Broadcast Email', icon: Mail, color: 'text-blue-400', hover: 'hover:bg-blue-500/10 hover:border-blue-500/20', path: '/marketing/email', limitKey: 'marketingEmailsLimit' as any, limitName: 'Email Broadcasts', tableName: 'marketing_campaigns', sumColumn: 'sent' },
                       { label: 'Add Segment', icon: Users, color: 'text-purple-400', hover: 'hover:bg-purple-500/10 hover:border-purple-500/20', path: '/marketing/segmentation' },
                       { label: 'Generate Report', icon: FileText, color: 'text-emerald-400', hover: 'hover:bg-emerald-500/10 hover:border-emerald-500/20', path: '/reports' },
                    ].map((action, i) => (
                       <button 
                           key={i} 
                           onClick={async () => {
                               if (action.limitKey && action.tableName) {
                                  const canCreate = await checkMarketingLimit(action.tableName, action.limitKey, action.limitName || '', action.sumColumn);
                                  if (!canCreate) return;
                               }
                               navigate(action.path);
                           }}
                           className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border border-transparent ${action.hover} bg-zinc-900/50 group`}
                       >
                          <div className={`p-2 rounded-xl bg-black/50 ${action.color} border border-white/5 group-hover:scale-110 transition-transform`}>
                             <action.icon size={16} />
                          </div>
                          <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">{action.label}</span>
                          <ArrowUpRight size={12} className="ml-auto text-zinc-700 group-hover:text-white transition-colors" />
                       </button>
                    ))}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default Marketing;