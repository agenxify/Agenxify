
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Zap, ArrowRight, CheckCircle2, Split, FlaskConical, Target, Plus, Beaker,
  TrendingUp, AlertTriangle, Play, Pause, RotateCcw, Settings, Eye,
  BarChart3, Users, MousePointer2, Smartphone, Monitor, Globe, Filter,
  Calendar, Layers, Download, Share2, Calculator, ShieldCheck, ChevronRight,
  ChevronDown, X, Save, Sparkles, BrainCircuit, RefreshCw, Search, Clock,
  Microscope, MoveRight, Rocket, Activity, Check, Edit3, Trash2, PieChart
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line, Scatter, ScatterChart, ZAxis, ReferenceLine, LineChart, Pie, PieChart as RePieChart, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { AVAILABLE_PLANS } from '../constants';
import { useMarketingOptimization, Experiment } from '../hooks/useMarketingOptimization';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

// --- Custom Components ---

const PremiumSlider = ({ value, onChange, min = 0, max = 100, step = 1, label, unit = '%' }: any) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-4 select-none">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
        <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{value}{unit}</span>
      </div>
      <div className="relative h-6 flex items-center group cursor-pointer">
         <div className="absolute w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-zinc-700 w-full" />
         </div>
         <div 
            className="absolute h-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
            style={{ width: `${percentage}%` }}
         />
         <input 
           type="range" min={min} max={max} step={step} value={value}
           onChange={(e) => onChange(parseFloat(e.target.value))}
           className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
         />
         <div 
           className="absolute w-4 h-4 bg-white rounded-full border-2 border-purple-600 shadow-xl pointer-events-none group-hover:scale-125 transition-transform ease-out"
           style={{ left: `calc(${percentage}% - 8px)` }}
         />
      </div>
    </div>
  );
};

const PremiumDropdown = ({ options, value, onChange, label, icon: Icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2" ref={ref}>
       {label && <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>}
       <div className="relative">
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-5 py-4 bg-zinc-900 border ${isOpen ? 'border-purple-500 ring-1 ring-purple-500/20' : 'border-zinc-800'} rounded-2xl text-sm font-bold text-white transition-all hover:bg-zinc-800`}
          >
             <div className="flex items-center gap-3">
                {Icon && <Icon size={16} className="text-zinc-400" />}
                <span>{value || 'Select option'}</span>
             </div>
             <ChevronDown size={16} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((opt: string) => (
                   <button
                      key={opt}
                      type="button"
                      onClick={() => { onChange(opt); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${value === opt ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                   >
                      {opt}
                      {value === opt && <Check size={14} />}
                   </button>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};

// --- Data Generators for new experiments ---
const generateProbData = (offsetA = 20, offsetB = 28) => Array.from({ length: 50 }, (_, i) => {
  const x = i;
  const yA = Math.exp(-Math.pow(x - offsetA, 2) / 50); 
  const yB = Math.exp(-Math.pow(x - offsetB, 2) / 40); 
  return { x, Control: yA, Variant: yB };
});

const generateLiftData = (base = 2, growth = 0.1) => Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  control: base + Math.random() * 0.5,
  variant: base + (i * growth) + Math.random() * 0.5,
}));

import { useAgencySubscription } from '../hooks/useAgencySubscription';

const MarketingOptimization: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use the Hook
  const { checkLimit } = usePlanEnforcement();
  const { experiments, loading, createExperiment, updateExperiment: hookUpdateExperiment, deleteExperiment } = useMarketingOptimization();
  const { workspace, addons: purchasedAddons, deductCredits } = useAgencySubscription();
  // State
  const [activeTab, setActiveTab] = useState<'Overview' | 'Editor' | 'Analysis' | 'Settings'>('Overview');
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isBanditSettingsOpen, setIsBanditSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // New Experiment Form State
  const [newExpName, setNewExpName] = useState('');
  const [newExpType, setNewExpType] = useState('A/B Test');
  const [newExpPage, setNewExpPage] = useState('Homepage');
  const [newExpMetric, setNewExpMetric] = useState('Conversion Rate');
  
  // Algorithm State
  const [explorationRate, setExplorationRate] = useState(20);
  const [updateFrequency, setUpdateFrequency] = useState('Real-time');
  const [autoStop, setAutoStop] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState('95% (Recommended)');
  const [trafficAllocation, setTrafficAllocation] = useState(50);

  const [aiInsight, setAiInsight] = useState("Campaign \"Winter Awareness\" is underperforming on mobile. Shifting 15% budget to social video could yield 12% lift.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Set selected experiment when list loads
  useEffect(() => {
      if (experiments.length > 0 && !selectedExperimentId) {
          setSelectedExperimentId(experiments[0].id);
      }
  }, [experiments, selectedExperimentId]);

  const selectedExperiment = useMemo(() => 
    experiments.find(e => e.id === selectedExperimentId) || experiments[0] || ({} as Experiment), 
  [experiments, selectedExperimentId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const calculateCredits = () => {
    const planId = workspace?.plan_id || 'free';
    const plan = AVAILABLE_PLANS.find(p => p.id === planId) || AVAILABLE_PLANS[0];
    const aiAddonCredits = purchasedAddons?.includes('ai_pro') ? 50000 : 0;
    const baseCredits = planId === 'free' ? 100 : plan.baseCredits;
    return baseCredits + (workspace?.credits_balance || 0) + aiAddonCredits;
  };

  const deductCreditsFn = async () => {
    await deductCredits(3);
  };

  const generateInsight = async () => {
    if (isAnalyzing) return;
    
    const balance = calculateCredits();
    if (balance < 3) {
        showToast("Insufficient Credits. Please top up.");
        return;
    }

    setIsAnalyzing(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = "Generate a single, short, high-impact marketing optimization insight (max 20 words) for a digital agency dashboard. Focus on ROI, CTR, or Churn. Be specific with numbers.";
        
        await deductCreditsFn();

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        if (response.text) {
            setAiInsight(response.text.trim());
        }
    } catch (e) {
        console.error("AI Error", e);
        showToast("AI Uplink Failed");
    } finally {
        setIsAnalyzing(false);
    }
  };

  // Mouse movement for spotlight effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleLaunchExperiment = async () => {
    if (!newExpName.trim()) {
        showToast("Experiment name is required");
        return;
    }

    if (!checkLimit('experimentsLimit', experiments.length)) {
        showToast("Plan Limit Reached: Upgrade to create more experiments");
        return;
    }

    const newId = `exp-${Date.now()}`;
    const newExp: Partial<Experiment> = {
        id: newId,
        name: newExpName || 'Untitled Experiment',
        type: newExpType,
        status: 'Running',
        targetPage: newExpPage,
        primaryMetric: newExpMetric,
        traffic_allocation: trafficAllocation,
        start: new Date().toISOString(),
        variants: ['Control', 'Variant B'],
        probData: generateProbData(25, 25), // Start equal
        liftData: generateLiftData(1, 0),
        kpis: { confidence: '10%', sample: '100', conversion: '0%', duration: '0d', lift: '0%' }
    };
    
    await createExperiment(newExp);
    setSelectedExperimentId(newId);
    setIsLaunchModalOpen(false);
    
    // Reset Form
    setNewExpName('');
    setTrafficAllocation(50);
    showToast("Experiment Initialized");
  };

  const handleExport = () => {
      setIsExporting(true);
      setTimeout(() => {
          if (!selectedExperiment) return;
          const headers = ['Variant', 'Visitors', 'Conversions', 'Rate'];
          const rows = (selectedExperiment.variantData || []).map((v) => {
            const rate = v.visitors > 0 ? ((v.conversions / v.visitors) * 100).toFixed(2) + '%' : '0%';
            return [v.name, v.visitors, v.conversions, rate];
          });
          
          const csvContent = "data:text/csv;charset=utf-8," 
              + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `experiment_${selectedExperiment.id}_export.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setIsExporting(false);
      }, 1000);
  };

  const updateSelectedExperiment = async (updates: Partial<Experiment>) => {
      if (selectedExperimentId) {
          await hookUpdateExperiment(selectedExperimentId, updates);
          showToast("Configuration Updated");
      }
  };
  
  const handleDeleteExperiment = async () => {
      if (selectedExperimentId && confirm("Terminate this experiment? Data will be archived.")) {
          await deleteExperiment(selectedExperimentId);
          setSelectedExperimentId(null);
          showToast("Experiment Terminated");
      }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-[#000000] text-white font-sans overflow-hidden p-6 selection:bg-purple-500/30"
    >
        {/* CSS for Spotlight & Animations */}
        <style>{`
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
      `}</style>
      
      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900 border border-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="max-w-[1800px] mx-auto space-y-8 relative z-10">
         
         {/* Header */}
         <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-8 border-b border-white/5 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="relative group">
                      <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                      <div className="relative flex items-center gap-2 px-3 py-1.5 bg-purple-950/30 border border-purple-500/20 rounded-full backdrop-blur-md">
                         <BrainCircuit size={14} className="text-purple-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Neural Inference Engine</span>
                      </div>
                   </div>
                   <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">v4.2.0</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                   Growth Science
                </h1>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
               <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                   {['Overview', 'Editor', 'Analysis', 'Settings'].map(tab => (
                      <button 
                         key={tab}
                         onClick={() => setActiveTab(tab as any)}
                         className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                            activeTab === tab 
                            ? 'bg-zinc-800 text-white shadow-lg' 
                            : 'text-zinc-500 hover:text-white'
                         }`}
                      >
                         {tab}
                      </button>
                   ))}
               </div>
               <div className="h-8 w-px bg-white/10" />
               <button 
                  onClick={() => setIsLaunchModalOpen(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2"
               >
                  <Plus size={16} strokeWidth={3} /> New Experiment
               </button>
            </div>
         </div>

         <div className="grid grid-cols-12 gap-8">
            
            {/* Sidebar List */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
                <div className="bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 flex flex-col h-[calc(100vh-280px)] spotlight-card">
                   <div className="flex items-center justify-between mb-6 px-2 relative z-20">
                      <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                         <Microscope size={14} className="text-purple-500"/> Active Tests
                      </h3>
                      <div className="flex gap-2">
                         <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"><Filter size={14}/></button>
                         <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"><Search size={14}/></button>
                      </div>
                   </div>
                   
                   <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-20">
                      {experiments.map((exp, i) => (
                         <div 
                            key={exp.id}
                            onClick={() => setSelectedExperimentId(exp.id)}
                            className={`p-5 rounded-[1.5rem] border cursor-pointer transition-all group relative overflow-hidden ${
                               selectedExperimentId === exp.id 
                               ? 'bg-zinc-800/80 border-purple-500/50 shadow-lg' 
                               : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                            }`}
                            style={{ animationDelay: `${i * 100}ms` }}
                         >
                            <div className="flex justify-between items-start mb-3">
                               <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                  exp.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  exp.status === 'Learning' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  'bg-zinc-800 text-zinc-500 border-zinc-700'
                               }`}>
                                  {exp.status}
                               </span>
                               <span className="text-[10px] font-bold text-zinc-600">{exp.type}</span>
                            </div>
                            <h4 className={`text-sm font-bold mb-3 transition-colors ${selectedExperimentId === exp.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                               {exp.name}
                            </h4>
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                               <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                                  <Users size={12} /> {exp.traffic || '0'}
                               </div>
                               <div className={`text-xs font-black ${String(exp.uplift).startsWith('+') ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                  {exp.uplift}
                               </div>
                            </div>
                         </div>
                      ))}
                      {experiments.length === 0 && (
                          <div className="p-8 text-center text-zinc-600 italic text-xs">
                              No experiments found. Create one to start.
                          </div>
                      )}
                   </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="col-span-12 lg:col-span-9 space-y-8">
                
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'Overview' && selectedExperiment && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                      {/* KPI Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                         {[
                            { label: 'Confidence', value: selectedExperiment.kpis?.confidence || '0%', sub: 'Statistically Significant', icon: Target, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10' },
                            { label: 'Sample Size', value: selectedExperiment.kpis?.sample || '0', sub: 'Total Visitors', icon: Users, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
                            { label: 'Conversion', value: selectedExperiment.kpis?.conversion || '0%', sub: `${selectedExperiment.kpis?.lift || '0%'} Lift`, icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
                            { label: 'Duration', value: selectedExperiment.kpis?.duration || '0d', sub: 'Time Elapsed', icon: Clock, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' }
                         ].map((stat, i) => (
                            <div key={i} className={`spotlight-card bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden group`}>
                               <div className="relative z-20">
                                  <div className="flex gap-3 mb-4">
                                     <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} ${stat.border} border`}>
                                        <stat.icon size={18} />
                                     </div>
                                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1.5">{stat.label}</p>
                                  </div>
                                  <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                                  <p className={`text-[10px] font-bold mt-2 ${stat.color}`}>{stat.sub}</p>
                               </div>
                            </div>
                         ))}
                      </div>

                      {/* Charts Area */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         
                         {/* Bayesian Probability */}
                         <div className="spotlight-card bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 min-h-[420px] relative overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-8 relative z-20">
                               <div>
                                  <h3 className="text-lg font-black text-white flex items-center gap-2"><BrainCircuit size={18} className="text-purple-500"/> Bayesian Probability</h3>
                                  <p className="text-xs text-zinc-500 font-bold mt-1">Likelihood of winning</p>
                               </div>
                               <div className="flex gap-4 text-[10px] font-bold">
                                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-600"/> Control</span>
                                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"/> Variant B</span>
                               </div>
                            </div>
                            <div className="flex-1 w-full relative z-20">
                               <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={selectedExperiment.probData || []}>
                                     <defs>
                                        <linearGradient id="colorVar" x1="0" y1="0" x2="0" y2="1">
                                           <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                           <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                     </defs>
                                     <Area type="monotone" dataKey="Control" stroke="#52525b" fill="transparent" strokeWidth={2} />
                                     <Area type="monotone" dataKey="Variant" stroke="#8b5cf6" fill="url(#colorVar)" strokeWidth={3} />
                                  </AreaChart>
                               </ResponsiveContainer>
                            </div>
                            <div className="mt-6 p-4 bg-purple-900/10 border border-purple-500/20 rounded-2xl flex items-start gap-4 relative z-20">
                               <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Sparkles size={16} /></div>
                               <div>
                                  <p className="text-sm font-bold text-purple-200">Probability Insight</p>
                                  <p className="text-[11px] text-purple-300/60 mt-1 leading-relaxed">
                                     Variant B has a <span className="text-purple-400 font-black">{selectedExperiment.kpis?.confidence}</span> probability of outperforming Control based on current data.
                                  </p>
                               </div>
                            </div>
                         </div>

                         {/* Lift Velocity */}
                         <div className="spotlight-card bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 min-h-[420px] relative overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-8 relative z-20">
                               <div>
                                  <h3 className="text-lg font-black text-white flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Conversion Velocity</h3>
                                  <p className="text-xs text-zinc-500 font-bold mt-1">Performance trend over time</p>
                               </div>
                            </div>
                            <div className="flex-1 w-full relative z-20">
                               <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={selectedExperiment.liftData || []}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} dy={10} minTickGap={30} />
                                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                                     <Tooltip 
                                        contentStyle={{background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff'}}
                                        itemStyle={{fontSize: '11px', fontWeight: '800'}}
                                     />
                                     <Line type="monotone" dataKey="control" stroke="#52525b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                                     <Line type="monotone" dataKey="variant" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981', strokeWidth: 0}} activeDot={{r: 6, strokeWidth: 0}} />
                                  </LineChart>
                               </ResponsiveContainer>
                            </div>
                         </div>
                      </div>

                      {/* Traffic Allocation (Multi-Armed Bandit) */}
                      <div className="p-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-[2.5rem] flex items-center justify-between relative overflow-hidden">
                         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                         
                         <div className="space-y-2 max-w-lg relative z-10">
                            <h4 className="text-xl font-black text-white flex items-center gap-3">
                               <Zap size={24} className="text-blue-400" /> Multi-Armed Bandit
                            </h4>
                            <p className="text-sm text-blue-200/60 leading-relaxed font-medium">
                               Automated traffic routing active. The Neural Engine is directing traffic to maximize conversion capture.
                            </p>
                         </div>
                         
                         <div className="flex gap-8 items-center relative z-10">
                            <div className="text-right">
                               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Current Split</p>
                               <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-zinc-500">{100 - (selectedExperiment.traffic_allocation || 50)}%</span>
                                  <div className="w-48 h-3 bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
                                     <div className="bg-zinc-600 h-full" style={{ width: `${100 - (selectedExperiment.traffic_allocation || 50)}%` }} />
                                     <div className="bg-blue-500 h-full relative overflow-hidden" style={{ width: `${selectedExperiment.traffic_allocation || 50}%` }}>
                                        <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                                     </div>
                                  </div>
                                  <span className="text-xs font-bold text-blue-400">{selectedExperiment.traffic_allocation || 50}%</span>
                               </div>
                            </div>
                            <button onClick={() => setIsBanditSettingsOpen(true)} className="p-4 bg-zinc-900 border border-white/10 rounded-2xl text-white hover:bg-white hover:text-black transition-all shadow-lg">
                               <Settings size={20} />
                            </button>
                         </div>
                      </div>

                      {/* Variant Table */}
                      <div className="bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                         <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-lg font-black text-white">Variant Performance</h3>
                            <button 
                                onClick={handleExport}
                                className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                               {isExporting ? <RefreshCw className="animate-spin" size={14}/> : <Download size={14}/>} {isExporting ? 'Exporting...' : 'Export Data'}
                            </button>
                         </div>
                         <table className="w-full text-left">
                            <thead className="bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                               <tr>
                                  <th className="px-10 py-6">Variant Name</th>
                                  <th className="px-10 py-6">Visitors</th>
                                  <th className="px-10 py-6">Conversions</th>
                                  <th className="px-10 py-6">Rate</th>
                                  <th className="px-10 py-6 text-right">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-bold text-zinc-300">
                               {(selectedExperiment.variantData || []).map((v, i) => (
                                   <tr key={v.id} className={`group hover:bg-white/5 transition-colors`}>
                                      <td className="px-10 py-6 flex items-center gap-4">
                                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${i === 0 ? 'bg-zinc-800 text-zinc-400' : 'bg-purple-600 text-white'}`}>{String.fromCharCode(65+i)}</div>
                                         {v.name}
                                      </td>
                                      <td className="px-10 py-6">{v.visitors.toLocaleString()}</td>
                                      <td className="px-10 py-6">{v.conversions.toLocaleString()}</td>
                                      <td className={`px-10 py-6 font-black text-lg ${v.visitors > 0 && (v.conversions/v.visitors) > 0.05 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                          {v.visitors > 0 ? ((v.conversions/v.visitors)*100).toFixed(2) : 0}%
                                      </td>
                                      <td className="px-10 py-6 text-right">
                                          <span className={`px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider ${i === 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                              {i === 1 ? 'Challenger' : 'Control'}
                                          </span>
                                      </td>
                                   </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                  </div>
                )}

                {/* --- EDITOR TAB --- */}
                {activeTab === 'Editor' && selectedExperiment && (
                  <div className="bg-[#0c0c0e]/80 border border-white/5 rounded-[2.5rem] p-10 animate-in fade-in slide-in-from-bottom-4">
                      <h3 className="text-2xl font-black text-white mb-8">Experiment Configuration</h3>
                      
                      <div className="space-y-8">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hypothesis Name</label>
                              <input 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] px-8 py-5 text-sm font-bold text-white outline-none focus:border-purple-600 transition-all placeholder:text-zinc-700" 
                                value={selectedExperiment.name}
                                onChange={(e) => updateSelectedExperiment({ name: e.target.value })}
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                             <div className="space-y-3">
                                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Status</label>
                                 <PremiumDropdown 
                                    value={selectedExperiment.status}
                                    options={['Running', 'Paused', 'Draft', 'Completed']}
                                    onChange={(v: any) => updateSelectedExperiment({ status: v })}
                                 />
                             </div>
                             <div className="space-y-3">
                                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Type</label>
                                 <PremiumDropdown 
                                    value={selectedExperiment.type}
                                    options={['A/B Test', 'Multivariate', 'Feature Flag']}
                                    onChange={(v: any) => updateSelectedExperiment({ type: v })}
                                 />
                             </div>
                          </div>

                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Variants</label>
                                  {/* Adding variants is complex with DB model, simplifying to read-only list for now or advanced modal later */}
                              </div>
                              <div className="space-y-3">
                                  {(selectedExperiment.variantData || []).map((v, i) => (
                                      <div key={v.id} className="flex gap-4 items-center">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${i===0 ? 'bg-zinc-800 text-zinc-400' : 'bg-purple-600 text-white'}`}>{String.fromCharCode(65+i)}</div>
                                          <input 
                                              value={v.name}
                                              disabled
                                              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none cursor-not-allowed opacity-70"
                                          />
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hypothesis Description</label>
                              <textarea 
                                className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 text-white text-sm font-medium outline-none focus:border-purple-600 resize-none placeholder:text-zinc-700"
                                value={selectedExperiment.hypothesis || ''}
                                onChange={(e) => updateSelectedExperiment({ hypothesis: e.target.value })}
                                placeholder="If we change [X], then [Y] will happen because..."
                              />
                          </div>
                      </div>
                  </div>
                )}

                {/* --- ANALYSIS TAB --- */}
                {activeTab === 'Analysis' && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-[#0c0c0e]/80 border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-6">
                          <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2">
                             <PieChart size={48} />
                          </div>
                          <h3 className="text-2xl font-black text-white">Segment Breakdown</h3>
                          <p className="text-zinc-500 max-w-md">Detailed cohort analysis is generating. This view will show performance across device types, traffic sources, and user segments.</p>
                          <div className="h-64 w-full max-w-2xl bg-zinc-900/50 rounded-3xl border border-white/5 flex items-center justify-center">
                             <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest animate-pulse">Processing Dataset...</span>
                          </div>
                      </div>
                   </div>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'Settings' && (
                   <div className="bg-[#0c0c0e]/80 border border-white/5 rounded-[2.5rem] p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <h3 className="text-2xl font-black text-white">Configuration</h3>
                      
                      <div className="space-y-6">
                          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex items-center justify-between">
                             <div>
                                <h4 className="text-sm font-bold text-white">Auto-Stop</h4>
                                <p className="text-[10px] text-zinc-500 mt-1">Automatically pause experiment if conversion drops below baseline by 20%.</p>
                             </div>
                             <div 
                                onClick={() => setAutoStop(!autoStop)}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${autoStop ? 'bg-purple-600 shadow-md' : 'bg-zinc-800'}`}
                             >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${autoStop ? 'left-7' : 'left-1'}`}/>
                             </div>
                          </div>

                          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex items-center justify-between">
                             <div>
                                <h4 className="text-sm font-bold text-white">Confidence Threshold</h4>
                                <p className="text-[10px] text-zinc-500 mt-1">Minimum statistical significance required to declare a winner.</p>
                             </div>
                             <select 
                                value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(e.target.value)}
                                className="bg-black border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-purple-500"
                             >
                                <option>90%</option>
                                <option>95% (Recommended)</option>
                                <option>99%</option>
                             </select>
                          </div>

                          <div className="p-6 bg-rose-900/10 border border-rose-900/30 rounded-3xl flex items-center justify-between">
                             <div>
                                <h4 className="text-sm font-bold text-rose-500">Danger Zone</h4>
                                <p className="text-[10px] text-rose-500/60 mt-1">Irreversible actions for this experiment.</p>
                             </div>
                             <button 
                                onClick={handleDeleteExperiment}
                                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                             >
                                Delete Experiment
                             </button>
                          </div>
                      </div>
                   </div>
                )}

            </div>
         </div>
      </div>
      
      {/* Launch Experiment Modal */}
      {isLaunchModalOpen && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg"><FlaskConical size={24}/></div>
                     <h2 className="text-3xl font-black text-white tracking-tight">New Experiment</h2>
                  </div>
                  <button onClick={() => setIsLaunchModalOpen(false)} className="p-4 hover:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-colors"><X size={24}/></button>
               </div>
               
               <div className="space-y-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hypothesis Name</label>
                     <input 
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] px-8 py-5 text-sm font-bold text-white outline-none focus:border-purple-600 transition-all placeholder:text-zinc-700" 
                       placeholder="e.g. Test New Hero Header"
                       value={newExpName}
                       onChange={e => setNewExpName(e.target.value)}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                     <PremiumDropdown 
                        label="Target Page"
                        value={newExpPage}
                        options={['Homepage', 'Pricing', 'Checkout', 'Landing Page A']}
                        onChange={setNewExpPage}
                        icon={Globe}
                     />
                     <PremiumDropdown 
                        label="Primary Metric"
                        value={newExpMetric}
                        options={['Conversion Rate', 'Revenue Per Visitor', 'Click Through Rate', 'Time on Page']}
                        onChange={setNewExpMetric}
                        icon={Activity}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <PremiumDropdown 
                        label="Experiment Type"
                        value={newExpType}
                        options={['A/B Test', 'Multivariate', 'Feature Flag']}
                        onChange={setNewExpType}
                        icon={Split}
                     />
                  </div>

                  <div className="pt-2">
                     <PremiumSlider 
                        label="Traffic Allocation"
                        value={trafficAllocation}
                        min={0}
                        max={100}
                        onChange={setTrafficAllocation}
                        unit="%"
                     />
                     <p className="text-[10px] text-zinc-500 font-medium mt-3 ml-1">Percentage of total visitors included in this experiment.</p>
                  </div>

                  <div className="flex gap-4 pt-6">
                     <button onClick={() => setIsLaunchModalOpen(false)} className="flex-1 py-5 bg-zinc-900 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:text-white hover:bg-zinc-800 transition-colors">Save Draft</button>
                     <button onClick={handleLaunchExperiment} className="flex-1 py-5 bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-purple-50 shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2">
                        <Rocket size={16} /> Launch Now
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Bandit Settings Modal */}
      {isBanditSettingsOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-white">Algorithm Tuning</h3>
                    <button onClick={() => setIsBanditSettingsOpen(false)}><X size={20} className="text-zinc-500 hover:text-white" /></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Exploration Rate (Epsilon)</label>
                        <PremiumSlider value={explorationRate} min={5} max={50} onChange={setExplorationRate} unit="%" label="" />
                        <p className="text-[10px] text-zinc-500">Percentage of traffic sent to random variations to discover new winners.</p>
                    </div>
                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Update Frequency</label>
                         <PremiumDropdown value={updateFrequency} options={['Real-time', 'Hourly', 'Daily']} onChange={setUpdateFrequency} />
                    </div>
                </div>
                <button onClick={() => setIsBanditSettingsOpen(false)} className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500">Update Model</button>
             </div>
          </div>
      )}

    </div>
  );
};

export default MarketingOptimization;
