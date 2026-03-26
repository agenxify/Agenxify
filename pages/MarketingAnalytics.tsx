
import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, PieChart as PieChartIcon, TrendingUp, ArrowUpRight, 
  ArrowDownRight, Calendar, Download, Activity, Globe, Map as MapIcon, Target,
  Filter, Share2, Layers, DollarSign, Users, MousePointer2, RefreshCw,
  Search, Zap, AlertTriangle, FileText, Table as TableIcon, X, Briefcase,
  Sparkles, Radar, Check, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ComposedChart
} from 'recharts';
import { useMarketingAnalytics } from '../hooks/useMarketingAnalytics';
import { useCurrency } from '../context/CurrencyContext';

const MarketingAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [isExporting, setIsExporting] = useState(false);
  const [viewCohortTable, setViewCohortTable] = useState(false);
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Mouse position for spotlight effects
  const containerRef = useRef<HTMLDivElement>(null);
  
  // --- Data Hook ---
  const { 
      revenueData, 
      serviceMixData, 
      cohortData, 
      geoData, 
      kpis, 
      loading 
  } = useMarketingAnalytics(timeRange, selectedRegion);
  const { format } = useCurrency();

  // Ref to hold current region for the interval
  const regionRef = useRef(selectedRegion);

  useEffect(() => {
    regionRef.current = selectedRegion;
  }, [selectedRegion]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleExport = () => {
     setIsExporting(true);
     setTimeout(() => {
        const headers = ["Period", "Retainer Revenue", "Project Revenue", "Upsell Revenue", "Total"];
        const rows = revenueData.map(row => [
            row.name,
            row.retainer,
            row.project,
            row.upsell,
            row.total
        ]);
        
        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Agency_Performance_${timeRange}_${selectedRegion.replace(' ', '_')}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExporting(false);
     }, 1500);
  };

  // Helper for dynamic icons
  const getIcon = (name: string) => {
      switch(name) {
          case 'DollarSign': return DollarSign;
          case 'Target': return Target;
          case 'Users': return Users;
          case 'Briefcase': return Briefcase;
          default: return Activity;
      }
  }

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-[#000000] text-white font-sans overflow-hidden p-6 selection:bg-blue-500/30"
    >
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes float-slow {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
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
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-grid-pattern z-0 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />

      <div className="max-w-[1800px] mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-8 pb-8 border-b border-white/5 animate-in fade-in slide-in-from-top-4 duration-700 relative z-50">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative flex items-center gap-2 px-3 py-1.5 bg-emerald-950/30 border border-emerald-500/20 rounded-full backdrop-blur-md">
                       <span className="relative flex h-2 w-2">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                       </span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Telemetry</span>
                    </div>
                 </div>
                 <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">v2.4.0</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-tight pb-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                 Agency Performance
              </h1>
           </div>
           
           <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
              <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                 {['7d', '30d', '90d', 'YTD'].map(range => (
                    <button 
                       key={range}
                       onClick={() => setTimeRange(range)}
                       className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group ${
                          timeRange === range 
                          ? 'text-white shadow-lg' 
                          : 'text-zinc-500 hover:text-zinc-300'
                       }`}
                    >
                       {timeRange === range && (
                          <div className="absolute inset-0 bg-zinc-800 rounded-lg -z-10 animate-in zoom-in-95 duration-200" />
                       )}
                       {range}
                    </button>
                 ))}
              </div>
              <div className="h-8 w-px bg-white/10" />
              
              <div className="relative" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)} 
                  className={`p-3 border rounded-xl transition-all hover:scale-105 active:scale-95 ${isFilterOpen ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-800/50 text-zinc-400 border-white/5 hover:text-white'}`}
                >
                  <Filter size={18}/>
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95">
                     <div className="p-2 space-y-1">
                        {['All Regions', 'North America', 'Europe', 'APAC'].map(region => (
                           <button 
                              key={region}
                              onClick={() => { setSelectedRegion(region); setIsFilterOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${selectedRegion === region ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                           >
                              {region}
                              {selectedRegion === region && <Check size={12} />}
                           </button>
                        ))}
                     </div>
                  </div>
                )}
              </div>

              <button 
                  onClick={handleExport} 
                  disabled={isExporting} 
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                 {isExporting ? <RefreshCw size={16} className="animate-spin"/> : <Download size={16} />} 
                 <span>Export</span>
              </button>
           </div>
        </div>

        {/* KPI Ticker Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {kpis.map((stat, i) => {
             const Icon = getIcon(stat.icon);
             return (
             <div 
               key={i} 
               className={`spotlight-card bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500`}
               style={{ animationDelay: `${i * 100}ms` }}
             >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-110`} />
                
                <div className="relative z-20 flex flex-col justify-between h-full">
                   <div className="flex justify-between items-start mb-6">
                      <div className={`p-3.5 rounded-2xl border transition-all duration-300 group-hover:scale-110 shadow-lg ${stat.bg} ${stat.border}`}>
                         <Icon size={22} className={stat.color} />
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border backdrop-blur-md ${stat.change.includes('+') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                         {stat.change}
                      </span>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                      <h3 className="text-4xl font-black text-white tabular-nums tracking-tight drop-shadow-md">{format(stat.val)}</h3>
                   </div>
                </div>
             </div>
             )
           })}
        </div>

        {/* Main Chart Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Revenue Chart */}
           <div className="lg:col-span-2 spotlight-card bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-8 relative z-20">
                 <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                       Revenue Composition <Activity size={16} className="text-blue-500" />
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Multi-stream financial breakdown</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"/> Retainers</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"/> Projects</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"/> Upsells</div>
                 </div>
              </div>
              <div className="flex-1 w-full min-h-[350px] relative z-20">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorRetainer" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProject" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorUpsell" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} dy={10} minTickGap={30} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} tickFormatter={(val) => `$${val/1000}k`} width={40} />
                       <Tooltip 
                          contentStyle={{background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                          itemStyle={{fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em'}}
                          cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                       />
                       <Area type="monotone" dataKey="retainer" stackId="1" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRetainer)" animationDuration={1500} />
                       <Area type="monotone" dataKey="project" stackId="1" stroke="#a855f7" strokeWidth={3} fill="url(#colorProject)" animationDuration={1500} />
                       <Area type="monotone" dataKey="upsell" stackId="1" stroke="#10b981" strokeWidth={3} fill="url(#colorUpsell)" animationDuration={1500} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Service Mix Pie */}
           <div className="spotlight-card bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4 relative z-20">
                 <div>
                    <h3 className="text-xl font-black text-white">Service Mix</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Revenue Distribution</p>
                 </div>
                 <div className="p-2 bg-zinc-900 rounded-lg border border-white/5"><Briefcase size={16} className="text-zinc-400"/></div>
              </div>

              <div className="flex-1 relative min-h-[300px] z-20">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                          data={serviceMixData} 
                          innerRadius={85} 
                          outerRadius={115} 
                          paddingAngle={6} 
                          dataKey="value"
                          stroke="none"
                          cornerRadius={8}
                       >
                          {serviceMixData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" className="hover:opacity-80 transition-opacity cursor-pointer" />
                          ))}
                       </Pie>
                       <Tooltip contentStyle={{background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: 'bold'}} />
                    </PieChart>
                 </ResponsiveContainer>
                 
                 {/* Center Content with Animation */}
                 <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <div className="absolute w-36 h-36 border-2 border-dashed border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
                    <span className="text-4xl font-black text-white tracking-tight drop-shadow-lg">{serviceMixData[0]?.value ? ((serviceMixData[0].value / serviceMixData.reduce((a,b) => a+b.value, 0)) * 100).toFixed(0) : 0}%</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900/80 px-2 py-0.5 rounded border border-white/5 backdrop-blur-sm mt-1">{serviceMixData[0]?.name || 'N/A'}</span>
                 </div>
              </div>

              <div className="space-y-2 mt-4 relative z-20">
                 {serviceMixData.slice(0,3).map((ch, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default group">
                       <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: ch.color, color: ch.color }} />
                          <span className="text-zinc-400 font-bold group-hover:text-blue-500 transition-colors">{ch.name}</span>
                       </div>
                       <span className="text-white font-mono font-bold group-hover:text-blue-500 transition-colors">${ch.value.toLocaleString()}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Cohort & Geo Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* Cohort Retention Table */}
           <div className="spotlight-card bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 overflow-hidden relative group">
              <div className="flex items-center justify-between mb-8 relative z-20">
                 <div>
                    <h3 className="text-xl font-black text-white">Client Retention</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Lifecycle Analysis</p>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setViewCohortTable(!viewCohortTable)}
                      className="px-4 py-2 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-zinc-800 flex items-center gap-2"
                    >
                      {viewCohortTable ? <BarChart3 size={14}/> : <TableIcon size={14}/>} 
                      {viewCohortTable ? 'Chart View' : 'Table View'}
                    </button>
                 </div>
              </div>

              <div className="h-72 w-full relative z-20">
                 {viewCohortTable ? (
                   <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                      <table className="w-full text-left border-collapse">
                         <thead className="sticky top-0 bg-[#0c0c0e] z-10">
                            <tr>
                               <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Period</th>
                               <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-right">Retention</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                            {cohortData.map((d, i) => (
                               <tr key={i} className="hover:bg-white/5 transition-colors group">
                                  <td className="px-4 py-3 text-xs font-bold text-zinc-300 group-hover:text-white">{d.name}</td>
                                  <td className="px-4 py-3 text-xs font-black text-right text-blue-500">{d.retention.toFixed(1)}%</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                 ) : (
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cohortData} barSize={20}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} dy={10} />
                         <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)', radius: 8}} 
                            contentStyle={{background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'}} 
                         />
                         <Bar dataKey="retention" name="Retention" radius={[6, 6, 6, 6]}>
                            {cohortData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.retention > 90 ? '#3b82f6' : entry.retention > 75 ? '#60a5fa' : '#93c5fd'} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                 )}
              </div>
              <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-6 relative z-20">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Avg Lifecycle</p>
                 <span className="text-xl font-black text-white">14.2 <span className="text-sm text-zinc-600 font-bold">Months</span></span>
              </div>
           </div>

           {/* Geo Map Simulation */}
           <div className="spotlight-card bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-0 relative overflow-hidden group flex flex-col">
              <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center opacity-20 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-30 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-80" />

              <div className="p-8 relative z-20 flex justify-between items-start">
                 <div>
                    <h3 className="text-xl font-black text-white">Global Reach</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Client Distribution</p>
                 </div>
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.3)]">{selectedRegion === 'All Regions' ? 'Global' : selectedRegion}</span>
                 </div>
              </div>

              <div className="flex-1 relative z-20 flex items-center justify-center min-h-[250px]">
                 {/* Map Hotspots Simulation */}
                 <div className="absolute top-1/3 left-1/4">
                    <div className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white/20"></span>
                    </div>
                 </div>

                 <div className="absolute bottom-1/3 right-1/3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75" style={{ animationDelay: '0.5s' }}></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600 border-2 border-white/20"></span>
                    </div>
                 </div>

                 <div className="absolute top-1/4 right-1/4">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" style={{ animationDelay: '1s' }}></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 border-2 border-white/20"></span>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-white/5 relative z-20 bg-[#0c0c0e]/50 backdrop-blur-sm">
                 <div className="grid grid-cols-3 gap-4">
                    {geoData.map((geo, i) => (
                       <div key={i} className="text-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">{geo.name}</p>
                          <p className="text-xl font-black text-white">{geo.value}%</p>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default MarketingAnalytics;
