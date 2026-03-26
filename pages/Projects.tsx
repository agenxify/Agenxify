
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, User, CheckCircle2, MoreHorizontal, Layers, Plus, 
  Search, Filter, ArrowUpRight, Clock, AlertCircle, Trash2, 
  Edit3, Copy, X, ChevronDown, CheckCircle, GripVertical, Target,
  LayoutGrid, List as ListIcon, DollarSign, PieChart, Star,
  ShieldCheck, Briefcase, Zap, Activity
} from 'lucide-react';
import { MOCK_PROJECTS, MOCK_PROFILES, AVAILABLE_PLANS, MOCK_CLIENTS } from '../constants.tsx';
import { Project, Profile } from '../types.ts';
import * as ReactRouterDom from 'react-router-dom';
import { supabase } from '../supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext';

const { Link } = ReactRouterDom as any;

// --- Custom Components ---

const ProjectModal = ({ 
  isOpen, 
  onClose, 
  project, 
  onSave, 
  clients, 
  teamMembers 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  project: Partial<Project>; 
  onSave: (p: Partial<Project>) => void;
  clients: any[];
  teamMembers: Profile[];
}) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    client: clients[0]?.name || '',
    status: 'Planning',
    priority: 'Medium',
    progress: 0,
    budget: 0,
    dueDate: new Date().toISOString().split('T')[0],
    description: '',
    team: [],
    tags: []
  });

  useEffect(() => {
    if (isOpen) {
      if (project.id) {
        setFormData({ ...project });
      } else {
        setFormData({
            title: '',
            client: clients[0]?.name || '',
            status: 'Planning',
            priority: 'Medium',
            progress: 0,
            budget: 0,
            dueDate: new Date().toISOString().split('T')[0],
            description: '',
            team: [],
            tags: []
        });
      }
    }
  }, [isOpen, project, clients]);

  if (!isOpen) return null;

  const toggleTeamMember = (id: string) => {
    setFormData(prev => ({
        ...prev,
        team: prev.team?.includes(id) 
            ? prev.team.filter(t => t !== id)
            : [...(prev.team || []), id]
    }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && !formData.tags?.includes(val)) {
        setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
        e.currentTarget.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl z-10 rounded-t-[2.5rem]">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                <Layers size={24} />
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{project.id ? 'Edit Mission Protocol' : 'Initialize Project'}</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Global Directive Configuration</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Project Identifier</label>
             <input 
               autoFocus
               value={formData.title} 
               onChange={e => setFormData({...formData, title: e.target.value})}
               className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-black text-lg text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
               placeholder="Project Name..."
             />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Client Entity</label>
                <div className="relative">
                   <select 
                     value={formData.client} 
                     onChange={e => setFormData({...formData, client: e.target.value})}
                     className="w-full px-5 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-700 dark:text-zinc-300 outline-none appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                   >
                     {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     <option value="Internal">Internal Agency</option>
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Deadline</label>
                <div className="relative">
                   <input 
                     type="date"
                     value={formData.dueDate} 
                     onChange={e => setFormData({...formData, dueDate: e.target.value})}
                     className="w-full px-5 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-700 dark:text-zinc-300 outline-none focus:border-blue-500 transition-colors"
                   />
                   <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 outline-none cursor-pointer"
                >
                  <option>Planning</option>
                  <option>In Progress</option>
                  <option>Review</option>
                  <option>Completed</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Priority</label>
                <select 
                  value={formData.priority} 
                  onChange={e => setFormData({...formData, priority: e.target.value as any})}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 outline-none cursor-pointer"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Budget ($)</label>
                <input 
                  type="number"
                  value={formData.budget} 
                  onChange={e => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 outline-none"
                  placeholder="0.00"
                />
             </div>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Progress: {formData.progress}%</label>
             </div>
             <input 
               type="range" min="0" max="100" 
               value={formData.progress} 
               onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})}
               className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Assigned Operatives</label>
             <div className="flex flex-wrap gap-2">
                {teamMembers.map(m => {
                   const isSelected = formData.team?.includes(m.id);
                   return (
                     <button 
                       key={m.id}
                       onClick={() => toggleTeamMember(m.id)}
                       className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                         isSelected 
                         ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                         : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600'
                       }`}
                     >
                       <img src={m.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                       <span className="text-[10px] font-bold uppercase">{m.name.split(' ')[0]}</span>
                     </button>
                   );
                })}
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Objective Brief</label>
             <textarea 
               value={formData.description}
               onChange={e => setFormData({...formData, description: e.target.value})}
               className="w-full h-32 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-300 outline-none resize-none focus:border-blue-500 transition-colors"
               placeholder="Describe the mission parameters..."
             />
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black/40 flex justify-end gap-3 rounded-b-[2.5rem]">
           <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-xs text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all">Cancel</button>
           <button onClick={() => onSave(formData)} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
              {project.id ? 'Save Changes' : 'Launch Project'}
           </button>
        </div>
      </div>
    </div>
  );
};


import { useAgencySubscription } from '../hooks/useAgencySubscription';

const Projects: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { workspace, subscription } = useAgencySubscription();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All Clients');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'Kanban' | 'List'>('Kanban');
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project>>({});

  // Plan State
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

  // Data for Dropdowns
  const [clients] = useState(() => JSON.parse(localStorage.getItem('agencyos_clients') || JSON.stringify(MOCK_CLIENTS)));
  const [teamMembers] = useState(() => JSON.parse(localStorage.getItem('agencyos_team_members') || JSON.stringify(MOCK_PROFILES)));

  // Close menus on click outside
  useEffect(() => {
    const handleClick = () => {
        setActiveMenu(null);
        setIsFilterOpen(false);
    }
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Fetch Projects from Supabase
  const fetchProjects = async () => {
    if (!user || !currentWorkspace) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data as any); // Map to frontend type
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user, currentWorkspace]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast(msg);
      setToastType(type);
      setTimeout(() => setToast(null), 3000);
  };

  const handleCreateNew = () => {
      const limit = currentPlan.projectLimit;
      if (limit !== -1 && projects.length >= limit) {
          showToast(`Plan Limit Reached: Upgrade to create more projects`, 'error');
          return;
      }
      setEditingProject({});
      setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
      setEditingProject(project);
      setIsModalOpen(true);
      setActiveMenu(null);
  };

  const handleSaveProject = async (data: Partial<Project>) => {
      // Optimistic update
      let updatedList;
      if (data.id) {
          updatedList = projects.map(p => p.id === data.id ? { ...p, ...data } as Project : p);
      } else {
          const newProject = { 
             id: `p-${Date.now()}`,
             ...data,
             title: data.title || 'Untitled Project',
             client: data.client || 'Internal',
             status: data.status || 'Planning',
             progress: data.progress || 0,
             dueDate: data.dueDate || new Date().toISOString().split('T')[0],
             team: data.team || [],
          } as Project;
          updatedList = [newProject, ...projects];
      }
      setProjects(updatedList);
      setIsModalOpen(false);
      
      // Supabase Update
      const payload = {
         id: data.id || `p-${Date.now()}`,
         workspace_id: currentWorkspace?.id,
         owner_id: user?.uid,
         title: data.title,
         client: data.client, // This field is technically 'client_name' in my previous SQL, but let's try 'client' or map it
         // Mapping to SQL structure:
         // id, owner_id, title, client, status, progress, budget, due_date, description
         status: data.status,
         progress: data.progress,
         budget: data.budget,
         due_date: data.dueDate,
         description: data.description
      };
      
      // Since the column in SQL is 'client' (text), we map data.client to it.
      // If the column name is different, we adjust here. The previous SQL said `client text`.
      
      const { error } = await supabase.from('projects').upsert(payload);
      
      if (error) {
          showToast("Error saving project", 'error');
          console.error(error);
          // Revert optimistic update here if needed (omitted for brevity)
      } else {
          showToast(data.id ? "Project Updated" : "Project Initialized");
      }
  };

  const statuses = ['Planning', 'In Progress', 'Review', 'Completed'];

  const handleStatusChange = async (id: string, status: string) => {
    if (!currentWorkspace) return;
    // Optimistic
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: status as Project['status'] } : p));
    setActiveMenu(null);
    
    // DB
    await supabase.from('projects').update({ status }).eq('id', id).eq('workspace_id', currentWorkspace.id);
  };

  const handleDelete = async (id: string) => {
    if (!currentWorkspace) return;
    if (window.confirm("Terminate this project protocol?")) {
        // Optimistic
        setProjects(prev => prev.filter(p => p.id !== id));
        showToast("Project Terminated");
        
        // DB
        await supabase.from('projects').delete().eq('id', id).eq('workspace_id', currentWorkspace.id);
    }
    setActiveMenu(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData("projectId", id);
      setDraggedProject(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (status: string) => {
      if (draggedProject) {
          handleStatusChange(draggedProject, status);
          setDraggedProject(null);
      }
  };

  const filteredProjects = projects.filter(p => {
      const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.client?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'All Clients' || p.client === activeFilter;
      return matchesSearch && matchesFilter;
  });

  const uniqueClients = Array.from(new Set(projects.map(p => p.client)));
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  if (loading) return <div className="p-10 text-white text-center">Loading Mission Control...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-40 relative min-h-screen">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-4 border border-white/10">
          {toastType === 'error' ? <AlertCircle size={18} className="text-rose-500" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
          {toast}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Mission Control</h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-full">
                <Activity size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{projects.length} Active Directives</span>
             </div>
             <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">Global Budget: ${totalBudget.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
           {/* Search */}
           <div className="relative flex-1 sm:w-64 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search directives..." 
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-sm text-slate-700 dark:text-white transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-[1.8rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <button onClick={() => setViewMode('Kanban')} className={`p-3 rounded-2xl transition-all ${viewMode === 'Kanban' ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}><LayoutGrid size={18}/></button>
              <button onClick={() => setViewMode('List')} className={`p-3 rounded-2xl transition-all ${viewMode === 'List' ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}><ListIcon size={18}/></button>
           </div>
           
           <button 
             onClick={handleCreateNew}
             className="px-6 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 dark:shadow-blue-900/30 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 group"
           >
             <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> New Protocol
           </button>
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
         <button onClick={() => setActiveFilter('All Clients')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeFilter === 'All Clients' ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-700'}`}>All Clients</button>
         {uniqueClients.map(c => (
             <button key={c} onClick={() => setActiveFilter(c)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeFilter === c ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-700'}`}>{c}</button>
         ))}
      </div>

      {viewMode === 'Kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar min-h-[600px]">
           {statuses.map(status => (
              <div 
                 key={status} 
                 className="flex-1 min-w-[320px] flex flex-col bg-slate-50/50 dark:bg-black/20 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800/50 p-2"
                 onDragOver={handleDragOver}
                 onDrop={() => handleDrop(status)}
              >
                 <div className="flex items-center justify-between px-6 py-4 mb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">{status}</h3>
                    <span className="bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-zinc-800">{filteredProjects.filter(p => p.status === status).length}</span>
                 </div>
                 
                 <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar px-2 pb-2">
                    {filteredProjects.filter(p => p.status === status).map((project) => (
                       <div 
                          key={project.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          className="group bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all relative overflow-hidden cursor-grab active:cursor-grabbing"
                       >
                          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === project.id ? null : project.id); }}
                               className="p-2 bg-slate-100 dark:bg-black rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                             >
                                <MoreHorizontal size={16} />
                             </button>
                             {activeMenu === project.id && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 overflow-hidden">
                                   <button onClick={() => handleEditProject(project)} className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all flex items-center gap-2"><Edit3 size={12}/> Edit Details</button>
                                   <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1"/>
                                   <button onClick={() => handleDelete(project.id)} className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all flex items-center gap-2"><Trash2 size={12}/> Terminate</button>
                                </div>
                             )}
                          </div>
                          
                          <div className="mb-4 flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                project.priority === 'High' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 border-rose-200 dark:border-rose-900/30' :
                                project.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 border-amber-200 dark:border-amber-900/30' :
                                'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border-emerald-200 dark:border-emerald-900/30'
                             }`}>
                                {project.priority || 'Normal'}
                             </span>
                          </div>

                          <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 pr-6">{project.title}</h3>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-6">{project.client}</p>
                          
                          <div className="space-y-4">
                             <div>
                                <div className="flex justify-between items-end mb-1.5">
                                   <span className="text-[9px] font-black text-slate-400 uppercase">Completion</span>
                                   <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">{project.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress}%` }} />
                                </div>
                             </div>
                             
                             <div className="pt-4 border-t border-slate-50 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                   {(project.team || []).slice(0,3).map((mid, i) => (
                                      <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 overflow-hidden">
                                         <img src={`https://i.pravatar.cc/150?u=${mid}`} className="w-full h-full object-cover" alt=""/>
                                      </div>
                                   ))}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                   <Clock size={12} /> {new Date(project.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                </span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                 <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                    <th className="px-10 py-6">Mission</th>
                    <th className="px-10 py-6">Client</th>
                    <th className="px-10 py-6">Timeline</th>
                    <th className="px-10 py-6">Budget</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                 {filteredProjects.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                       <td className="px-10 py-6">
                          <p className="font-black text-sm text-slate-900 dark:text-white">{p.title}</p>
                          {p.priority && <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${p.priority === 'High' ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-slate-400 bg-slate-100 dark:bg-zinc-800'}`}>{p.priority}</span>}
                       </td>
                       <td className="px-10 py-6 text-xs font-bold text-slate-600 dark:text-zinc-400">{p.client}</td>
                       <td className="px-10 py-6">
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">Due {new Date(p.dueDate).toLocaleDateString()}</span>
                             <div className="w-20 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${p.progress}%` }} />
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-6 font-mono text-xs font-bold text-slate-900 dark:text-white">${(p.budget || 0).toLocaleString()}</td>
                       <td className="px-10 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                             p.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 border-emerald-200 dark:border-emerald-900/30' :
                             p.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-500 border-blue-200 dark:border-blue-900/30' :
                             'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}>{p.status}</span>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEditProject(p)} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={14}/></button>
                             <button onClick={() => handleDelete(p.id)} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        project={editingProject} 
        onSave={handleSaveProject} 
        clients={clients}
        teamMembers={teamMembers}
      />

    </div>
  );
};

export default Projects;
