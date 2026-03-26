
import React, { useState, useEffect, useMemo } from 'react';
import { AVAILABLE_PLANS, MOCK_CLIENTS, MOCK_INVOICES } from '../constants';
import { 
  Plus, Search, Package, Clock, CreditCard, Edit3, Trash2,
  Download, LayoutGrid, List, DollarSign,
  Copy, Eye, ShoppingBag, ArrowUp, ArrowDown, X
} from 'lucide-react';
import { Service } from '../types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import * as ReactRouterDom from 'react-router-dom';
import { useServices } from '../hooks/useServices.ts';
import { useCurrency } from '../context/CurrencyContext.tsx';

const { Link, useNavigate } = ReactRouterDom as any;

const MiniChart = ({ data, color }: { data: any[], color: string }) => (
  <div className="h-10 w-24">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

import { useAgencySubscription } from '../hooks/useAgencySubscription';

const Services: React.FC = () => {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const { workspace, subscription } = useAgencySubscription();
  
  // Use the hook
  const { services, loading, deleteService, addService } = useServices();

  const [orders, setOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('agencyos_orders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [viewStats, setViewStats] = useState<Record<string, { views: number, lastViewed: string }>>(() => {
    try {
        const saved = localStorage.getItem('agencyos_service_stats');
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [currentPlan, setCurrentPlan] = useState(() => {
    return AVAILABLE_PLANS[0];
  });

  useEffect(() => {
    if (subscription) {
      setCurrentPlan(AVAILABLE_PLANS.find(p => p.id === subscription.plan_id) || AVAILABLE_PLANS[0]);
    } else if (workspace) {
      setCurrentPlan(AVAILABLE_PLANS.find(p => p.id === workspace.plan_id) || AVAILABLE_PLANS[0]);
    }
  }, [subscription, workspace]);
  
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // --- Effects ---
  useEffect(() => {
    const handleSync = () => {
      const savedOrders = localStorage.getItem('agencyos_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedStats = localStorage.getItem('agencyos_service_stats');
      if (savedStats) setViewStats(JSON.parse(savedStats));
    };
    window.addEventListener('agencyos_config_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('agencyos_config_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateService = () => {
      if (currentPlan.servicesLimit !== -1 && services.length >= currentPlan.servicesLimit) {
          showToast(`Plan Limit Reached: ${currentPlan.name} plan allows max ${currentPlan.servicesLimit} services.`, 'error');
          return;
      }
      navigate('/services/new');
  };

  // --- Actions ---
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to archive this service package?")) {
      await deleteService(id);
      showToast("Service Archived");
    }
  };

  const handleDuplicate = async (service: Service) => {
      if (currentPlan.servicesLimit !== -1 && services.length >= currentPlan.servicesLimit) {
          showToast(`Plan Limit Reached: Cannot duplicate service.`, 'error');
          return;
      }

    const newService = {
      ...service,
      id: `s-${Date.now()}`,
      name: `${service.name} (Copy)`
    };
    
    // Use hook to add
    await addService(newService);
    showToast("Service Duplicated");
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Archive ${selectedServices.size} services?`)) {
      for (const id of selectedServices) {
          await deleteService(id);
      }
      setSelectedServices(new Set());
      showToast("Bulk Action Complete");
    }
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleExportCSV = () => {
    if (services.length === 0) return;
    
    const headers = [
      "Service ID", 
      "Service Name", 
      "Type", 
      "Pricing Model", 
      "Base Price (USD)", 
      "Description"
    ];

    const rows = services.map(s => {
      return [
        s.id,
        s.name,
        s.type,
        s.pricingType,
        s.price.toFixed(2),
        (s.description || "").replace(/"/g, '""')
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/\n/g, ' ')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AgencyOS_Service_Matrix_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Full Service Matrix Exported");
  };

  // --- Derived State ---
  const filteredServices = useMemo(() => {
    const result = services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || s.type === filterType;
      return matchesSearch && matchesType;
    });

    result.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [services, searchTerm, filterType, sortConfig]);

  const stats = useMemo(() => {
    const total = services.length;
    const recurringServices = services.filter(s => s.type === 'Recurring');
    const totalMRR = recurringServices.reduce((acc, s) => acc + s.price, 0);
    const avgPrice = total > 0 ? services.reduce((acc, s) => acc + s.price, 0) / total : 0;
    
    return { 
      total, 
      recurringCount: recurringServices.length, 
      totalMRR, 
      avgPrice
    };
  }, [services]);

  // Generate dynamic-ish charts based on real stats
  const generateChartData = (baseValue: number) => {
    return Array.from({ length: 7 }, (_, i) => ({ 
      value: Math.max(10, baseValue * (0.8 + Math.random() * 0.4)) 
    }));
  };

  const charts = useMemo(() => ({
    active: generateChartData(stats.total),
    mrr: generateChartData(stats.totalMRR / 100),
    avg: generateChartData(stats.avgPrice / 10),
    clients: generateChartData(orders.length)
  }), [stats, orders]);

  const formatCurrency = (val: number) => format(val);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-40 relative min-h-screen">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-12 flex items-center gap-4 border border-white/10 backdrop-blur-md">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Service Matrix</h2>
          <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-500 font-medium">
             <Package size={16} className="text-blue-500" />
             <p>Admin Control Panel • v2.4.0</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 transition-all shadow-sm active:scale-95" 
            title="Export Everything (CSV)"
          >
             <Download size={20} />
          </button>
          <button 
            onClick={handleCreateService} 
            className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
            <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> New Offering
          </button>
        </div>
      </div>

      {/* Real-time KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Active Services', value: stats.total, sub: `${services.length} Live Now`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', chartData: charts.active, chartColor: '#2563eb' },
          { label: 'Recurring MRR', value: formatCurrency(stats.totalMRR), sub: `${stats.recurringCount} Active Subs`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10', chartData: charts.mrr, chartColor: '#9333ea' },
          { label: 'Avg. Ticket', value: formatCurrency(stats.avgPrice), sub: 'Portfolio Average', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', chartData: charts.avg, chartColor: '#10b981' },
          { label: 'Total Orders', value: orders.length, sub: 'All Time', icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', chartData: charts.clients, chartColor: '#f59e0b' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
             <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                   <stat.icon size={22} />
                </div>
                <MiniChart data={stat.chartData} color={stat.chartColor} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
             <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
             <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 mt-2 bg-slate-100 dark:bg-zinc-950 w-fit px-2 py-0.5 rounded">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl shadow-blue-500/5 flex flex-col lg:flex-row items-center gap-6 sticky top-4 z-30">
         <div className="relative flex-1 w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search services, tags, or pricing..." 
              className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex gap-2">
               <span className="px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-[9px] font-bold text-slate-400 dark:text-zinc-500">CMD+K</span>
            </div>
         </div>

         <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
            <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800">
               {['All', 'Recurring', 'One-off'].map(type => (
                 <button 
                   key={type}
                   onClick={() => setFilterType(type)}
                   className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                     filterType === type 
                     ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-md' 
                     : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'
                   }`}
                 >
                   {type}
                 </button>
               ))}
            </div>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

            <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800">
               <button onClick={() => setViewMode('List')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'List' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-md' : 'text-slate-400 dark:text-zinc-500'}`}><List size={18} /></button>
               <button onClick={() => setViewMode('Grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'Grid' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-md' : 'text-slate-400 dark:text-zinc-500'}`}><LayoutGrid size={18} /></button>
            </div>
         </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedServices.size > 0 && (
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-10 border border-white/10">
            <span className="font-bold text-sm">{selectedServices.size} selected</span>
            <div className="h-4 w-px bg-white/20" />
            <button onClick={handleBulkDelete} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-rose-400 transition-colors"><Trash2 size={16} /> Archive</button>
            <button onClick={() => setSelectedServices(new Set())} className="p-1 hover:bg-white/10 rounded-full"><X size={16} /></button>
         </div>
      )}

      {/* Main Content */}
      <div className="min-h-[500px]">
         {loading ? (
             <div className="flex items-center justify-center py-40">
                 <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
             </div>
         ) : viewMode === 'List' ? (
            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xl">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                        <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                           <th className="px-8 py-6 w-16 text-center">
                              <input type="checkbox" className="accent-blue-600 w-4 h-4 rounded cursor-pointer" onChange={(e) => setSelectedServices(e.target.checked ? new Set(filteredServices.map(s => s.id)) : new Set())} checked={selectedServices.size === filteredServices.length && filteredServices.length > 0} />
                           </th>
                           <th className="px-8 py-6 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('name')}>Service Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="inline w-3 h-3"/> : <ArrowDown className="inline w-3 h-3"/>)}</th>
                           <th className="px-8 py-6 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('pricingType')}>Model</th>
                           <th className="px-8 py-6 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleSort('price')}>Value</th>
                           <th className="px-8 py-6">Performance</th>
                           <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {filteredServices.map((service, idx) => {
                           const sViews = viewStats[service.id]?.views || 0;
                           const sOrders = orders.filter(o => o.serviceId === service.id);
                           const sSales = sOrders.length;
                           const sRevenue = sOrders.reduce((sum, o) => sum + o.amount, 0);

                           return (
                           <tr 
                              key={service.id} 
                              className={`group transition-all hover:bg-blue-50/30 dark:hover:bg-blue-900/10 ${selectedServices.has(service.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                              style={{ animationDelay: `${idx * 50}ms` }}
                           >
                              <td className="px-8 py-6 text-center">
                                 <input 
                                    type="checkbox" 
                                    className="accent-blue-600 w-4 h-4 rounded cursor-pointer" 
                                    checked={selectedServices.has(service.id)}
                                    onChange={(e) => {
                                       const newSet = new Set(selectedServices);
                                       if (e.target.checked) newSet.add(service.id);
                                       else newSet.delete(service.id);
                                       setSelectedServices(newSet);
                                    }}
                                 />
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 relative shadow-sm group-hover:scale-105 transition-transform">
                                       <img src={service.image} alt="" className="w-full h-full object-cover" />
                                       {service.type === 'Recurring' && (
                                          <div className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-zinc-900" title="Subscription" />
                                       )}
                                    </div>
                                    <div>
                                       <Link to={`/services/${service.id}`} className="font-black text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">{service.name}</Link>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-zinc-950 px-2 py-0.5 rounded uppercase tracking-wider">{service.id.substring(0, 8)}</span>
                                       </div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                                       {service.pricingType === 'Standard' ? <Package size={14} className="text-blue-500"/> : service.pricingType === 'Time based' ? <Clock size={14} className="text-purple-500"/> : <CreditCard size={14} className="text-emerald-500"/>}
                                       {service.pricingType}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{service.type}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <span className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">{formatCurrency(service.price)}</span>
                              </td>
                              <td className="px-8 py-6">
                                  <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-3">
                                           <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5" title="Total Views">
                                              <Eye size={12} className="text-blue-500" /> {sViews}
                                           </span>
                                           <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5" title="Total Sales">
                                              <ShoppingBag size={12} className="text-emerald-500" /> {sSales}
                                           </span>
                                      </div>
                                      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-1">
                                          {formatCurrency(sRevenue)} REV
                                      </p>
                                  </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={`/services/${service.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Edit3 size={16}/></Link>
                                    <button onClick={() => handleDuplicate(service)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Copy size={16}/></button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                           </tr>
                         );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {filteredServices.map((service, idx) => (
                  <div 
                     key={service.id} 
                     className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 p-6 flex flex-col shadow-sm hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-800 transition-all group relative overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                     style={{ animationDelay: `${idx * 50}ms` }}
                  >
                     <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md bg-white/80 dark:bg-black/50 ${service.type === 'Recurring' ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400'}`}>{service.type}</span>
                     </div>

                     <div className="h-48 rounded-[2rem] overflow-hidden mb-6 relative group/img cursor-pointer" onClick={() => navigate(`/services/${service.id}`)}>
                        <img src={service.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" alt="" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                           <button onClick={(e) => { e.stopPropagation(); navigate(`/services/${service.id}`); }} className="p-3 bg-zinc-900/90 text-white border border-white/10 rounded-xl hover:scale-110 transition-transform shadow-xl hover:bg-blue-600 hover:border-blue-600"><Edit3 size={18}/></button>
                           <button onClick={(e) => { e.stopPropagation(); handleDuplicate(service); }} className="p-3 bg-zinc-900/90 text-white border border-white/10 rounded-xl hover:scale-110 transition-transform shadow-xl hover:bg-blue-600 hover:border-blue-600"><Copy size={18}/></button>
                        </div>
                     </div>

                     <div className="space-y-4 flex-1">
                        <div>
                           <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1 line-clamp-1">{service.name}</h3>
                           <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 min-h-[2.5em]">{service.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-zinc-950 px-2 py-1 rounded flex items-center gap-1">
                              {service.pricingType === 'Time based' && <Clock size={10} />} 
                              {service.pricingType === 'Credit based' && <CreditCard size={10} />}
                              {service.pricingType === 'Standard' && <Package size={10} />}
                              {service.pricingType}
                           </span>
                           {service.creditsIncluded && <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-zinc-950 px-2 py-1 rounded">{service.creditsIncluded} Credits</span>}
                        </div>
                     </div>

                     <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(service.price)}</span>
                        <div className="flex gap-2">
                           <button onClick={() => handleDelete(service.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {filteredServices.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
               <div className="w-32 h-32 bg-slate-100 dark:bg-zinc-900 rounded-[3rem] flex items-center justify-center mb-8">
                  <Search size={64} className="text-slate-300 dark:text-zinc-700" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 dark:text-white">No Services Found</h3>
               <p className="text-slate-500 dark:text-zinc-500 font-medium max-w-md mx-auto mt-2">Adjust your filters or create a new offering to populate the matrix.</p>
               <button onClick={handleCreateService} className="mt-8 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform">Create Service</button>
            </div>
         )}
      </div>
    </div>
  );
};

export default Services;
