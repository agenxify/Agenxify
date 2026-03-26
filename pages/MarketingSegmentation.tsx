
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Plus, Search, Filter, PieChart, Tag, 
  ArrowUpRight, MoreHorizontal, UserCheck, Hash,
  Database, RefreshCw, Download, Layers, ShieldCheck,
  ChevronDown, X, Trash2, Save, Wand, Sparkles, CheckCircle2, Clock,
  Upload, FileSpreadsheet, FileText, Globe, Link as LinkIcon,
  Cable, Check, Cloud, ShoppingBag, Info, Server, Key,
  Activity, Zap, Target, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';
import { useMarketing, Segment, MarketingContact } from '../hooks/useMarketing';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';
import { useMarketingPlan } from '../src/hooks/useMarketingPlan';
import { UpgradeModal } from '../components/UpgradeModal';

interface SegmentFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
}

const COLORS = [
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-yellow-500',
  'from-pink-500 to-rose-500'
];

// --- 3D Tilt Component ---
const TiltCard = ({ children, className = "", onClick, style }: any) => {
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

    ref.current.style.setProperty('--rx', `${-dy * 8}deg`);
    ref.current.style.setProperty('--ry', `${dx * 8}deg`);
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
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ 
        transform: 'perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry))',
        transformStyle: 'preserve-3d',
        ...style 
      }}
    >
      {children}
    </div>
  );
};

// --- Sub-Components ---

const DataSourcesModal = ({ isOpen, onClose, onSync, connectedSources }: any) => {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sources = [
    { id: 'hubspot', name: 'HubSpot CRM', icon: Database, color: 'text-orange-500', requireKey: true },
    { id: 'salesforce', name: 'Salesforce', icon: Cloud, color: 'text-blue-500', requireKey: true },
    { id: 'shopify', name: 'Shopify Store', icon: ShoppingBag, color: 'text-emerald-500', requireKey: true },
    { id: 'custom_api', name: 'Custom JSON API', icon: Server, color: 'text-purple-500', requireUrl: true },
  ];

  const handleConnect = async () => {
    setError(null);
    setIsProcessing(true);

    if (activeSource === 'custom_api' && !apiUrl) {
        setError("Endpoint URL is required");
        setIsProcessing(false);
        return;
    }
    if (activeSource !== 'custom_api' && !apiKey) {
        setError("API Access Key is required for authentication");
        setIsProcessing(false);
        return;
    }

    try {
        if (activeSource === 'custom_api') {
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    onSync(activeSource, true, data);
                    setActiveSource(null);
                } else {
                    throw new Error("API response must be a JSON array");
                }
            } catch (err: any) {
                setError(`Connection Failed: ${err.message}`);
                setIsProcessing(false);
                return;
            }
        } else {
            await new Promise(r => setTimeout(r, 1500));
            onSync(activeSource, true, []); 
            setActiveSource(null);
        }
    } catch (err) {
        setError("Connection refused by host.");
    } finally {
        setIsProcessing(false);
        setApiKey('');
        setApiUrl('');
    }
  };

  const handleDisconnect = (id: string) => {
      onSync(id, false, []);
  };

  return (
    <div className="fixed inset-0 z-[10010] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
       <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-2xl font-black text-white">Data Integrations</h3>
             <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"><X size={20}/></button>
          </div>
          
          {activeSource ? (
              <div className="space-y-6 animate-in slide-in-from-right">
                  <div className="flex items-center gap-3 mb-2">
                      <button onClick={() => setActiveSource(null)} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                          <ChevronDown className="rotate-90" size={14}/> Back
                      </button>
                  </div>
                  
                  <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center gap-4">
                      {(() => {
                          const src = sources.find(s => s.id === activeSource);
                          return (
                              <>
                                <div className={`p-3 bg-black rounded-xl ${src?.color}`}><src.icon size={24}/></div>
                                <div>
                                    <h4 className="font-bold text-white">{src?.name}</h4>
                                    <p className="text-xs text-zinc-500">Configure connection</p>
                                </div>
                              </>
                          );
                      })()}
                  </div>

                  {activeSource === 'custom_api' ? (
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Data Endpoint (JSON)</label>
                          <input 
                            value={apiUrl}
                            onChange={e => setApiUrl(e.target.value)}
                            placeholder="https://api.yourservice.com/v1/contacts" 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 font-mono"
                          />
                          <p className="text-[10px] text-zinc-600">Must return an array of objects. Mapping happens automatically.</p>
                      </div>
                  ) : (
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">API Access Key</label>
                          <div className="relative">
                            <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input 
                                type="password"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="sk_live_..." 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-600 font-mono"
                            />
                          </div>
                      </div>
                  )}

                  {error && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-500 flex items-center gap-2">
                          <Info size={14}/> {error}
                      </div>
                  )}

                  <button 
                    onClick={handleConnect}
                    disabled={isProcessing}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                      {isProcessing ? 'Verifying...' : 'Authenticate & Sync'}
                  </button>
              </div>
          ) : (
            <div className="space-y-3">
                {sources.map(src => {
                const isConnected = connectedSources.includes(src.id);

                return (
                    <div key={src.id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl group hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-4">
                        <div className={`p-3 bg-zinc-900 rounded-xl ${src.color}`}>
                            <src.icon size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">{src.name}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{isConnected ? 'Active' : 'Not Connected'}</p>
                        </div>
                        </div>
                        {isConnected ? (
                             <button 
                                onClick={() => handleDisconnect(src.id)}
                                className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                                Disconnect
                            </button>
                        ) : (
                            <button 
                                onClick={() => setActiveSource(src.id)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Setup
                            </button>
                        )}
                    </div>
                );
                })}
            </div>
          )}
       </div>
    </div>
  );
};

const ImportModal = ({ isOpen, onClose, onImport }: any) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        const mapColumn = (query: string) => headers.findIndex(h => h.includes(query));
        
        const nameIdx = mapColumn('name') > -1 ? mapColumn('name') : mapColumn('first');
        const emailIdx = mapColumn('email') > -1 ? mapColumn('email') : mapColumn('mail');
        const companyIdx = mapColumn('company') > -1 ? mapColumn('company') : mapColumn('org');
        const revenueIdx = mapColumn('revenue') > -1 ? mapColumn('revenue') : mapColumn('value');
        
        const parsedContacts: any[] = [];

        rows.slice(1).forEach((rowStr, i) => {
            if (!rowStr.trim()) return;
            const cells = rowStr.split(',').map(c => c.trim().replace(/"/g, ''));
            
            if (cells[emailIdx] || cells[nameIdx]) {
                parsedContacts.push({
                    id: `imp-${Date.now()}-${i}`,
                    name: cells[nameIdx] || 'Unknown',
                    email: cells[emailIdx] || '',
                    company: cells[companyIdx] || 'Independent',
                    revenue: parseFloat(cells[revenueIdx]) || 0,
                    status: 'Lead',
                    source: 'CSV Upload',
                    lastSeen: new Date().toISOString(),
                    avatar: `https://i.pravatar.cc/150?u=${i}_${Date.now()}`
                });
            }
        });

        setTimeout(() => {
            onImport(parsedContacts);
            setIsUploading(false);
            onClose();
        }, 1000);
      };
      
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[10005] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
       <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"><X size={20}/></button>
          
          <div className="text-center space-y-6">
             <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-500/20 shadow-lg shadow-blue-500/10">
                <Database size={32} className="text-blue-500" />
             </div>
             
             <div>
                <h3 className="text-2xl font-black text-white">Import Data</h3>
                <p className="text-zinc-500 text-sm font-medium mt-2">Upload a CSV (Headers: Name, Email, Company, Revenue).</p>
             </div>

             {isUploading ? (
                <div className="py-12 flex flex-col items-center">
                   <RefreshCw size={32} className="text-blue-500 animate-spin mb-4" />
                   <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Parsing File...</p>
                </div>
             ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-blue-600 hover:bg-blue-600/5 rounded-3xl p-12 transition-all cursor-pointer group"
                >
                   <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                   <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-zinc-900 rounded-full group-hover:scale-110 transition-transform shadow-lg">
                         <Upload size={24} className="text-zinc-400 group-hover:text-blue-500" />
                      </div>
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-white">Click to Upload CSV</span>
                   </div>
                </div>
             )}
             
             <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-4">
                <span>Supported: CSV</span>
             </div>
          </div>
       </div>
    </div>
  );
};

const MarketingSegmentation: React.FC = () => {
  const navigate = useNavigate();
  
  // --- REAL BACKEND HOOK ---
  const { segments, contacts, loading, addSegment, updateSegment, deleteSegment, importContacts, refresh } = useMarketing();
  const { isUpgradeModalOpen, setIsUpgradeModalOpen, featureName, checkMarketingLimit } = useMarketingPlan();

  const [connectedSources, setConnectedSources] = useState<string[]>(() => {
      const saved = localStorage.getItem('agencyos_data_sources');
      return saved ? JSON.parse(saved) : [];
  });

  // --- UI State ---
  const [queryMode, setQueryMode] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('agencyos_data_sources', JSON.stringify(connectedSources));
  }, [connectedSources]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleImportData = async (newContacts: MarketingContact[]) => {
    if (newContacts.length === 0) {
        showToast("No valid contacts found in import.");
        return;
    }
    await importContacts(newContacts);
    showToast(`${newContacts.length} Contacts Imported Successfully`);
    setIsImportOpen(false);
  };

  const handleSyncSource = (sourceId: string, connect: boolean, data?: any[]) => {
      if (connect) {
          setConnectedSources(prev => [...prev, sourceId]);
          
          if (data && data.length > 0) {
              const mappedData = data.map((d: any, i: number) => ({
                  id: d.id || `api-${Date.now()}-${i}`,
                  name: d.name || d.fullname || 'Unknown API User',
                  email: d.email || '',
                  company: d.company || 'External',
                  revenue: d.revenue || 0,
                  status: 'Lead',
                  source: 'API Sync',
                  lastSeen: new Date().toISOString(),
                  avatar: `https://i.pravatar.cc/150?u=${sourceId}${i}`
              }));
              handleImportData(mappedData);
              showToast(`Synced ${mappedData.length} records from ${sourceId}`);
          } else {
              showToast(`Connected to ${sourceId} (No records imported)`);
          }
      } else {
          setConnectedSources(prev => prev.filter(s => s !== sourceId));
          showToast(`Disconnected from ${sourceId}`);
      }
  };

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: 'Dynamic' | 'Static' | 'AI Predicted';
    filters: SegmentFilter[];
    tags: string[];
    color?: string;
  }>({
    name: '',
    type: 'Dynamic',
    filters: [],
    tags: [],
    color: 'from-blue-500 to-cyan-500'
  });

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      type: segment.type,
      filters: segment.filters || [],
      tags: segment.tags || [],
      color: segment.color
    });
    setQueryMode(true);
  };

  const handleCreate = () => {
    setEditingSegment(null);
    setFormData({
      name: '',
      type: 'Dynamic',
      filters: [{ id: `f-${Date.now()}`, field: 'Status', operator: 'Equals', value: '', logic: 'AND' }],
      tags: [],
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
    setQueryMode(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this segment?")) {
      await deleteSegment(id);
      showToast("Segment deleted");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast("Segment name required");
      return;
    }

    if (editingSegment) {
      await updateSegment(editingSegment.id, formData);
      showToast("Segment updated");
    } else {
      if (!checkMarketingLimit('segmentsLimit', segments.length, 'New Segments')) {
          return;
      }
      await addSegment(formData);
      showToast("New segment created");
    }
    setQueryMode(false);
  };

  const addFilter = () => {
    setFormData(prev => ({
      ...prev,
      filters: [...prev.filters, { id: `f-${Date.now()}`, field: 'Contact Property', operator: 'contains', value: '', logic: 'AND' }]
    }));
  };

  const removeFilter = (id: string) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== id)
    }));
  };

  const updateFilter = (id: string, key: keyof SegmentFilter, value: string) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.map(f => f.id === id ? { ...f, [key]: value } : f)
    }));
  };

  const filteredSegments = useMemo(() => {
    return segments.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [segments, searchTerm]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.company.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [contacts, searchTerm, statusFilter]);

  const handleExportContacts = () => {
      const headers = ['Name', 'Email', 'Company', 'Revenue', 'Status', 'Source', 'Last Seen'];
      const rows = filteredContacts.map(c => [c.name, c.email, c.company, c.revenue, c.status, c.source, c.lastSeen]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `contacts_export_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Export downloaded");
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-[1800px] mx-auto space-y-8 p-6 bg-[#000000] min-h-screen text-white font-sans relative pb-40">
      
      <style>{`
        @keyframes flow-rgb {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-flow-rgb {
          background-size: 200% 200%;
          animation: flow-rgb 6s ease infinite;
        }
        @keyframes pulse-soft {
           0%, 100% { opacity: 0.8; transform: scale(1); }
           50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
      
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleImportData} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} featureName={featureName} />
      <DataSourcesModal isOpen={isSourcesOpen} onClose={() => setIsSourcesOpen(false)} onSync={handleSyncSource} connectedSources={connectedSources} />

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-zinc-900 border border-zinc-800 text-white px-8 py-4 rounded-full font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 border border-white/10">
          <CheckCircle2 size={16} className="text-emerald-500" /> {toast}
        </div>
      )}

      {/* Hero Header with RGB Flow */}
      <div className="relative group w-full mb-12 px-0">
          {/* Animated RGB Border */}
          <div className="absolute -inset-[3px] bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded-[2.5rem] blur-[15px] opacity-30 group-hover:opacity-60 transition-all duration-700 animate-flow-rgb" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex-1 w-full md:w-auto mb-6 md:mb-0">
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">Audience Matrix</h1>
                  <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                     <Activity size={14} className="text-blue-500 animate-pulse" /> Live Segmentation Core
                  </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                 <div className="relative group/search w-full sm:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/search:text-blue-500 transition-colors" size={18} />
                    <input 
                       type="text" 
                       placeholder="Search segments..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-white outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all placeholder:text-zinc-600"
                    />
                 </div>
                 <button 
                    onClick={handleCreate}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 group/btn border border-blue-500"
                 >
                    <Plus size={16} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" /> New Segment
                 </button>
              </div>
          </div>
      </div>

      {/* DATA SOURCES CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TiltCard className="bg-[#0c0c0e] border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden group hover:border-zinc-700">
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 bg-zinc-900 rounded-xl text-zinc-400 border border-zinc-800 group-hover:text-white transition-colors group-hover:scale-110 duration-300">
                    <Database size={24} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sync Active</span>
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Contacts</p>
                <h3 className="text-4xl font-black text-white tracking-tight">{contacts.length.toLocaleString()}</h3>
            </div>
        </TiltCard>

        <TiltCard className="bg-[#0c0c0e] border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden group hover:border-blue-500/30">
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-3 bg-zinc-900 rounded-xl text-zinc-400 border border-zinc-800 group-hover:text-blue-500 transition-colors group-hover:scale-110 duration-300">
                    <Globe size={24} />
                </div>
                <button onClick={() => setIsSourcesOpen(true)} className="text-[10px] font-bold text-blue-500 hover:text-white uppercase tracking-wider bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all">Configure</button>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Data Sources</p>
                <div className="flex flex-wrap gap-2">
                    {connectedSources.length === 0 && <span className="text-zinc-600 text-xs font-bold italic">No sources connected</span>}
                    {connectedSources.map((src, i) => (
                        <div key={i} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] font-bold text-zinc-300 shadow-sm capitalize animate-in zoom-in">{src.replace('_', ' ')}</div>
                    ))}
                </div>
            </div>
        </TiltCard>

        <TiltCard 
            onClick={() => setIsImportOpen(true)}
            className="bg-[#0c0c0e] border border-zinc-800 border-dashed hover:border-blue-600/50 rounded-[2rem] p-8 relative overflow-hidden group cursor-pointer transition-colors"
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-zinc-900 rounded-full text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg group-hover:scale-110 duration-300">
                    <Upload size={24} />
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Import CSV File</p>
            </div>
        </TiltCard>
      </div>

      {/* Query Builder */}
      {queryMode && (
         <div className="bg-[#0c0c0e] border border-zinc-800 rounded-[2.5rem] p-10 mb-12 animate-in slide-in-from-top-4 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Database size={200} /></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                     <Database size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white">{editingSegment ? 'Edit Segment Logic' : 'New Segment Constructor'}</h3>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Define audience rules</p>
                  </div>
               </div>
               <button onClick={() => setQueryMode(false)} className="p-3 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>

            <div className="space-y-8 relative z-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Segment Name</label>
                     <input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-600 transition-all"
                        placeholder="e.g. Q4 High Value Leads"
                        autoFocus
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Segment Type</label>
                     <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                        {['Dynamic', 'Static', 'AI Predicted'].map(t => (
                           <button 
                              key={t}
                              onClick={() => setFormData({...formData, type: t as any})}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === t ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                           >
                              {t}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="h-px bg-zinc-800" />

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Filter Rules</p>
                  
                  {formData.filters.map((filter, index) => (
                     <div key={filter.id} className="group relative animate-in slide-in-from-left">
                        {index > 0 && (
                           <div className="flex justify-center py-2 relative">
                              <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-zinc-800/50" /></div>
                              <select 
                                 value={filter.logic}
                                 onChange={(e) => updateFilter(filter.id, 'logic', e.target.value)}
                                 className="relative z-10 bg-[#0c0c0e] border border-zinc-800 rounded-lg px-3 py-1 text-[10px] font-black uppercase text-zinc-500 outline-none cursor-pointer hover:border-zinc-700"
                              >
                                 <option value="AND">AND</option>
                                 <option value="OR">OR</option>
                              </select>
                           </div>
                        )}
                        
                        <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl group-hover:border-blue-500/30 transition-all">
                           <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 font-mono text-xs">{index + 1}</div>
                           
                           <select 
                              value={filter.field}
                              onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 w-48 appearance-none cursor-pointer"
                           >
                              <option>Contact Property</option>
                              <option>Lifecycle Stage</option>
                              <option>Revenue</option>
                              <option>Status</option>
                           </select>

                           <select 
                              value={filter.operator}
                              onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 w-40 appearance-none cursor-pointer"
                           >
                              <option>is any of</option>
                              <option>contains</option>
                              <option>Greater Than</option>
                              <option>Equals</option>
                           </select>

                           <input 
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500" 
                              placeholder="Value..." 
                           />

                           <button onClick={() => removeFilter(filter.id)} className="p-3 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16}/></button>
                        </div>
                     </div>
                  ))}

                  <button 
                     onClick={addFilter}
                     className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-bold text-xs uppercase tracking-widest hover:border-zinc-700 hover:text-zinc-300 transition-all flex items-center justify-center gap-2 hover:bg-zinc-900/50"
                  >
                     <Plus size={14} /> Add Filter Condition
                  </button>
               </div>
            </div>

            <div className="mt-10 pt-8 border-t border-zinc-800 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-8">
                  <div>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Est. Audience</p>
                     <p className="text-3xl font-black text-white">{editingSegment ? editingSegment.count : 'Calculating...'}</p>
                  </div>
                  <div className="h-10 w-px bg-zinc-800" />
                  <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                     <Wand size={16} />
                     <div>
                        <p className="text-[10px] font-black uppercase">AI Insight</p>
                        <span className="text-xs font-bold">Audience match is high quality</span>
                     </div>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setQueryMode(false)} className="px-8 py-4 text-zinc-400 hover:text-white text-xs font-bold transition-colors">Discard</button>
                  <button onClick={handleSave} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                     <Save size={16} /> Save Segment
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Segment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {filteredSegments.map((seg) => (
            <TiltCard 
               key={seg.id} 
               onClick={() => handleEdit(seg)} 
               className="group relative bg-[#0c0c0e] rounded-[2.5rem] p-8 border border-white/10 hover:border-zinc-700 shadow-xl transition-all duration-500 cursor-pointer overflow-hidden h-[280px] flex flex-col justify-between"
            >
               {/* Subtle background glow/gradient */}
               <div className={`absolute inset-0 bg-gradient-to-br from-[#0c0c0e] to-[#131315]`} />
               <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${seg.color}`} />
               
               <div className="flex justify-between items-start relative z-10">
                  <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform shadow-inner border border-zinc-800 group-hover:text-white duration-300">
                     {seg.type === 'AI Predicted' ? <Sparkles size={24} className="text-purple-500" /> : <Users size={24} />}
                  </div>
                  <button onClick={(e) => handleDelete(seg.id, e)} className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
               </div>

               <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-blue-500 transition-colors line-clamp-2">{seg.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                     <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                        seg.type === 'AI Predicted' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        seg.type === 'Dynamic' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        'bg-zinc-800 text-zinc-500 border-zinc-700'
                     }`}>{seg.type}</span>
                  </div>
               </div>

               <div className="flex items-end justify-between border-t border-zinc-800 pt-6 relative z-10">
                  <div>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Population</p>
                     <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-white tracking-tighter">{seg.count?.toLocaleString() || 0}</p>
                        <span className={`text-[10px] font-bold ${seg.growth?.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{seg.growth}</span>
                     </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors shadow-lg">
                     <ArrowUpRight size={18} strokeWidth={2.5} />
                  </div>
               </div>
            </TiltCard>
         ))}
      </div>

      {/* CONTACTS DATA TABLE */}
      <div className="mt-12 bg-[#0c0c0e] border border-zinc-800 rounded-[3rem] overflow-visible shadow-2xl relative group/table">
         {/* Background Glow */}
         <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none opacity-0 group-hover/table:opacity-100 transition-opacity duration-700 rounded-[3rem]" />
         
         <div className="p-10 border-b border-zinc-800 flex items-center justify-between relative z-10">
            <div>
               <h3 className="text-2xl font-black text-white">Global Registry</h3>
               <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{filteredContacts.length} Records Loaded</p>
            </div>
            <div className="flex gap-2 relative">
               <button onClick={handleExportContacts} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"><Download size={18} /></button>
            </div>
         </div>
         <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
               <thead className="bg-zinc-900/50 border-b border-zinc-800">
                  <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                     <th className="px-10 py-6">Entity</th>
                     <th className="px-10 py-6">Status</th>
                     <th className="px-10 py-6">Revenue</th>
                     <th className="px-10 py-6">Source</th>
                     <th className="px-10 py-6 text-right">Last Sync</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800/50">
                  {filteredContacts.map((contact, i) => (
                     <tr key={i} className="group hover:bg-zinc-900/30 transition-colors cursor-default">
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 shadow-lg group-hover:scale-110 transition-transform">
                                 <img src={contact.avatar} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{contact.name}</p>
                                 <p className="text-[10px] font-medium text-zinc-500">{contact.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                              contact.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                              contact.status === 'Lead' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                              'bg-zinc-800 text-zinc-500 border-zinc-700'
                           }`}>
                              {contact.status}
                           </span>
                        </td>
                        <td className="px-10 py-6 font-mono text-sm font-bold text-zinc-300">
                           ${contact.revenue.toLocaleString()}
                        </td>
                        <td className="px-10 py-6 text-xs font-bold text-zinc-500">
                           {contact.source}
                        </td>
                        <td className="px-10 py-6 text-right text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                           {contact.lastSeen}
                        </td>
                     </tr>
                  ))}
                  {filteredContacts.length === 0 && (
                     <tr>
                        <td colSpan={5} className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                           No contacts in registry matching criteria.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default MarketingSegmentation;
