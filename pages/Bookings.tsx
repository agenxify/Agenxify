
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Calendar, Clock, Globe, Copy, Share2, 
  Settings2, User, MoreVertical, Check, ExternalLink,
  ChevronRight, ArrowRight, Zap, Filter, Search,
  CalendarCheck, Trash2, Edit3, CheckCircle2,
  Lock, Bell, Smartphone, Monitor, Layout, 
  X, Briefcase, RefreshCcw, Video, Users, Link as LinkIcon,
  ChevronDown, Mail, Video as VideoIcon, ShieldAlert,
  ShieldCheck, MapPin, Phone, Hash, LayoutTemplate, FileEdit,
  Compass, SortAsc, SortDesc
} from 'lucide-react';
import { MOCK_CLIENTS, AVAILABLE_PLANS } from '../constants';
import { useAuth } from '../context/AuthContext.tsx';
import * as ReactRouterDom from 'react-router-dom';
import { useBookings } from '../hooks/useBookings.ts';

const { useNavigate } = ReactRouterDom as any;

import { useAgencySubscription } from '../hooks/useAgencySubscription';

const Bookings: React.FC = () => {
  const navigate = useNavigate();

  // Use the hook instead of local state management
  const { eventTypes, bookings: scheduledBookings, loading, addBooking, deleteBooking: deleteBookingFromDb, deleteEventType: deleteEventTypeFromDb } = useBookings();
  const { canEdit } = useAuth();
  const { workspace, subscription } = useAgencySubscription();

  // --- UI States ---
  const [activeTab, setActiveTab] = useState<'Event Types' | 'Scheduled' | 'Completed'>('Event Types');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [collisionError, setCollisionError] = useState<string | null>(null);
  
  // Sorting & Filtering for Scheduled
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [durationFilter, setDurationFilter] = useState<number | 'All'>('All');
  
  // Plan Limit Check
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

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateProtocol = () => {
     if (!canEdit('bookings')) {
         showToast("Access Denied: You do not have permission to create booking types", 'error');
         return;
     }
     if (currentPlan.bookingsLimit !== -1 && eventTypes.length >= currentPlan.bookingsLimit) {
         showToast(`Plan Limit Reached: ${currentPlan.name} plan allows max ${currentPlan.bookingsLimit} protocols.`, 'error');
         return;
     }
     navigate('/bookings/new');
  };

  const handleScheduleMeeting = () => {
     if (!canEdit('bookings')) {
         showToast("Access Denied: You do not have permission to schedule meetings", 'error');
         return;
     }
     setIsBookingModalOpen(true);
  };

  const deleteEventType = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canEdit('bookings')) {
        showToast("Access Denied: You do not have permission to delete protocols", 'error');
        return;
    }
    if (confirm("Decommission this protocol?")) {
      deleteEventTypeFromDb(id);
      showToast("Registry Updated");
    }
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const duration = parseInt(formData.get('duration') as string) || 30;

    const newStart = new Date(`${date}T${time}`).getTime();

    const isCollision = scheduledBookings.some(b => {
      if (editingBooking?.id && b.id === editingBooking.id) return false;
      if (b.dueDate !== date) return false;
      const bStart = new Date(`${b.dueDate}T${b.dueTime}`).getTime();
      const bEnd = bStart + (b.duration || 30) * 60000;
      const newEnd = newStart + duration * 60000;
      return (newStart < bEnd) && (newEnd > bStart);
    });

    if (isCollision) {
      setCollisionError("Operational Conflict: Window already occupied.");
      return;
    }

    const booking = {
      id: editingBooking?.id || '',
      title: formData.get('title'),
      client: formData.get('client'),
      dueDate: date,
      dueTime: time,
      duration: duration,
      status: 'Confirmed'
    };

    addBooking(booking);

    setIsBookingModalOpen(false);
    setEditingBooking(null);
    setCollisionError(null);
    showToast(editingBooking ? "Meeting Rescheduled" : "Meeting Registry Updated");
  };

  const deleteBooking = (id: string) => {
    if (confirm("Cancel this scheduled meeting?")) {
      deleteBookingFromDb(id);
      showToast("Meeting Terminated");
    }
  };

  const filteredEventTypes = useMemo(() => {
    return eventTypes.filter(t => t && t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [eventTypes, searchTerm]);

  const actives = filteredEventTypes.filter(t => t.status === 'Active');
  const templates = filteredEventTypes.filter(t => t.status === 'Template');
  const drafts = filteredEventTypes.filter(t => t.status === 'Draft');

  const filteredBookings = useMemo(() => {
    const now = Date.now();
    const baseBookings = scheduledBookings.filter(b => {
      if (!b.dueDate || !b.dueTime) return false;
      const startTime = new Date(`${b.dueDate}T${b.dueTime}`).getTime();
      const endTime = startTime + (b.duration || 30) * 60000;
      const isPast = endTime < now;
      
      if (activeTab === 'Scheduled') return !isPast;
      if (activeTab === 'Completed') return isPast;
      return false;
    });

    const result = baseBookings.filter(b => 
      b && b.title && b.client && (
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.client.toLowerCase().includes(searchTerm.toLowerCase())
      ) && (durationFilter === 'All' || b.duration === durationFilter)
    );

    result.sort((a, b) => {
      const timeA = new Date(`${a.dueDate}T${a.dueTime}`).getTime();
      const timeB = new Date(`${b.dueDate}T${b.dueTime}`).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [scheduledBookings, searchTerm, sortOrder, durationFilter, activeTab]);

  const ProtocolCard: React.FC<{ type: any }> = ({ type }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const safeColor = type.color || 'bg-blue-600';
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -15; 
      const rotateY = ((x - centerX) / centerX) * 15;
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      if (!cardRef.current) return;
      cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    return (
        <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
            if (type.status === 'Template') {
                navigate(`/bookings/new?templateId=${type.id}`);
            } else {
                navigate(`/bookings/edit/${type.id}`);
            }
        }}
        className={`bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col group hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_40px_80px_-15px_rgba(37,99,235,0.25)] transition-all duration-300 ease-out relative overflow-hidden h-full cursor-pointer animate-in fade-in zoom-in-95 will-change-transform ${type.status === 'Draft' ? 'bg-zinc-50/50 dark:bg-zinc-900/50' : ''}`}
        >
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-30 group-hover:scale-150 transition-all duration-1000 animate-pulse ${safeColor}`} />
        
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={`w-14 h-14 rounded-2xl ${type.status === 'Template' ? 'bg-indigo-600' : safeColor} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                {type.status === 'Template' ? (
                  <LayoutTemplate size={28} className="text-white" />
                ) : type.title.includes('Discovery') ? (
                  <div className="relative">
                    <Clock size={28} className="text-white" />
                    <Zap size={10} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" fill="currentColor" />
                  </div>
                ) : (
                  <Clock size={28} className="text-white" />
                )}
            </div>
            <div className="flex gap-2 items-center">
                <div className={`h-8 px-4 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all group-hover:scale-105 ${
                type.status === 'Template' ? 'bg-indigo-500 text-white border-indigo-400' :
                type.status === 'Draft' ? 'bg-amber-500 text-white border-amber-400' :
                'bg-emerald-500 text-white border-emerald-400'
                }`}>
                    {type.status}
                </div>
                <button onClick={(e) => deleteEventType(type.id, e)} className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
            </div>
        </div>

        <div className="mb-8 relative z-10">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 leading-tight group-hover:text-blue-500 transition-colors">{type.title}</h3>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{type.description}</p>
        </div>

        <div className="mt-auto space-y-4 relative z-10 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
                <span className="flex items-center gap-1.5"><Clock size={10} className="text-blue-500"/> {type.duration} MIN</span>
                <span className="flex items-center gap-1.5"><MapPin size={10} className="text-indigo-500"/> {type.location || type.locationProvider || 'Remote'}</span>
            </div>
            
            <button 
                onClick={(e) => {
                e.stopPropagation();
                if (type.status === 'Template') {
                    navigate(`/bookings/new?templateId=${type.id}`);
                } else {
                    navigator.clipboard.writeText(`${window.location.origin}/#/book/${type.slug}`); 
                    showToast("Direct link copied"); 
                }
                }}
                className={`w-full py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                type.status === 'Template' 
                ? 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700' 
                : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-blue-600 dark:hover:bg-blue-600 dark:hover:text-white'
                } shadow-lg`}
            >
                {type.status === 'Template' ? <><Plus size={12}/> Create from Blueprint</> : <><Copy size={12}/> Share Protocol</>}
            </button>
        </div>
        </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CalendarCheck size={32} className="text-blue-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Synchronizing Registry</h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Accessing Secure Protocol Database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-40 relative">
      <style>{`
        @keyframes flow-rgb {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-flow-rgb {
          background-size: 400% 400%;
          animation: flow-rgb 8s ease infinite;
        }
      `}</style>
      
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10010] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 border border-white/10 backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-white" />
          </div>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <CalendarCheck size={32} strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Bookings</h1>
              <div className="flex items-center gap-3 mt-1">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Agency Portal / Scheduler</p>
                 <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Core Synchronized</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
              {(['Event Types', 'Scheduled', 'Completed'] as const).map(tab => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
                 >
                   {tab}
                 </button>
              ))}
           </div>
           <button 
             onClick={() => { 
               setCollisionError(null); 
               if (activeTab === 'Scheduled' || activeTab === 'Completed') {
                 handleScheduleMeeting();
               } else {
                 handleCreateProtocol();
               }
             }}
             className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 group border border-blue-500"
           >
             <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> {activeTab === 'Event Types' ? 'Create protocol' : 'Schedule meeting'}
           </button>
        </div>
      </div>

      {activeTab === 'Event Types' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700">
           
           {/* Primary RGB Search Bar */}
           <div className="relative group w-full mb-8 px-0">
              <div className="absolute -inset-[3px] bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500 rounded-[2.5rem] blur-[10px] opacity-20 group-hover:opacity-60 transition-all duration-700 animate-flow-rgb group-hover:blur-[12px]" />
              <div className="relative flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-1.5 transition-all group-hover:bg-white dark:group-hover:bg-[#0c0c0e]">
                <div className="flex items-center flex-1 pr-4">
                  <Search className="ml-8 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={24} />
                  <input 
                    type="text" 
                    placeholder="Search protocols, blueprints or drafts..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-6 pr-8 py-6.5 bg-transparent border-none outline-none font-black text-lg text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-800"
                  />
                </div>
                <div className="hidden sm:flex items-center gap-2 pr-8">
                   <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-black text-zinc-500 uppercase border dark:border-zinc-700 shadow-sm">CMD+K</span>
                </div>
              </div>
           </div>

           {/* ACTIVE PROTOCOLS */}
           {actives.length > 0 && (
             <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                   <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><Zap size={16} fill="currentColor"/></div>
                   <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">Live Protocols</h2>
                   <div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-1 ml-4" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {actives.map(t => <ProtocolCard key={t.id} type={t} />)}
                </div>
             </div>
           )}

           {/* BLUEPRINTS (TEMPLATES) */}
           {templates.length > 0 && (
             <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg"><LayoutTemplate size={16}/></div>
                   <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">Service Blueprints</h2>
                   <div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-1 ml-4" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {templates.map(t => <ProtocolCard key={t.id} type={t} />)}
                </div>
             </div>
           )}

           {/* DRAFTS */}
           {drafts.length > 0 && (
             <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                   <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg"><FileEdit size={16}/></div>
                   <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">Draft Protocols</h2>
                   <div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-1 ml-4" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {drafts.map(t => <ProtocolCard key={t.id} type={t} />)}
                </div>
             </div>
           )}

           {filteredEventTypes.length === 0 && (
             <div className="py-20 text-center flex flex-col items-center gap-6 opacity-30">
                <ShieldAlert size={64} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-[0.3em]">No protocols found matching search</p>
             </div>
           )}
        </div>
      )}

      {(activeTab === 'Scheduled' || activeTab === 'Completed') && (
        <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-blue-500/5 overflow-hidden animate-in fade-in duration-700">
           <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-8">
              
              <div className="relative flex-1 group">
                 <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-blue-500/20 rounded-[2.25rem] blur-sm opacity-0 group-focus-within:opacity-100 transition-all duration-700 animate-flow-rgb" />
                 <div className="relative bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.25rem] transition-all group-focus-within:border-blue-500/50 group-focus-within:ring-4 group-focus-within:ring-blue-100 dark:group-focus-within:ring-blue-900/20 overflow-hidden">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                    <input 
                      className="w-full pl-20 pr-8 py-7 bg-transparent text-lg font-black outline-none dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-800" 
                      placeholder={`Search ${activeTab.toLowerCase()} sessions...`} 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
              </div>

              <div className="flex gap-3 relative shrink-0">
                 <button 
                   onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                   className="px-8 py-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"
                 >
                   {activeTab === 'Scheduled' ? 'Upcoming' : 'Past'} {sortOrder === 'asc' ? <SortAsc size={16} className="text-blue-500"/> : <SortDesc size={16} className="text-blue-500"/>}
                 </button>
                 <div className="relative">
                    <button 
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className={`p-5 rounded-2xl border transition-all ${isFilterMenuOpen ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800'}`}
                    >
                        <Filter size={24}/>
                    </button>
                    {isFilterMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 p-2 animate-in zoom-in-95">
                            <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Duration</p>
                            {[15, 30, 60, 'All'].map(d => (
                                <button 
                                    key={d}
                                    onClick={() => { setDurationFilter(d as any); setIsFilterMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${durationFilter === d ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900'}`}
                                >
                                    {d === 'All' ? 'Reset (All)' : `${d} Minutes`}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
              </div>
           </div>
           
           <div className="overflow-x-auto">
             {filteredBookings.length > 0 ? (
               <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-black/40 border-b border-zinc-100 dark:border-zinc-800">
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                          <th className="px-12 py-8">Session Context</th>
                          <th className="px-12 py-8">Participant</th>
                          <th className="px-12 py-8">Tactical Window</th>
                          <th className="px-12 py-8">Status</th>
                          <th className="px-12 py-8 text-right">Link</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {filteredBookings.map(b => (
                          <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group">
                              <td className="px-12 py-8">
                                  <p className="font-black text-lg text-zinc-900 dark:text-white leading-none mb-1.5">{b.title}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                                     <Hash size={10} /> {b.id}
                                  </div>
                              </td>
                              <td className="px-12 py-8">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400"><User size={18}/></div>
                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{b.client}</span>
                                 </div>
                              </td>
                              <td className="px-12 py-8">
                                  <div className="space-y-1.5">
                                     <div className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400">
                                        <Calendar size={14}/> {b.dueDate}
                                     </div>
                                     <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                                        <Clock size={12}/> {b.dueTime} <span className="opacity-50">• {b.duration} Min</span>
                                     </div>
                                  </div>
                              </td>
                              <td className="px-12 py-8">
                                  <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">{b.status}</span>
                              </td>
                              <td className="px-12 py-8 text-right">
                                 <div className="flex justify-end items-center gap-4">
                                    <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                      <button onClick={() => deleteBooking(b.id)} className="p-2 text-zinc-300 hover:text-rose-500 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl shadow-sm transition-all"><Trash2 size={16}/></button>
                                    </div>
                                    {b.meetUrl && (
                                      <button 
                                        onClick={() => {
                                          navigator.clipboard.writeText(b.meetUrl);
                                          showToast("Meeting link copied");
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                      >
                                        <LinkIcon size={14} /> Copy Link
                                      </button>
                                    )}
                                 </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
               </table>
             ) : (
                <div className="py-40 text-center flex flex-col items-center gap-6 opacity-30">
                   <CalendarCheck size={64} strokeWidth={1} />
                   <p className="text-sm font-black uppercase tracking-[0.3em]">Registry Clear</p>
                </div>
             )}
           </div>
        </div>
      )}

      {/* BOOKING MODAL (Manual Schedule) */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[10020] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsBookingModalOpen(false)} />
           <div className="relative bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
              <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-black/20 shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                       <VideoIcon size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{editingBooking ? 'Reschedule Session' : 'Manual Meeting Entry'}</h2>
                 </div>
                 <button onClick={() => setIsBookingModalOpen(false)} className="p-4 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-2xl transition-all shadow-sm"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveBooking} className="p-10 space-y-8 overflow-y-auto no-scrollbar bg-slate-50/20 dark:bg-black/20">
                 
                 {collisionError && (
                   <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] flex items-center gap-5 animate-in shake">
                      <ShieldAlert className="text-rose-500 shrink-0" size={24} />
                      <p className="text-sm font-bold text-rose-500 leading-tight">{collisionError}</p>
                   </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] ml-2">Meeting Intent</label>
                    <input name="title" defaultValue={editingBooking?.title} required autoFocus className="w-full px-8 py-5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-lg text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all" placeholder="Subject..." />
                 </div>


                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] ml-2">Authorized Date</label>
                       <div className="relative">
                          <input type="date" name="date" defaultValue={editingBooking?.dueDate} required className="w-full px-8 py-5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none" onChange={() => setCollisionError(null)} />
                          <Calendar size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] ml-2">Tactical Time</label>
                       <div className="relative">
                          <input type="time" name="time" defaultValue={editingBooking?.dueTime} required className="w-full px-8 py-5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none" onChange={() => setCollisionError(null)} />
                          <Clock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] ml-2">Window Duration (MIN)</label>
                    <div className="relative">
                       <select name="duration" defaultValue={editingBooking?.duration || 30} className="w-full px-8 py-5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white outline-none appearance-none cursor-pointer">
                          {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} Minutes</option>)}
                       </select>
                       <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                 </div>

                 <div className="pt-4">
                    <button type="submit" disabled={!!collisionError} className={`w-full py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all ${collisionError ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-500/40 hover:bg-blue-700 active:scale-95'}`}>
                       {editingBooking ? 'Commit Changes' : 'Initialize Session'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
