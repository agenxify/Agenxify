
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line
} from 'recharts';
import { 
  Briefcase, Users, DollarSign, CheckCircle, ArrowUpRight, Plus, 
  Clock, MoreHorizontal, Settings, Timer, Zap, History, ShieldCheck,
  BrainCircuit, Globe, Activity, Lock, Heart, Info, TrendingUp, 
  AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Sparkles, Wifi,
  CheckSquare, Square, Trash2, X, BarChart3, HardDrive, Wallet,
  CreditCard
} from 'lucide-react';
import { MOCK_PROFILES, AVAILABLE_PLANS } from '../constants';
import * as ReactRouterDom from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext.tsx';
import { formatRelativeTime } from '../utils/date';

// --- Backend Hooks ---
import { useAuth } from '../context/AuthContext.tsx';
import { useRequests } from '../hooks/useRequests';
import { useInvoices } from '../hooks/useInvoices';
import { useActivity } from '../hooks/useActivity';
import { useClients } from '../hooks/useClients';
import { useTimesheets } from '../hooks/useTimesheets';
import { useStorage } from '../hooks/useStorage';
import { useTasks } from '../hooks/useTasks'; 

// --- Components ---

const { Link, useNavigate } = ReactRouterDom as any;

const getProfileId = (name: string) => {
  const p = MOCK_PROFILES.find(p => p.name === name);
  return p ? p.id : 'current';
};

const StatCard = ({ title, value, sub, icon: Icon, colorClass, to }: any) => {
  const Content = (
    <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800/60 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden h-full cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${colorClass || 'bg-blue-600'}`}>
          <Icon size={22} className="text-white" />
        </div>
        <button className="p-2 text-slate-300 dark:text-zinc-800 hover:text-slate-600 dark:hover:text-zinc-500 transition-colors">
          <Settings size={14}/>
        </button>
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1">{title}</p>
        <div className="flex items-baseline space-x-2">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        </div>
        {sub && <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-tighter mt-1">{sub}</p>}
      </div>
    </div>
  );

  return to ? <Link to={to} className="block h-full">{Content}</Link> : Content;
};

// Moved outside to prevent re-mounting and re-animating on every dashboard tick
const RenderChart = React.memo(({ config, data }: { config: any, data: any[] }) => {
  const ChartComponent = config.chartStyle === 'bar' ? BarChart : config.chartStyle === 'line' ? LineChart : AreaChart;
  const DataComponent = config.chartStyle === 'bar' ? Bar : config.chartStyle === 'line' ? Line : Area;
  
  return (
    <ResponsiveContainer width="100%" height="100%" id="req-overview-container">
      <ChartComponent data={data}>
        <defs>
          <linearGradient id="reqGrad" x1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary-600)" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="var(--primary-600)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10, fontWeight: 700}} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10, fontWeight: 700}} />
        <Tooltip 
          contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff'}}
          itemStyle={{color: 'var(--primary-600)'}}
        />
        <DataComponent 
          type="monotone" 
          dataKey="requests" 
          stroke="var(--primary-600)" 
          strokeWidth={3} 
          fill={config.chartStyle === 'area' ? "url(#reqGrad)" : "var(--primary-600)"} 
          dot={{fill: 'var(--primary-600)', r: 4}} 
          activeDot={{r: 6}} 
          radius={config.chartStyle === 'bar' ? [4, 4, 0, 0] as any : undefined}
          isAnimationActive={true}
          animationDuration={1500}
        />
      </ChartComponent>
    </ResponsiveContainer>
  );
});

import { useAgencySubscription } from '../hooks/useAgencySubscription';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { format } = useCurrency();

  // --- Backend Data Hooks ---
  const { requests } = useRequests();
  const { invoices } = useInvoices();
  const { events: activityLogs } = useActivity();
  const { clients } = useClients();
  const { entries: timesheets } = useTimesheets();
  const { storageUsage } = useStorage(null);
  const { tasks, addTask: addTaskToDb, updateTask, deleteTask: deleteTaskFromDb } = useTasks(); 
  const { workspace, subscription, addons: purchasedAddons } = useAgencySubscription();
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('agencyos_global_config');
    return saved ? JSON.parse(saved) : { 
      agencyName: 'AgencyOS Global',
      showRevenue: true, 
      showTasks: true, 
      showActivity: true, 
      showInvoices: true, 
      chartStyle: 'area',
      currency: 'USD',
      fiscalYearStart: '01'
    };
  });

  // --- Real-time State ---
  const [liveRevenue, setLiveRevenue] = useState(0);
  const [liveLoad, setLiveLoad] = useState(78);
  const [liveActiveUsers, setLiveActiveUsers] = useState(3);
  
  // --- Credits State ---
  const [credits, setCredits] = useState({ total: 1000, used: 0, balance: 1000 });
  
  // --- Storage State ---
  const [storageStats, setStorageStats] = useState({ used: 0, total: 100 });

  const [newTaskInput, setNewTaskInput] = useState("");

  // --- Live Clock & User State ---
  const [currentTime, setCurrentTime] = useState(new Date());

  // Derive userName directly from Auth Context
  const userName = user?.name ? user.name.split(' ')[0] : 'User';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
      const h = currentTime.getHours();
      if (h < 12) return 'Good Morning';
      if (h < 18) return 'Good Afternoon';
      return 'Good Evening';
  };

  // --- Calculations ---

  // 1. Chart Data from Requests
  const chartData = useMemo(() => {
    // Group requests by date (last 14 days)
    const days = 14;
    const data: Record<string, number> = {};
    const now = new Date();
    
    // Init empty days
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        data[key] = 0;
    }

    if (requests && Array.isArray(requests)) {
        requests.forEach(r => {
            const d = new Date(r.updatedAt || r.dueDate); // Use updatedAt as creation/activity proxy if available
            const key = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            if (data[key] !== undefined) {
                data[key]++;
            }
        });
    }

    return Object.entries(data).map(([day, count]) => ({ day, requests: count }));
  }, [requests]);

  // 2. Total Burn from Timesheets
  const totalBurn = useMemo(() => {
     if (!timesheets) return '0h 0m';
     const mins = timesheets.reduce((acc, e) => {
        if (!e.duration) return acc;
        const m = e.duration.match(/(\d+)h\s*(\d+)m/);
        return m ? acc + parseInt(m[1]) * 60 + parseInt(m[2]) : acc;
     }, 0);
     return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }, [timesheets]);

  // 3. Credits Calculation
  useEffect(() => {
    try {
      const planId = subscription?.plan_id || workspace?.plan_id || 'free';
      const plan = AVAILABLE_PLANS.find(p => p.id === planId) || AVAILABLE_PLANS[0];
      
      const aiAddonCredits = purchasedAddons?.includes('ai_pro') ? 50000 : 0;
      const baseCredits = planId === 'free' ? 100 : plan.baseCredits;
      
      const totalCredits = baseCredits + aiAddonCredits;
      const availableBalance = workspace?.credits_balance || 0;
      
      const total = Math.max(totalCredits, availableBalance);
      const used = Math.max(0, total - availableBalance);
      
      setCredits({ total, used, balance: availableBalance });
    } catch (e) {
      console.error("Credit calc error", e);
    }
  }, [workspace, subscription, purchasedAddons]);

  // 4. Storage Calculation (Using Hook)
  useEffect(() => {
    try {
        // Use real storage usage from hook
        const usedGB = storageUsage / 1024 / 1024;

        // Calculate Total Limit
        const planId = subscription?.plan_id || workspace?.plan_id || 'free';
        const plan = AVAILABLE_PLANS.find(p => p.id === planId) || AVAILABLE_PLANS[0];
        let totalLimit = plan.storageLimitGB;

        if (purchasedAddons?.includes('storage_1tb')) {
            totalLimit += 1024;
        }

        setStorageStats({ used: usedGB, total: totalLimit });
    } catch (e) {
        console.error("Storage calc error", e);
    }
  }, [storageUsage, workspace, subscription, purchasedAddons]);

  // 5. Config Sync
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('agencyos_global_config');
      if (saved) setConfig(JSON.parse(saved));
    };
    
    window.addEventListener('storage', handleSync);
    window.addEventListener('agencyos_config_updated', handleSync);
    
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('agencyos_config_updated', handleSync);
    };
  }, []);

  // 6. Live Revenue Calculation from Real Invoices
  useEffect(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const actualMtd = invoices
        .filter((inv) => {
            const d = new Date(inv.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && inv.status === 'Paid';
        })
        .reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
    
    setLiveRevenue(actualMtd);

    // Simulation Intervals for "Aliveness"
    const loadInterval = setInterval(() => {
        setLiveLoad(prev => {
            const noise = Math.random() > 0.5 ? 1 : -1;
            const next = prev + noise;
            return Math.max(60, Math.min(95, next));
        });
    }, 2000);
    
    const usersInterval = setInterval(() => {
        setLiveActiveUsers(Math.floor(Math.random() * 5) + 2);
    }, 10000);

    return () => {
        clearInterval(loadInterval);
        clearInterval(usersInterval);
    };
  }, [invoices]);

  const currentFiscalQuarter = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const startMonth = parseInt(config.fiscalYearStart || '01');
    const adjustedMonth = (currentMonth - startMonth + 12) % 12;
    const quarter = Math.floor(adjustedMonth / 3) + 1;
    return `FY Q${quarter}`;
  }, [config.fiscalYearStart]);

  const activeClientsCount = clients.filter(c => c.status === 'Active').length;

  // Task Handlers (Connected to Backend)
  const handleAddTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskInput.trim()) return;
      
      addTaskToDb({
          id: '', // Generated by hook/DB
          title: newTaskInput,
          status: 'To Do',
          priority: 'Medium',
          type: 'Operational',
          project: 'Dashboard Quick Add',
          assignee: 'Me',
          dueDate: new Date().toISOString().split('T')[0],
          estimatedTime: '30m',
          spentTime: '0m'
      });
      setNewTaskInput("");
  };

  const toggleTask = (id: string, currentStatus: string) => {
      updateTask(id, { status: currentStatus === 'Done' ? 'To Do' : 'Done' });
  };

  const handleDeleteTask = (id: string) => {
      deleteTaskFromDb(id);
  };
  
  // Filter only relevant tasks for the dashboard widget
  const widgetTasks = useMemo(() => {
      // Prioritize non-done tasks, take top 5
      return tasks.sort((a, b) => {
          if (a.status === 'Done' && b.status !== 'Done') return 1;
          if (a.status !== 'Done' && b.status === 'Done') return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }).slice(0, 5);
  }, [tasks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20 relative">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{userName}</span>
          </h2>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700">
                <p className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 tabular-nums">
                   {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
             </div>
             <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
             </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/timesheets" className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2">
            <Timer size={16} /> Timesheets
          </Link>
          <Link to="/requests" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-blue-900/30 transition-all flex items-center gap-2">
            <Plus size={16} /> New Request
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Requests" 
          value={requests.length}
          sub={`${requests.filter(r => r.status === 'Pending').length} pending`}
          icon={Briefcase} 
          to="/requests"
          colorClass="bg-rose-600 shadow-rose-500/20" 
        />
        <StatCard 
          title="Active Clients" 
          value={activeClientsCount}
          sub="Verified Partners" 
          icon={Users} 
          to="/clients"
          colorClass="bg-purple-600 shadow-purple-500/20" 
        />
        {config.showRevenue && (
          <StatCard 
            title="Monthly Revenue" 
            value={format(liveRevenue)}
            sub="Real-time Ledger" 
            icon={DollarSign} 
            to="/reports"
            colorClass="bg-emerald-600 shadow-emerald-500/20" 
          />
        )}
        <StatCard 
          title="Total Production" 
          value={totalBurn}
          sub="Logged this month" 
          icon={Activity} 
          to="/timesheets"
          colorClass="bg-cyan-500 shadow-cyan-500/20" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm ${!config.showTasks && !config.showActivity ? 'lg:col-span-3' : ''}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Requests Overview</h3>
            <div className="flex bg-slate-100 dark:bg-black p-1 rounded-xl border dark:border-zinc-800">
              <span className="px-4 py-1.5 text-[10px] font-black uppercase bg-white dark:bg-zinc-800 dark:text-white shadow-sm rounded-lg">{config.chartStyle} View</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <RenderChart config={config} data={chartData} />
          </div>
        </div>

        <div className="space-y-8 flex flex-col">
          {config.showTasks && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Requests</h3>
                <Link to="/requests" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center">View all <ArrowUpRight size={12} className="ml-1"/></Link>
              </div>
              <div className="space-y-5 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {requests.slice(0, 2).map((req) => (
                  <div key={req.id} className="flex items-center justify-between group">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{req.title}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-medium">{req.updatedAt || req.dueDate}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                      req.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
                {requests.length === 0 && <p className="text-xs text-zinc-500 italic">No active missions.</p>}
              </div>
            </div>
          )}

          {config.showActivity && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">System Audit</h3>
                <Link to="/activity" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center">Live Log <History size={12} className="ml-1"/></Link>
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {activityLogs.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 group">
                    <Link to={`/profile/${getProfileId(event.user)}`} className="w-8 h-8 rounded-lg border-2 border-white dark:border-zinc-800 overflow-hidden shrink-0 shadow-sm hover:ring-2 hover:ring-blue-100 transition-all">
                      <img src={event.userAvatar || `https://i.pravatar.cc/150?u=${event.user}`} className="w-full h-full object-cover" alt="" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 leading-tight truncate">
                        {event.user} <span className="text-slate-400 font-medium">{event.action}</span> <span className="text-blue-600 dark:text-blue-400">{event.target}</span>
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase">{formatRelativeTime(event.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {activityLogs.length === 0 && <p className="text-xs text-zinc-500 italic">No activity logged.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-8 ${config.showInvoices && config.showRevenue ? 'lg:grid-cols-2' : ''}`}>
        {config.showInvoices && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Fiscal Summary</h3>
              <button onClick={() => navigate('/billing')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center">Manage Billing <ArrowUpRight size={12} className="ml-1"/></button>
            </div>
            <div className="space-y-4">
              {invoices.slice(0, 4).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">{inv.id}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-medium">{inv.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{format(inv.amount)}</p>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{inv.status}</span>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-xs text-zinc-500 italic text-center py-4">No invoices on record.</p>}
            </div>
          </div>
        )}

        {config.showRevenue && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Revenue Trends</h3>
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1 rounded-lg">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span className="text-[9px] font-black text-emerald-600 uppercase">Verified {currentFiscalQuarter} Data</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cumulative Earnings</p>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{format(liveRevenue)}</h4>
                </div>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                  <ArrowUpRight size={14} className="mr-1"/> +12.4% Cycle Growth
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[72%] rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]"></div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50 dark:border-zinc-800">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Target</p>
                  <p className="text-xs font-black text-slate-700 dark:text-zinc-300">{format(45000)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Forecast</p>
                  <p className="text-xs font-black text-slate-700 dark:text-zinc-300">{format(38200)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Net Gap</p>
                  <p className="text-xs font-black text-rose-500">-{format(6800)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- STRATEGIC TILES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* 1. Net Revenue (MTD) - Live */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm relative group overflow-hidden">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                 <DollarSign size={24} />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg text-[10px] font-black">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </div>
           </div>
           <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500">
                 <p className="text-[10px] font-black uppercase tracking-widest">Net Revenue (MTD)</p>
                 <div className="group/tooltip relative">
                    <Info size={12} className="cursor-help" />
                 </div>
              </div>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{format(liveRevenue)}</h3>
           </div>
           <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-emerald-600 rotate-12 group-hover:scale-110 transition-transform duration-700">
              <DollarSign size={160} />
           </div>
        </div>

        {/* 2. Active Clients - Live Indicators */}
        <Link to="/clients" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm relative group overflow-hidden hover:border-blue-500/50 transition-all">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                 <Users size={24} />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-[9px] font-black uppercase text-blue-500">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> {liveActiveUsers} Online
              </div>
           </div>
           <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Active Clients</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{activeClientsCount}</h3>
           </div>
           <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-blue-600 rotate-12 group-hover:scale-110 transition-transform duration-700">
              <Users size={160} />
           </div>
        </Link>

        {/* 3. My Tasks */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm relative group overflow-hidden flex flex-col justify-between xl:row-span-2">
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                   <CheckSquare size={24} />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">
                        {widgetTasks.length > 0 ? Math.round((widgetTasks.filter(t => t.status === 'Done').length / widgetTasks.length) * 100) : 0}% Done
                    </span>
                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                          style={{ width: `${widgetTasks.length > 0 ? (widgetTasks.filter(t => t.status === 'Done').length / widgetTasks.length) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-6 relative z-10 flex-1 overflow-y-auto no-scrollbar max-h-[140px] xl:max-h-full">
                {widgetTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 group/task">
                        <button 
                            onClick={() => toggleTask(task.id, task.status)}
                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${task.status === 'Done' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-zinc-700 hover:border-indigo-400'}`}
                        >
                            {task.status === 'Done' && <CheckCircle2 size={12} strokeWidth={4} />}
                        </button>
                        <span className={`text-xs font-bold transition-all flex-1 truncate ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-zinc-200'}`}>
                            {task.title}
                        </span>
                        <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover/task:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAddTask} className="relative z-10 mt-auto">
                <div className="relative group/input">
                    <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 hover:text-indigo-600 transition-colors p-1">
                        <Plus size={16} />
                    </button>
                    <input 
                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-all"
                        placeholder="Add new task..."
                        value={newTaskInput}
                        onChange={(e) => setNewTaskInput(e.target.value)}
                    />
                </div>
            </form>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-indigo-600 rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <CheckSquare size={160} />
           </div>
        </div>

        {/* 4. Team Utilization */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm relative group overflow-hidden">
           <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                 <Activity size={24} />
              </div>
              <span className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">Optimal</span>
           </div>
           <div className="relative z-10">
              <div className="flex justify-between items-end mb-2">
                 <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Team Load</p>
                 <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{liveLoad}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-3">
                 <div 
                    className="h-full bg-indigo-600 rounded-full relative overflow-hidden transition-all duration-1000 ease-in-out" 
                    style={{ width: `${liveLoad}%` }}
                 >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                 </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500">Capacity for <span className="text-indigo-500">~2 new enterprise</span> projects.</p>
           </div>
        </div>

        {/* 5. AI Credits */}
        <Link to="/billing/topup" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm relative group overflow-hidden flex items-center justify-between cursor-pointer hover:border-fuchsia-500/30 transition-all">
           <div className="space-y-2 relative z-10">
              <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                 <BrainCircuit size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Neural Credits</p>
              <div className="flex items-baseline gap-1">
                 <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{credits.used.toLocaleString()} / {credits.total.toLocaleString()}</h3>
                 <span className="text-xs font-bold text-slate-400 dark:text-zinc-600">USED ({credits.balance.toLocaleString()} REMAINING)</span>
              </div>
           </div>
           <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                 <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-zinc-800" />
                 <circle 
                    cx="50" cy="50" r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={251} 
                    strokeDashoffset={251 * (credits.balance / (credits.total || 1))}
                    className="text-fuchsia-500 transition-all duration-1000 ease-out" 
                    strokeLinecap="round" 
                 />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Zap size={20} className="text-fuchsia-500 group-hover:animate-pulse" fill="currentColor" />
              </div>
           </div>
        </Link>
      </div>

      <style>{`
        @keyframes shimmer { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(100%); } 
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
