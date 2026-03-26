
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Filter, Search, 
  Calendar as CalendarIcon, Clock, Briefcase, CheckSquare,
  MoreHorizontal, ChevronDown, CheckCircle2, User, Target,
  X, Layers, Zap, Trash2, Edit3, Save, Globe, AlertCircle,
  ShieldCheck, Hash, UserCircle, List, Video, History,
  Maximize2, LayoutGrid, ListFilter, CalendarDays, ShieldAlert
} from 'lucide-react';
import { Request, Task, TimeEntry } from '../types';
import { MOCK_PROFILES, MOCK_CLIENTS } from '../constants';
import { useRequests } from '../hooks/useRequests.ts';
import { useTasks } from '../hooks/useTasks.ts';
import { useBookings } from '../hooks/useBookings.ts';
import { useTimesheets } from '../hooks/useTimesheets.ts';

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Month' | 'Day'>('Month');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Missions' | 'Tasks' | 'Bookings' | 'Logs'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [collisionError, setCollisionError] = useState<string | null>(null);

  // --- Unified Data Streams ---
  const { requests, addRequest, updateRequest, deleteRequest } = useRequests();
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { bookings, addBooking, deleteBooking } = useBookings();
  const { entries: timesheets, deleteEntry } = useTimesheets();

  const [formData, setFormData] = useState<any>({
    title: '',
    type: 'Task',
    dueDate: '',
    dueTime: '09:00',
    duration: 30, // minutes
    priority: 'Medium',
    description: '',
    client: MOCK_CLIENTS[0]?.name || '',
    assignedTo: 'Agency Admin'
  });

  useEffect(() => {
    const handleGlobalSchedule = (e: any) => {
      if (e.detail?.date) {
        setFormData({
          title: '',
          type: 'Task',
          description: '',
          client: MOCK_CLIENTS[0]?.name || '',
          assignedTo: 'Agency Admin',
          priority: 'Medium',
          duration: 30,
          dueDate: e.detail.date,
          dueTime: e.detail.time || '09:00'
        });
      }
      setIsModalOpen(true);
      setIsEditMode(false);
      setCollisionError(null);
    };
    
    window.addEventListener('agencyos_global_schedule', handleGlobalSchedule);
    return () => {
      window.removeEventListener('agencyos_global_schedule', handleGlobalSchedule);
    };
  }, []);

  // Calendar Helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const prev = () => {
    if (viewMode === 'Month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else setCurrentDate(new Date(currentDate.getTime() - 86400000));
  };
  const next = () => {
    if (viewMode === 'Month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else setCurrentDate(new Date(currentDate.getTime() + 86400000));
  };

  const combinedEvents = useMemo(() => {
    const combined = [
      ...requests.map(r => ({ ...r, calendarType: 'Mission' as const, dateStr: r.dueDate })),
      ...tasks.map(t => ({ ...t, calendarType: 'Task' as const, dateStr: t.dueDate })),
      ...bookings.map(b => ({ ...b, calendarType: 'Booking' as const, dateStr: b.dueDate })),
      ...timesheets.map(ts => ({ ...ts, calendarType: 'Log' as const, title: ts.task, dateStr: ts.date, dueTime: '08:00' }))
    ];

    return combined.filter(ev => {
      const dateStr = ev.dateStr;
      if (!dateStr || dateStr === '-') return false;
      
      // Parse date string carefully. Some might be ISO, some YYYY-MM-DD
      const evDate = new Date(dateStr);
      // Adjust for timezone offset if it's just a date string to avoid off-by-one errors
      // A simple YYYY-MM-DD is parsed as UTC, so we need to be careful.
      // For this app, let's assume local comparison or match string parts.
      
      let dateMatch = false;
      if (viewMode === 'Month') {
        // Match Month and Year
        // We use string splitting for YYYY-MM-DD to be safe from TZ issues
        const [y, m, d] = dateStr.split('-').map(Number);
        if (y === currentDate.getFullYear() && (m - 1) === currentDate.getMonth()) {
            dateMatch = true;
        }
      } else {
         const [y, m, d] = dateStr.split('-').map(Number);
         if (y === currentDate.getFullYear() && (m - 1) === currentDate.getMonth() && d === currentDate.getDate()) {
             dateMatch = true;
         }
      }
      
      const title = (ev as any).title || (ev as any).subject || (ev as any).task || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = activeFilter === 'All' || 
                           (activeFilter === 'Missions' && ev.calendarType === 'Mission') ||
                           (activeFilter === 'Tasks' && ev.calendarType === 'Task') ||
                           (activeFilter === 'Bookings' && ev.calendarType === 'Booking') ||
                           (activeFilter === 'Logs' && ev.calendarType === 'Log');

      return dateMatch && matchesSearch && matchesFilter;
    }).sort((a, b) => {
        const timeA = (a as any).dueTime || '00:00';
        const timeB = (b as any).dueTime || '00:00';
        return timeA.localeCompare(timeB);
    });
  }, [requests, tasks, bookings, timesheets, currentDate, searchTerm, activeFilter, viewMode]);

  const days = useMemo(() => {
    const totalDays = daysInMonth(currentDate);
    const startDay = startDayOfMonth(currentDate);
    const daysArr = [];
    for (let i = 0; i < startDay; i++) daysArr.push(null);
    for (let i = 1; i <= totalDays; i++) daysArr.push(i);
    return daysArr;
  }, [currentDate]);

  const getEventsForDay = (day: number) => {
    return combinedEvents.filter(ev => {
      if (!ev.dateStr) return false;
      const [y, m, d] = ev.dateStr.split('-').map(Number);
      return d === day;
    });
  };

  const handleDayClick = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = d.getDate().toString().padStart(2, '0');
    const isoDate = `${d.getFullYear()}-${month}-${dayStr}`;
    
    setFormData({
      title: '',
      type: 'Task',
      dueDate: isoDate,
      dueTime: '09:00',
      duration: 30,
      priority: 'Medium',
      description: '',
      client: MOCK_CLIENTS[0]?.name || '',
      assignedTo: 'Agency Admin'
    });
    setCollisionError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleHourDoubleClick = (hour: string) => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = currentDate.getDate().toString().padStart(2, '0');
    const isoDate = `${currentDate.getFullYear()}-${month}-${dayStr}`;

    setFormData({
      title: '',
      type: 'Booking',
      dueDate: isoDate,
      dueTime: hour,
      duration: 30,
      priority: 'Medium',
      description: '',
      client: MOCK_CLIENTS[0]?.name || '',
      assignedTo: 'Agency Admin'
    });
    setCollisionError(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditEvent = (ev: any) => {
    setSelectedEvent(ev);
    setFormData({
      title: ev.title || ev.subject || ev.task || '',
      type: ev.calendarType,
      dueDate: ev.dateStr,
      dueTime: ev.dueTime || '09:00',
      duration: ev.duration || 30,
      priority: ev.priority || 'Medium',
      description: ev.description || '',
      client: ev.client || ev.project || '',
      assignedTo: ev.assignedTo || ev.user || 'Agency Admin'
    });
    setCollisionError(null);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const checkCollision = (newStartStr: string, newTime: string, newDuration: number, excludeId?: string) => {
    const newStart = new Date(`${newStartStr}T${newTime}`).getTime();
    const newEnd = newStart + (newDuration * 60000);

    return bookings.some(existing => {
      if (excludeId && existing.id === excludeId) return false;
      if (existing.dueDate !== newStartStr) return false;

      const exStart = new Date(`${existing.dueDate}T${existing.dueTime}`).getTime();
      const exEnd = exStart + (existing.duration || 30) * 60000;

      return (newStart < exEnd) && (newEnd > exStart);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollisionError(null);

    // Collision Check for Bookings
    if (formData.type === 'Booking') {
      const hasCollision = checkCollision(
        formData.dueDate, 
        formData.dueTime, 
        formData.duration, 
        isEditMode ? selectedEvent.id : undefined
      );

      if (hasCollision) {
        setCollisionError("Tactical Window Occupied: A meeting is already registered in this time slot.");
        return;
      }
    }

    if (formData.type === 'Task') {
      const task: any = {
        title: formData.title,
        project: formData.client || 'Internal',
        assignee: formData.assignedTo,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        status: isEditMode ? selectedEvent.status : 'To Do',
        priority: formData.priority,
        type: 'Operational',
        estimatedTime: '1h 00m',
        spentTime: '0h 00m',
        description: formData.description
      };
      
      if (isEditMode) updateTask(selectedEvent.id, task);
      else addTask(task);

    } else if (formData.type === 'Mission') {
      const request: any = {
        title: formData.title,
        client: formData.client,
        service: 'Direct Request',
        assignedTo: formData.assignedTo,
        status: isEditMode ? selectedEvent.status : 'Pending',
        priority: formData.priority,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        updatedAt: new Date().toISOString(),
        description: formData.description,
        creditsConsumed: 0,
        creditsTotal: 10
      };

      if (isEditMode) updateRequest(selectedEvent.id, request);
      else addRequest(request);

    } else if (formData.type === 'Booking') {
        const booking = {
            title: formData.title,
            client: formData.client,
            clientEmail: MOCK_CLIENTS.find(c => c.name === formData.client)?.email || '',
            dueDate: formData.dueDate,
            dueTime: formData.dueTime,
            duration: formData.duration,
            description: formData.description,
            status: 'Confirmed'
        };
        // Bookings hook doesn't support update yet in this version, treat as new or simple replacement logic
        addBooking({ ...booking, id: isEditMode ? selectedEvent.id : undefined });
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!window.confirm(`Purge this ${selectedEvent.calendarType} from the schedule?`)) return;
    if (selectedEvent.calendarType === 'Task') {
      deleteTask(selectedEvent.id);
    } else if (selectedEvent.calendarType === 'Mission') {
      deleteRequest(selectedEvent.id);
    } else if (selectedEvent.calendarType === 'Booking') {
      deleteBooking(selectedEvent.id);
    } else if (selectedEvent.calendarType === 'Log') {
      deleteEntry(selectedEvent.id);
    }
    setIsModalOpen(false);
  };

  const getTypeStyle = (type: string) => {
      switch(type) {
          case 'Mission': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
          case 'Booking': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
          case 'Task': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
          case 'Log': return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200 dark:border-zinc-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-40 transition-colors">
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Master Schedule</h2>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Master Protocol Sync</span>
             </div>
             <p className="text-slate-500 dark:text-zinc-500 font-medium text-sm">Aggregating missions, tasks, bookings, and production logs.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           {/* View Mode Toggle */}
           <div className="flex bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1.5 rounded-2xl shadow-sm">
             {(['Month', 'Day'] as const).map(v => (
               <button 
                 key={v}
                 onClick={() => setViewMode(v)} 
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === v ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
               >
                 {v}
               </button>
             ))}
           </div>

           <div className="flex bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1.5 rounded-2xl shadow-sm overflow-x-auto no-scrollbar max-w-[400px]">
             {(['All', 'Missions', 'Tasks', 'Bookings', 'Logs'] as const).map(f => (
               <button 
                 key={f}
                 onClick={() => setActiveFilter(f)} 
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
               >
                 {f}
               </button>
             ))}
           </div>
           
           <button 
             onClick={() => { 
                setFormData({
                    title: '',
                    type: 'Task',
                    dueDate: new Date().toISOString().split('T')[0],
                    dueTime: '09:00',
                    duration: 30,
                    priority: 'Medium',
                    description: '',
                    client: MOCK_CLIENTS[0]?.name || '',
                    assignedTo: 'Agency Admin'
                });
                setIsEditMode(false); 
                setCollisionError(null); 
                setIsModalOpen(true); 
             }}
             className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 group border border-blue-500"
           >
             <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Schedule Protocol
           </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden p-8">
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-zinc-800">
           <div className="flex items-center gap-4">
              <button onClick={prev} className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"><ChevronLeft size={20} className="text-slate-600 dark:text-zinc-400"/></button>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                 {viewMode === 'Month' ? monthYear : currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={next} className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"><ChevronRight size={20} className="text-slate-600 dark:text-zinc-400"/></button>
           </div>
           {viewMode === 'Month' && <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Jump to Today</button>}
        </div>

        {viewMode === 'Month' && (
           <>
              <div className="grid grid-cols-7 gap-4 mb-4">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest">{d}</div>
                 ))}
              </div>
              <div className="grid grid-cols-7 gap-2 md:gap-4 auto-rows-fr">
                 {days.map((day, i) => (
                    <div 
                      key={i} 
                      onClick={() => day && handleDayClick(day)}
                      className={`min-h-[140px] p-3 rounded-2xl border transition-all relative group flex flex-col gap-1 ${
                          !day ? 'bg-transparent border-transparent pointer-events-none' : 'bg-slate-50/50 dark:bg-black/40 border-slate-100 dark:border-zinc-800/50 hover:border-blue-500/30 dark:hover:border-blue-500/30 cursor-pointer hover:bg-white dark:hover:bg-zinc-900'
                      }`}
                    >
                       {day && (
                         <>
                            <span className={`text-xs font-bold mb-2 block ${new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 w-7 h-7 flex items-center justify-center rounded-full' : 'text-slate-400 dark:text-zinc-600'}`}>{day}</span>
                            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[100px]">
                               {getEventsForDay(day).slice(0, 4).map((ev: any, idx) => (
                                  <div 
                                    key={idx} 
                                    onClick={(e) => { e.stopPropagation(); handleEditEvent(ev); }}
                                    className={`text-[9px] font-bold px-2 py-1.5 rounded-lg truncate border ${getTypeStyle(ev.calendarType)} transition-transform hover:scale-[1.02]`}
                                    title={ev.title}
                                  >
                                     {ev.dueTime && <span className="opacity-70 mr-1">{ev.dueTime}</span>}
                                     {ev.title}
                                  </div>
                               ))}
                               {getEventsForDay(day).length > 4 && (
                                  <div className="text-[9px] font-bold text-slate-400 pl-1">+{getEventsForDay(day).length - 4} more</div>
                               )}
                            </div>
                         </>
                       )}
                    </div>
                 ))}
              </div>
           </>
        )}

        {viewMode === 'Day' && (
           <div className="space-y-2 relative h-[800px] overflow-y-auto custom-scrollbar pr-4">
              {HOURS.map(hour => (
                 <div key={hour} className="flex gap-6 group min-h-[80px]" onDoubleClick={() => handleHourDoubleClick(hour)}>
                    <div className="w-16 text-xs font-bold text-slate-400 dark:text-zinc-600 py-2 text-right sticky left-0 bg-white dark:bg-zinc-900 z-10">{hour}</div>
                    <div className="flex-1 border-t border-slate-100 dark:border-zinc-800 relative group-hover:bg-slate-50 dark:group-hover:bg-zinc-900/50 transition-colors">
                        {/* Events for this hour */}
                        {combinedEvents.filter((ev: any) => {
                             if(!ev.dateStr) return false;
                             const [y, m, d] = ev.dateStr.split('-').map(Number);
                             const isSameDay = y === currentDate.getFullYear() && (m-1) === currentDate.getMonth() && d === currentDate.getDate();
                             const evHour = ev.dueTime?.split(':')[0];
                             const slotHour = hour.split(':')[0];
                             return isSameDay && evHour === slotHour;
                        }).map((ev: any, idx) => (
                             <div 
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); handleEditEvent(ev); }}
                                className={`absolute left-2 right-2 top-1 bottom-1 rounded-xl p-3 text-xs font-bold cursor-pointer border shadow-sm flex flex-col justify-center ${getTypeStyle(ev.calendarType)}`}
                                style={{ top: `${(idx * 10) + 5}px`, zIndex: 10 + idx }}
                             >
                                <div className="flex justify-between">
                                    <span>{ev.title}</span>
                                    <span className="opacity-70 text-[9px] uppercase">{ev.calendarType}</span>
                                </div>
                             </div>
                        ))}
                    </div>
                 </div>
              ))}
              
              {/* Current Time Indicator */}
              {currentDate.toDateString() === new Date().toDateString() && (
                  <div 
                    className="absolute left-16 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                    style={{ top: `${(new Date().getHours() * 80) + (new Date().getMinutes() / 60 * 80)}px` }}
                  >
                     <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5" />
                  </div>
              )}
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-black rounded-xl">
                        {isEditMode ? <Edit3 size={20} className="text-blue-500"/> : <Plus size={20} className="text-blue-500"/>}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{isEditMode ? 'Edit Protocol' : 'New Protocol'}</h3>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
              </div>
              
              <form onSubmit={handleSave} className="space-y-6">
                 {collisionError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                       <ShieldAlert size={16} /> {collisionError}
                    </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Protocol Type</label>
                    <div className="flex bg-slate-50 dark:bg-black p-1 rounded-xl border border-slate-100 dark:border-zinc-800">
                       {['Task', 'Mission', 'Booking'].map(t => (
                          <button 
                            key={t} 
                            type="button"
                            onClick={() => setFormData({...formData, type: t})}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === t ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400'}`}
                          >
                             {t}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Title</label>
                    <input 
                      autoFocus
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-colors"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Protocol Name..."
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Date</label>
                       <input 
                         type="date"
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-colors"
                         value={formData.dueDate}
                         onChange={e => setFormData({...formData, dueDate: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Time</label>
                       <input 
                         type="time"
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:border-blue-500 transition-colors"
                         value={formData.dueTime}
                         onChange={e => setFormData({...formData, dueTime: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="flex gap-3 pt-4">
                    {isEditMode && (
                       <button type="button" onClick={handleDelete} className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all border border-rose-100 dark:border-rose-900/30">Delete</button>
                    )}
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2">
                       {isEditMode ? <Save size={16}/> : <Plus size={16}/>} {isEditMode ? 'Save Changes' : 'Initialize'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
