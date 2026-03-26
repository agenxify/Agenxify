
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Briefcase, Clock, CheckCircle, AlertCircle, TrendingUp, Search, 
  Filter, Plus, Download, LayoutList, LayoutGrid, MoreHorizontal,
  X, User, Trash2, Edit2, CheckCircle2, Hash, Globe, Layers, Zap, Info, Send,
  ChevronRight, Folder, ChevronDown, Check, Loader2
} from 'lucide-react';
import { Request } from '../types.ts';
import * as ReactRouterDom from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useRequests } from '../hooks/useRequests.ts';
import { useSystemData } from '../hooks/useSystemData.ts';
import { useClients } from '../hooks/useClients.ts';
import { useTeam } from '../hooks/useTeam.ts';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

const { Link } = ReactRouterDom as any;

// Reusable Custom Dropdown Component
const CustomDropdown = ({ 
  value, 
  options, 
  onChange, 
  placeholder, 
  icon: Icon, 
  className = "",
  renderOption
}: {
  value: string;
  options: any[];
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: any;
  className?: string;
  renderOption?: (opt: any) => React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => (typeof o === 'string' ? o : o.value || o.name || o.id) === value);
  const displayValue = selectedOption ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label || selectedOption.name || selectedOption.value) : value;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-[1.75rem] text-sm font-bold text-slate-900 dark:text-white hover:border-blue-500/50 transition-all focus:ring-4 focus:ring-blue-500/10 outline-none"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-slate-400 dark:text-zinc-500" />}
          <span className="truncate">{displayValue || placeholder}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-2 animate-in zoom-in-95 duration-200">
          {options.map((opt, idx) => {
            const val = typeof opt === 'string' ? opt : opt.value || opt.name || opt.id;
            const label = typeof opt === 'string' ? opt : opt.label || opt.name || opt.value;
            const isSelected = value === val;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => { onChange(val); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between mb-1 last:mb-0 ${
                  isSelected 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                   {renderOption ? renderOption(opt) : label}
                </div>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MultiSelectDropdown = ({ 
  values, 
  options, 
  onChange, 
  placeholder, 
  icon: Icon, 
  className = "",
  renderOption
}: {
  values: string[];
  options: any[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  icon?: any;
  className?: string;
  renderOption?: (opt: any) => React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = values.length > 0 
    ? values.map(v => {
        const opt = options.find(o => (typeof o === 'string' ? o : o.value || o.name || o.id) === v);
        return opt ? (typeof opt === 'string' ? opt : opt.label || opt.name || opt.value) : v;
      }).join(', ')
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-[1.75rem] text-sm font-bold text-slate-900 dark:text-white hover:border-blue-500/50 transition-all focus:ring-4 focus:ring-blue-500/10 outline-none"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {Icon && <Icon size={16} className="text-slate-400 dark:text-zinc-500 shrink-0" />}
          <span className="truncate">{displayValue}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-2 animate-in zoom-in-95 duration-200">
          {options.map((opt, idx) => {
            const val = typeof opt === 'string' ? opt : opt.value || opt.name || opt.id;
            const label = typeof opt === 'string' ? opt : opt.label || opt.name || opt.value;
            const isSelected = values.includes(val);
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => { 
                  e.preventDefault();
                  if (isSelected) {
                    onChange(values.filter(v => v !== val));
                  } else {
                    onChange([...values, val]);
                  }
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between mb-1 last:mb-0 ${
                  isSelected 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                   {renderOption ? renderOption(opt) : label}
                </div>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Requests: React.FC = () => {
  const { user } = useAuth();
  const { requests, loading, addRequest, updateRequest, deleteRequest } = useRequests();
  const { checkSharedLimit } = usePlanEnforcement();
  
  // Use specific hooks for direct DB access (avoiding mocks)
  const { clients } = useClients();
  const { members: teamMembers } = useTeam();
  const { services, projects } = useSystemData();

  useEffect(() => {
    console.log("DEBUG: Requests page clients:", clients);
  }, [clients]);

  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  const handleNewRequest = async () => {
    const canCreate = await checkSharedLimit('requests', 'projectLimit', { column: 'status', operator: 'not.in', value: ['Completed', 'Overdue'] });
    if (!canCreate) {
      showToast(`Plan Limit Reached: Upgrade to create more active missions`, 'error');
      return;
    }
    setIsModalOpen(true);
  };

  const [newRequest, setNewRequest] = useState({
    title: '',
    client: '',
    service: '',
    priority: 'Medium' as Request['priority'],
    description: '',
    project: '',
    assignedTo: [] as string[]
  });

  // Reset defaults if lists change
  useEffect(() => {
    if (clients.length > 0 && !newRequest.client) {
       setNewRequest(prev => ({ ...prev, client: clients[0].name }));
    }
    if (services.length > 0 && !newRequest.service) {
      setNewRequest(prev => ({ ...prev, service: services[0].name }));
    }
    if (teamMembers.length > 0 && newRequest.assignedTo.length === 0) {
      setNewRequest(prev => ({ ...prev, assignedTo: [teamMembers[0].name] }));
    }
  }, [clients, services, teamMembers]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const canCreate = await checkSharedLimit('requests', 'projectLimit', { column: 'status', operator: 'not.in', value: ['Completed', 'Overdue'] });
    if (!canCreate) {
        showToast(`Plan Limit Reached: Upgrade to create more active missions`, 'error');
        return;
    }

    const request: Request = {
      id: `REQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      title: newRequest.title,
      client: newRequest.client || (clients[0]?.name || 'Unknown'),
      service: newRequest.service || (services[0]?.name || 'General'),
      project: newRequest.project || undefined,
      assignedTo: newRequest.assignedTo.length > 0 ? newRequest.assignedTo.join(', ') : (teamMembers[0]?.name || 'Admin'),
      status: 'Pending',
      priority: newRequest.priority,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      description: newRequest.description,
      creditsConsumed: 0,
      creditsTotal: 10,
      files: [],
      checklist: [],
      timesheets: []
    };
    
    const success = await addRequest(request);
    
    if (success) {
      setIsModalOpen(false);
      showToast("Mission Initialized Successfully");
      setNewRequest({ 
          title: '', 
          client: clients[0]?.name || '', 
          service: services[0]?.name || '', 
          priority: 'Medium', 
          description: '', 
          project: '', 
          assignedTo: teamMembers[0] ? [teamMembers[0].name] : [] 
      });
    } else {
       showToast("Failed to initialize mission", 'error');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this mission? This action will purge all associated logs and files.')) {
      await deleteRequest(id);
      showToast("Mission Terminated");
    }
    setActiveMenu(null);
  };

  const handleStatusUpdate = async (id: string, status: Request['status']) => {
    await updateRequest(id, { status });
    showToast(`Status updated to ${status}`);
    setActiveMenu(null);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Client Permission Filter
      if (user?.role === 'client' && req.client !== user.name) {
          return false;
      }
      
      // Team Member Permission Filter
      if (user?.role === 'team') {
          const assignees = req.assignedTo.split(',').map(s => s.trim());
          if (!assignees.includes(user.name)) {
              return false;
          }
      }
      
      const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           req.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Statuses' || req.status === statusFilter;
      const matchesPriority = priorityFilter === 'All Priorities' || req.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requests, searchTerm, statusFilter, priorityFilter, user]);

  const stats = useMemo(() => {
    // Only calculate stats for visible requests
    const relevantRequests = user?.role === 'client' 
        ? requests.filter(r => r.client === user.name)
        : requests;

    const total = relevantRequests.length;
    const pending = relevantRequests.filter(r => r.status === 'Pending').length;
    const inProgress = relevantRequests.filter(r => r.status === 'In Progress').length;
    const completed = relevantRequests.filter(r => r.status === 'Completed').length;
    const overdue = relevantRequests.filter(r => r.status === 'Overdue').length;
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';

    return [
      { label: 'Total Requests', value: total, icon: Briefcase, color: 'text-slate-600 bg-slate-100' },
      { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
      { label: 'In Progress', value: inProgress, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
      { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
      { label: 'Overdue', value: overdue, icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
      { label: 'Completion Rate', value: `${rate}%`, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
    ];
  }, [requests, user]);

  // Filter projects by selected client for the dropdown
  const availableProjects = useMemo(() => {
     return projects.filter(p => p.client === newRequest.client);
  }, [projects, newRequest.client]);

  // Only Team Members for Assignment (Operatives)
  const assignableUsers = useMemo(() => {
      return teamMembers.map(m => ({ value: m.name, label: m.name }));
  }, [teamMembers]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20 relative transition-colors">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-12 flex items-center gap-4 border border-white/10">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${toastType === 'error' ? 'bg-rose-500' : 'bg-blue-600'}`}>
             {toastType === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          </div>
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Enterprise Requests</h2>
          <p className="text-slate-500 dark:text-zinc-500 font-medium mt-1">Global production queue and mission command center.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
            <button onClick={() => setView('list')} className={`p-2.5 rounded-lg transition-all ${view === 'list' ? 'bg-slate-900 dark:bg-black text-white shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'}`}><LayoutList size={20}/></button>
            <button onClick={() => setView('kanban')} className={`p-2.5 rounded-lg transition-all ${view === 'kanban' ? 'bg-slate-900 dark:bg-black text-white shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'}`}><LayoutGrid size={20}/></button>
          </div>
          {user?.role !== 'client' && (
              <button className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-xl shadow-blue-200 dark:shadow-blue-900/30 transition-all flex items-center gap-2" onClick={handleNewRequest}>
                <Plus size={20} /> New Request
              </button>
          )}
        </div>
      </div>

      {user?.role !== 'client' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm flex flex-col items-center text-center group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
              <div className={`p-3 rounded-2xl ${stat.color} dark:bg-opacity-20 mb-4 group-hover:scale-110 transition-transform`}><stat.icon size={20}/></div>
              <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase mb-1 tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h4>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl shadow-blue-500/5 overflow-visible">
        <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-300" size={20} />
            <input 
              type="text" 
              placeholder="Search active missions..." 
              className="w-full pl-14 pr-20 py-4 bg-slate-50 dark:bg-black/40 border-2 border-transparent hover:border-slate-200 dark:hover:border-zinc-700 focus:border-blue-500/50 focus:bg-white dark:focus:bg-black rounded-2xl text-sm font-bold outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-inner focus:shadow-lg focus:shadow-blue-500/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex pointer-events-none">
               <kbd className="hidden sm:inline-block px-2 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[10px] font-black text-slate-400 dark:text-zinc-500 shadow-sm">
                  CMD+K
               </kbd>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <div className="w-48">
                <CustomDropdown 
                   value={statusFilter}
                   options={['All Statuses', 'Pending', 'In Progress', 'Completed', 'Overdue']}
                   onChange={setStatusFilter}
                   className="z-20"
                />
             </div>
             <div className="w-48">
                <CustomDropdown 
                   value={priorityFilter}
                   options={['All Priorities', 'High', 'Medium', 'Low']}
                   onChange={setPriorityFilter}
                   className="z-10"
                />
             </div>
          </div>
        </div>
        
        {view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                  <th className="px-10 py-6">Mission & Identifier</th>
                  <th className="px-10 py-6">Partner</th>
                  <th className="px-10 py-6">Timeline</th>
                  <th className="px-10 py-6">Operational State</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-blue-50/30 dark:hover:bg-white/5 transition-colors group animate-in fade-in">
                    <td className="px-10 py-6">
                      <Link to={`/requests/${req.id}`} className="font-black text-lg text-slate-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block mb-1">{req.title}</Link>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 rounded text-[9px] font-black uppercase tracking-widest">{req.service}</span>
                        <span className="text-[10px] text-slate-300 dark:text-zinc-700 font-bold">{req.id}</span>
                        {req.project && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                                <Folder size={10} /> {req.project}
                            </span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-black text-slate-700 dark:text-zinc-300">{req.client}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shadow-sm shrink-0">
                            <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 truncate max-w-[120px]">{req.assignedTo}</span>
                        </div>
                        <div className="flex items-center text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                          <Clock size={12} className="mr-1.5" /> {req.dueDate}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          req.status === 'Completed' ? 'bg-emerald-500 text-white' :
                          req.status === 'In Progress' ? 'bg-blue-500 text-white' :
                          req.status === 'Overdue' ? 'bg-rose-500 text-white' :
                          'bg-amber-400 text-white'
                        }`}>
                          {req.status}
                        </span>
                        <span className={`text-[10px] font-black uppercase ${
                          req.priority === 'High' ? 'text-rose-500' :
                          req.priority === 'Medium' ? 'text-amber-500' :
                          'text-emerald-500'
                        }`}>
                          {req.priority} Priority
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <Link to={`/requests/${req.id}`} className="p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-zinc-600 rounded-xl transition-all shadow-sm hover:scale-110 active:scale-95" title="Inspect Mission">
                          <Edit2 size={18} />
                        </Link>
                        {user?.role !== 'client' && (
                            <button onClick={() => handleDeleteRequest(req.id)} className="p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-600 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-zinc-600 rounded-xl transition-all shadow-sm hover:scale-110 active:scale-95" title="Terminate Mission">
                              <Trash2 size={18} />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-slate-50/50 dark:bg-black/20">
            {filteredRequests.map(req => (
              <div key={req.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all group flex flex-col relative animate-in zoom-in-95 duration-300">
                <div className="absolute top-6 right-6 z-10">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === req.id ? null : req.id)}
                    className="p-2 text-slate-300 dark:text-zinc-600 hover:text-slate-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-black/60 rounded-xl"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {activeMenu === req.id && user?.role !== 'client' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-700 shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                      <button onClick={() => handleStatusUpdate(req.id, 'In Progress')} className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Move to Active</button>
                      <button onClick={() => handleStatusUpdate(req.id, 'Completed')} className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">Mark Finished</button>
                      <div className="h-px bg-slate-50 dark:bg-zinc-700 my-1" />
                      <button onClick={() => handleDeleteRequest(req.id)} className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all">Terminate</button>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between mb-6">
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    req.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    req.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    req.status === 'Overdue' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                    'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {req.status}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    req.priority === 'High' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' :
                    req.priority === 'Medium' ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                    'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  }`} />
                </div>
                
                <Link to={`/requests/${req.id}`} className="text-xl font-black text-slate-900 dark:text-zinc-100 leading-tight mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 pr-6">
                  {req.title}
                </Link>
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest bg-slate-50 dark:bg-black px-2 py-1 rounded">{req.service}</span>
                    {req.project && (
                         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/10 px-2 py-1 rounded flex items-center gap-1">
                             <Folder size={10} /> {req.project}
                         </span>
                    )}
                </div>
                
                <div className="mt-auto space-y-5 pt-6 border-t border-slate-50 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 shadow-sm overflow-hidden">
                        <img src={`https://i.pravatar.cc/150?u=${req.assignedTo.split(',')[0].trim()}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-zinc-200">{req.assignedTo}</p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-tighter">Mission Owner</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 dark:text-zinc-200">{req.dueDate}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-tighter">Deadline</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRequests.length === 0 && (
          <div className="py-40 text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-900/50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200 dark:text-zinc-800 mb-6 shadow-inner">
              <Briefcase size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100">Queue is Clear</h3>
            <p className="text-slate-500 dark:text-zinc-500 font-medium mt-1">Try widening your search or check finished missions.</p>
          </div>
        )}
      </div>

      {/* REFINED HIGH-CONTRAST CREATE REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 md:p-12 overflow-hidden animate-in fade-in duration-300">
          <div 
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 transition-opacity duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          <div className="relative bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.5),0_0_1px_rgba(0,0,0,0.1)] w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-400 ease-out border-2 border-slate-100 dark:border-zinc-800 scrollbar-hide overflow-visible">
            <form onSubmit={handleCreateRequest} className="p-10 md:p-14">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-6">
                  <div className="p-6 bg-slate-900 dark:bg-black text-white rounded-[2rem] shadow-2xl border dark:border-zinc-800">
                    <Plus size={36} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">New Resource Request</h3>
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
                      <p className="text-slate-400 dark:text-zinc-600 font-black uppercase text-[10px] tracking-[0.3em]">Agency Operations Core</p>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-5 bg-slate-50 dark:bg-black text-slate-300 dark:text-zinc-600 hover:text-slate-900 dark:hover:text-white rounded-[1.75rem] transition-all hover:bg-white dark:hover:bg-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700 border border-transparent shadow-sm"><X size={28} /></button>
              </div>

              <div className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] block ml-4 flex items-center gap-2"><Hash size={12} className="text-blue-500"/> Mission Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Brief name of the requirement..." 
                    className="w-full px-8 py-5.5 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-[1.75rem] outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:bg-white dark:focus:bg-zinc-900 font-bold text-xl text-slate-900 dark:text-white transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-800"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] block ml-4 flex items-center gap-2"><Globe size={12} className="text-indigo-500"/> Partner Client</label>
                    <CustomDropdown 
                      value={newRequest.client}
                      options={clients.map(c => ({ value: c.name, label: c.name }))}
                      onChange={(val) => {
                          console.log("DEBUG: Client changed to:", val);
                          setNewRequest({...newRequest, client: val});
                      }}
                      placeholder="Select Client..."
                      className="z-50"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] block ml-4 flex items-center gap-2"><Layers size={12} className="text-purple-500"/> Service Line</label>
                    <CustomDropdown 
                      value={newRequest.service}
                      options={services.map(s => ({ value: s.name, label: s.name }))}
                      onChange={(val) => setNewRequest({...newRequest, service: val})}
                      placeholder="Select Service..."
                      className="z-40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Optional Project Linking */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] block ml-4 flex items-center gap-2"><Folder size={12} className="text-emerald-500"/> Associated Request (Unfinished)</label>
                        <CustomDropdown 
                          value={newRequest.project}
                          options={[{ value: '', label: 'No Request' }, ...requests.filter(r => r.status !== 'Completed').map(r => ({ value: r.title, label: r.title }))]}
                          onChange={(val) => {
                              console.log("DEBUG: Project/Request changed to:", val);
                              setNewRequest({...newRequest, project: val});
                          }}
                          placeholder="Select Unfinished Request..."
                          className="z-30"
                        />
                    </div>

                    {/* Team Member Assignment */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] block ml-4 flex items-center gap-2"><User size={12} className="text-blue-500"/> Assigned Operative(s)</label>
                        <MultiSelectDropdown 
                          values={newRequest.assignedTo}
                          options={assignableUsers}
                          onChange={(vals) => {
                              console.log("DEBUG: Operatives changed to:", vals);
                              setNewRequest({...newRequest, assignedTo: vals});
                          }}
                          placeholder="Assign Agent(s)..."
                          className="z-20"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] block ml-4 flex items-center gap-2"><Zap size={12} className="text-amber-500"/> Operational Risk Level</label>
                  <div className="flex gap-4">
                    {(['Low', 'Medium', 'High'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewRequest({...newRequest, priority: p})}
                        className={`flex-1 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
                          newRequest.priority === p 
                          ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-700 shadow-xl' 
                          : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] block ml-4 flex items-center gap-2"><Info size={12} className="text-blue-500"/> Mission Intelligence Briefing</label>
                  <textarea 
                    placeholder="Provide deep context for the production team..." 
                    className="w-full px-8 py-8 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-[2.5rem] outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:bg-white dark:focus:bg-zinc-900 font-medium text-lg text-slate-700 dark:text-zinc-300 transition-all min-h-[160px] resize-none shadow-sm"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-12">
                <button 
                  type="submit"
                  className="w-full py-8 bg-slate-900 dark:bg-blue-600 text-white rounded-[2.25rem] font-black text-2xl shadow-[0_32px_64px_-16px_rgba(15,23,42,0.4)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-6 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Send size={32} className="relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                  <span className="relative z-10">Initialize Production</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
