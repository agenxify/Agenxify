
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, 
  ComposedChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ReferenceLine, LineChart
} from 'recharts';
import { 
  TrendingUp, BarChart3, Filter, Download, Calendar, 
  DollarSign, PieChart as PieIcon, Activity, ArrowUpRight, 
  ArrowDownRight, Layers, Zap, Briefcase, FileText, ChevronDown, Clock,
  Sparkles, BrainCircuit, Target, AlertTriangle, Users, Wallet,
  CreditCard, Share2, Printer, RefreshCw, Star, Loader2
} from 'lucide-react';
import { useReports } from '../hooks/useReports.ts';
import { useCurrency } from '../context/CurrencyContext.tsx';

// --- Types ---
type TimeRange = '7d' | '30d' | '90d' | 'YTD';
type ReportTab = 'Executive' | 'Financial' | 'Operational';

interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  text: string;
}

// --- Colors ---
const COLORS = {
  primary: '#2563eb', // Blue 600
  secondary: '#8b5cf6', // Violet 500
  success: '#10b981', // Emerald 500
  warning: '#f59e0b', // Amber 500
  danger: '#f43f5e', // Rose 500
  slate: '#64748b', // Slate 500
  grid: 'rgba(148, 163, 184, 0.1)',
};

const EXPENSE_COLORS = ['#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981'];

// --- Helper Components ---

const InsightBadge: React.FC<Insight> = ({ type, text }) => (
  <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
    type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' :
    type === 'negative' ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30' :
    'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
  }`}>
    <div className={`p-2 rounded-full shrink-0 ${
      type === 'positive' ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300' :
      type === 'negative' ? 'bg-rose-100 dark:bg-rose-800 text-rose-600 dark:text-rose-300' :
      'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
    }`}>
      {type === 'positive' ? <TrendingUp size={14} /> : type === 'negative' ? <AlertTriangle size={14} /> : <BrainCircuit size={14} />}
    </div>
    <div>
      <p className={`text-xs font-bold leading-relaxed ${
        type === 'positive' ? 'text-emerald-800 dark:text-emerald-200' :
        type === 'negative' ? 'text-rose-800 dark:text-rose-200' :
        'text-blue-800 dark:text-blue-200'
      }`}>{text}</p>
    </div>
  </div>
);

const KpiCard = ({ title, value, trend, trendValue, icon: Icon, colorClass, delay, subtext }: any) => {
  const colorText = colorClass?.replace('bg-', 'text-') || 'text-blue-500';
  return (
    <div 
      className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards hover:shadow-xl transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute -right-4 -top-4 p-8 opacity-[0.03] transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 ${colorText}`}>
        <Icon size={140} fill="currentColor" />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${colorClass || 'bg-blue-600'} bg-opacity-10 dark:bg-opacity-20 text-${colorClass?.split('-')[1] || 'blue'}-600 dark:text-${colorClass?.split('-')[1] || 'blue'}-400 shadow-sm`}>
              <Icon size={20} />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trendValue}
              </div>
            )}
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        </div>
        {subtext && <p className="text-[10px] font-bold text-slate-400 mt-3">{subtext}</p>}
      </div>
    </div>
  );
};

const SectionHeading = ({ title, subtitle, action }: { title: string, subtitle: string, action?: React.ReactNode }) => (
  <div className="flex items-end justify-between mb-8">
    <div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-500 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
    {action}
  </div>
);

const Reports: React.FC = () => {
  const { format, currency } = useCurrency();
  // State
  const [activeTab, setActiveTab] = useState<ReportTab>('Executive');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [chartStyle, setChartStyle] = useState('area');

  // --- Real Backend Hook ---
  const { 
      revenueData, 
      expenseData, 
      cashFlowData, 
      teamLoadData, 
      projectHealth, 
      financials, 
      ops, 
      aiInsights, 
      loading 
  } = useReports(timeRange);

  useEffect(() => {
    const savedConfig = localStorage.getItem('agencyos_global_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.chartStyle) setChartStyle(parsed.chartStyle);
    }
  }, []);

  const handleExport = (format: 'PDF' | 'CSV') => {
    setIsExportMenuOpen(false);
    setIsExporting(true);
    
    // Simulate intensive compute
    setTimeout(() => {
      if (format === 'CSV') {
        const headers = ["Period", "Revenue", "Expenses", "Net Profit", "Forecasted Revenue"];
        const rows = revenueData.map(d => [
          d.name, 
          d.revenue.toFixed(2), 
          d.expenses.toFixed(2), 
          d.profit.toFixed(2), 
          d.projected.toFixed(2)
        ]);
        
        const csvContent = [
          headers.join(","),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `AgencyOS_${activeTab}_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'PDF') {
        window.print();
      }
      
      setIsExporting(false);
    }, 1200);
  };

  const formatCurrency = (val: number) => format(val);

  // Render Logic for Dynamic Chart
  const renderRevenueChart = () => {
     const commonProps = {
         data: revenueData,
         margin: { top: 10, right: 10, left: 0, bottom: 0 }
     };
     const commonGrid = <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />;
     const commonXAxis = <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />;
     const commonYAxis = <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickFormatter={(val) => format(val)} />;
     const commonTooltip = <Tooltip contentStyle={{backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff'}} itemStyle={{fontSize: '12px', fontWeight: 'bold'}} />;

     if (chartStyle === 'bar') {
         return (
             <BarChart {...commonProps}>
                {commonGrid}
                {commonXAxis}
                {commonYAxis}
                {commonTooltip}
                <Bar dataKey="revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="projected" fill={COLORS.slate} radius={[4, 4, 0, 0]} name="Forecast" />
             </BarChart>
         );
     } else if (chartStyle === 'line') {
         return (
             <LineChart {...commonProps}>
                {commonGrid}
                {commonXAxis}
                {commonYAxis}
                {commonTooltip}
                <Line type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={3} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="projected" stroke={COLORS.slate} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
             </LineChart>
         );
     }
     
     // Default Area
     return (
         <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            {commonGrid}
            {commonXAxis}
            {commonYAxis}
            {commonTooltip}
            <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
            <Area type="monotone" dataKey="projected" stroke={COLORS.slate} strokeWidth={2} strokeDasharray="5 5" fill="none" name="Forecast" />
         </AreaChart>
     );
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 relative">
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; background: white !important; }
          .max-w-7xl { max-width: 100% !important; padding: 40px !important; }
          .bg-white, .dark .bg-zinc-900 { background: white !important; color: black !important; }
          .dark .text-white { color: black !important; }
          .border { border-color: #eee !important; }
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
        }
      `}</style>
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Business Intelligence</h2>
          <div className="flex items-center gap-2">
             <Sparkles size={14} className="text-blue-500" />
             <p className="text-slate-500 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest">
               AI-Driven Analytics Engine • Live DB Connection
             </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            {['Executive', 'Financial', 'Operational'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as ReportTab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative z-20">
             <button 
               onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
               className={`flex items-center gap-2 px-5 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold hover:border-blue-300 dark:hover:border-blue-700 transition-all text-slate-700 dark:text-white ${isTimeMenuOpen ? 'ring-4 ring-blue-50 dark:ring-blue-900/20 border-blue-300 dark:border-blue-700' : ''}`}
             >
                <Calendar size={16} /> {timeRange.toUpperCase()} <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isTimeMenuOpen ? 'rotate-180' : ''}`} />
             </button>
             {isTimeMenuOpen && (
               <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 z-50">
                 {['7d', '30d', '90d', 'YTD'].map(r => (
                   <button 
                     key={r} 
                     onClick={() => { setTimeRange(r as TimeRange); setIsTimeMenuOpen(false); }} 
                     className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors uppercase ${
                       timeRange === r 
                       ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                       : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                     }`}
                   >
                     {r}
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="relative z-20">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"
            >
              {isExporting ? <span className="animate-spin">...</span> : <><Download size={16} /> Export</>}
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 p-1">
                <button onClick={() => handleExport('CSV')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors">
                  <FileText size={16} /> Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Section (Global) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 no-print">
        {aiInsights.map((insight, idx) => (
          <InsightBadge key={idx} type={insight.type} text={insight.text} />
        ))}
      </div>

      {/* TAB: EXECUTIVE */}
      {activeTab === 'Executive' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Revenue" value={formatCurrency(financials.totalRevenue)} trend="up" trendValue="Live" icon={DollarSign} colorClass="bg-emerald-500" delay={0} />
            <KpiCard title="Monthly Recurring" value={formatCurrency(financials.mrr)} trend="up" trendValue="Est." icon={RefreshCw} colorClass="bg-blue-600" delay={50} subtext="Based on current inv." />
            <KpiCard title="Profit Margin" value={`${financials.profitMargin}%`} trend="down" trendValue="Calc." icon={TrendingUp} colorClass="bg-purple-600" delay={100} />
            <KpiCard title="Active Projects" value={ops.activeProjects} trend="up" trendValue="Active" icon={Layers} colorClass="bg-amber-500" delay={150} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <SectionHeading title="Revenue Trajectory" subtitle="Actual vs Projected Performance" />
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   {renderRevenueChart()}
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
              <SectionHeading title="Risk Analysis" subtitle="Client Concentration" />
              <div className="flex-1 flex flex-col items-center justify-center relative">
                 <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-zinc-800 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-[12px] border-rose-500 border-t-transparent border-l-transparent rotate-45" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'}}></div>
                    <div className="text-center">
                       <span className="text-4xl font-black text-slate-900 dark:text-white">{ops.clientConcentration}%</span>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Top Client</p>
                    </div>
                 </div>
                 <div className="mt-8 text-center space-y-2">
                    <p className="text-xs font-bold text-rose-500 flex items-center justify-center gap-1"><AlertTriangle size={14} /> Dependency Risk</p>
                    <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">Revenue from your top client vs total revenue.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FINANCIAL */}
      {activeTab === 'Financial' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                 <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Net Profit</p>
                 <h3 className="text-4xl font-black text-emerald-500">{formatCurrency(financials.totalRevenue - financials.expenses)}</h3>
                 <p className="text-xs font-bold text-emerald-600 mt-4 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg w-fit">Revenue - Labor Cost</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                 <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Est. Labor Cost</p>
                 <h3 className="text-4xl font-black text-rose-500">{formatCurrency(financials.expenses)}</h3>
                 <p className="text-xs font-bold text-rose-600 mt-4 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg w-fit">Total Hours * {format(50)}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                 <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Outstanding Invoices</p>
                 <h3 className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(financials.outstanding)}</h3>
                 <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-6 overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (financials.outstanding / (financials.totalRevenue + financials.outstanding)) * 100)}%` }} />
                 </div>
                 <p className="text-[9px] text-slate-400 font-bold mt-2 text-right">Pending Collection</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                 <SectionHeading title="Cash Flow Forecast" subtitle="Cumulative Net Income" />
                 <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={cashFlowData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                          <Tooltip contentStyle={{backgroundColor: '#09090b', borderRadius: '12px', border: 'none', color: '#fff'}} />
                          <Bar dataKey="net" fill={COLORS.primary} radius={[4,4,0,0]} barSize={20} />
                          <Line type="monotone" dataKey="cumulative" stroke={COLORS.success} strokeWidth={3} dot={false} />
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                 <SectionHeading title="Cost Distribution" subtitle="Estimated Allocations" />
                 <div className="flex items-center gap-8">
                    <div className="h-64 w-64 shrink-0 relative">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie data={expenseData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                {expenseData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                                ))}
                             </Pie>
                             <Tooltip contentStyle={{backgroundColor: '#000', borderRadius: '8px', border: 'none', color: '#fff'}} />
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Wallet size={24} className="text-slate-300" />
                       </div>
                    </div>
                    <div className="flex-1 space-y-3">
                       {expenseData.map((entry, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                             <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: EXPENSE_COLORS[i]}} />
                                <span className="font-bold text-slate-600 dark:text-zinc-400">{entry.name}</span>
                             </div>
                             <span className="font-black text-slate-900 dark:text-white">{formatCurrency(entry.value)}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* TAB: OPERATIONAL */}
      {activeTab === 'Operational' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                 <SectionHeading title="Team Utilization" subtitle="Based on Time Entries" />
                 <div className="space-y-6">
                    {teamLoadData.map((member, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                             <span className="text-slate-700 dark:text-zinc-300">{member.name}</span>
                             <span className="text-slate-500">{member.load}% Load</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                             <div className="h-full bg-blue-500 rounded-full" style={{width: `${member.billable}%`}} title="Billable" />
                             <div className="h-full bg-slate-300 dark:bg-zinc-600 rounded-r-full" style={{width: `${member.load - member.billable}%`}} title="Internal" />
                          </div>
                       </div>
                    ))}
                    <div className="flex justify-center gap-6 mt-4 no-print">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" /> Billable
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                          <div className="w-3 h-3 bg-slate-300 dark:bg-zinc-600 rounded-full" /> Internal
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                 <SectionHeading title="Active Project Health" subtitle="Real-time Status" />
                 <div className="space-y-4">
                    {projectHealth.map((p, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-blue-200 transition-all">
                          <div>
                             <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Budget: {p.budget}% Used</p>
                          </div>
                          <div className="flex items-center gap-3">
                             {p.status === 'Critical' && <AlertTriangle size={16} className="text-rose-500" />}
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                p.status === 'On Track' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                p.status === 'At Risk' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                             }`}>
                                {p.status}
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 dark:bg-black p-10 rounded-[3rem] border border-slate-800 dark:border-zinc-800 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-10 opacity-10">
                 <Star size={200} className="text-white" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div>
                    <h3 className="text-2xl font-black text-white mb-2">Client Satisfaction Score</h3>
                    <p className="text-slate-400 text-sm font-medium">Based on recent ticket feedback and project approvals.</p>
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black text-white tracking-tighter">{ops.satisfaction}</span>
                    <span className="text-xl font-bold text-slate-500">/ 10</span>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
