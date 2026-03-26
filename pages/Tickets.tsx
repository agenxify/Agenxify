
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LifeBuoy, Search, Filter, Plus, Clock, 
  MessageCircle, User, AlertTriangle, CheckCircle2, 
  MoreHorizontal, X, Trash2, Edit3, CheckCircle, ChevronRight,
  Send, Paperclip, ShieldCheck, Mail, Globe, Hash, Info,
  Activity, Tag, UserPlus, CornerDownRight, ExternalLink, FileText,
  Zap, Layers, Shield, ChevronDown, Check, Loader2, Edit
} from 'lucide-react';
import { Ticket } from '../types';
import { useTickets } from '../hooks/useTickets.ts';
import { useClients } from '../hooks/useClients.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

// --- Custom Dropdown for Forms ---
const CustomDropdown = ({ 
  value, 
  options, 
  onChange, 
  placeholder, 
  icon: Icon, 
  className = "",
  disabled = false
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: any;
  className?: string;
  disabled?: boolean;
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

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button 
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none transition-all text-sm ${
          disabled 
          ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-zinc-900' 
          : 'focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20'
        }`}
      >
        <span className="truncate">{value || placeholder}</span>
        {!disabled && <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-2 animate-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between mb-1 last:mb-0 ${
                value === opt 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt}
              {value === opt && <Check size={14} strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Portal Menu for Actions ---
interface TicketMenuProps {
  ticket: Ticket;
  anchorRect: DOMRect;
  onClose: () => void;
  onStatusChange: (id: string, status: Ticket['status']) => void;
  onDelete: (id: string) => void;
  onEdit: (ticket: Ticket) => void;
}

const TicketActionMenuPortal = ({ ticket, anchorRect, onClose, onStatusChange, onDelete, onEdit }: TicketMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // Calculate position: align right edge of menu with right edge of button
  const [pos, setPos] = useState({ top: anchorRect.bottom + 8, left: anchorRect.right - 192 }); 

  useEffect(() => {
    // Basic boundary check (if near bottom of screen, flip up)
    if (window.innerHeight - anchorRect.bottom < 200) {
       setPos({ top: anchorRect.top - 160, left: anchorRect.right - 192 });
    }
  }, [anchorRect]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div 
        ref={menuRef}
        style={{ top: pos.top, left: pos.left }} 
        className="fixed z-[9999] w-48 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-1"
        onClick={(e) => e.stopPropagation()}
      >
         <button onClick={() => { onStatusChange(ticket.id, 'Solved'); onClose(); }} className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all flex items-center gap-2">
            <CheckCircle size={14} /> Mark Solved
         </button>
         <button onClick={() => { onEdit(ticket); onClose(); }} className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all flex items-center gap-2">
            <Edit3 size={14} /> Edit Details
         </button>
         <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1 mx-2" />
         <button onClick={() => { onDelete(ticket.id); onClose(); }} className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all flex items-center gap-2">
            <Trash2 size={14} /> Delete Ticket
         </button>
      </div>
    </>,
    document.body
  );
};

const Tickets: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { getLimit } = usePlanEnforcement();
  
  // Use Supabase Hook
  const { tickets, loading, addTicket, updateTicket, deleteTicket } = useTickets();
  const { clients } = useClients();

  useEffect(() => {
    console.log("DEBUG: Tickets page clients:", clients);
  }, [clients]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'All' | 'Open' | 'Pending' | 'Solved'>('All');
  
  // Modal & Menu States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeMenu, setActiveMenu] = useState<{ id: string, rect: DOMRect } | null>(null);
  
  const [toast, setToast] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [formTicket, setFormTicket] = useState<Partial<Ticket>>({
    subject: '',
    client: currentUser?.role === 'client' ? currentUser.name : (clients[0]?.name || ''),
    priority: 'Medium',
    status: 'Open',
    assignee: 'Alex River',
    description: '',
    department: 'General Support',
    category: 'Inquiry',
    source: 'Portal'
  });

  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((formTicket as any).id) {
       // Edit Mode
       updateTicket((formTicket as any).id, formTicket);
       showToast("Ticket Updated Successfully");
    } else {
       // Create Mode
       const ticket: Ticket = {
        id: `TKT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        subject: formTicket.subject || 'Untitled Ticket',
        client: formTicket.client || 'Unknown Client',
        priority: formTicket.priority as any,
        status: 'Open',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        assignee: formTicket.assignee || 'Unassigned',
        description: formTicket.description || '',
        department: formTicket.department,
        category: formTicket.category,
        source: formTicket.source as any,
        attachments: [],
        history: [
          { 
            user: currentUser?.name || 'Unknown', 
            action: 'initialized the ticket manually', 
            time: new Date().toLocaleTimeString(),
            avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=system'
          }
        ]
      };
      addTicket(ticket);
      showToast("Ticket Created Successfully");
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormTicket({ 
        subject: '', 
        client: currentUser?.role === 'client' ? currentUser.name : (clients[0]?.name || ''), 
        priority: 'Medium', 
        status: 'Open', 
        assignee: 'Alex River', 
        description: '', 
        department: 'General Support', 
        category: 'Inquiry', 
        source: 'Portal' 
    });
  };

  const handleOpenEdit = (ticket: Ticket) => {
     setFormTicket(ticket);
     setIsModalOpen(true);
  };

  const handleDeleteTicket = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this ticket? This action is irreversible.')) {
      deleteTicket(id);
      if (selectedTicket?.id === id) {
        setSelectedTicket(null);
      }
      showToast("Ticket Purged");
    }
    setActiveMenu(null);
  };

  const handleDeleteHistoryItem = (ticketId: string, itemIndex: number) => {
    if (!window.confirm('Remove this entry from the mission log?')) return;
    const targetTicket = tickets.find(t => t.id === ticketId);
    if (!targetTicket) return;

    const newHistory = [...(targetTicket.history || [])];
    newHistory.splice(itemIndex, 1);
    updateTicket(ticketId, { history: newHistory });

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, history: newHistory });
    }
    showToast("Log Entry Removed");
  };

  const handleStatusUpdate = (id: string, status: Ticket['status']) => {
    const targetTicket = tickets.find(t => t.id === id);
    if (!targetTicket) return;

    const newHistory = [
        ...(targetTicket.history || []),
        { user: currentUser?.name || 'Unknown', action: `updated status to ${status}`, time: new Date().toLocaleTimeString(), avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=system' }
    ];

    updateTicket(id, { status, history: newHistory });

    if (selectedTicket?.id === id) {
      setSelectedTicket({ ...selectedTicket, status, history: newHistory });
    }
    showToast(`Status updated: ${status}`);
    setActiveMenu(null);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const newHistory = [
        ...(selectedTicket.history || []),
        { 
            user: currentUser?.name || 'Unknown', 
            action: `replied: "${replyText}"`, 
            time: new Date().toLocaleTimeString(), 
            avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=system' 
        }
    ];
    updateTicket(selectedTicket.id, { history: newHistory });
    setSelectedTicket({ ...selectedTicket, history: newHistory });
    setReplyText('');
    showToast("Reply Broadcasted");
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicket) return;

    const fileUrl = URL.createObjectURL(file);
    const newAttachments = [...(selectedTicket.attachments || []), `${file.name}|${fileUrl}`];
    
    const newHistory = [
        ...(selectedTicket.history || []),
        { 
            user: currentUser?.name || 'Unknown', 
            action: `attached file: ${file.name}`, 
            time: new Date().toLocaleTimeString(), 
            avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=system'
        }
    ];

    updateTicket(selectedTicket.id, { attachments: newAttachments, history: newHistory });
    setSelectedTicket({ ...selectedTicket, attachments: newAttachments, history: newHistory });
    
    showToast(`Attached: ${file.name}`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = activeStatusFilter === 'All' || t.status === activeStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, activeStatusFilter]);

  const stats = useMemo(() => {
    const unresolved = tickets.filter(t => t.status !== 'Solved' && t.status !== 'Closed').length;
    const overdue = tickets.filter(t => t.priority === 'High' && t.status !== 'Solved').length;
    return [
      { label: 'Unresolved', value: unresolved, color: 'bg-blue-600', icon: LifeBuoy },
      { label: 'Critical Ops', value: overdue, color: 'bg-rose-500', icon: AlertTriangle },
      { label: 'Total Volume', value: tickets.length, color: 'bg-slate-900', icon: Activity },
    ];
  }, [tickets]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative pb-40 transition-colors">
      
      {/* Portal Menu */}
      {activeMenu && (
        <TicketActionMenuPortal 
           ticket={tickets.find(t => t.id === activeMenu.id)!}
           anchorRect={activeMenu.rect}
           onClose={() => setActiveMenu(null)}
           onStatusChange={handleStatusUpdate}
           onDelete={handleDeleteTicket}
           onEdit={handleOpenEdit}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-12 flex items-center gap-4 border border-white/10 backdrop-blur-md">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
             <CheckCircle2 size={18} />
          </div>
          {toast}
        </div>
      )}

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Support Desk</h2>
          <p className="text-slate-500 dark:text-zinc-500 font-medium text-lg">Central nervous system for client resolution and success.</p>
        </div>
        <button 
          onClick={() => { 
            const ticketsLimit = getLimit('ticketsLimit');
            if (ticketsLimit !== -1 && tickets.filter(t => t.status !== 'Solved').length >= ticketsLimit) {
              setToast(`Plan Limit: Max ${ticketsLimit} active tickets.`);
              return;
            }
            resetForm(); 
            setIsModalOpen(true); 
          }}
          className="group relative flex items-center gap-4 px-10 py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl hover:shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] active:scale-[0.97] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Plus size={24} className="relative z-10 group-hover:rotate-90 transition-transform duration-500" />
          <span className="relative z-10">Initialize Ticket</span>
        </button>
      </div>

      {/* Stats Board */}
      {currentUser?.role !== 'client' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] dark:opacity-[0.05] group-hover:scale-125 transition-transform duration-1000 rotate-12 pointer-events-none">
                <stat.icon size={160} className="dark:text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h4 className="text-4xl font-black text-slate-900 dark:text-white">{stat.value}</h4>
              </div>
              <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-lg relative z-10 group-hover:rotate-12 transition-transform`}>
                <stat.icon size={28} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid View */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-slate-200 dark:border-zinc-800 shadow-2xl shadow-blue-500/5">
        <div className="p-10 border-b border-slate-100 dark:border-zinc-800 flex flex-col lg:flex-row items-center gap-8">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by mission, client or identifier..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-sm text-slate-700 dark:text-white transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-[1.75rem] border border-slate-200 dark:border-zinc-800 shadow-inner">
            {(['All', 'Open', 'Pending', 'Solved'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setActiveStatusFilter(f)}
                className={`px-8 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${
                  activeStatusFilter === f 
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-lg' 
                  : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
              <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em]">
                <th className="px-10 py-8">Ticket Context</th>
                <th className="px-10 py-8">Client</th>
                <th className="px-10 py-8">Priority</th>
                <th className="px-10 py-8">Status</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredTickets.map(ticket => (
                <tr 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className={`group transition-all cursor-pointer ${
                    selectedTicket?.id === ticket.id 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'hover:bg-slate-50/50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                        ticket.category === 'Billing' ? 'bg-amber-500 shadow-amber-200 dark:shadow-amber-900/20' :
                        ticket.category === 'Infrastructure' ? 'bg-purple-600 shadow-purple-200 dark:shadow-purple-900/20' :
                        'bg-blue-600 shadow-blue-200 dark:shadow-blue-900/20'
                      }`}>
                        {ticket.category === 'Billing' ? <Zap size={24} /> : ticket.category === 'Infrastructure' ? <Layers size={24} /> : <MessageCircle size={24} />}
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1">{ticket.subject}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{ticket.id}</span>
                          <span className="w-1 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                          <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{ticket.department}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                        <img 
                          src={clients.find(c => c.name === ticket.client)?.avatar || `https://i.pravatar.cc/150?u=${ticket.client}`} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">{ticket.client}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      ticket.priority === 'High' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' :
                      ticket.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                      'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
                      ticket.status === 'Solved' ? 'text-emerald-500' : 
                      ticket.status === 'Open' ? 'text-blue-500' : 'text-slate-500 dark:text-zinc-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        ticket.status === 'Solved' ? 'bg-emerald-500' : 
                        ticket.status === 'Open' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="relative inline-block">
                      <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveMenu(activeMenu?.id === ticket.id ? null : { id: ticket.id, rect }); 
                        }}
                        className="p-3 text-slate-300 dark:text-zinc-600 hover:text-slate-900 dark:hover:text-white transition-colors bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                    <td colSpan={5} className="py-20 text-center flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600">
                        <LifeBuoy size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-black uppercase tracking-widest">No tickets found</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Slide-Over */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-[0_0_80px_-20px_rgba(0,0,0,0.2)] z-[100] transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${selectedTicket ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedTicket && (
          <div className="h-full flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-black/20 backdrop-blur-md">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Ticket ID: {selectedTicket.id}</p>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white truncate max-w-xs">{selectedTicket.subject}</h3>
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${
                    selectedTicket.status === 'Solved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-3 bg-white dark:bg-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 transition-all"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="bg-slate-50 dark:bg-black/40 p-6 rounded-[2rem] border border-slate-100 dark:border-zinc-800">
                <p className="text-sm font-medium text-slate-600 dark:text-zinc-300 leading-relaxed">{selectedTicket.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{selectedTicket.department}</span>
                  <span className="px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{selectedTicket.category}</span>
                </div>
              </div>

              {/* History Stream */}
              <div className="space-y-8 relative before:absolute before:left-[1.2rem] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-zinc-800">
                {(selectedTicket.history || []).map((log, idx) => (
                  <div key={idx} className="relative pl-14 group">
                    <div className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border-4 border-slate-50 dark:border-zinc-800 shadow-sm overflow-hidden z-10">
                      <img src={log.avatar || 'https://i.pravatar.cc/150?u=system'} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-all relative">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{log.user}</p>
                        <button onClick={() => handleDeleteHistoryItem(selectedTicket.id, idx)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">{log.action}</p>
                      <p className="text-[9px] font-bold text-slate-300 dark:text-zinc-600 uppercase tracking-widest mt-2">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 sticky bottom-0">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Type a reply or internal note..." 
                  className="w-full pl-6 pr-32 py-5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-sm dark:text-white"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileAttach} />
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-all">
                    <Paperclip size={18} />
                  </button>
                  <button onClick={handleSendReply} disabled={!replyText.trim()} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl w-full max-w-2xl border border-slate-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 dark:bg-black text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                  <LifeBuoy size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {(formTicket as any).id ? 'Edit Ticket' : 'New Ticket'}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Support Request Protocol</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 dark:bg-zinc-800 text-slate-300 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveTicket} className="p-10 space-y-8 overflow-y-auto no-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Subject</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  placeholder="What's the issue?" 
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-slate-900 dark:text-white transition-all"
                  value={formTicket.subject}
                  onChange={(e) => setFormTicket({...formTicket, subject: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Client</label>
                  <CustomDropdown 
                    value={formTicket.client || ''}
                    options={clients.map(c => c.name)}
                    onChange={(val) => setFormTicket({...formTicket, client: val})}
                    placeholder="Select Client..."
                    className="z-50"
                    disabled={currentUser?.role === 'client'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Priority</label>
                  <CustomDropdown 
                    value={formTicket.priority || 'Medium'}
                    options={['Low', 'Medium', 'High']}
                    onChange={(val) => setFormTicket({...formTicket, priority: val as any})}
                    placeholder="Priority..."
                    className="z-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Department</label>
                  <CustomDropdown 
                    value={formTicket.department || ''}
                    options={['General Support', 'Finance', 'DevOps', 'Creative']}
                    onChange={(val) => setFormTicket({...formTicket, department: val})}
                    placeholder="Select Dept..."
                    className="z-30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Category</label>
                  <CustomDropdown 
                    value={formTicket.category || ''}
                    options={['Inquiry', 'Bug', 'Feature Request', 'Billing', 'Infrastructure']}
                    onChange={(val) => setFormTicket({...formTicket, category: val})}
                    placeholder="Category..."
                    className="z-20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Description</label>
                <textarea 
                  required
                  placeholder="Provide detailed context..." 
                  className="w-full px-8 py-6 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-medium text-slate-700 dark:text-zinc-300 transition-all min-h-[120px] resize-none"
                  value={formTicket.description}
                  onChange={(e) => setFormTicket({...formTicket, description: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/30">
                {(formTicket as any).id ? 'Update Ticket' : 'Create Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
