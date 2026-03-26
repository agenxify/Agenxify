
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, MoreHorizontal, MessageSquare, FileText, CheckSquare, 
  Clock, CreditCard, Download, Plus, Paperclip, Send, User,
  Trash2, ShieldCheck, CheckCircle2, AlertCircle, History,
  Briefcase, X, File, Image as ImageIcon, Video, Trash, ExternalLink,
  Edit3, Zap, Copy, Files, Calendar, Target, BookOpen, Layers, Activity
} from 'lucide-react';
import { Request, FileAttachment, ChecklistItem, RequestTimeEntry } from '../types';
import { MOCK_PROFILES } from '../constants';
import * as ReactRouterDom from 'react-router-dom';
import { useRequests, LogEntry } from '../hooks/useRequests.ts';
import { useTeam } from '../hooks/useTeam.ts';

const { useParams, Link, useNavigate } = ReactRouterDom as any;

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
        className="w-full flex items-center justify-between px-3 py-2 bg-transparent border-b border-transparent hover:border-blue-200 text-xs font-black text-slate-900 focus:border-blue-200 outline-none text-right"
      >
        <div className="flex items-center gap-2 overflow-hidden w-full justify-end">
          {Icon && <Icon size={12} className="text-slate-400 shrink-0" />}
          <span className="truncate">{displayValue}</span>
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-2 min-w-[200px]">
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
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between mb-1 last:mb-0 ${
                  isSelected 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                   {renderOption ? renderOption(opt) : label}
                </div>
                {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const RequestDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, updateRequest: updateRequestInDb, deleteRequest: deleteRequestFromDb, addRequest, fetchRequestLogs, addRequestLog } = useRequests();
  const { members: teamMembers } = useTeam();
  
  const [activeTab, setActiveTab] = useState('Activity');
  const [commentInput, setCommentInput] = useState('');
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const topMenuRef = useRef<HTMLDivElement>(null);
  
  // Local Logs State (Fetched from Supabase)
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Local Form State for smooth editing
  const [formData, setFormData] = useState<Request | null>(null);

  // Profile Sync
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('agencyos_profile_data');
    return saved ? JSON.parse(saved) : MOCK_PROFILES.find(p => p.id === 'current');
  });

  useEffect(() => {
    const handleProfileUpdate = (e: any) => { if (e.detail) setCurrentUser(e.detail); };
    window.addEventListener('agencyos_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('agencyos_profile_updated', handleProfileUpdate);
  }, []);

  // Fetch Logs
  useEffect(() => {
      if (id) {
          fetchRequestLogs(id).then(setLogs);
      }
  }, [id]);

  // Find request from global state
  const globalRequest = useMemo(() => requests.find(r => r.id === id), [requests, id]);

  // Sync global state to local form data on mount or id change
  useEffect(() => {
    if (globalRequest) {
      setFormData(prev => {
        // Only update if we don't have data, or if the ID changed (navigation)
        if (!prev || prev.id !== globalRequest.id) {
          return JSON.parse(JSON.stringify(globalRequest)); // Deep copy
        }
        return prev;
      });
    }
  }, [globalRequest?.id]); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (topMenuRef.current && !topMenuRef.current.contains(event.target as Node)) {
        setIsTopMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to save specific fields to DB
  const saveField = async (field: keyof Request, value: any) => {
    if (!id || !formData) return;
    
    // Update Local State first
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);

    // Update DB
    await updateRequestInDb(id, { 
      [field]: value, 
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    });
  };

  // Generic update wrapper
  const updateRequest = async (updates: Partial<Request>) => {
    if (!id || !formData) return;
    setFormData(prev => prev ? ({ ...prev, ...updates }) : null);
    await updateRequestInDb(id, { 
      ...updates, 
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    });
  };

  const createLog = async (action: string, type: LogEntry['type'], content?: string, attachment?: any) => {
      if (!id) return;
      const newLog = {
          id: `log-${Date.now()}`,
          request_id: id,
          user: currentUser.name,
          avatar: currentUser.avatar,
          action,
          type,
          content,
          attachment
      };
      
      // Optimistic
      setLogs(prev => [ { ...newLog, timestamp: 'Just now', created_at: new Date().toISOString() }, ...prev]);
      
      // DB
      await addRequestLog(newLog);
  };

  const handleChangeStatus = (newStatus: Request['status']) => {
    if (formData?.status === newStatus) return;
    saveField('status', newStatus);
    createLog(`changed status to ${newStatus}`, 'status');
    showToast(`Status updated: ${newStatus}`);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newFile: FileAttachment = {
      id: `file-${Date.now()}`,
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toLocaleDateString(),
      owner: currentUser.name
    };

    createLog('uploaded a file', 'file', undefined, newFile);

    updateRequest({ files: [...(formData?.files || []), newFile] });
    showToast("Resource Uploaded");
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = (fileId: string) => {
    if (!window.confirm('Remove this asset from the repository?')) return;
    const updatedFiles = (formData?.files || []).filter(f => f.id !== fileId);
    updateRequest({ files: updatedFiles });
    showToast("Asset Purged");
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    createLog('added a comment', 'comment', commentInput);
    setCommentInput('');
  };

  const handleDuplicate = async () => {
    if (!formData) return;
    const newReqId = `REQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const newReq: Request = {
      ...formData,
      id: newReqId,
      title: `${formData.title} (Copy)`,
      status: 'Pending',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      creditsConsumed: 0
    };
    
    await addRequest(newReq);
    
    // Log initial creation for copy
    // Note: addRequestLog needs new ID
    // We skip extensive log duplication for simplicity, start fresh
    
    setIsTopMenuOpen(false);
    navigate(`/requests/${newReqId}`);
  };

  const handleCopyId = () => {
    if (!formData) return;
    navigator.clipboard.writeText(formData.id);
    showToast("Mission ID Copied");
    setIsTopMenuOpen(false);
  };

  const handleDeleteRequest = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to permanently delete this mission? All production history, logs, and assets will be purged.')) return;
    
    await deleteRequestFromDb(id);
    navigate('/requests');
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = { id: `chk-${Date.now()}`, text: 'Specify sub-task...', completed: false };
    updateRequest({ checklist: [...(formData?.checklist || []), newItem] });
  };

  const toggleChecklistItem = (itemId: string) => {
    const updated = (formData?.checklist || []).map(item => item.id === itemId ? { ...item, completed: !item.completed } : item);
    updateRequest({ checklist: updated });
  };

  const addTimesheetEntry = () => {
    const newEntry: RequestTimeEntry = {
      id: `time-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      duration: '1h 00m',
      description: 'Production work...',
      user: currentUser.name
    };
    updateRequest({ timesheets: [...(formData?.timesheets || []), newEntry] });
  };

  const updateTimesheetEntry = (entryId: string, updates: Partial<RequestTimeEntry>) => {
    const updated = (formData?.timesheets || []).map(entry => entry.id === entryId ? { ...entry, ...updates } : entry);
    updateRequest({ timesheets: updated });
  };

  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300"><AlertCircle size={40}/></div>
        <h2 className="text-2xl font-black text-slate-900">Mission Not Found</h2>
        <Link to="/requests" className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200">Return to Grid</Link>
      </div>
    );
  }

  const tabs = ['Activity', 'Request Details', 'Files', 'Checklists', 'Timesheets', 'Organization Notes'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10001] bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-12 flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
             <CheckCircle2 size={18} />
          </div>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <Link to="/requests" className="p-3.5 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"><ArrowLeft size={22}/></Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{formData.title}</h2>
              <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{formData.id}</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-bold text-slate-400">
              <span className="flex items-center"><Clock size={14} className="mr-1.5 text-blue-500" /> Audit Logged: {formData.updatedAt}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-blue-600 uppercase tracking-widest text-[10px]">{formData.service}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative" ref={topMenuRef}>
          <button 
            onClick={() => setIsCreditModalOpen(true)}
            className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
          >
            <Zap size={18}/> Manage Burn
          </button>
          <button 
            onClick={() => setIsTopMenuOpen(!isTopMenuOpen)}
            className={`p-3.5 border transition-all shadow-sm rounded-2xl ${
              isTopMenuOpen 
              ? 'bg-slate-900 text-white border-slate-900' 
              : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600'
            }`}
          >
            <MoreHorizontal size={22}/>
          </button>
          
          {isTopMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-[2rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden z-[1000] animate-in zoom-in-95 duration-200">
              <div className="p-3 space-y-1">
                <button onClick={handleCopyId} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <Copy size={18} /> Copy Mission ID
                </button>
                <button onClick={handleDuplicate} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <Files size={18} /> Duplicate Mission
                </button>
                <button onClick={() => { setActiveTab('Request Details'); setIsTopMenuOpen(false); }} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <Edit3 size={18} /> Edit Blueprint
                </button>
                <div className="h-px bg-slate-100 my-1 mx-4" />
                <button onClick={handleDeleteRequest} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all">
                  <Trash2 size={18} /> Delete Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex bg-white p-2 rounded-[1.75rem] border border-slate-200 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl shadow-blue-500/5 p-10 min-h-[700px]">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileAttach} />
            
            {activeTab === 'Activity' && (
              <div className="space-y-12 animate-in slide-in-from-bottom-6">
                <div className="relative group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-6 flex items-center"><MessageSquare size={12} className="mr-2"/> Collaborative Intel Stream</p>
                  <div className="relative">
                    <textarea 
                      placeholder="Add insight to the mission stream..." 
                      className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-base outline-none focus:ring-4 focus:ring-blue-100 transition-all min-h-[160px] font-medium text-slate-700 placeholder:text-slate-300"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                    />
                    <div className="absolute right-6 bottom-6 flex items-center space-x-4">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-slate-300 hover:text-blue-600 bg-white border border-slate-100 rounded-2xl transition-all"
                      >
                        <Paperclip size={20}/>
                      </button>
                      <button 
                        onClick={handleAddComment}
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                      >
                        <Send size={16} /> Broadcast
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-10 relative before:absolute before:left-[1.2rem] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                  {logs.map((log) => (
                    <div key={log.id} className="relative pl-14 group animate-in slide-in-from-left-4">
                      <div className="absolute left-0 top-0 w-10 h-10 rounded-2xl bg-white border-4 border-slate-50 shadow-sm overflow-hidden z-10">
                        <img src={log.avatar || `https://i.pravatar.cc/150?u=${log.user}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black text-slate-900">{log.user}</p>
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">{log.action}</span>
                          <span className="text-[10px] text-slate-300 font-bold ml-auto">{log.timestamp}</span>
                        </div>
                        {log.content && (
                          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <p className="text-slate-600 text-sm leading-relaxed">{log.content}</p>
                          </div>
                        )}
                        {log.type === 'file' && log.attachment && (
                          <div 
                            onClick={() => window.open(log.attachment?.url, '_blank')}
                            className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between cursor-pointer hover:bg-blue-100/50 transition-all"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                {log.attachment.type.includes('image') ? <ImageIcon size={20}/> : <File size={20}/>}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-900">{log.attachment.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{log.attachment.size}</p>
                              </div>
                            </div>
                            <Download size={16} className="text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Request Details' && (
              <div className="space-y-12 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"><Target size={20}/></div>
                         <h4 className="text-lg font-black text-slate-900">Primary Objective</h4>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 focus-within:bg-white focus-within:shadow-xl transition-all">
                        <textarea 
                          className="w-full bg-transparent text-slate-800 text-sm leading-relaxed min-h-[120px] outline-none border-none resize-none font-bold"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          onBlur={() => saveField('title', formData.title)}
                          placeholder="Mission title..."
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100"><BookOpen size={20}/></div>
                         <h4 className="text-lg font-black text-slate-900">Production Context</h4>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 focus-within:bg-white focus-within:shadow-xl transition-all">
                        <textarea 
                          className="w-full bg-transparent text-slate-600 text-sm leading-relaxed min-h-[250px] outline-none border-none resize-none font-medium"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          onBlur={() => saveField('description', formData.description)}
                          placeholder="Provide deep context and background information for the execution team..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg"><Layers size={20}/></div>
                         <h4 className="text-lg font-black text-slate-900">Mission Parameters</h4>
                      </div>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center group py-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Authorized Partner</span>
                          <span className="text-xs font-black text-slate-900">{formData.client}</span>
                        </div>
                        <div className="flex justify-between items-center group py-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Execution Lead(s)</span>
                          <MultiSelectDropdown 
                            values={formData.assignedTo ? formData.assignedTo.split(',').map(s => s.trim()) : []}
                            options={teamMembers.map(m => ({ value: m.name, label: m.name }))}
                            onChange={(vals) => {
                                const newVal = vals.join(', ');
                                setFormData({...formData, assignedTo: newVal});
                                saveField('assignedTo', newVal);
                            }}
                            placeholder="Assign..."
                            className="w-48"
                          />
                        </div>
                        <div className="flex justify-between items-center group py-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter flex items-center"><Calendar size={12} className="mr-1.5"/> Strategic Deadline</span>
                          <input 
                            type="text"
                            className="text-xs font-black text-slate-900 bg-transparent text-right outline-none focus:text-blue-600 border-b border-transparent focus:border-blue-200"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                            onBlur={() => saveField('dueDate', formData.dueDate)}
                          />
                        </div>
                        <div className="flex justify-between items-center group py-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Operational Risk</span>
                          <select 
                            className="bg-transparent text-xs font-black outline-none cursor-pointer text-blue-600 appearance-none text-right"
                            value={formData.priority}
                            onChange={(e) => {
                                const val = e.target.value as any;
                                setFormData({...formData, priority: val});
                                saveField('priority', val);
                            }}
                          >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(37,99,235,0.4)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden group border border-blue-500/20">
                        <div className="absolute right-[-5%] top-[-5%] opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
                           <Zap size={180} fill="currentColor" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                                    <Activity size={14} className="text-blue-200" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Production Resource Burn</p>
                            </div>

                            <div className="flex items-baseline gap-3 mb-8">
                               <span className="text-6xl font-black tracking-tighter drop-shadow-lg">{formData.creditsConsumed || 0}</span>
                               <div className="flex flex-col">
                                   <span className="text-sm font-black opacity-50 uppercase tracking-widest">Spent</span>
                                   <span className="text-sm font-black opacity-30">/ {formData.creditsTotal || 10} Cap</span>
                               </div>
                            </div>

                            <div className="space-y-3">
                                <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                   <div 
                                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out relative overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                                      style={{ width: `${Math.min(100, ((formData.creditsConsumed || 0) / (formData.creditsTotal || 10)) * 100)}%` }}
                                   >
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                                   </div>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.15em] opacity-50">
                                    <span>Utilization Rate</span>
                                    <span>{Math.round(((formData.creditsConsumed || 0) / (formData.creditsTotal || 10)) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                        <style>{`
                           @keyframes shimmer {
                              0% { transform: translateX(-100%); }
                              100% { transform: translateX(100%); }
                           }
                        `}</style>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Files' && (
              <div className="animate-in fade-in space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Asset Repository</h3>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Plus size={16}/> Upload New
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(formData.files || []).map(file => (
                    <div key={file.id} className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative animate-in zoom-in-95">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {file.type.includes('image') ? <ImageIcon size={24}/> : file.type.includes('video') ? <Video size={24}/> : <File size={24}/>}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash size={18}/>
                        </button>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 truncate pr-2" title={file.name}>{file.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{file.size} • {file.uploadedAt}</p>
                      
                      <div className="mt-6 flex gap-2">
                        <button 
                          onClick={() => window.open(file.url, '_blank')}
                          className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={14}/> Open Asset
                        </button>
                      </div>
                    </div>
                  ))}
                  {(formData.files || []).length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-300">
                      <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 opacity-40">
                        <File size={48} />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest">No assets in this mission vault</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Checklists' && (
              <div className="animate-in fade-in space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Task Verification</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      { (formData.checklist || []).filter(c => c.completed).length } / { (formData.checklist || []).length } Components Validated
                    </p>
                  </div>
                  <button onClick={addChecklistItem} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition-all"><Plus size={20}/></button>
                </div>
                <div className="space-y-4">
                  {(formData.checklist || []).map(item => (
                    <div key={item.id} className="flex items-center space-x-4 group animate-in slide-in-from-left-2">
                      <button 
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                          item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent hover:border-blue-400'
                        }`}
                      >
                        <CheckCircle2 size={16}/>
                      </button>
                      <input 
                        type="text" 
                        value={item.text}
                        onChange={(e) => {
                          const updated = (formData.checklist || []).map(i => i.id === item.id ? { ...i, text: e.target.value } : i);
                          updateRequest({ checklist: updated });
                        }}
                        className={`flex-1 bg-transparent text-sm font-bold outline-none border-b border-transparent focus:border-blue-200 py-2 transition-all ${
                          item.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}
                      />
                      <button 
                        onClick={() => {
                          const updated = (formData.checklist || []).filter(i => i.id !== item.id);
                          updateRequest({ checklist: updated });
                        }}
                        className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash size={16}/>
                      </button>
                    </div>
                  ))}
                  {(formData.checklist || []).length === 0 && (
                    <div className="py-20 text-center text-slate-300">
                      <CheckSquare size={48} className="mx-auto mb-4 opacity-20"/>
                      <p className="text-sm font-bold uppercase tracking-widest">Architect your action list</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Timesheets' && (
              <div className="animate-in fade-in space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Mission Production Log</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time effort aggregation</p>
                  </div>
                  <button onClick={addTimesheetEntry} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                    <Plus size={16}/> Log Effort
                  </button>
                </div>
                <div className="space-y-4">
                  {(formData.timesheets || []).map(entry => (
                    <div key={entry.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center gap-6 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={entry.description}
                          onChange={(e) => updateTimesheetEntry(entry.id, { description: e.target.value })}
                          className="w-full bg-transparent font-black text-slate-900 outline-none border-b border-transparent focus:border-blue-200 mb-2"
                        />
                        <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span className="flex items-center"><User size={12} className="mr-1.5" /> {entry.user}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <input 
                            type="date" 
                            value={entry.date}
                            onChange={(e) => updateTimesheetEntry(entry.id, { date: e.target.value })}
                            className="bg-transparent outline-none focus:text-blue-600"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <input 
                            type="text" 
                            value={entry.duration}
                            onChange={(e) => updateTimesheetEntry(entry.id, { duration: e.target.value })}
                            className="text-2xl font-black text-slate-900 bg-transparent outline-none text-right w-24 focus:text-blue-600"
                          />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">Burn Rate</p>
                        </div>
                        <button 
                          onClick={() => {
                            const updated = (formData.timesheets || []).filter(e => e.id !== entry.id);
                            updateRequest({ timesheets: updated });
                          }}
                          className="p-3 text-slate-200 hover:text-rose-500 transition-colors"
                        >
                          <Trash size={20}/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {(formData.timesheets || []).length === 0 && (
                    <div className="py-20 text-center text-slate-300">
                      <Clock size={48} className="mx-auto mb-4 opacity-20"/>
                      <p className="text-sm font-bold uppercase tracking-widest">No effort recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Organization Notes' && (
              <div className="animate-in fade-in space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Confidential Intelligence</h3>
                  <div className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    <ShieldCheck size={14} className="mr-1.5"/> Enterprise Guarded
                  </div>
                </div>
                <div className="relative group">
                  <textarea 
                    className="w-full min-h-[500px] p-12 bg-slate-50 rounded-[3rem] border border-slate-100 outline-none focus:bg-white focus:shadow-2xl focus:shadow-blue-500/5 transition-all text-slate-700 font-medium leading-relaxed resize-none"
                    placeholder="Document high-level intelligence and sensitive mission data..."
                    value={formData.orgNotes || ''}
                    onChange={(e) => setFormData({...formData, orgNotes: e.target.value})}
                    onBlur={() => saveField('orgNotes', formData.orgNotes)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl shadow-blue-500/5 p-10 space-y-10 relative overflow-hidden group">
            <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 rotate-12 pointer-events-none">
              <Briefcase size={200} />
            </div>

            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center"><History size={14} className="mr-2 text-blue-500"/> Operational State</p>
              <div className="space-y-4">
                {(['Pending', 'In Progress', 'Completed', 'Overdue'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => handleChangeStatus(s)}
                    className={`w-full p-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-between transition-all group/btn ${
                      formData.status === s 
                      ? 'bg-slate-900 text-white shadow-xl translate-x-1' 
                      : 'bg-slate-50 text-slate-400 hover:bg-white hover:border-slate-200 border border-transparent'
                    }`}
                  >
                    {s}
                    {formData.status === s ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border border-slate-200 group-hover/btn:border-blue-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 space-y-8">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Partner Lead</p>
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-slate-200 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${formData.client}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{formData.client}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified Client</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEFINED HIGH-CONTRAST RESOURCE MODAL */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-12 overflow-hidden animate-in fade-in duration-500">
          {/* Backdrop - Solid Dark Overlay (No Blur) */}
          <div 
            className="fixed inset-0 bg-slate-900/60 transition-opacity duration-300" 
            onClick={() => setIsCreditModalOpen(false)} 
          />
          
          <div className="relative bg-white rounded-[3rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.5),0_0_1px_rgba(0,0,0,0.1)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-400 ease-out border-2 border-slate-100">
            <div className="p-12 text-center relative">
              <button 
                onClick={() => setIsCreditModalOpen(false)}
                className="absolute top-8 right-8 p-4 text-slate-300 hover:text-slate-900 bg-slate-50 rounded-2xl transition-all"
              >
                <X size={24}/>
              </button>

              <div className="w-24 h-24 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl relative">
                <CreditCard size={44}/>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center border-4 border-white">
                  <Zap size={16} fill="white" />
                </div>
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Resource Allocation</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4">Mission Burn Matrix</p>
              
              <div className="mt-12 space-y-6">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Execution Burn</p>
                  <div className="flex items-center justify-center gap-8">
                    <button 
                      onClick={() => updateRequest({ creditsConsumed: Math.max(0, (formData.creditsConsumed || 0) - 1) })}
                      className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all font-black text-2xl"
                    >-</button>
                    <span className="text-6xl font-black text-slate-900 w-24 text-center">{formData.creditsConsumed || 0}</span>
                    <button 
                      onClick={() => updateRequest({ creditsConsumed: (formData.creditsConsumed || 0) + 1 })}
                      className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50 transition-all font-black text-2xl"
                    >+</button>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Total Mission Budget</p>
                  <div className="flex items-center justify-center gap-8">
                    <button 
                      onClick={() => updateRequest({ creditsTotal: Math.max(1, (formData.creditsTotal || 10) - 1) })}
                      className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-white transition-all font-black text-2xl"
                    >-</button>
                    <span className="text-6xl font-black text-slate-900 w-24 text-center">{formData.creditsTotal || 10}</span>
                    <button 
                      onClick={() => updateRequest({ creditsTotal: (formData.creditsTotal || 10) + 1 })}
                      className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-white transition-all font-black text-2xl"
                    >+</button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsCreditModalOpen(false)}
                className="mt-12 w-full py-8 bg-slate-900 text-white rounded-[2.25rem] font-black text-xl shadow-[0_32px_64px_-16px_rgba(15,23,42,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group overflow-hidden relative"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <ShieldCheck size={24} className="relative z-10" />
                 <span className="relative z-10 uppercase tracking-widest text-sm">Commit Resources</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetail;
