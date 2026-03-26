
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, Filter, MoreHorizontal, FileText, 
  FolderPlus, Trash2, Edit3, Copy, Eye, LayoutGrid, 
  List, ArrowUpRight, Pin, Folder, File, ArrowUpDown, ChevronDown, X,
  Clock, Zap, LayoutTemplate, MoreVertical, Check, RefreshCw, AlertTriangle, CheckCircle2, Share2, ExternalLink
} from 'lucide-react';
import { Page } from '../types';
import { AVAILABLE_PLANS } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { usePages } from '../hooks/usePages';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';


const Pages: React.FC = () => {
  // Use Hook
  const { pages, createPage, updatePage, softDeletePage, restorePage, deletePage, loading } = usePages();
  const { getLimit } = usePlanEnforcement();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pinned' | 'Deleted'>('All');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Menu & Modal States
  const [menuState, setMenuState] = useState<{ id: string, x: number, y: number } | null>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'title', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewPage, setPreviewPage] = useState<Page | null>(null);

  // Mock folders for now (or implement a folders table later)
  const [folders, setFolders] = useState<{id: string, name: string}[]>([
    { id: 'f1', name: 'Flows' },
    { id: 'f2', name: 'Internal Clients' },
    { id: 'f3', name: 'External Clients' }
  ]);

  const navigate = useNavigate();

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuState(null);
      setIsSortMenuOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside, true); 
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside, true);
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreatePage = async () => {
    const pagesLimit = getLimit('pagesLimit');
    if (pagesLimit !== -1 && pages.filter(p => !p.deleted).length >= pagesLimit) {
        showToast(`Plan Limit Reached: Your plan allows max ${pagesLimit} active pages.`, 'error');
        return;
    }

    const newPage = await createPage({
      title: 'Untitled Page',
      folderId: activeFolderId,
    });
    
    if (newPage) {
      navigate(`/pages/edit/${newPage.id}`);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolders([...folders, { id: `fol-${Date.now()}`, name: newFolderName }]);
    setNewFolderName('');
    setIsNewFolderOpen(false);
  };

  const handlePin = (id: string, currentPinned: boolean) => {
    updatePage(id, { pinned: !currentPinned });
    setMenuState(null);
  };

  const handleDelete = (id: string) => {
    // Soft Delete
    if (window.confirm("Move this page to trash?")) {
      softDeletePage(id);
    }
    setMenuState(null);
  };

  const handleRestore = (id: string) => {
    restorePage(id);
    setMenuState(null);
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm("Permanently remove this page? This cannot be undone.")) {
      deletePage(id);
    }
    setMenuState(null);
  };

  const handleDuplicate = async (page: Page) => {
    const pagesLimit = getLimit('pagesLimit');
    if (pagesLimit !== -1 && pages.filter(p => !p.deleted).length >= pagesLimit) {
        showToast(`Plan Limit Reached: Cannot duplicate page.`, 'error');
        return;
    }

    await createPage({
      title: `${page.title} (Copy)`,
      blocks: page.blocks,
      slug: `${page.slug}-copy-${Date.now()}`
    });
    
    showToast("Page Duplicated");
    setMenuState(null);
  };

  const handleViewLive = (id: string) => {
    const baseUrl = window.location.href.split('#')[0];
    const url = `${baseUrl}#/p/${id}`;
    window.open(url, '_blank');
    setMenuState(null);
  };

  const openMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuState({ id, x: rect.right, y: rect.bottom });
  };

  const filteredPages = useMemo(() => {
    const result = pages.filter(p => {
      // 1. Deleted Filter Logic
      if (activeFilter === 'Deleted') {
        if (!p.deleted) return false;
      } else {
        if (p.deleted) return false;
      }

      // 2. Search
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 3. Folder Scope (Ignore folder in Deleted view to show all deleted items)
      const matchesFolder = activeFilter !== 'Deleted' && activeFolderId ? p.folderId === activeFolderId : true;
      
      // 4. Pinned Scope
      const matchesFilter = activeFilter === 'Pinned' ? p.pinned : true;
      
      return matchesSearch && matchesFolder && matchesFilter;
    });

    // Sorting Logic
    result.sort((a, b) => {
      // Using updatedAt string for comparison might be tricky if date format varies, but usePages formats it.
      // Better to rely on sort by ID/created usually if date string isn't ISO. 
      // Assuming hook returns a sortable format or we accept simple string sort for now.
      if (sortConfig.key === 'date') {
         return sortConfig.direction === 'asc' 
            ? String(a.updatedAt).localeCompare(String(b.updatedAt))
            : String(b.updatedAt).localeCompare(String(a.updatedAt));
      } else if (sortConfig.key === 'title') {
        return sortConfig.direction === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  }, [pages, searchTerm, activeFolderId, activeFilter, sortConfig]);

  const counts = {
    all: pages.filter(p => !p.deleted).length,
    pinned: pages.filter(p => p.pinned && !p.deleted).length,
    deleted: pages.filter(p => p.deleted).length, 
    flows: pages.filter(p => p.folderId === 'f1' && !p.deleted).length,
    internal: pages.filter(p => p.folderId === 'f2' && !p.deleted).length
  };

  if (loading) return <div className="p-10 text-white flex justify-center"><RefreshCw className="animate-spin" /></div>;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] animate-in fade-in duration-700 bg-slate-50 dark:bg-black font-sans overflow-hidden rounded-[2.5rem] shadow-sm relative">
      
      {toast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[10002] bg-zinc-900 border border-zinc-800 text-white px-8 py-4 rounded-full font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 border border-white/10">
          <CheckCircle2 size={16} className="text-emerald-500" /> {toast}
        </div>
      )}

      {/* Sidebar - Independently Scrollable */}
      <div className="w-80 border-r border-slate-200 dark:border-zinc-800/60 p-6 hidden md:flex flex-col gap-8 bg-white/50 dark:bg-[#09090b]/80 backdrop-blur-xl h-full overflow-y-auto shrink-0">
        <div className="relative group z-10 shrink-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-sm"></div>
          <div className="relative flex items-center bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <Search className="ml-4 text-slate-400 dark:text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="w-full pl-3 pr-4 py-3.5 bg-transparent text-sm font-bold outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 space-y-8 pr-2">
          {/* Library Section */}
          <div className="space-y-2">
            <p className="px-4 text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-3">Library</p>
            
            <button 
              onClick={() => { setActiveFilter('All'); setActiveFolderId(null); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 group relative overflow-hidden ${activeFilter === 'All' && !activeFolderId ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50'}`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <LayoutGrid size={18} className={activeFilter === 'All' && !activeFolderId ? 'text-white' : 'text-slate-400 dark:text-zinc-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'} /> 
                All Pages
              </div>
              <span className={`relative z-10 px-2.5 py-0.5 rounded-lg text-[10px] font-black ${activeFilter === 'All' && !activeFolderId ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 group-hover:bg-white dark:group-hover:bg-zinc-700'}`}>{counts.all}</span>
            </button>

            <button 
              onClick={() => setActiveFilter('Pinned')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 group ${activeFilter === 'Pinned' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Pin size={18} className={activeFilter === 'Pinned' ? 'text-white' : 'text-slate-400 dark:text-zinc-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'} /> 
                Pinned
              </div>
              <span className={`text-[10px] font-black ${activeFilter === 'Pinned' ? 'text-white opacity-100' : 'opacity-60'}`}>{counts.pinned}</span>
            </button>

            <button 
              onClick={() => setActiveFilter('Deleted')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 group ${activeFilter === 'Deleted' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50'}`}
            >
              <div className="flex items-center gap-3">
                <Trash2 size={18} className={activeFilter === 'Deleted' ? 'text-white' : 'text-slate-400 dark:text-zinc-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'} /> 
                Deleted
              </div>
              <span className={`text-[10px] font-black ${activeFilter === 'Deleted' ? 'text-white opacity-100' : 'opacity-60'}`}>{counts.deleted}</span>
            </button>
          </div>
          
          {/* Collections Section */}
          <div className="space-y-2">
             <div className="flex items-center justify-between px-4 mb-3">
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Collections</p>
                <button onClick={() => setIsNewFolderOpen(true)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Plus size={14} strokeWidth={3}/></button>
             </div>
             
             {folders.map(f => (
               <button 
                 key={f.id}
                 onClick={() => { setActiveFolderId(f.id); setActiveFilter('All'); }}
                 className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 group ${activeFolderId === f.id ? 'bg-white dark:bg-zinc-800/80 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-zinc-700' : 'text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-white'}`}
               >
                 <div className="flex items-center gap-3">
                    <Folder size={18} className={activeFolderId === f.id ? 'text-blue-500 fill-blue-500/20' : 'text-slate-400 dark:text-zinc-600 group-hover:text-blue-500 transition-colors'} /> 
                    {f.name}
                 </div>
                 <span className="text-[10px] font-black opacity-40 group-hover:opacity-100 transition-opacity">{pages.filter(p => p.folderId === f.id && !p.deleted).length}</span>
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-black transition-colors h-full overflow-hidden">
        
        {/* Header */}
        <div className="h-24 px-8 md:px-12 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-zinc-800/50 z-40 sticky top-0">
          <div>
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : activeFilter}</h2>
             <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-2">
               <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'Deleted' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span> {filteredPages.length} documents
             </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
               <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
               <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600'}`}><List size={18} /></button>
            </div>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
            
            <button 
              onClick={handleCreatePage} 
              className="group relative px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
               <div className="flex items-center gap-2 relative z-10">
                  <Plus size={18} strokeWidth={3} /> 
                  <span className="text-xs font-black uppercase tracking-widest">New Page</span>
               </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-32 scroll-smooth">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredPages.map((page, idx) => (
                <div 
                  key={page.id} 
                  className="group relative flex flex-col h-[320px] bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-in fade-in zoom-in-95 fill-mode-forwards"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => activeFilter !== 'Deleted' && navigate(`/pages/edit/${page.id}`)}
                >
                  <div className="flex-1 bg-slate-50 dark:bg-[#0c0c0e] relative p-6 flex flex-col items-center justify-center group-hover:bg-white dark:group-hover:bg-zinc-900/50 transition-colors duration-500 rounded-t-[2.5rem] overflow-hidden">
                     <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-zinc-800 p-4 transform scale-100 group-hover:scale-[1.02] group-hover:rotate-1 transition-all duration-500 ease-out origin-bottom flex flex-col gap-3 opacity-90 group-hover:opacity-100">
                        <div className="w-full h-24 bg-slate-50 dark:bg-zinc-800/50 rounded-lg flex items-center justify-center mb-2 overflow-hidden relative">
                           <LayoutTemplate size={24} className="text-slate-200 dark:text-zinc-700" />
                        </div>
                        <div className="space-y-1.5">
                           <div className="w-3/4 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full" />
                           <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full" />
                        </div>
                     </div>
                     
                     <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-10">
                        {activeFilter !== 'Deleted' ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/pages/edit/${page.id}`); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 hover:scale-105 transition-all shadow-xl">Edit</button>
                            <button onClick={(e) => { e.stopPropagation(); const baseUrl = window.location.href.split('#')[0]; window.open(`${baseUrl}#/p/${page.id}`, '_blank'); }} className="p-2.5 bg-white/20 text-white rounded-xl hover:bg-white/40 backdrop-blur-md transition-colors"><Eye size={16}/></button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const baseUrl = window.location.href.split('#')[0];
                                const url = `${baseUrl}#/p/${page.id}`;
                                navigator.clipboard.writeText(url);
                                showToast("Public link copied");
                              }} 
                              className="p-2.5 bg-white/20 text-white rounded-xl hover:bg-white/40 backdrop-blur-md transition-colors"
                              title="Share Public Link"
                            >
                              <Share2 size={16}/>
                            </button>
                          </>
                        ) : (
                          <div className="px-4 py-2 bg-rose-500/80 text-white rounded-xl font-bold text-xs">Deleted</div>
                        )}
                     </div>
                  </div>
                  
                  <div className="p-5 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 relative z-20 flex flex-col justify-center min-h-[90px] rounded-b-[2.5rem]">
                    <div className="flex justify-between items-start mb-1.5">
                      <p className="font-black text-sm text-slate-900 dark:text-white truncate pr-4">{page.title}</p>
                      <button 
                        onClick={(e) => openMenu(e, page.id)} 
                        className="text-slate-300 dark:text-zinc-600 hover:text-slate-900 dark:hover:text-white transition-colors p-1 -mr-2 rounded-lg"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-auto">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                        <Clock size={12} />
                        <span>{page.updatedAt}</span>
                      </div>
                      
                      {page.pinned && (
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg shadow-sm">
                          <Pin size={12} fill="currentColor" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPages.map((page, idx) => (
                <div 
                  key={page.id} 
                  className="group flex items-center justify-between px-6 py-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-lg transition-all cursor-pointer relative animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => activeFilter !== 'Deleted' && navigate(`/pages/edit/${page.id}`)}
                >
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-50 dark:bg-black rounded-2xl text-slate-400 dark:text-zinc-500 border border-slate-100 dark:border-zinc-800 group-hover:text-blue-500 transition-all">
                      <FileText size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors mb-1 block">{page.title}</p>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                         <span className="flex items-center gap-1"><Clock size={10} /> {page.updatedAt}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
                         <span>{page.owner}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {page.pinned && (
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30">
                        <Pin size={16} fill="currentColor" />
                      </div>
                    )}
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          const baseUrl = window.location.href.split('#')[0];
                          const url = `${baseUrl}#/p/${page.id}`;
                          navigator.clipboard.writeText(url);
                          showToast("Public link copied");
                      }}
                      className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-blue-600 transition-colors"
                      title="Share Public Link"
                    >
                      <Share2 size={20} />
                    </button>

                    <div className="w-px h-8 bg-slate-100 dark:bg-zinc-800 mx-2" />
                    <button 
                      onClick={(e) => openMenu(e, page.id)} 
                      className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-900 transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Create Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsNewFolderOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-100 dark:border-zinc-800 p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <FolderPlus size={24} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">New Collection</h3>
              </div>
              <button onClick={() => setIsNewFolderOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Collection Name</label>
                 <input 
                   autoFocus 
                   type="text" 
                   className="w-full px-6 py-4 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-slate-900 dark:text-white transition-all placeholder:text-slate-300" 
                   value={newFolderName} 
                   onChange={(e) => setNewFolderName(e.target.value)} 
                   placeholder="e.g. Q4 Campaigns" 
                 />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsNewFolderOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Menu Portal */}
      {menuState && createPortal(
        <div 
          className="fixed z-[9999] w-52 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5"
          style={{ top: menuState.y + 8, left: menuState.x - 208 }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeFilter === 'Deleted' ? (
            <>
              <button onClick={() => handleRestore(menuState.id)} className="w-full px-3 py-2.5 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl flex items-center gap-3 transition-colors"><RefreshCw size={14} /> Restore Page</button>
              <button onClick={() => handlePermanentDelete(menuState.id)} className="w-full px-3 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl flex items-center gap-3 transition-colors"><Trash2 size={14} /> Permanently Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate(`/pages/edit/${menuState.id}`); setMenuState(null); }} className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-3 transition-colors"><Edit3 size={14} /> Open Editor</button>
              <button onClick={() => handleViewLive(menuState.id)} className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-3 transition-colors"><ExternalLink size={14} /> View Live Page</button>
              <button onClick={() => handlePin(menuState.id, pages.find(p => p.id === menuState.id)?.pinned || false)} className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-3 transition-colors"><Pin size={14} /> {pages.find(p => p.id === menuState.id)?.pinned ? 'Unpin Page' : 'Pin Page'}</button>
              <button onClick={() => handleDuplicate(pages.find(p => p.id === menuState.id)!)} className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-3 transition-colors"><Copy size={14} /> Duplicate</button>
              <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1 mx-2" />
              <button onClick={() => handleDelete(menuState.id)} className="w-full px-3 py-2.5 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl flex items-center gap-3 transition-colors"><Trash2 size={14} /> Move to Trash</button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Pages;
