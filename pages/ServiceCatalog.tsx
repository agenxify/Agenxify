
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Plus, Package, Clock, CreditCard, ArrowRight, CheckCircle2, 
    Star, Filter, X, Zap, ShieldCheck, Tag, MoreHorizontal, 
    Eye, Copy, Share2, BarChart3, Edit3, Globe, ExternalLink, QrCode,
    TrendingUp, Users, Activity, ShoppingCart, Smartphone, Calendar, LayoutTemplate
} from 'lucide-react';
import { Service } from '../types';
import * as ReactRouterDom from 'react-router-dom';
import { useServices } from '../hooks/useServices.ts';
import { useCurrency } from '../context/CurrencyContext.tsx';

const { Link, useNavigate } = ReactRouterDom as any;

// --- Stats Helper ---
const getServiceStats = () => {
  try {
    return JSON.parse(localStorage.getItem('agencyos_service_stats') || '{}');
  } catch (e) {
    return {};
  }
};

const incrementServiceView = (id: string) => {
  const stats = getServiceStats();
  const current = stats[id] || { views: 0 };
  const updated = {
    ...stats,
    [id]: { ...current, views: current.views + 1, lastViewed: new Date().toISOString() }
  };
  localStorage.setItem('agencyos_service_stats', JSON.stringify(updated));
  return updated[id];
};

// --- Sub-Components ---

const ServiceDetailModal = ({ service, onClose, onEdit, onCopyLink }: { service: Service, onClose: () => void, onEdit: () => void, onCopyLink: (e: any) => void }) => {
  // Real Data State
  const [stats, setStats] = useState<{ views: number, lastViewed: string }>({ views: 0, lastViewed: new Date().toISOString() });
  
  useEffect(() => {
    // Increment view count on mount
    const newStats = incrementServiceView(service.id);
    setStats(newStats);
  }, [service.id]);

  const activeViewers = 1; // Realistic: Just the current user
  const demandLevel = stats.views > 50 ? 'High' : stats.views > 20 ? 'Medium' : 'Normal';
  const demandColor = stats.views > 50 ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : stats.views > 20 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

  return (
    <div className="fixed inset-0 z-[10005] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-6xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-zinc-800 relative">
            
            {/* Left: Visuals & Telemetry */}
            <div className="w-full md:w-5/12 h-64 md:h-auto relative group bg-black overflow-hidden">
                <img 
                    src={service.image} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-[2s]" 
                    alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                {/* Mobile Close Button */}
                <button onClick={onClose} className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-black transition-all md:hidden z-20"><X size={20}/></button>

                {/* Floating Stats Card */}
                <div className="absolute bottom-8 left-8 right-8 z-10">
                    <div className="bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl transform transition-transform group-hover:-translate-y-2">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Real-time Analytics</span>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${demandColor}`}>
                                {demandLevel} Interest
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-3xl font-black text-white tracking-tight tabular-nums">{stats.views.toLocaleString()}</p>
                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Total Views</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white tracking-tight tabular-nums">{activeViewers}</p>
                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Active Now</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-3 text-xs text-zinc-300">
                                <Calendar size={12} className="text-blue-400" />
                                <span className="font-medium flex-1 truncate">Last Viewed</span>
                                <span className="text-[10px] text-zinc-500">{new Date(stats.lastViewed).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-300">
                                <Globe size={12} className="text-blue-400" />
                                <span className="font-medium flex-1 truncate">Traffic Source</span>
                                <span className="text-[10px] text-zinc-500">Internal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Right: Details & Actions */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-zinc-900">
                <div className="absolute top-0 right-0 p-8 hidden md:block z-20">
                    <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 md:p-14">
                    <div className="space-y-8">
                        {/* Header Info */}
                        <div>
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${service.type === 'Recurring' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'}`}>
                                    {service.type}
                                </span>
                                <span className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-zinc-700">
                                    {service.pricingType}
                                </span>
                            </div>
                            
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight">{service.name}</h2>
                            
                            <div className="flex items-center gap-6 text-sm font-bold text-slate-500 dark:text-zinc-400">
                                <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded"><ShieldCheck size={14} /> Verified Service</span>
                                <span className="flex items-center gap-1.5"><Clock size={14} /> 2-4 Days Delivery</span>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-zinc-800 w-full" />

                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Package size={14} className="text-blue-500" /> Service Deliverables
                            </h4>
                            <p className="text-base text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                                {service.description}
                            </p>
                            <ul className="mt-6 space-y-3">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-zinc-300">
                                    <CheckCircle2 size={16} className="text-blue-500" /> Professional Grade Quality
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-zinc-300">
                                    <CheckCircle2 size={16} className="text-blue-500" /> Source Files Included
                                </li>
                                {service.creditsIncluded && (
                                    <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-zinc-300">
                                        <CheckCircle2 size={16} className="text-blue-500" /> {service.creditsIncluded} Credits Loaded
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 md:p-10 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-col md:flex-row items-center gap-6">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total Investment</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{format(service.price)}</span>
                            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">USD</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full flex items-center gap-3 justify-end">
                        <button 
                            onClick={onEdit}
                            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex-1 md:flex-none flex items-center justify-center gap-2"
                        >
                            <Edit3 size={16} /> Manage
                        </button>
                        <button 
                            onClick={onCopyLink}
                            className="p-4 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-sm group"
                            title="Copy Public Link"
                        >
                            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const ServiceCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { services, loading } = useServices();
  const { format } = useCurrency();

  const [stats, setStats] = useState<Record<string, { views: number }>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [toast, setToast] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Sync
  useEffect(() => {
    // Initial stats load
    setStats(getServiceStats());

    const handleSync = () => {
        // Refresh stats
        setStats(getServiceStats());
    };
    
    window.addEventListener('agencyos_config_updated', handleSync);
    window.addEventListener('storage', handleSync); // For cross-tab sync
    
    return () => {
        window.removeEventListener('agencyos_config_updated', handleSync);
        window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Update stats locally when returning from modal to reflect the increment
  useEffect(() => {
      if (!selectedService) {
          setStats(getServiceStats());
      }
  }, [selectedService]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyLink = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      navigator.clipboard.writeText(`https://agencyos.io/service/${id}`);
      showToast("Storefront Link Copied");
  };

  const categories = ['All', 'Design', 'Development', 'Marketing', 'Consulting', 'Security'];

  const filteredServices = useMemo(() => {
    return services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = activeCategory === 'All' || 
            (activeCategory === 'Design' && (s.name.includes('Design') || s.name.includes('Brand'))) ||
            (activeCategory === 'Development' && (s.name.includes('Web') || s.name.includes('App'))) ||
            (activeCategory === 'Marketing' && (s.name.includes('Marketing') || s.name.includes('Content'))) ||
            (activeCategory === 'Consulting' && s.name.includes('Consulting'));
            
        return matchesSearch && categoryMatch;
    });
  }, [services, searchTerm, activeCategory]);

  return (
    <div className="max-w-[1800px] mx-auto pb-40 relative min-h-screen">
      
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10010] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-12 flex items-center gap-4 border border-white/10 backdrop-blur-md">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
             <CheckCircle2 size={18} />
          </div>
          {toast}
        </div>
      )}

      {/* Hero Section: Creator Context */}
      <div className="relative overflow-hidden rounded-[3.5rem] bg-[#0c0c0e] text-white p-12 md:p-20 mb-16 shadow-2xl border border-zinc-800 group isolate">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-screen pointer-events-none" />
         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none" />
         
         <div className="relative z-10 max-w-3xl space-y-8 animate-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20 backdrop-blur-md shadow-lg">Storefront Manager</span>
               <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-[8px] font-black">L</div>
               </div>
               <span className="text-xs font-bold text-zinc-400">Live Portfolio</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.0]">
               Your Public <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Service Collection.</span>
            </h1>
            
            <p className="text-lg text-zinc-400 font-medium max-w-xl leading-relaxed">
               Manage how your agency capabilities are presented to the world. Curate your catalog, generate purchase links, and track view performance.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
               <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <input 
                     type="text" 
                     placeholder="Search your inventory..." 
                     className="w-full pl-14 pr-6 py-5 bg-zinc-800/40 backdrop-blur-xl border border-white/5 rounded-[2rem] text-white placeholder:text-zinc-600 font-bold outline-none focus:bg-zinc-800/60 focus:border-blue-500/50 transition-all shadow-2xl"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <button onClick={() => navigate('/services/new')} className="px-8 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 border border-blue-500">
                  <Plus size={16} strokeWidth={3} /> Add Product
               </button>
            </div>
         </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-4 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-slate-200/50 dark:border-zinc-800/50 shadow-xl mb-12 flex items-center justify-between max-w-6xl mx-auto">
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-2 py-1">
            {categories.map(cat => (
               <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                     activeCategory === cat 
                     ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' 
                     : 'text-slate-500 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
               >
                  {cat}
               </button>
            ))}
         </div>
         <div className="flex items-center gap-2 pr-2">
            <button 
                onClick={() => window.open(window.location.origin + '/#/store', '_blank')}
                className="px-5 py-3 rounded-2xl bg-zinc-800 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center gap-2"
            >
                <ExternalLink size={14} /> View Live Store
            </button>
            <button 
                onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/#/store');
                    showToast("Store URL Copied");
                }}
                className="p-3.5 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-all border border-zinc-700" 
                title="Share Store Link"
            >
               <Share2 size={18} />
            </button>
            <button 
                onClick={() => navigate('/store-editor')}
                className="p-3.5 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-all border border-zinc-700"
                title="Edit Store"
            >
               <Edit3 size={18} />
            </button>
         </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
         {filteredServices.map((service, idx) => (
            <div 
               key={service.id} 
               onClick={() => setSelectedService(service)}
               className="group bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-2 flex flex-col cursor-pointer relative animate-in fade-in slide-in-from-bottom-8 fill-mode-forwards"
               style={{ animationDelay: `${idx * 50}ms` }}
            >
               <div className="h-72 overflow-hidden relative p-4">
                  <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative">
                     <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                     
                     <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
                        <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/services/${service.id}`); }} 
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-colors"
                            title="Edit Listing"
                        >
                           <Edit3 size={18} />
                        </button>
                        <button 
                            onClick={(e) => handleCopyLink(service.id, e)} 
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-blue-600 transition-colors"
                            title="Copy Public Link"
                        >
                           <Share2 size={18} />
                        </button>
                     </div>

                     <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1.5 backdrop-blur-xl text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-lg ${
                           service.type === 'Recurring' ? 'bg-indigo-600/80' : 'bg-blue-600/80'
                        }`}>
                           {service.type}
                        </span>
                     </div>

                     <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="font-black text-2xl text-white leading-tight mb-2 drop-shadow-md">{service.name}</h3>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
                               {stats[service.id]?.views || 0} Views
                           </span>
                           <div className="flex text-yellow-400"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="p-8 pt-2 flex flex-col flex-1">
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-3 mb-6">
                     {service.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                     {service.pricingType === 'Time based' && (
                        <span className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-950 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                           <Clock size={12}/> Hourly
                        </span>
                     )}
                     <span className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-950 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Tag size={12}/> {service.pricingType}
                     </span>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-50 dark:border-zinc-800 flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">List Price</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{format(service.price)}</p>
                     </div>
                     <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/services/${service.id}`); }}
                            className="px-6 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
                        >
                            Manage
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {filteredServices.length === 0 && (
         <div className="py-32 text-center flex flex-col items-center justify-center opacity-50">
            <div className="w-32 h-32 bg-slate-100 dark:bg-zinc-900 rounded-[3rem] flex items-center justify-center mb-6">
               <Package size={64} className="text-slate-300 dark:text-zinc-700" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Catalog Empty</h3>
            <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-widest">No services match your criteria</p>
         </div>
      )}

      {/* Enhanced Real-Time Detail Modal */}
      {selectedService && (
         <ServiceDetailModal 
            service={selectedService} 
            onClose={() => setSelectedService(null)} 
            onEdit={() => navigate(`/services/${selectedService.id}`)}
            onCopyLink={(e) => handleCopyLink(selectedService.id, e)}
         />
      )}

    </div>
  );
};

export default ServiceCatalog;
