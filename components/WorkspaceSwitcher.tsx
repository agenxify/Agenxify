import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Briefcase, Trash2, Settings } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { WorkspaceSettingsModal } from './WorkspaceSettingsModal';

export const WorkspaceSwitcher = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace, updateWorkspace, deleteWorkspace, loading } = useWorkspace();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [settingsWorkspaceId, setSettingsWorkspaceId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      await createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (workspaces.length <= 1) {
      alert("You must have at least one workspace.");
      return;
    }
    if (confirm("Are you sure you want to delete this workspace? All data associated with it will be permanently removed.")) {
      try {
        await deleteWorkspace(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 w-full p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black opacity-50">
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800 animate-pulse" />
        {isSidebarOpen && (
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-2/3" />
            <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-1/3" />
          </div>
        )}
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="p-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50">
        {isSidebarOpen ? 'Workspace Error' : '!'}
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full" ref={dropdownRef}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 w-full text-left transition-all p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black group cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 shadow-sm"
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg font-bold text-sm shadow-sm overflow-hidden">
              {currentWorkspace.logo_url ? (
                <img src={currentWorkspace.logo_url} alt={currentWorkspace.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentWorkspace.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {isSidebarOpen && (
            <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300 flex items-center justify-between">
              <div className="min-w-0">
                <h1 className="text-xs font-bold text-slate-900 dark:text-white leading-none truncate tracking-tight">{currentWorkspace.name}</h1>
                <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 mt-0.5 truncate uppercase tracking-widest">
                   Workspace
                </p>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          )}
        </div>

        {isOpen && isSidebarOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-2 py-1">Your Workspaces</p>
              <div className="max-h-64 overflow-y-auto no-scrollbar space-y-1">
                {workspaces.map(ws => {
                  const isOwner = ws.owner_id === user?.uid;
                  
                  return (
                    <div key={ws.id} className="group/item relative">
                        <div 
                          onClick={() => {
                            setCurrentWorkspace(ws);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left cursor-pointer ${currentWorkspace.id === ws.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-zinc-400 shrink-0 overflow-hidden">
                              {ws.logo_url ? (
                                <img src={ws.logo_url} alt={ws.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                ws.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">{ws.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {currentWorkspace.id === ws.id && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                            
                            {isOwner && (
                              <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSettingsWorkspaceId(ws.id);
                                    setIsOpen(false);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                  title="Workspace Settings"
                                >
                                  <Settings size={12} />
                                </button>
                                {workspaces.length > 1 && (
                                  <button 
                                    onClick={(e) => handleDelete(e, ws.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
                                    title="Delete Workspace"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t border-slate-100 dark:border-zinc-800 p-2 bg-slate-50 dark:bg-zinc-900/50">
              {!isCreating ? (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Plus size={14} /> Create Workspace
                </button>
              ) : (
                <form onSubmit={handleCreate} className="flex flex-col gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Workspace Name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-black text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-1">
                    <button type="submit" disabled={!newWorkspaceName.trim()} className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-md disabled:opacity-50">Create</button>
                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold py-1.5 rounded-md">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {settingsWorkspaceId && (
        <WorkspaceSettingsModal 
          workspaceId={settingsWorkspaceId} 
          onClose={() => setSettingsWorkspaceId(null)} 
        />
      )}
    </>
  );
};
