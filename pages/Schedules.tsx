
import React, { useState, useMemo } from 'react';
import { 
  Users, Calendar, Clock, Plus, Filter, Search, 
  ChevronRight, MoreHorizontal, CheckCircle2, AlertCircle,
  Zap, Layers, Target, ShieldCheck, Timer, Briefcase,
  X, Sparkles, UserCheck, Activity
} from 'lucide-react';
import { MOCK_PROFILES } from '../constants';

const Schedules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Team Availability' | 'Sprint Cycles'>('Team Availability');
  const [searchTerm, setSearchTerm] = useState('');

  const teamSchedules = useMemo(() => {
    return MOCK_PROFILES.map(p => ({
        ...p,
        status: Math.random() > 0.3 ? 'On-Shift' : 'Away',
        currentProject: Math.random() > 0.5 ? 'Global Redesign' : 'Brand Audit Q4',
        utilization: Math.floor(Math.random() * 40) + 60,
        nextBlock: '14:00 - Design Review'
    }));
  }, []);

  const sprints = [
    { id: 'S-01', name: 'UI Overhaul v2', start: 'Oct 01', end: 'Oct 14', status: 'In Progress', progress: 65, team: 4 },
    { id: 'S-02', name: 'Mobile Engine Sync', start: 'Oct 15', end: 'Oct 28', status: 'Planning', progress: 10, team: 3 },
    { id: 'S-03', name: 'Revenue Pipeline 4.0', start: 'Oct 05', end: 'Oct 12', status: 'Completed', progress: 100, team: 6 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-40 relative transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Operational Rhythms</h2>
          <p className="text-slate-500 dark:text-zinc-500 font-medium text-lg">Managing workforce availability and tactical sprint velocity.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-[1.75rem] border border-slate-200 dark:border-zinc-800 shadow-inner">
           {(['Team Availability', 'Sprint Cycles'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-8 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === tab ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"><UserCheck size={22}/></div>
               <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Active Now</span>
            </div>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white">12 / 15</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Workforce on-shift</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"><Activity size={22}/></div>
               <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Velocity</span>
            </div>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white">94%</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Sprint efficiency rate</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"><Zap size={22}/></div>
               <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Directives</span>
            </div>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white">42</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Tasks due this week</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform"><Timer size={22}/></div>
               <span className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Utilization</span>
            </div>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white">82%</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Average load factor</p>
         </div>
      </div>

      {/* Main View */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-slate-200 dark:border-zinc-800 shadow-2xl shadow-blue-500/5 overflow-hidden">
        <div className="p-10 border-b border-slate-100 dark:border-zinc-800 flex flex-col lg:flex-row items-center gap-8">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600" size={20} />
              <input 
                type="text" 
                placeholder={`Filter ${activeTab.toLowerCase()} registry...`}
                className="w-full pl-16 pr-6 py-4.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[1.75rem] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="px-8 py-4.5 bg-blue-600 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3">
              <Plus size={18} strokeWidth={3}/> Adjust Protocol
           </button>
        </div>

        <div className="p-2 overflow-x-auto">
          {activeTab === 'Team Availability' ? (
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50/50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                  <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.25em]">
                     <th className="px-10 py-8">Workforce Member</th>
                     <th className="px-10 py-8">Status</th>
                     <th className="px-10 py-8">Current Assignment</th>
                     <th className="px-10 py-8">Load Factor</th>
                     <th className="px-10 py-8 text-right">Operational Log</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {teamSchedules.map(member => (
                    <tr key={member.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-[1.5rem] bg-slate-100 dark:bg-zinc-800 overflow-hidden shadow-inner border-2 border-white dark:border-zinc-700">
                                <img src={member.avatar} className="w-full h-full object-cover" alt=""/>
                             </div>
                             <div>
                                <p className="text-base font-black text-slate-900 dark:text-white">{member.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">{member.role}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            member.status === 'On-Shift' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}>
                             {member.status}
                          </span>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                             <Layers size={14} className="text-blue-500" />
                             <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">{member.currentProject}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="space-y-2 max-w-[120px]">
                             <div className="flex justify-between items-end">
                                <span className="text-[9px] font-black text-slate-400">{member.utilization}%</span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${member.utilization > 85 ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${member.utilization}%` }} />
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <button className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm">
                             <MoreHorizontal size={18} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-10 bg-slate-50/50 dark:bg-black/20">
               {sprints.map(sprint => (
                 <div key={sprint.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm group hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start mb-6">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                         sprint.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' :
                         sprint.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' :
                         'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                       }`}>
                          {sprint.status}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sprint.id}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-6 leading-tight">{sprint.name}</h4>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <div className="flex justify-between items-end">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Velocity Progress</span>
                             <span className="text-xs font-black text-slate-900 dark:text-white">{sprint.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${sprint.progress}%` }} />
                          </div>
                       </div>
                       <div className="pt-6 border-t border-slate-50 dark:border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <Calendar size={14} className="text-blue-500" />
                             <span className="text-xs font-bold text-slate-500">{sprint.start} - {sprint.end}</span>
                          </div>
                          <div className="flex -space-x-3">
                             {Array.from({ length: sprint.team }).map((_, i) => (
                               <div key={i} className="w-8 h-8 rounded-xl border-2 border-white dark:border-zinc-900 bg-slate-200 dark:bg-zinc-800 overflow-hidden shadow-sm hover:scale-110 transition-transform">
                                  <img src={`https://i.pravatar.cc/150?u=team-${i}`} className="w-full h-full object-cover" alt=""/>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
               <button className="flex flex-col items-center justify-center p-10 bg-slate-50/50 dark:bg-black/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-900 transition-all group gap-4">
                  <div className="p-5 bg-white dark:bg-zinc-900 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Plus size={32}/></div>
                  <span className="text-xs font-black uppercase tracking-widest">Deploy Sprint Cycle</span>
               </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[3rem] border border-blue-100 dark:border-blue-900/30 flex items-center gap-8 group">
         <div className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/10 transition-transform group-hover:scale-105">
            <ShieldCheck size={32} />
         </div>
         <div>
            <h4 className="text-lg font-black text-blue-900 dark:text-blue-200 flex items-center gap-2">Protocol Sync Active <Sparkles size={18} className="text-blue-400" /></h4>
            <p className="text-sm font-medium text-blue-700/80 dark:text-blue-300/60 leading-relaxed max-w-2xl mt-1">Schedules are automatically synchronized with global mission deadlines and employee capacity algorithms to ensure zero-bottleneck production cycles.</p>
         </div>
      </div>
    </div>
  );
};

export default Schedules;
