
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, Layout, FileText, UserPlus, MessageSquare, 
  Search, Shield, X, Trash2, Info, Activity as ActivityIcon, Loader2
} from 'lucide-react';
import { MOCK_PROFILES } from '../constants';
import { ActivityEvent } from '../types';
import { Link } from 'react-router-dom';
import { useActivity } from '../hooks/useActivity.ts';
import { formatRelativeTime } from '../utils/date';


// Helper to resolve profile ID from name
const getProfileId = (name: string) => {
  const p = MOCK_PROFILES.find(p => p.name === name);
  return p ? p.id : 'current';
};

const Activity: React.FC = () => {
  // Parsing query params for deep linking
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  const deepLinkId = searchParams.get('id');

  // Use the custom hook instead of localStorage directly
  const { events, loading, markAsRead, markAllAsRead, deleteActivity } = useActivity();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);

  // Deep Linking Handling
  useEffect(() => {
    if (deepLinkId && events.length > 0) {
      const found = events.find(e => e.id === deepLinkId);
      if (found) {
        setSelectedEvent(found);
        // Auto-mark as read if opened via notification click
        if (found.status === 'unread') {
            markAsRead(found.id);
        }
      }
    } else if (events.length > 0 && !selectedEvent) {
      // Optional: Auto-select first event if none selected
      // setSelectedEvent(events[0]);
    }
  }, [deepLinkId, events]); 

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
        const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              e.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              e.target.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeType === 'all' || e.type === activeType;
        return matchesSearch && matchesType;
    });
  }, [events, searchTerm, activeType]);

  const handleEventClick = (event: ActivityEvent) => {
      setSelectedEvent(event);
      if (event.status === 'unread') {
          markAsRead(event.id);
      }
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Delete this log entry?")) {
          deleteActivity(id);
          if (selectedEvent?.id === id) setSelectedEvent(null);
      }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'deploy': return Zap;
          case 'project': return Layout;
          case 'finance': return FileText;
          case 'crm': return UserPlus;
          case 'security': return Shield;
          default: return MessageSquare;
      }
  };

  if (loading) {
      return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 h-[calc(100vh-140px)] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
            <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Activity</h2>
                <p className="text-slate-500 dark:text-zinc-500 font-medium mt-1">Real-time audit trail and operational logs.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => markAllAsRead()} 
                    disabled={events.every(e => e.status === 'read')}
                    className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Mark All Read
                </button>
            </div>
        </div>

        <div className="flex-1 flex gap-8 min-h-0">
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-4 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm outline-none font-medium dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 outline-none appearance-none"
                        value={activeType}
                        onChange={(e) => setActiveType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="deploy">Deployments</option>
                        <option value="project">Projects</option>
                        <option value="finance">Finance</option>
                        <option value="crm">CRM</option>
                        <option value="security">Security</option>
                    </select>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredEvents.map(event => {
                        const Icon = getIcon(event.type);
                        return (
                            <div 
                                key={event.id} 
                                onClick={() => handleEventClick(event)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 hover:shadow-md ${
                                    selectedEvent?.id === event.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                    : event.status === 'unread' 
                                        ? 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900' 
                                        : 'bg-slate-50/50 dark:bg-black/20 border-transparent hover:bg-white dark:hover:bg-zinc-900'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    event.importance === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}>
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                            {event.user} <span className="font-medium text-slate-500 dark:text-zinc-500">{event.action}</span> {event.target}
                                        </p>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 whitespace-nowrap ml-2">
                                            {formatRelativeTime(event.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-zinc-500 truncate">{event.description}</p>
                                </div>
                                {event.status === 'unread' && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                            </div>
                        );
                    })}
                    {filteredEvents.length === 0 && (
                        <div className="py-20 text-center text-slate-400 dark:text-zinc-600 flex flex-col items-center justify-center h-full">
                            <ActivityIcon size={40} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-bold">No activity logs found</p>
                            <p className="text-[10px] uppercase tracking-widest mt-2 opacity-50">Events will appear here as you work</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedEvent ? (
                <div className="w-96 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl p-8 shrink-0 flex flex-col h-full animate-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-8">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            selectedEvent.type === 'security' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                            {selectedEvent.type}
                        </span>
                        <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400"><X size={18}/></button>
                    </div>

                    <div className="flex flex-col items-center text-center mb-8">
                        <Link to={`/profile/${getProfileId(selectedEvent.user)}`} className="relative group cursor-pointer">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-slate-200 dark:bg-zinc-800 p-1 shadow-lg mb-4 overflow-hidden border-2 border-white dark:border-zinc-700">
                                <img src={selectedEvent.userAvatar || `https://i.pravatar.cc/150?u=${selectedEvent.user}`} alt="" className="w-full h-full object-cover rounded-[1.2rem]" />
                            </div>
                        </Link>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedEvent.user}</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold">{formatRelativeTime(selectedEvent.timestamp)} • {selectedEvent.timestamp.toLocaleString()}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/40 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 mb-6 flex-1 overflow-y-auto">
                        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 leading-relaxed">
                            {selectedEvent.description}
                        </p>
                    </div>

                    <div className="mt-auto space-y-3 shrink-0">
                        <button onClick={() => handleDelete(selectedEvent.id)} className="w-full py-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 font-bold text-xs hover:border-rose-200 dark:hover:border-rose-900 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all flex items-center justify-center gap-2">
                            <Trash2 size={16} /> Delete Log
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-96 bg-slate-50 dark:bg-black/20 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 border-dashed flex items-center justify-center text-slate-300 dark:text-zinc-700 hidden lg:flex">
                    <div className="text-center">
                        <ActivityIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">Select an event</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Activity;
