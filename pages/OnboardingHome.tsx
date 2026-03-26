
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Rocket, Plus, Search, Filter, MoreHorizontal, 
  Trash2, Edit3, Copy, Eye, LayoutGrid, List,
  TrendingUp, Users, CheckCircle2, Clock, Zap,
  ExternalLink, Share2, BarChart3, ShieldCheck,
  ChevronRight, ArrowUpRight, Target, Sparkles,
  Smartphone, Monitor, Globe, Calendar, RefreshCw,
  MoreVertical, Command, ArrowDownRight, Layers,
  PieChart, Activity, MousePointer2, AlertCircle,
  X, Download, FileText, ChevronDown, Bell, Timer,
  Cpu, Terminal, Zap as ZapIcon, GitBranch, BarChart2,
  PlayCircle, Archive, StopCircle, User, Send
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadialBarChart, RadialBar, Legend, LineChart, Line
} from 'recharts';
import { AVAILABLE_PLANS } from '../constants';
import { useAuth } from '../context/AuthContext.tsx';
import * as ReactRouterDom from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding.ts';
import { supabase } from '../supabase.ts';
import { useClients } from '../hooks/useClients';
import { useTeam } from '../hooks/useTeam';
import { useMessenger } from '../hooks/useMessenger';

const { useNavigate, Link } = ReactRouterDom as any;

// --- 3D Tilt Card Component ---
const TiltCard = ({ children, className, onClick, style }: any) => {
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

    ref.current.style.setProperty('--rx', `${-dy * 4}deg`);
    ref.current.style.setProperty('--ry', `${dx * 4}deg`);
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
      className={`relative transition-transform duration-300 ease-out will-change-transform ${className}`}
      style={{ 
        transform: 'perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry))',
        ...style 
      }}
    >
      {children}
    </div>
  );
};

// --- Sub-Component: Protocol Card ---
const ProtocolCard = ({ flow, isSelected, onSelect, navigate, onDelete, onDuplicate, onStatusChange, onShare }: any) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <TiltCard 
       className={`group relative bg-[#09090b] rounded-[2.5rem] p-1 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
       onClick={() => navigate(`/onboarding/builder/${flow.id}`)}
    >
       {/* Flowing Gradient Border/Background */}
       <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-[2.5rem]" />
       <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2.5rem] animate-flow-gradient" style={{ backgroundSize: '200% 200%' }} />

       <div className="relative h-full bg-[#0c0c0e] rounded-[2.3rem] p-6 flex flex-col justify-between overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6 relative z-20">
             <div className="flex items-center gap-3">
                <div 
                   onClick={(e) => { e.stopPropagation(); onSelect(flow.id); }}
                   className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-zinc-700 hover:border-zinc-500'}`}
                >
                   {isSelected && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                   flow.status === 'Live' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                   flow.status === 'Draft' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                   'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                   <div className={`w-1.5 h-1.5 rounded-full ${flow.status === 'Live' ? 'bg-emerald-400 animate-pulse' : flow.status === 'Draft' ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                   {flow.status}
                </div>
             </div>

             <div className="flex items-center gap-1 relative" ref={menuRef}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onShare(flow); }}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  title="Share Protocol"
                >
                   <Share2 size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDuplicate(flow, e); }}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  title="Quick Copy"
                >
                   <Copy size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                  className={`p-2 rounded-xl transition-all ${isMenuOpen ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                >
                   <MoreVertical size={16} />
                </button>
                
                {/* Advanced Actions Popup */}
                {isMenuOpen && (
                   <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 p-1" onClick={e => e.stopPropagation()}>
                      <div className="px-3 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Set Status</div>
                      <button onClick={() => { onStatusChange(flow.id, 'Live'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-lg flex items-center gap-2"><PlayCircle size={14}/> Go Live</button>
                      <button onClick={() => { onStatusChange(flow.id, 'Draft'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/10 rounded-lg flex items-center gap-2"><StopCircle size={14}/> Revert to Draft</button>
                      <button onClick={() => { onStatusChange(flow.id, 'Archived'); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 rounded-lg flex items-center gap-2"><Archive size={14}/> Archive</button>
                      <div className="h-px bg-zinc-800 my-1" />
                      <button onClick={(e) => { onDelete(flow.id, e); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"><Trash2 size={14}/> Delete Protocol</button>
                   </div>
                )}
             </div>
          </div>

          {/* Content */}
          <div className="space-y-3 mb-8 relative z-10">
             <h3 className="text-xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">{flow.name}</h3>
             <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500">
                <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md text-zinc-400 font-mono tracking-wider">{flow.id.substring(0,8)}...</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {flow.updatedAt}</span>
             </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
             <div className="bg-zinc-900/50 rounded-2xl p-3 border border-zinc-800 hover:border-emerald-500/30 transition-colors group/metric">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                   </div>
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wide group-hover/metric:text-emerald-400 transition-colors">Est. Time</span>
                </div>
                <p className="text-lg font-black text-white">
                    {(() => {
                       const totalSeconds = (flow.steps?.length || 0) * 30;
                       const minutes = Math.floor(totalSeconds / 60);
                       const seconds = totalSeconds % 60;
                       return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                    })()}
                 </p>
             </div>

             <div className="bg-zinc-900/50 rounded-2xl p-3 border border-zinc-800 hover:border-blue-500/30 transition-colors group/metric">
                <div className="flex items-center gap-2 mb-1">
                   <Timer size={12} className="text-blue-500" />
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wide group-hover/metric:text-blue-400 transition-colors">Steps</span>
                </div>
                <p className="text-lg font-black text-white">{flow.steps?.length || 0}</p>
             </div>
          </div>

          {/* Decor */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all pointer-events-none" />
       </div>
    </TiltCard>
  );
};

// --- Share Modal ---
const ShareModal = ({ isOpen, onClose, onShare, flow, clients, team }: { isOpen: boolean, onClose: () => void, onShare: (userId: string) => void, flow: any, clients: any[], team: any[] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredTeam = team.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[10005] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
               <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Share Protocol</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold truncate max-w-[250px]">
                          {flow?.name || 'Onboarding Flow'}
                      </p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400 transition-colors"><X size={20}/></button>
               </div>
               
               <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black/20">
                  <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        autoFocus 
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 outline-none font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/20" 
                        placeholder="Search user registry..." 
                        onChange={e => setSearchTerm(e.target.value)} 
                      />
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-2">
                  {filteredClients.length > 0 && (
                      <div className="px-4 py-2 flex items-center gap-2 mt-2">
                          <Users size={12} className="text-blue-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Clients</p>
                      </div>
                  )}
                  {filteredClients.map(c => (
                     <button key={c.id} onClick={() => onShare(c.id)} className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl transition-all text-left group mx-1">
                        <div className="relative"><img src={c.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-all" alt=""/></div>
                        <div><p className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</p><p className="text-xs text-slate-500 dark:text-zinc-500">{c.company}</p></div>
                        <Send size={16} className="ml-auto text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                     </button>
                  ))}
                  
                  {filteredTeam.length > 0 && (
                      <div className="px-4 py-2 flex items-center gap-2 mt-4">
                          <ShieldCheck size={12} className="text-emerald-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Team</p>
                      </div>
                  )}
                  {filteredTeam.map(p => (
                     <button key={p.id} onClick={() => onShare(p.id)} className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl transition-all text-left group mx-1">
                        <div className="relative"><img src={p.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-emerald-500 transition-all" alt=""/></div>
                        <div><p className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</p><p className="text-xs text-slate-500 dark:text-zinc-500">{p.role}</p></div>
                        <Send size={16} className="ml-auto text-slate-300 dark:text-zinc-600 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                     </button>
                  ))}

                  {filteredClients.length === 0 && filteredTeam.length === 0 && (
                      <div className="py-12 text-center text-slate-400 dark:text-zinc-600">
                          <User size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest">No users found</p>
                      </div>
                  )}
               </div>
            </div>
         </div>
    );
};

import { useAgencySubscription } from '../hooks/useAgencySubscription';

const OnboardingHome: React.FC = () => {
  const navigate = useNavigate();
  // Using Hook for Realtime Data
  const { flows, analytics, fetchFlows, fetchAnalytics, saveFlow, deleteFlow } = useOnboarding();
  const { clients } = useClients();
  const { members: team } = useTeam();
  const { createConversation, sendMessage } = useMessenger();
  const { canEdit } = useAuth();
  const { workspace, subscription } = useAgencySubscription();
  
  // --- State ---
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [timeRange, setTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedFlows, setSelectedFlows] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFlowForShare, setSelectedFlowForShare] = useState<any>(null);

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

  // --- Effects ---
  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  useEffect(() => {
    fetchAnalytics(timeRange);
    
    // Subscribe to view/submission events for realtime chart updates
    const viewSub = supabase.channel('views-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'onboarding_views' }, () => fetchAnalytics(timeRange))
        .subscribe();
        
    const subSub = supabase.channel('subs-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'onboarding_submissions' }, () => fetchAnalytics(timeRange))
        .subscribe();

    const flowSub = supabase.channel('flows-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'onboarding_flows' }, () => fetchFlows())
        .subscribe();

    return () => { 
        supabase.removeChannel(viewSub);
        supabase.removeChannel(subSub);
        supabase.removeChannel(flowSub);
    };
  }, [timeRange, fetchAnalytics, fetchFlows]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Handlers ---
  const handleCreateNew = () => {
    if (!canEdit('onboarding')) {
        showToast("Access Denied: You do not have permission to create protocols", 'error');
        return;
    }
    if (currentPlan.onboardingLimit !== -1 && flows.length >= currentPlan.onboardingLimit) {
        showToast(`Plan Limit Reached: ${currentPlan.name} plan allows max ${currentPlan.onboardingLimit} onboarding flows.`, 'error');
        return;
    }

    const newId = `f-${Date.now()}`;
    const newFlow = {
      id: newId,
      name: 'Untitled Protocol',
      status: 'Draft' as const,
      responses: 0,
      completion: 0,
      updated_at: new Date().toISOString(),
      type: 'Custom',
      views: 0,
      steps: [],
      branding: {} 
    };
    
    saveFlow(newFlow).then(() => {
        navigate(`/onboarding/builder/${newId}`);
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit('onboarding')) {
        showToast("Access Denied: You do not have permission to archive protocols", 'error');
        return;
    }
    if (window.confirm("Archive this onboarding protocol?")) {
      deleteFlow(id);
    }
  };

  const handleDuplicate = (flow: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit('onboarding')) {
        showToast("Access Denied: You do not have permission to duplicate protocols", 'error');
        return;
    }
    if (currentPlan.onboardingLimit !== -1 && flows.length >= currentPlan.onboardingLimit) {
        showToast(`Plan Limit Reached: Cannot duplicate flow.`, 'error');
        return;
    }
    const newId = `f-${Date.now()}`;
    const newFlow = { ...flow, id: newId, name: `${flow.name} (Copy)`, status: 'Draft' as const, responses: 0, views: 0 };
    saveFlow(newFlow);
    showToast("Protocol Duplicated");
  };

  const handleStatusChange = (id: string, status: string) => {
     if (!canEdit('onboarding')) {
        showToast("Access Denied: You do not have permission to change protocol status", 'error');
        return;
     }
     const flow = flows.find(f => f.id === id);
     if(flow) {
         saveFlow({ ...flow, status: status as any });
         showToast(`Status updated to ${status}`);
     }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([fetchFlows(), fetchAnalytics(timeRange)]).then(() => setIsRefreshing(false));
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedFlows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedFlows(newSet);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Status', 'Type', 'Responses', 'Completion', 'Views', 'Updated At'];
    const rows = flows.map((f: any) => [f.id, f.name, f.status, f.type, f.responses, f.completion + '%', f.views, f.updatedAt]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `protocols_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SHARE LOGIC ---
  const openShareModal = (flow: any) => {
      setSelectedFlowForShare(flow);
      setIsShareModalOpen(true);
  };

  const handleShareProtocol = async (userId: string) => {
      if (!selectedFlowForShare) return;

      let targetUser: any = clients.find((c: any) => c.id === userId);
      if (!targetUser) {
          targetUser = team.find((t: any) => t.id === userId);
      }
      
      if (!targetUser) return;

      try {
          // 1. Create or Find Conversation
          const chatId = await createConversation([userId], false);
          
          if (!chatId) {
              showToast("Failed to initiate chat session", 'error');
              return;
          }

          // 2. Construct Invite Payload
          const inviteLink = `${window.location.origin}/#/onboarding/view/${selectedFlowForShare.id}`;
          const payload = {
              type: 'onboarding_invite',
              flowId: selectedFlowForShare.id,
              flowName: selectedFlowForShare.name,
              url: inviteLink,
              description: 'Please complete this secure onboarding protocol to proceed.'
          };

          // 3. Send Message (as JSON string for the hook to parse or store)
          await sendMessage(chatId, JSON.stringify(payload), 'invite');

          showToast(`Protocol sent to ${targetUser.name}`);
          setIsShareModalOpen(false);
      } catch (err) {
          console.error("Share error:", err);
          showToast("Failed to share protocol", 'error');
      }
  };

  // --- Derived Data ---
  const filteredFlows = useMemo(() => {
    return flows.filter((f: any) => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [flows, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-white p-6 md:p-10 pb-40 overflow-x-hidden font-sans transition-colors duration-300">
      
      <ShareModal 
         isOpen={isShareModalOpen} 
         onClose={() => setIsShareModalOpen(false)} 
         onShare={handleShareProtocol} 
         flow={selectedFlowForShare}
         clients={clients}
         team={team}
      />

      <style>{`
        @keyframes flow-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-flow-gradient {
          background-size: 200% 200%;
          animation: flow-gradient 6s ease infinite;
        }
        @keyframes ripple-slow {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .animate-ripple-slow {
          animation: ripple-slow 3s linear infinite;
        }
      `}</style>
      
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-zinc-900 border border-zinc-800 text-white px-8 py-4 rounded-full font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 border border-white/10">
          <CheckCircle2 size={16} className="text-emerald-500" /> {toast}
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Client Gateways</h2>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Protocol v4.8</span>
             </div>
             <p className="text-slate-500 dark:text-zinc-500 font-medium text-sm">Automated intake & verification flows.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={handleExportCSV}
             className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-zinc-700 transition-all shadow-sm active:scale-95"
           >
              <Download size={20} />
           </button>
           <button 
             onClick={handleCreateNew}
             disabled={!canEdit('onboarding')}
             className={`px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-3 active:scale-95 group ${!canEdit('onboarding') ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Create Protocol
           </button>
        </div>
      </div>

      {/* --- ANALYTICS DASHBOARD --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
         
         {/* Main Traffic Chart (Real Data) */}
         <TiltCard className="lg:col-span-8 bg-[#09090b] border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                     <BarChart2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-none">Forms Created Analysis</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Real-time Creation Volume</p>
                  </div>
               </div>
               <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  {['7d', '30d', '90d'].map(r => (
                     <button 
                        key={r} 
                        onClick={() => setTimeRange(r)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider ${timeRange === r ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                     >
                        {r}
                     </button>
                  ))}
               </div>
            </div>
            
            <div className="h-56 w-full relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.chartData}>
                     <defs>
                        <linearGradient id="colorForms" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 700}} dy={10} />
                     <Tooltip 
                        contentStyle={{backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}
                        itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                     />
                     <Area type="monotone" dataKey="formsCreated" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorForms)" activeDot={{r: 6, strokeWidth: 0}} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </TiltCard>

         {/* Side Stats */}
         <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Realtime Velocity Tracker */}
            <TiltCard 
               className="flex-1 bg-[#09090b] border border-zinc-800 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group cursor-default"
            >
               {/* Background Flow Animation */}
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-blue-900/10 z-0"></div>
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent)] animate-pulse z-0"></div>
               
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                           <Activity size={12} className="animate-pulse"/> Velocity
                        </h4>
                        <p className="text-xs font-bold text-zinc-400">Response Trend</p>
                     </div>
                     <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        Total {analytics.totalResponses}
                     </span>
                  </div>

                  <div className="flex items-end gap-2 mb-2">
                     <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{analytics.totalResponses}</span>
                     <span className="text-sm font-bold text-zinc-500 mb-2">Forms Created</span>
                  </div>

                  {/* Flowing Chart (Real Data) */}
                  <div className="h-16 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.velocityData}>
                           <defs>
                              <linearGradient id="velocityGrad" x1="0" y1="0" x2="1" y2="0">
                                 <stop offset="0%" stopColor="#10b981" stopOpacity={0.1}/>
                                 <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              </linearGradient>
                           </defs>
                           <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#10b981" 
                              strokeWidth={3} 
                              fill="url(#velocityGrad)" 
                              animationDuration={2000}
                           />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </TiltCard>
            
            {/* Quick Deploy */}
            <TiltCard 
               onClick={handleCreateNew}
               className="flex-1 bg-gradient-to-br from-indigo-900 to-black rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl group cursor-pointer border border-indigo-500/20"
            >
               {/* Technical Grid Background */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] group-hover:[mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_100%,transparent_100%)] transition-all duration-700 pointer-events-none transform group-hover:scale-110" />
               
               <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                  <Cpu size={120} className="text-indigo-500" />
               </div>
               
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                     <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_40px_rgba(99,102,241,0.8)] transition-all duration-500">
                        <Rocket size={24} strokeWidth={3} />
                     </div>
                     <ArrowUpRight className="text-indigo-400 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                  
                  <div className="flex items-center gap-2 my-4 opacity-50 group-hover:opacity-100 transition-opacity">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <div className="w-8 h-[1px] bg-indigo-500/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <div className="w-8 h-[1px] bg-indigo-500/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>

                  <div>
                     <h3 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md">Quick Deploy</h3>
                     <p className="text-indigo-200 text-xs font-bold mt-1 uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <Terminal size={12} /> Initialize Sequence
                     </p>
                  </div>
               </div>
            </TiltCard>
         </div>
      </div>

      {/* --- CONTROL BAR --- */}
      <div className="sticky top-4 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-2 mb-10 shadow-xl shadow-slate-200/50 dark:shadow-black/50 flex flex-col md:flex-row items-center gap-4 transition-all duration-300">
         <div className="relative flex-1 w-full md:w-auto group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
               type="text" 
               placeholder="Search protocols, IDs, or metadata..." 
               className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[2rem] text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>

         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto px-2">
            {['All', 'Live', 'Draft', 'Archived'].map(status => (
               <button 
                  key={status} 
                  onClick={() => setStatusFilter(status)}
                  className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                     statusFilter === status 
                     ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-lg' 
                     : 'bg-transparent border-transparent text-slate-500 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
               >
                  {status}
               </button>
            ))}
         </div>

         <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800 hidden md:block" />

         <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 shadow-inner">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-md' : 'text-slate-400 dark:text-zinc-600 hover:text-slate-900 dark:hover:text-white'}`}><LayoutGrid size={18}/></button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-md' : 'text-slate-400 dark:text-zinc-600 hover:text-slate-900 dark:hover:text-white'}`}><List size={18}/></button>
         </div>

         <button 
            onClick={handleRefresh}
            className={`p-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 transition-all shadow-sm active:scale-95 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
         >
            <RefreshCw size={18} />
         </button>
      </div>

      {/* --- BULK ACTIONS --- */}
      {selectedFlows.size > 0 && (
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 border border-slate-700 dark:border-zinc-200">
            <span className="font-bold text-sm">{selectedFlows.size} selected</span>
            <div className="flex items-center gap-2">
               <button className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors" title="Archive"><Archive size={18} className="text-zinc-400" /></button>
               <button className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors" title="Duplicate"><Copy size={18} /></button>
               <button className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors" title="Export"><Share2 size={18} /></button>
            </div>
            <button onClick={() => setSelectedFlows(new Set())} className="p-1 bg-white/20 dark:bg-black/10 rounded-full hover:bg-white/30 dark:hover:bg-black/20 transition-colors"><X size={14}/></button>
         </div>
      )}

      {/* --- CONTENT GRID --- */}
      <div className="w-full">
         
         <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-lg font-black text-slate-900 dark:text-white">Active Protocols</h3>
               <button onClick={handleExportCSV} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  <Download size={14} /> Export CSV
               </button>
            </div>

            {viewMode === 'grid' ? (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {filteredFlows.map((flow: any, idx: number) => (
                     <ProtocolCard 
                        key={flow.id} 
                        flow={flow} 
                        isSelected={selectedFlows.has(flow.id)}
                        onSelect={toggleSelect}
                        navigate={navigate}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onStatusChange={handleStatusChange}
                        onShare={openShareModal}
                     />
                  ))}
                  
                  {/* Create New Card */}
                  <button 
                     onClick={handleCreateNew}
                     className="group relative flex flex-col items-center justify-center gap-6 min-h-[260px] rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-500 bg-transparent hover:bg-blue-50/50 dark:hover:bg-blue-900/10 overflow-hidden active:scale-95 active:bg-blue-100 dark:active:bg-blue-900/20"
                  >
                     <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
                     
                     <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all duration-500 shadow-sm flex items-center justify-center z-10 relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ripple-slow pointer-events-none" />
                        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500 relative z-10" />
                        <div className="absolute inset-0 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 animate-ping" />
                     </div>
                     
                     <div className="z-10 text-center space-y-1">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Initialize Protocol</span>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">Click to configure new flow</p>
                     </div>
                  </button>
               </div>
            ) : (
               <div className="bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                        <tr className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em]">
                           <th className="px-8 py-6 w-16 text-center">#</th>
                           <th className="px-8 py-6">Identity</th>
                           <th className="px-8 py-6">State</th>
                           <th className="px-8 py-6">Metrics</th>
                           <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {filteredFlows.map((flow: any) => (
                           <tr 
                              key={flow.id} 
                              className="group hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/onboarding/builder/${flow.id}`)}
                           >
                              <td className="px-8 py-6 text-center" onClick={e => e.stopPropagation()}>
                                 <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-black checked:bg-blue-600 appearance-none cursor-pointer"
                                    checked={selectedFlows.has(flow.id)}
                                    onChange={() => toggleSelect(flow.id)}
                                 />
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{flow.name}</p>
                                 <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 mt-1">{flow.id} • {flow.updatedAt}</p>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${flow.status === 'Live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{flow.status}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="w-24 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-1">
                                    <div className="h-full bg-blue-500" style={{ width: `${flow.completion}%` }} />
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500">{flow.responses} Entries</p>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <button onClick={(e) => { e.stopPropagation(); openShareModal(flow); }} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Share"><Share2 size={16}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/onboarding/view/${flow.id}`)}} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="View"><Eye size={16}/></button>
                                    <button onClick={(e) => handleDuplicate(flow, e)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="Duplicate"><Copy size={16}/></button>
                                    <button onClick={(e) => handleDelete(flow.id, e)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="Delete"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>

      </div>
    </div>
  );
};

export default OnboardingHome;
