
import React, { useState } from 'react';
import { 
  Filter, Plus, Layout, ArrowDown, ChevronRight, MousePointer2, 
  CreditCard, Mail, Clock, ArrowRightCircle, Target, MoreHorizontal,
  Settings, Copy, Trash2, GitMerge, BarChart2, PieChart, Layers
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';

const { useNavigate } = ReactRouterDom as any;

const MarketingFunnels: React.FC = () => {
  const navigate = useNavigate();
  const [activeFunnel, setActiveFunnel] = useState('f1');
  const [viewMode, setViewMode] = useState<'Builder' | 'Analytics'>('Builder');

  // Simulated Funnel Nodes
  const FUNNEL_NODES = [
    { id: '1', type: 'page', label: 'Landing Page', traffic: '42.5k', conv: '12%', next: ['2', '3'] },
    { id: '2', type: 'action', label: 'Email Opt-In', traffic: '5.1k', conv: '45%', next: ['4'] },
    { id: '3', type: 'page', label: 'Offer Page (Upsell)', traffic: '850', conv: '8%', next: ['5'] },
    { id: '4', type: 'email', label: 'Nurture Sequence', traffic: '2.3k', conv: '22%', next: ['5'] },
    { id: '5', type: 'checkout', label: 'Checkout', traffic: '1.2k', conv: '65%', next: ['6'] },
    { id: '6', type: 'page', label: 'Thank You', traffic: '780', conv: '-', next: [] },
  ];

  const FUNNEL_METRICS = [
     { name: 'Impressions', value: 42500, drop: 0 },
     { name: 'Leads', value: 5100, drop: 88 },
     { name: 'Qualified', value: 2300, drop: 55 },
     { name: 'Checkout', value: 1200, drop: 48 },
     { name: 'Sales', value: 780, drop: 35 },
  ];

  return (
    <div className="h-full bg-[#000000] text-white flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <div className="h-20 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between px-8 shrink-0 z-20">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-600/10 rounded-xl text-orange-500 border border-orange-500/20">
               <Target size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tight">Conversion Architect</h1>
            <div className="h-6 w-px bg-zinc-800 mx-2" />
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
               <button onClick={() => setViewMode('Builder')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Builder' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Builder</button>
               <button onClick={() => setViewMode('Analytics')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Analytics' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Analytics</button>
            </div>
         </div>
         <div className="flex items-center gap-3">
             <div className="text-right mr-4">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Revenue</p>
                <p className="text-sm font-black text-white">$42,890.00</p>
             </div>
             <button className="px-6 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all">Publish Live</button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
         {/* Sidebar - Funnel List */}
         <div className="w-80 border-r border-zinc-800 bg-[#050505] p-4 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar">
            <button className="w-full py-3 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-bold text-xs uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-all flex items-center justify-center gap-2">
               <Plus size={14}/> New Funnel
            </button>
            <div className="space-y-2">
               {[
                  { id: 'f1', name: 'Q4 Webinar Launch', status: 'Live', conv: '4.2%' },
                  { id: 'f2', name: 'E-Book Magnet', status: 'Draft', conv: '-' },
                  { id: 'f3', name: 'High-Ticket VSL', status: 'Paused', conv: '1.8%' }
               ].map(f => (
                  <div key={f.id} onClick={() => setActiveFunnel(f.id)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeFunnel === f.id ? 'bg-zinc-900 border-zinc-700 shadow-lg' : 'bg-transparent border-transparent hover:bg-zinc-900/50'}`}>
                     <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${f.status === 'Live' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>{f.status}</span>
                        <MoreHorizontal size={14} className="text-zinc-600 hover:text-white"/>
                     </div>
                     <h4 className="font-bold text-sm text-white mb-1">{f.name}</h4>
                     <p className="text-[10px] text-zinc-500">Conv. Rate: <span className="text-white">{f.conv}</span></p>
                  </div>
               ))}
            </div>
         </div>

         {/* Main Canvas Area */}
         <div className="flex-1 bg-[#0c0c0e] relative overflow-hidden flex flex-col items-center p-10 min-w-0">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

            {viewMode === 'Builder' ? (
               <div className="flex-1 w-full max-w-5xl flex flex-col items-center gap-8 relative z-10 overflow-y-auto no-scrollbar pb-20">
                  {FUNNEL_NODES.map((node, i) => (
                     <div key={node.id} className="relative flex flex-col items-center animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                        {/* Connection Line */}
                        {i > 0 && <div className="h-8 w-0.5 bg-zinc-800" />}
                        
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] w-80 shadow-xl hover:border-orange-500/50 hover:shadow-orange-500/10 transition-all cursor-pointer group relative">
                           <div className="flex justify-between items-center mb-4">
                              <div className={`p-2 rounded-xl ${
                                 node.type === 'page' ? 'bg-blue-500/10 text-blue-500' :
                                 node.type === 'email' ? 'bg-purple-500/10 text-purple-500' :
                                 node.type === 'checkout' ? 'bg-emerald-500/10 text-emerald-500' :
                                 'bg-orange-500/10 text-orange-500'
                              }`}>
                                 {node.type === 'page' ? <Layout size={16}/> :
                                  node.type === 'email' ? <Mail size={16}/> :
                                  node.type === 'checkout' ? <CreditCard size={16}/> : <MousePointer2 size={16}/>}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400"><Settings size={14}/></button>
                                 <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400"><Trash2 size={14}/></button>
                              </div>
                           </div>
                           <h4 className="font-black text-white text-lg mb-1">{node.label}</h4>
                           <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4 pt-4 border-t border-zinc-800">
                              <span>{node.traffic} Visits</span>
                              <span className="text-emerald-500">{node.conv} Conv</span>
                           </div>

                           {/* Node Add-on Buttons */}
                           <button className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-white hover:border-white transition-all opacity-0 group-hover:opacity-100 shadow-lg z-20">
                              <GitMerge size={16} />
                           </button>
                        </div>
                     </div>
                  ))}
                  <button className="mt-4 px-6 py-3 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:border-zinc-600 transition-all">
                     + Add Step
                  </button>
               </div>
            ) : (
               <div className="w-full max-w-6xl space-y-8 relative z-10 overflow-y-auto no-scrollbar pb-20">
                  <div className="grid grid-cols-3 gap-6">
                     <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem]">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Total Value</p>
                        <h3 className="text-4xl font-black text-white">$42,890</h3>
                     </div>
                     <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem]">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Earnings Per Click</p>
                        <h3 className="text-4xl font-black text-white">$4.25</h3>
                     </div>
                     <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem]">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Conversion Rate</p>
                        <h3 className="text-4xl font-black text-emerald-500">1.84%</h3>
                     </div>
                  </div>

                  <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem]">
                     <h4 className="text-lg font-black text-white mb-8">Funnel Drop-off Analysis</h4>
                     <div className="space-y-6">
                        {FUNNEL_METRICS.map((step, i) => (
                           <div key={i} className="flex items-center gap-6">
                              <div className="w-24 text-right">
                                 <p className="text-xs font-bold text-zinc-400">{step.name}</p>
                              </div>
                              <div className="flex-1 relative h-12 bg-zinc-800/50 rounded-r-xl overflow-hidden flex items-center px-4">
                                 <div 
                                    className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 opacity-20" 
                                    style={{ width: `${(step.value / 42500) * 100}%` }}
                                 />
                                 <span className="relative z-10 font-bold text-white">{step.value.toLocaleString()}</span>
                                 {step.drop > 0 && (
                                    <span className="ml-auto text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">-{step.drop}% Drop</span>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>

    </div>
  );
};

export default MarketingFunnels;
