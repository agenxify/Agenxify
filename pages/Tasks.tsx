
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Table, LayoutGrid, Calendar, 
  MoreHorizontal, CheckCircle2,
  X, Briefcase, Layers,
  Clock, Trash2, Edit3, 
  AlertCircle, CheckSquare, Play, Square,
  Target, Zap
} from 'lucide-react';
import { Task } from '../types';
import { MOCK_PROFILES } from '../constants';
import { useAuth } from '../context/AuthContext.tsx';
import { useTasks } from '../hooks/useTasks.ts';
import { useRequests } from '../hooks/useRequests.ts';
import { useTickets } from '../hooks/useTickets.ts';

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colorBase = color.split(' ')[0].replace('text-', '').split('-')[0];
  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between group hover:shadow-xl dark:hover:border-zinc-700 transition-all relative overflow-hidden">
      <div className="absolute right-[-5%] top-[-5%] opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-1000 rotate-12 pointer-events-none">
         <Icon size={140} className="dark:text-white" />
      </div>
      <div>
         <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">{label}</p>
         <h4 className="text-4xl font-black text-slate-900 dark:text-white">{value}</h4>
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 text-${colorBase}-600 dark:text-${colorBase}-400 shadow-lg relative z-10 group-hover:rotate-6 transition-transform`}>
         <Icon size={28} />
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ 
  task: Task, 
  onClick: () => void, 
  onStatusChange: (s: Task['status']) => void,
  onEdit: () => void,
  onDelete: () => void,
  activeMenuId: string | null,
  onToggleMenu: (id: string) => void
}> = ({ task, onClick, onStatusChange, onEdit, onDelete, activeMenuId, onToggleMenu }) => {
  const isOverdue = task.status !== 'Done' && new Date(task.dueDate) < new Date();
  const isMenuOpen = activeMenuId === task.id;

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] hover:border-blue-200 dark:hover:border-zinc-700 transition-all group cursor-pointer relative animate-in slide-in-from-bottom-4"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
          task.priority === 'High' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' :
          task.priority === 'Medium' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' : 
          'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
        }`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all relative">
           <button 
             onClick={(e) => { e.stopPropagation(); onStatusChange('Done'); }} 
             className="p-1 text-slate-300 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
             title="Mark as Done"
           >
             <CheckCircle2 size={16}/>
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onToggleMenu(task.id); }} 
             className={`p-1 transition-colors ${isMenuOpen ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-white'}`}
           >
             <MoreHorizontal size={16}/>
           </button>
           
           {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                 <div className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-zinc-900/50">Move To</div>
                 {(['To Do', 'In Progress', 'Review', 'Done'] as const).map(status => (
                    <button 
                        key={status}
                        onClick={(e) => { e.stopPropagation(); onStatusChange(status); onToggleMenu(''); }}
                        className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2 ${task.status === status ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-zinc-400'}`}
                    >
                        {task.status === status && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>}
                        {status}
                    </button>
                 ))}
                 <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1"/>
                 <button onClick={(e) => { e.stopPropagation(); onEdit(); onToggleMenu(''); }} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                    <Edit3 size={12}/> Edit Details
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); onDelete(); onToggleMenu(''); }} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 flex items-center gap-2">
                    <Trash2 size={12}/> Delete Task
                 </button>
              </div>
           )}
        </div>
      </div>

      <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</h4>
      <div className="flex items-center gap-2 mb-6">
         <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
           {task.refType === 'Mission' ? <Briefcase size={10} className="text-blue-500"/> : <Layers size={10} className="text-indigo-500"/>}
           {task.project}
         </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase">
           <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-slate-200 dark:bg-zinc-800'}`} />
           <span className={`${isOverdue ? 'text-rose-500' : 'text-slate-400 dark:text-zinc-600'}`}>
             {task.dueDate} {task.dueTime && <span className="ml-1 opacity-60">@ {task.dueTime}</span>}
           </span>
        </div>
        <img src={`https://i.pravatar.cc/150?u=${task.assignee}`} className="w-6 h-6 rounded-lg border-2 border-white dark:border-zinc-800 shadow-sm" alt="" />
      </div>
    </div>
  );
};

const Tasks: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // Use Hooks
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks();
  const { requests } = useRequests();
  const { tickets } = useTickets();

  // Global Config Sync
  const [globalConfig, setGlobalConfig] = useState(() => {
    const saved = localStorage.getItem('agencyos_global_config');
    return saved ? JSON.parse(saved) : { 
      agencyName: 'AgencyOS',
      defaultTaskPriority: 'Medium',
      defaultTaskType: 'Operational'
    };
  });

  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '', status: 'To Do', priority: 'Medium', type: 'Operational', 
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    assignee: currentUser?.name || 'Admin', refType: 'Internal', refId: '', description: '', checklist: [], estimatedTime: '1h 00m'
  });

  useEffect(() => {
      // Sync listener for global config changes
      const handleSync = (e: any) => { if(e.detail) setGlobalConfig(e.detail); };
      window.addEventListener('agencyos_config_updated', handleSync);
      return () => window.removeEventListener('agencyos_config_updated', handleSync);
  }, []);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = () => setActiveCardMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task: Task = {
      id: '', // Hook generates ID
      title: newTask.title || 'Untitled Task',
      status: (newTask.status as any) || 'To Do',
      priority: (newTask.priority as any) || 'Medium',
      type: (newTask.type as any) || 'Operational',
      dueDate: newTask.dueDate || '-',
      dueTime: newTask.dueTime || '09:00',
      assignee: newTask.assignee || currentUser?.name || 'Admin',
      project: newTask.refType === 'Mission' 
        ? requests.find(r => r.id === newTask.refId)?.title || 'Internal' 
        : newTask.refType === 'Ticket' 
        ? tickets.find(t => t.id === newTask.refId)?.subject || 'Support'
        : 'General Operations',
      spentTime: '0h 00m',
      estimatedTime: newTask.estimatedTime || '1h 00m',
      refType: newTask.refType as any,
      refId: newTask.refId,
      description: newTask.description,
      checklist: []
    };
    
    addTask(task);
    setIsModalOpen(false);
    showToast("Task Initialized");
    
    setNewTask({ 
      title: '', 
      status: 'To Do', 
      priority: globalConfig.defaultTaskPriority, 
      type: globalConfig.defaultTaskType,
      refType: 'Internal', 
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '09:00'
    });
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    updateTask(id, updates);
    if (selectedTask?.id === id) setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm("Purge this task protocol?")) {
      deleteTask(id);
      setSelectedTask(null);
      showToast("Task Terminated");
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tasks, searchTerm]);

  const stats = useMemo(() => ({
    pending: tasks.filter(t => t.status !== 'Done').length,
    overdue: tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length,
    done: tasks.filter(t => t.status === 'Done').length
  }), [tasks]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
      );
  }

  return (
    <div className="w-full px-8 space-y-8 pb-40 relative transition-colors">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[11000] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl flex items-center gap-4 border border-white/10 dark:border-white/5 animate-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-emerald-400" /> {toast}
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Command Queue</h2>
          <p className="text-slate-500 dark:text-zinc-500 font-medium text-lg">{globalConfig.agencyName} Strategic Mission Log.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="bg-white dark:bg-zinc-900 p-2 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 flex shadow-sm">
             <button onClick={() => setView('table')} className={`p-3 rounded-xl transition-all ${view === 'table' ? 'bg-slate-900 dark:bg-black text-white shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}><Table size={20}/></button>
             <button onClick={() => setView('kanban')} className={`p-3 rounded-xl transition-all ${view === 'kanban' ? 'bg-slate-900 dark:bg-black text-white shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}><LayoutGrid size={20}/></button>
           </div>
           
           <button 
             onClick={() => setIsModalOpen(true)}
             className="px-8 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-primary hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 group border border-transparent dark:border-blue-500/30"
           >
             <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Initialize Task
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Active Tasks" value={stats.pending} icon={Zap} color="text-blue-600 bg-blue-50" />
        <StatCard label="Strategic Delay" value={stats.overdue} icon={AlertCircle} color="text-rose-600 bg-rose-50" />
        <StatCard label="Mission Complete" value={stats.done} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
        <StatCard label="Queue Velocity" value="92%" icon={Target} color="text-indigo-600 bg-indigo-50" />
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col xl:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={20} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-sm text-slate-700 dark:text-white placeholder:text-slate-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
          {(['To Do', 'In Progress', 'Review', 'Done'] as const).map(status => (
            <div key={status} className="flex flex-col space-y-4">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl">
                <h3 className="font-black text-slate-900 dark:text-zinc-100 uppercase tracking-widest text-[11px]">{status}</h3>
                <span className="text-[10px] font-black text-slate-400">{filteredTasks.filter(t => t.status === status).length}</span>
              </div>
              <div className="space-y-4">
                {filteredTasks.filter(t => t.status === status).map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => setSelectedTask(task)} 
                    onStatusChange={(s) => handleUpdateTask(task.id, { status: s })} 
                    onEdit={() => { setSelectedTask(task); setIsModalOpen(true); }}
                    onDelete={() => handleDeleteTask(task.id)}
                    activeMenuId={activeCardMenu}
                    onToggleMenu={(id) => setActiveCardMenu(activeCardMenu === id ? null : id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-10 py-6">Objective</th>
                <th className="px-10 py-6">State</th>
                <th className="px-10 py-6">Schedule</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-blue-50/10 dark:hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedTask(task)}>
                  <td className="px-10 py-6 font-black text-slate-900 dark:text-white">{task.title}</td>
                  <td className="px-10 py-6">
                    <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase bg-slate-100 dark:bg-zinc-800 text-slate-400">{task.status}</span>
                  </td>
                  <td className="px-10 py-6 text-xs font-black text-slate-500">{task.dueDate} {task.dueTime && <span className="opacity-40">@ {task.dueTime}</span>}</td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-3 text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center animate-in fade-in duration-300 p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-slate-100 dark:border-zinc-800 flex flex-col p-10">
            <form onSubmit={handleCreateTask} className="space-y-8">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg"><Plus size={24}/></div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">New Task Protocol</h3>
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 dark:bg-black rounded-2xl"><X size={28}/></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Name</label>
                  <input required autoFocus type="text" className="w-full px-8 py-5 bg-slate-50 dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Date</label>
                    <div className="relative">
                       <input type="date" required className="w-full px-8 py-5 bg-slate-50 dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} />
                       <Calendar size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Time</label>
                    <div className="relative">
                       <input type="time" required className="w-full px-8 py-5 bg-slate-50 dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" value={newTask.dueTime} onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})} />
                       <Clock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Priority</label>
                    <div className="flex gap-2">
                       {['Low', 'Medium', 'High'].map(p => (
                         <button 
                           key={p} 
                           type="button"
                           onClick={() => setNewTask({...newTask, priority: p as any})}
                           className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${newTask.priority === p ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-black border-slate-100 dark:border-zinc-800 text-slate-400 hover:border-blue-500'}`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>
                </div>
              </div>
              <button type="submit" className="w-full py-8 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-primary hover:bg-blue-700 active:scale-95 transition-all">Initialize Mission Protocol</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
