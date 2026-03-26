
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Target, TrendingUp, User, Plus, 
  Trash2, CheckCircle2, 
  Hash, ChevronDown, X, Layers,
  Edit2, Settings2, Sparkles,
  ArrowRight, MoreHorizontal,
  Zap, BarChart3, ShieldCheck,
  ChevronRight, Layout, Filter,
  FolderPlus, Copy, Search,
  GripVertical, DollarSign, Activity,
  Calendar, Briefcase, Mail, Phone,
  Building2, UserCircle, Tag, Eye, Info,
  CheckCircle, Globe, ChevronLeft,
  Download,
  Settings,
  Clock,
  Loader2
} from 'lucide-react';
import { Lead, Pipeline as PipelineType } from '../types';
import { GLOBAL_CURRENCIES } from '../constants';
import { usePipeline } from '../hooks/usePipeline.ts';
import { useTeam } from '../hooks/useTeam.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useCurrency } from '../context/CurrencyContext.tsx';

// --- Custom Components ---

const PipelineDropdown = ({ value, onChange, options, placeholder, icon: Icon }: any) => {
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
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm flex items-center justify-between group backdrop-blur-sm hover:bg-slate-100/50 dark:hover:bg-white/10"
      >
        <div className="flex items-center gap-2 truncate">
            {Icon && <Icon size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />}
            <span className={`truncate ${value && value !== 'None' ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-zinc-500"}`}>
                {value || placeholder}
            </span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 dark:text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 custom-scrollbar">
          {options.map((opt: string) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                value === opt 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {opt}
              {value === opt && <CheckCircle2 size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: Lead['priority'] }) => {
  const styles = {
    High: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-900/30',
    Medium: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-900/30',
    Low: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/30'
  };
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${styles[priority]}`}>
      {priority}
    </span>
  );
};

const Pipeline: React.FC = () => {
  // Use Custom Hook for Backend Logic
  const { pipelines, loading, addPipeline, updatePipeline, deletePipeline, addLead, updateLead, deleteLead } = usePipeline();
  const { members: teamMembers } = useTeam();
  const { user } = useAuth();
  const { format } = useCurrency();

  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  
  // Initialize Active Pipeline once data is loaded
  useEffect(() => {
      if (!loading && pipelines.length > 0 && !activePipelineId) {
          // Default to the first pipeline if none selected
          setActivePipelineId(pipelines[0].id);
      } else if (!loading && pipelines.length > 0 && activePipelineId) {
          // Validate current ID still exists (e.g. after deletion)
          const exists = pipelines.find(p => p.id === activePipelineId);
          if (!exists) setActivePipelineId(pipelines[0].id);
      }
  }, [pipelines, loading, activePipelineId]);

  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isAddPhaseModalOpen, setIsAddPhaseModalOpen] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  
  // Menu State
  const [activeLeadMenu, setActiveLeadMenu] = useState<string | null>(null);
  
  // Preview State
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);

  // Multi-field state for the modal
  const [phoneList, setPhoneList] = useState<string[]>(['']);
  const [emailList, setEmailList] = useState<string[]>(['']);

  const activePipeline = useMemo(() => 
    pipelines.find(p => p.id === activePipelineId) || null,
    [pipelines, activePipelineId]
  );

  const [newDeal, setNewDeal] = useState<Partial<Lead>>({
    title: '', company: '', contact: '', value: 0, stage: '', priority: 'Medium', probability: 20,
    phone: '', email: '', owner: user?.name || 'Agency Admin', currency: 'USD', label: 'None', expectedCloseDate: '',
    sourceChannel: 'Portal', sourceChannelId: '', visibility: "Team"
  });

  // Update default owner when user profile loads
  useEffect(() => {
    if (user?.name && (newDeal.owner === 'Agency Admin' || !newDeal.owner)) {
      setNewDeal(prev => ({ ...prev, owner: user.name }));
    }
  }, [user?.name]);

  // Reset multi-fields when modal opens
  useEffect(() => {
    if (isNewLeadModalOpen) {
      setPhoneList(newDeal.phone ? newDeal.phone.split(', ') : ['']);
      setEmailList(newDeal.email ? newDeal.email.split(', ') : ['']);
    }
  }, [isNewLeadModalOpen, newDeal.phone, newDeal.email]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
      // Close lead menu on outside click
      setActiveLeadMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreatePipeline = async () => {
    const name = window.prompt("Protocol Name (e.g. Q4 Expansion):");
    if (!name) return;
    await addPipeline(name);
    setIsSwitcherOpen(false);
    showToast(`Protocol "${name}" Online`);
  };

  const handleRenamePipeline = async () => {
    if (!activePipeline) return;
    const newName = window.prompt("Rename Protocol:", activePipeline.name);
    if (!newName) return;
    await updatePipeline(activePipeline.id, { name: newName });
    setIsSwitcherOpen(false);
    showToast("Registry Updated");
  };

  const handleDeleteActivePipeline = async () => {
    if (!activePipeline) return;
    if (pipelines.length <= 1) return alert("System requires at least one active protocol.");
    if (!window.confirm(`DESTRUCTIVE: Wipe "${activePipeline.name}" from core memory?`)) return;
    
    // Find next ID before deletion
    const nextPipeline = pipelines.find(p => p.id !== activePipeline.id);
    
    await deletePipeline(activePipeline.id);
    
    if (nextPipeline) {
      setActivePipelineId(nextPipeline.id);
    }
    setIsSwitcherOpen(false);
    showToast("Data Purged");
  };

  const handleDeployPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim() || !activePipeline) return;
    
    const updatedStages = [...activePipeline.stages, newPhaseName];
    await updatePipeline(activePipeline.id, { stages: updatedStages });
    
    showToast(`Phase "${newPhaseName}" Deployed`);
    setNewPhaseName('');
    setIsAddPhaseModalOpen(false);
  };

  const handleDeleteStage = async (stageName: string) => {
    if (!activePipeline) return;
    if (!window.confirm(`Purge Phase "${stageName}"? This will move associated missions to the first stage.`)) return;
    
    const newStages = activePipeline.stages.filter(s => s !== stageName);
    const firstStage = activePipeline.stages[0] === stageName ? activePipeline.stages[1] : activePipeline.stages[0];

    // First, move all leads in this stage to the first stage
    const leadsToMove = activePipeline.leads.filter(l => l.stage === stageName);
    for (const lead of leadsToMove) {
        await updateLead(activePipeline.id, lead.id, { stage: firstStage });
    }

    // Then update pipeline structure
    await updatePipeline(activePipeline.id, { stages: newStages });
    showToast("Phase Decommissioned");
  };

  const handleDrop = async (stage: string) => {
    if (!draggedLeadId || !activePipeline) return;
    
    // Optimistic Update handled in Hook, trigger it
    await updateLead(activePipeline.id, draggedLeadId, { stage });
    
    setDraggedLeadId(null);
    setHoveredStage(null);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePipeline) return;

    // Consolidate phone/emails
    const consolidatedPhones = phoneList.filter(p => p.trim() !== '').join(', ');
    const consolidatedEmails = emailList.filter(e => e.trim() !== '').join(', ');

    // Check if updating existing
    if ((newDeal as any).id) {
        const updates: Partial<Lead> = {
             ...newDeal,
            title: newDeal.title || 'Untitled Mission',
            phone: consolidatedPhones,
            email: consolidatedEmails
        };
        await updateLead(activePipeline.id, (newDeal as any).id, updates);
        showToast("Mission Updated");
    } else {
        const deal: Lead = {
            id: '', // Hook will generate ID
            title: newDeal.title || 'Untitled Mission',
            company: newDeal.company || 'Unknown Intel',
            contact: newDeal.contact || 'Stakeholder',
            value: Number(newDeal.value) || 0,
            stage: newDeal.stage || activePipeline.stages[0],
            probability: newDeal.probability || 20,
            createdAt: new Date().toISOString(),
            priority: newDeal.priority as Lead['priority'] || 'Medium',
            phone: consolidatedPhones,
            email: consolidatedEmails,
            owner: newDeal.owner,
            label: newDeal.label,
            expectedCloseDate: newDeal.expectedCloseDate,
            sourceChannel: newDeal.sourceChannel,
            sourceChannelId: newDeal.sourceChannelId,
            visibility: newDeal.visibility,
            currency: newDeal.currency
        };
        await addLead(activePipeline.id, deal);
        showToast("Strategic Mission Logged");
    }

    setIsNewLeadModalOpen(false);
    
    // Reset Form
    setNewDeal({ 
      title: '', company: '', contact: '', value: 0, stage: '', priority: 'Medium', probability: 20,
      phone: '', email: '', owner: user?.name || 'Agency Admin', currency: 'USD', label: 'None',
      sourceChannel: 'Portal', visibility: "Team"
    });
    setPhoneList(['']);
    setEmailList(['']);
  };

  const handleDeleteLead = async (id: string) => {
    if (!activePipeline) return;
    if (!window.confirm("Purge this mission record?")) return;
    await deleteLead(activePipeline.id, id);
    showToast("Record Nuked");
  };

  // Multi-field handlers
  const handlePhoneChange = (index: number, value: string) => {
    const list = [...phoneList];
    list[index] = value;
    setPhoneList(list);
  };
  const addPhoneField = () => setPhoneList([...phoneList, '']);
  const removePhoneField = (index: number) => {
    if (phoneList.length > 1) {
        setPhoneList(phoneList.filter((_, i) => i !== index));
    } else {
        setPhoneList(['']);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const list = [...emailList];
    list[index] = value;
    setEmailList(list);
  };
  const addEmailField = () => setEmailList([...emailList, '']);
  const removeEmailField = (index: number) => {
      if (emailList.length > 1) {
        setEmailList(emailList.filter((_, i) => i !== index));
      } else {
        setEmailList(['']);
      }
  };

  const visibleLeads = useMemo(() => {
    if (!activePipeline) return [];
    return activePipeline.leads.filter(lead => {
      if (lead.visibility === 'Private') {
        return lead.owner === user?.name;
      }
      return true;
    });
  }, [activePipeline, user?.name]);

  const stats = useMemo(() => {
    const leads = visibleLeads;
    return { 
      totalValue: leads.reduce((acc, curr) => acc + curr.value, 0),
      count: leads.length,
      weightedValue: leads.reduce((acc, curr) => acc + (curr.value * (curr.probability / 100)), 0)
    };
  }, [visibleLeads]);

  // Combine team members and current user for the owner dropdown
  const ownerOptions = useMemo(() => {
      const options = teamMembers.map(m => m.name);
      if (user?.name && !options.includes(user.name)) {
          options.unshift(user.name);
      }
      return options;
  }, [teamMembers, user]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  // Ensure there's an active pipeline before rendering main content
  if (!activePipeline) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#0c0c0e] flex-col gap-4 text-white">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-sm font-bold text-zinc-500">Initializing Registry...</p>
        </div>
      );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[100vw] overflow-x-hidden pb-12 transition-colors">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1100] bg-slate-900 dark:bg-zinc-800 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 border border-white/10 uppercase tracking-[0.2em]">
           <Sparkles size={12} className="text-blue-400" /> {toast}
        </div>
      )}

      {/* STRATEGIC COMMAND HUB */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-6 py-3 rounded-2xl shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative" ref={switcherRef}>
            <button 
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="flex items-center gap-3 px-5 py-2 bg-slate-900 dark:bg-black text-white rounded-xl hover:bg-slate-800 dark:hover:bg-zinc-800 transition-all shadow-xl group border border-transparent dark:border-zinc-800"
            >
              <BarChart3 size={18} className="text-blue-400" />
              <div className="text-left">
                <p className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest leading-none mb-1">Strategic Domain</p>
                <p className="text-sm font-black tracking-tight leading-none truncate max-w-[140px]">{activePipeline.name}</p>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSwitcherOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100] py-3 animate-in zoom-in-95 duration-200">
                <div className="px-5 py-2">
                  <p className="text-[8px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-4">Registry</p>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                    {pipelines.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => { setActivePipelineId(p.id); setIsSwitcherOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left rounded-xl transition-all flex items-center justify-between group ${activePipelineId === p.id ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-black/40'}`}
                      >
                        <div className="min-w-0">
                          <p className={`text-xs font-black truncate ${activePipelineId === p.id ? 'text-white' : 'text-slate-900 dark:text-zinc-100'}`}>{p.name}</p>
                          <p className={`text-[9px] font-bold ${activePipelineId === p.id ? 'text-blue-100' : 'text-slate-400 dark:text-zinc-500'}`}>
                            {p.leads.filter(lead => lead.visibility !== 'Private' || lead.owner === user?.name).length} Records
                          </p>
                        </div>
                        {activePipelineId === p.id && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-slate-100 dark:bg-zinc-800 my-3" />
                <div className="px-3 space-y-1">
                  <button onClick={(e) => { e.stopPropagation(); handleCreatePipeline(); }} className="w-full px-5 py-2.5 text-left text-[10px] font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl flex items-center gap-3 uppercase tracking-widest">
                    <FolderPlus size={16} /> New Protocol
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleRenamePipeline(); }} className="w-full px-5 py-2.5 text-left text-[10px] font-black text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-3 uppercase tracking-widest">
                    <Edit2 size={16} /> Rename Active
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteActivePipeline(); }} className="w-full px-5 py-2.5 text-left text-[10px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl flex items-center gap-3 uppercase tracking-widest">
                    <Trash2 size={16} /> Purge Current
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-10 w-px bg-slate-100 dark:bg-zinc-800 hidden lg:block mx-2" />
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex flex-col">
              <p className="text-[7px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Active</p>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{stats.count}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-[7px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Raw Val</p>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{format(stats.totalValue)}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-[7px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Weighted</p>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400 leading-none">{format(Math.round(stats.weightedValue))}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setNewDeal({ 
                 title: '', company: '', contact: '', value: 0, stage: activePipeline.stages[0], 
                 priority: 'Medium', probability: 20,
                 phone: '', email: '', owner: user?.name || 'Agency Admin', currency: 'USD', label: 'None',
                 sourceChannel: 'Portal', visibility: "Team"
              });
              setPhoneList(['']);
              setEmailList(['']);
              setIsNewLeadModalOpen(true);
            }}
            className="flex items-center gap-3 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-200 dark:shadow-blue-900/30 hover:bg-blue-700 transition-all active:scale-95 group"
          >
            <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> New Mission
          </button>
        </div>
      </div>

      {/* ULTRA-DENSE PIPELINE GRID */}
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar min-h-[78vh] px-1 pt-2">
        {activePipeline.stages.map((stage, idx) => (
          <div 
            key={stage} 
            className={`flex flex-col w-[280px] shrink-0 space-y-3 transition-all duration-300 ${hoveredStage === stage ? 'bg-blue-50/40 dark:bg-blue-900/10 rounded-3xl p-2 -m-2 z-10' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setHoveredStage(stage); }}
            onDragLeave={() => setHoveredStage(null)}
            onDrop={() => handleDrop(stage)}
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm group rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-6 h-6 bg-slate-900 dark:bg-black text-white text-[9px] font-black rounded shadow-sm border dark:border-zinc-800">{idx + 1}</div>
                <h3 className="font-black text-slate-900 dark:text-zinc-100 uppercase tracking-widest text-[10px] truncate">{stage}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                  {visibleLeads.filter(l => l.stage === stage).length}
                </span>
                <button onClick={() => handleDeleteStage(stage)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 transition-all">
                  <X size={14} />
                </button>
              </div>
            </div>
            
            {/* Card Inventory */}
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto no-scrollbar pb-10">
              {visibleLeads.filter(l => l.stage === stage).map((lead, lIdx) => (
                <div 
                  key={lead.id} 
                  draggable
                  onDragStart={() => setDraggedLeadId(lead.id)}
                  onDoubleClick={(e) => { e.stopPropagation(); setPreviewLead(lead); }}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.4)] hover:border-blue-200 dark:hover:border-zinc-600 transition-all group cursor-grab active:cursor-grabbing relative animate-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${lIdx * 30}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <PriorityBadge priority={lead.priority} />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all relative">
                      <button 
                        onMouseDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }} 
                        className="p-1 text-slate-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={12}/>
                      </button>
                      <button 
                        onMouseDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); setActiveLeadMenu(activeLeadMenu === lead.id ? null : lead.id); }} 
                        className={`p-1 transition-colors ${activeLeadMenu === lead.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400'}`}
                      >
                        <MoreHorizontal size={12}/>
                      </button>
                      
                      {activeLeadMenu === lead.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-xl z-[999] overflow-hidden animate-in fade-in zoom-in-95" 
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => e.stopPropagation()}
                        >
                           <button 
                                onClick={() => { 
                                    setNewDeal(lead); 
                                    setPhoneList(lead.phone ? lead.phone.split(', ') : ['']);
                                    setEmailList(lead.email ? lead.email.split(', ') : ['']);
                                    setIsNewLeadModalOpen(true); 
                                    setActiveLeadMenu(null); 
                                }} 
                                className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                            >
                                <Edit2 size={12}/> Edit
                            </button>
                           <div className="h-px bg-slate-100 dark:bg-zinc-800" />
                           <button 
                                onClick={() => { handleDeleteLead(lead.id); setActiveLeadMenu(null); }} 
                                className="w-full text-left px-3 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                            >
                                <Trash2 size={12}/> Delete
                            </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 mb-1 tracking-tight truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{lead.title || lead.company}</h4>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-tight mb-4">
                    <User size={10} className="text-blue-500" /> {lead.contact}
                  </div>
                  
                  <div className="pt-3 border-t border-slate-50 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">{format(lead.value)}</p>
                    <div className="text-right">
                       <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                             <div className="bg-blue-600 h-full transition-all duration-700" style={{width: `${lead.probability}%`}} />
                          </div>
                          <span className="text-[9px] font-black text-slate-900 dark:text-zinc-400 leading-none">{lead.probability}%</span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              
                <button 
                onClick={() => { 
                    setNewDeal({ 
                        title: '', company: '', contact: '', value: 0, stage: stage, 
                        priority: 'Medium', probability: 20,
                        phone: '', email: '', owner: user?.name || 'Agency Admin', currency: 'USD', label: 'None',
                        sourceChannel: 'Portal', visibility: "Team"
                    });
                    setPhoneList(['']);
                    setEmailList(['']);
                    setIsNewLeadModalOpen(true); 
                }}
                className="w-full py-5 border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-xl text-slate-400 dark:text-zinc-600 font-black text-[9px] uppercase tracking-widest hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2 group"
              >
                <Plus size={12} strokeWidth={3} className="group-hover:scale-125 transition-transform" /> Initialize Mission
              </button>
            </div>
          </div>
        ))}

        {/* STRATEGIC PHASE DEPLOYMENT */}
        <div className="flex flex-col w-[280px] shrink-0">
           <button 
             onClick={() => setIsAddPhaseModalOpen(true)}
             className="w-full h-14 bg-white dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-slate-50 dark:hover:bg-black hover:border-blue-400 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group shadow-sm"
           >
              <div className="p-2 bg-slate-50 dark:bg-black rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <Layers size={18} />
              </div>
              Deploy Strategic Phase
           </button>
        </div>
      </div>

      {/* DETAILED ADD MISSION MODAL (PIPEDRIVE-STYLE LAYOUT) */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 md:p-8 overflow-hidden animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsNewLeadModalOpen(false)} />
          
          <div className="relative bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 dark:border-white/5 ring-1 ring-white/10">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100/10 dark:border-white/5 flex items-center justify-between shrink-0 bg-white/50 dark:bg-white/5 z-10 backdrop-blur-md">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-900 dark:bg-black text-white rounded-[1.25rem] shadow-xl border border-white/10 dark:border-white/5">
                  <Target size={28} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{(newDeal as any).id ? 'Edit Mission' : 'Add Mission'} (Opportunity)</h3>
                  <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] mt-0.5">Strategic Registry Sync</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsNewLeadModalOpen(false)} className="p-4 text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-100/10 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/10"><X size={28} /></button>
            </div>

            <form onSubmit={handleCreateLead} className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/20 dark:bg-black/20">
              <div className="flex flex-col md:flex-row divide-x divide-slate-100/10 dark:divide-white/5">
                {/* Left Panel: Detailed Form Fields */}
                <div className="flex-1 p-10 space-y-8 bg-white/40 dark:bg-transparent">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                        <UserCircle size={10} className="text-blue-500" /> CONTACT PERSON
                      </label>
                      <input required autoFocus type="text" placeholder="POC Name..." className="w-full px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 hover:bg-slate-100/50 dark:hover:bg-white/10" value={newDeal.contact || ''} onChange={(e) => setNewDeal({...newDeal, contact: e.target.value})} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                        <Building2 size={10} className="text-indigo-500" /> ORGANIZATION
                      </label>
                      <input required type="text" placeholder="Entity ID / Company Name..." className="w-full px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 hover:bg-slate-100/50 dark:hover:bg-white/10" value={newDeal.company || ''} onChange={(e) => setNewDeal({...newDeal, company: e.target.value})} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                        <Hash size={10} className="text-emerald-500" /> MISSION TITLE
                      </label>
                      <input type="text" placeholder="e.g. Project Q4 Retainer" value={newDeal.title || ''} onChange={(e) => setNewDeal({...newDeal, title: e.target.value})} className="w-full px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 hover:bg-slate-100/50 dark:hover:bg-white/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                          <DollarSign size={10} className="text-amber-500" /> VALUE
                        </label>
                        <div className="flex gap-2">
                           <input required type="number" className="flex-1 px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500/50 font-black text-base text-slate-900 dark:text-white hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all" value={newDeal.value || ''} onChange={(e) => setNewDeal({...newDeal, value: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                          <Zap size={10} className="text-rose-500" /> CONFIDENCE %
                        </label>
                        <input required type="number" max="100" className="w-full px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500/50 font-black text-base text-slate-900 dark:text-white hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all" value={newDeal.probability ?? ''} onChange={(e) => setNewDeal({...newDeal, probability: Number(e.target.value)})} />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                          <DollarSign size={10} className="text-blue-500" /> CURRENCY
                        </label>
                       <PipelineDropdown 
                          value={newDeal.currency || 'USD'}
                          options={GLOBAL_CURRENCIES.map(c => c.code)}
                          onChange={(val: string) => setNewDeal({...newDeal, currency: val})}
                          placeholder="Select Currency"
                       />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1 ml-1">ACTIVE PIPELINE</label>
                      <input disabled value={activePipeline?.name || ''} className="w-full px-6 py-4.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-2xl text-slate-400 dark:text-zinc-600 font-black text-sm cursor-not-allowed" />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1 ml-1">MISSION PHASE</label>
                      <div className="flex bg-slate-100/50 dark:bg-black/40 p-1.5 rounded-2xl gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10">
                        {activePipeline.stages.map(s => (
                          <button 
                            key={s} 
                            type="button"
                            onClick={() => setNewDeal({...newDeal, stage: s})}
                            className={`flex-1 min-w-[80px] py-3.5 px-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${newDeal.stage === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400 hover:bg-white/50 dark:hover:bg-white/5'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                          <Tag size={10} /> LABEL
                        </label>
                        <PipelineDropdown 
                           value={newDeal.label || 'None'}
                           options={['None', 'Hot Lead', 'Cold']}
                           onChange={(val: string) => setNewDeal({...newDeal, label: val})}
                           placeholder="Select Label"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                          <Calendar size={10} /> EXPECTED CLOSE
                        </label>
                        <input type="date" className="w-full px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500/50 font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all" value={newDeal.expectedCloseDate || ''} onChange={(e) => setNewDeal({...newDeal, expectedCloseDate: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1 ml-1">OWNER</label>
                      <PipelineDropdown 
                         value={newDeal.owner || 'Agency Admin'}
                         options={ownerOptions}
                         onChange={(val: string) => setNewDeal({...newDeal, owner: val})}
                         placeholder="Assign Owner"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1 ml-1">SOURCE CHANNEL</label>
                        <input type="text" placeholder="Portal" className="w-full px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500/50 font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all" value={newDeal.sourceChannel || ''} onChange={(e) => setNewDeal({...newDeal, sourceChannel: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1 ml-1">SOURCE CHANNEL ID</label>
                        <input type="text" placeholder="Optional identifier" className="w-full px-6 py-4.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500/50 font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all" value={newDeal.sourceChannelId || ''} onChange={(e) => setNewDeal({...newDeal, sourceChannelId: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                        <Eye size={10} /> VISIBLE TO
                      </label>
                      <PipelineDropdown 
                         value={newDeal.visibility || 'Team'}
                         options={['Team', "Item owner's visibility group", 'Private']}
                         onChange={(val: string) => setNewDeal({...newDeal, visibility: val})}
                         placeholder="Select Visibility"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Panel: Entity Details Meta */}
                <div className="w-full md:w-96 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md p-10 space-y-10">
                   <div className="space-y-8">
                     <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] border-b border-slate-200/50 dark:border-white/10 pb-5">ENTITY DETAILS</p>
                     
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block ml-1 flex items-center gap-2"><Phone size={12} className="text-slate-400 dark:text-zinc-600"/> PHONE</label>
                           
                           {phoneList.map((ph, idx) => (
                               <div key={idx} className="flex gap-2">
                                   <input 
                                     type="tel" 
                                     placeholder="+1 (555) 000-0000" 
                                     className="w-full px-6 py-4 bg-white/50 dark:bg-black/50 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100/10 focus:border-blue-500/50 font-bold text-sm transition-all text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-black/80" 
                                     value={ph || ''} 
                                     onChange={(e) => handlePhoneChange(idx, e.target.value)} 
                                   />
                                   {phoneList.length > 1 && (
                                       <button onClick={() => removePhoneField(idx)} className="p-4 bg-white/50 dark:bg-black/50 rounded-2xl border border-slate-200/60 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                                   )}
                               </div>
                           ))}
                           
                           <button type="button" onClick={addPhoneField} className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:underline ml-1">+ ADD PHONE</button>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block ml-1 flex items-center gap-2"><Mail size={12} className="text-slate-400 dark:text-zinc-600" /> EMAIL</label>
                           
                           {emailList.map((em, idx) => (
                               <div key={idx} className="flex gap-2">
                                   <input 
                                     type="email" 
                                     placeholder="contact@organization.com" 
                                     className="w-full px-6 py-4 bg-white/50 dark:bg-black/50 border border-slate-200/60 dark:border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100/10 focus:border-blue-500/50 font-bold text-sm transition-all text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-black/80" 
                                     value={em || ''} 
                                     onChange={(e) => handleEmailChange(idx, e.target.value)} 
                                   />
                                   {emailList.length > 1 && (
                                       <button onClick={() => removeEmailField(idx)} className="p-4 bg-white/50 dark:bg-black/50 rounded-2xl border border-slate-200/60 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                                   )}
                               </div>
                           ))}

                           <button type="button" onClick={addEmailField} className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:underline ml-1">+ ADD EMAIL</button>
                        </div>
                     </div>

                     <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100/50 dark:border-blue-900/30 flex flex-col items-center text-center gap-4 mt-12 backdrop-blur-sm">
                        <div className="p-4 bg-white dark:bg-white/5 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm border border-blue-100 dark:border-white/10"><Info size={24} /></div>
                        <p className="text-[11px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest">CRM Insight</p>
                        <p className="text-[11px] text-blue-600/80 dark:text-blue-300/60 font-semibold leading-relaxed">All deal history and activity logs will be automatically synchronized with this contact's global profile.</p>
                     </div>
                   </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-end bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl sticky bottom-0 z-20">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setIsNewLeadModalOpen(false)} className="px-8 py-4 text-slate-900 dark:text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/10 transition-all backdrop-blur-sm">CANCEL</button>
                  <button type="submit" className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] hover:bg-emerald-700 transition-all active:scale-95 border border-emerald-500/50">
                    SAVE
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PHASE MODAL */}
      {isAddPhaseModalOpen && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80" onClick={() => setIsAddPhaseModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-zinc-800">
            <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-900 dark:bg-black text-white rounded-xl shadow-lg border dark:border-zinc-800"><Layers size={20} className="text-blue-400" /></div>
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Deploy Strategic Phase</h3>
               </div>
               <button onClick={() => setIsAddPhaseModalOpen(false)} className="p-2 text-slate-400 dark:text-zinc-600 hover:text-slate-900 dark:hover:text-white transition-all"><X size={24}/></button>
            </div>
            <form onSubmit={handleDeployPhase} className="p-10 space-y-8 bg-slate-50/20 dark:bg-black/20">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Phase Protocol Name</label>
                <input required autoFocus type="text" placeholder="e.g. Technical Audit" className="w-full px-6 py-4.5 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100/10 focus:bg-white dark:focus:bg-black text-sm font-bold transition-all shadow-sm dark:text-white" value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 dark:hover:bg-blue-700 transition-all shadow-xl active:scale-95">Initialize Phase Protocol</button>
            </form>
          </div>
        </div>
      )}

      {/* MISSION PREVIEW MODAL (READ-ONLY) */}
      {previewLead && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setPreviewLead(null)} />
          <div className="relative bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
             
             {/* Header */}
             <div className="p-10 pb-8 border-b border-slate-100/20 dark:border-white/5 flex justify-between items-start bg-gradient-to-b from-white/40 to-transparent dark:from-white/5">
                <div className="space-y-4 w-full">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
                         <Target size={32} />
                      </div>
                      <div className="min-w-0 flex-1">
                         <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">{previewLead.title || previewLead.company}</h2>
                         <p className="text-sm font-bold text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                            <Building2 size={14}/> {previewLead.company}
                         </p>
                      </div>
                   </div>
                </div>
                <button onClick={() => setPreviewLead(null)} className="p-4 bg-slate-100/50 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:rotate-90">
                   <X size={24} />
                </button>
             </div>

             {/* Content Body */}
             <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                
                {/* Financials & Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-slate-50/50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5 flex flex-col justify-between">
                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Deal Value</p>
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {format(previewLead.value)}
                            </h3>
                            <span className="text-xs text-slate-400 dark:text-zinc-600 font-bold">{previewLead.currency}</span>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-slate-50/50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5 flex flex-col justify-between">
                         <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Win Probability</p>
                         <div className="flex items-center gap-4">
                             <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{previewLead.probability}%</span>
                             <div className="h-2 flex-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${previewLead.probability}%` }} />
                             </div>
                         </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-slate-50/50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5 flex flex-col justify-between">
                         <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Current Phase</p>
                         <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"/>
                             <span className="text-2xl font-black text-slate-900 dark:text-white">{previewLead.stage}</span>
                         </div>
                    </div>
                </div>

                {/* Details Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   {/* Contact Intel */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-white/5">
                          <UserCircle size={16} className="text-blue-500"/>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Contact Intelligence</h4>
                      </div>
                      <div className="space-y-4">
                          <div>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Point of Contact</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{previewLead.contact}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Email</p>
                                  <p className="text-sm font-medium text-slate-600 dark:text-zinc-300 truncate" title={previewLead.email}>{previewLead.email || 'N/A'}</p>
                              </div>
                              <div>
                                  <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Phone</p>
                                  <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">{previewLead.phone || 'N/A'}</p>
                              </div>
                          </div>
                      </div>
                   </div>

                   {/* Strategic Meta */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-white/5">
                          <Info size={16} className="text-purple-500"/>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Strategic Metadata</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Priority Level</p>
                              <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                 previewLead.priority === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                 previewLead.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              }`}>
                                 {previewLead.priority}
                              </span>
                          </div>
                          <div>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Label</p>
                              <span className="inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-transparent">
                                 {previewLead.label || 'None'}
                              </span>
                          </div>
                          <div>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Visibility</p>
                              <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">{previewLead.visibility || 'Team'}</p>
                          </div>
                          <div>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase mb-1">Expected Close</p>
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{previewLead.expectedCloseDate || 'TBD'}</p>
                          </div>
                      </div>
                   </div>
                </div>

                {/* System Data */}
                <div className="p-8 bg-black/20 rounded-[2rem] border border-white/5 space-y-4">
                    <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-4">SYSTEM LOGS</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase">Created At</p>
                            <p className="text-xs font-mono text-slate-300 dark:text-zinc-400 mt-1">{new Date(previewLead.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase">Source Channel</p>
                            <p className="text-xs font-mono text-slate-300 dark:text-zinc-400 mt-1">{previewLead.sourceChannel || 'Direct'} <span className="opacity-50">{previewLead.sourceChannelId ? `(${previewLead.sourceChannelId})` : ''}</span></p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase">Mission Owner</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-white font-bold">{previewLead.owner?.[0] || 'A'}</div>
                                <p className="text-xs font-bold text-slate-300 dark:text-zinc-400">{previewLead.owner || 'Unassigned'}</p>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Footer Actions */}
             <div className="p-8 border-t border-slate-100/20 dark:border-white/5 flex items-center justify-end gap-4 bg-white/80 dark:bg-[#09090b]/90 backdrop-blur-xl">
                 <button onClick={() => setPreviewLead(null)} className="px-6 py-3 text-slate-500 dark:text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">Close Viewer</button>
                 <button 
                   onClick={() => {
                      setNewDeal(previewLead); 
                      setPhoneList(previewLead.phone ? previewLead.phone.split(', ') : ['']);
                      setEmailList(previewLead.email ? previewLead.email.split(', ') : ['']);
                      setIsNewLeadModalOpen(true); 
                      setPreviewLead(null);
                   }}
                   className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
                 >
                    Modify Mission Data
                 </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Pipeline;
