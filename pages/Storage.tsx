
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  HardDrive, Upload, File as FileIcon, Image as ImageIcon, Database, 
  Trash2, Download, Search, Filter, PieChart, MoreHorizontal,
  Cloud, Lock, Users, Globe, CheckCircle2, AlertCircle, Zap,
  Folder, Grid, List, Star, Clock, ChevronRight, Share2, Tag,
  Eye, FileText, Video, Music, MoreVertical, X, CornerDownRight,
  Plus, Check, Monitor, LayoutGrid, ArrowUpRight, FolderPlus, ArrowLeft,
  Maximize2, Minimize2, ChevronLeft, HelpCircle, ChevronDown, Info, Link as LinkIcon,
  FileCode, FileAudio, MessageSquare, Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { MOCK_PROFILES, MOCK_CLIENTS, AVAILABLE_PLANS } from '../constants.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useStorage, StoredFile } from '../hooks/useStorage';
import { useClients } from '../hooks/useClients';
import { useTeam } from '../hooks/useTeam';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

const formatSize = (kb: number) => {
  if (kb === 0) return '--';
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb} KB`;
};

const getFileIcon = (type: string, size: number = 20) => {
  const ext = type.toLowerCase();
  if (ext === 'folder') return <Folder size={size} className="text-blue-500 fill-blue-500/20" />;
  if (['jpg', 'png', 'svg', 'fig', 'gif', 'jpeg', 'webp', 'bmp'].includes(ext)) return <ImageIcon size={size} className="text-purple-500" />;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return <Video size={size} className="text-rose-500" />;
  if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music size={size} className="text-pink-500" />;
  if (['sql', 'db', 'csv', 'json', 'xml'].includes(ext)) return <Database size={size} className="text-emerald-500" />;
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return <FileText size={size} className="text-slate-500" />;
  if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py'].includes(ext)) return <FileCode size={size} className="text-amber-500" />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <CornerDownRight size={size} className="text-amber-500" />;
  return <FileIcon size={size} className="text-slate-400" />;
};

const FileCard: React.FC<{ 
  file: StoredFile; 
  selectedFile: StoredFile | null; 
  onSelect: (file: StoredFile) => void; 
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onNavigate?: (folderId: string) => void;
  onPreview?: (file: StoredFile) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}> = ({ 
  file, 
  selectedFile, 
  onSelect, 
  onToggleStar,
  onNavigate,
  onPreview,
  onDragStart,
  onDragEnd,
  onDrop
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    if (file.type === 'folder') {
        e.preventDefault(); // Allow drop
        e.currentTarget.classList.add('ring-2', 'ring-blue-500');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-blue-500');
  };

  const handleDropInternal = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-blue-500');
    if (file.type === 'folder') {
        onDrop(e, file.id);
    }
  };

  return (
    <div 
      onClick={() => onSelect(file)}
      onDoubleClick={() => {
        if (file.type === 'folder' && onNavigate) onNavigate(file.id);
        else if (file.type !== 'folder' && onPreview) onPreview(file);
        else onSelect(file);
      }}
      draggable
      onDragStart={(e) => onDragStart(e, file.id)}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropInternal}
      className={`group relative p-6 rounded-[2.5rem] border transition-all duration-300 cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 focus:ring-4 focus:ring-blue-200 outline-none ${
        selectedFile?.id === file.id 
        ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-500/30' 
        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${
          selectedFile?.id === file.id 
          ? 'bg-white/20' 
          : file.type === 'folder' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-zinc-800'
        } transition-transform group-hover:scale-110`}>
          {file.type === 'folder' 
            ? <Folder size={32} className={selectedFile?.id === file.id ? "text-white fill-white/20" : "text-blue-500 fill-blue-500/20"} />
            : getFileIcon(file.type, 32)
          }
        </div>
        <button 
          onClick={(e) => onToggleStar(file.id, e)} 
          className={`p-3 rounded-full transition-all ${
            selectedFile?.id === file.id 
            ? 'hover:bg-white/20 text-white' 
            : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-300 dark:text-zinc-600'
          }`}
        >
          <Star size={20} className={file.starred ? "fill-amber-400 text-amber-400" : ""} />
        </button>
      </div>
      
      <div className="space-y-1.5">
        <h4 className={`text-base font-black truncate pr-2 ${selectedFile?.id === file.id ? 'text-white' : 'text-slate-900 dark:text-white'}`} title={file.name}>
          {file.name}
        </h4>
        <div className={`flex items-center justify-between text-[11px] font-bold uppercase tracking-wide ${selectedFile?.id === file.id ? 'text-blue-100' : 'text-slate-400 dark:text-zinc-500'}`}>
          <span>{formatSize(file.size)}</span>
          <span>{file.date}</span>
        </div>
      </div>
    </div>
  );
};

const StorageHero = ({ used, total }: { used: number, total: number }) => {
  const percentage = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;
    
    const rotateX = -yPct * 8;
    const rotateY = xPct * 8;

    containerRef.current.style.setProperty('--rx', `${rotateX}deg`);
    containerRef.current.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty('--rx', '0deg');
    containerRef.current.style.setProperty('--ry', '0deg');
  };

  return (
    <>
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex-1 rounded-[3.5rem] p-10 md:p-14 relative overflow-hidden shadow-2xl border border-slate-800 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-16 group isolate transition-all duration-300 ease-out"
        style={{
          transform: 'perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
          backgroundColor: '#000000',
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
           <div 
             className="absolute w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[150px] mix-blend-screen opacity-50 bottom-[-25%] left-[-15%]"
           />
        </div>
        
        <div className="relative z-10 flex-1 space-y-8 w-full select-none">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md shadow-lg">Enterprise Vault</span>
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">Storage Capacity</h2>
            <p className="text-slate-300 text-lg font-medium mt-2 max-w-lg drop-shadow-md">Secure, encrypted, and redundant asset management for high-velocity agency operations.</p>
          </div>
          
          <div className="space-y-5">
             <div className="flex justify-between items-end">
                <div className="flex items-baseline gap-2">
                   <span className="text-7xl font-black text-white tracking-tighter drop-shadow-xl">{percentage}%</span>
                   <span className="text-xl font-bold text-slate-400">USED</span>
                </div>
                <span className="text-xl font-black text-white mb-2">{used.toFixed(2)} <span className="text-slate-500">/</span> {total} GB</span>
             </div>
             
             <div className="w-full bg-slate-900/50 h-8 rounded-full overflow-hidden border border-slate-700/50 p-1 backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.6)] relative overflow-hidden transition-all duration-1000 ease-out" 
                  style={{ width: `${percentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/30" />
                </div>
             </div>
          </div>
        </div>

        <div className="relative z-10 w-72 h-72 shrink-0 hidden xl:flex items-center justify-center transform transition-transform duration-500 hover:scale-105">
           <div className="w-full h-full relative drop-shadow-2xl">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Used', value: used },
                      { name: 'Free', value: total - used }
                    ]}
                    innerRadius={90}
                    outerRadius={115}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="rgba(30, 41, 59, 0.5)" />
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                 <Database size={40} className="text-white mb-3 drop-shadow-md" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Remaining</span>
                 <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">{(total - used).toFixed(0)}<span className="text-base text-slate-500 ml-1">GB</span></span>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

const Storage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { getLimit } = usePlanEnforcement();
  
  // Data for Share Modal
  const { clients } = useClients();
  const { members: team } = useTeam();

  // State for Navigation & UI
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{id: string, name: string}[]>([]);
  
  // Use Hook for Backend Data
  const { files, loading, uploadFile, createFolder, deleteItem, toggleStar, storageUsage, refresh } = useStorage(currentFolderId);

  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [addonStorage, setAddonStorage] = useState(0);

  // Calculate Total Storage based on Plan + Addons
  const totalStorageGB = getLimit('storageLimitGB');

  useEffect(() => {
    const plan = AVAILABLE_PLANS.find(p => p.storageLimitGB === getLimit('storageLimitGB')) || AVAILABLE_PLANS[0];
    setCurrentPlan(plan);
    // Calculate addon storage by subtracting base plan storage from total limit
    setAddonStorage(Math.max(0, totalStorageGB - plan.storageLimitGB));
  }, [totalStorageGB]);

  // Share Modal State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareSearchTerm, setShareSearchTerm] = useState('');
  const [shareTargets, setShareTargets] = useState<any[]>([]);

  useEffect(() => {
     // Re-build targets whenever clients/team data changes
     const conversations = JSON.parse(localStorage.getItem('agencyos_conversations_v3') || '[]');
     
     // Merge and de-duplicate targets
     const targets = [
         ...conversations.map((c: any) => ({ 
             id: c.participantId, 
             name: c.participantName, 
             type: c.isGroup ? 'Group' : 'Direct',
             avatar: c.participantAvatar 
         })),
         ...clients.map((c: any) => ({
             id: c.id,
             name: c.name,
             type: 'Client',
             avatar: c.avatar
         })),
         ...team.map((t: any) => ({
             id: t.id,
             name: t.name,
             type: 'Team',
             avatar: t.avatar
         }))
     ];
     
     // Remove duplicates by ID
     const uniqueTargets = Array.from(new Map(targets.map((item: any) => [item.id, item])).values());
     setShareTargets(uniqueTargets);
  }, [clients, team]);

  const handleShare = (targetId: string) => {
      if (!selectedFile) return;

      const conversations = JSON.parse(localStorage.getItem('agencyos_conversations_v3') || '[]');
      let targetConv = conversations.find((c: any) => c.participantId === targetId);

      if (!targetConv) {
          const target = shareTargets.find(t => t.id === targetId);
          if (target) {
              targetConv = {
                  id: `c-${Date.now()}`,
                  participantId: target.id,
                  participantName: target.name,
                  participantAvatar: target.avatar,
                  participantRole: target.type === 'Team' ? 'Team' : 'Client',
                  lastMessage: "File Shared",
                  lastMessageTime: new Date().toISOString(),
                  unreadCount: 0,
                  isOnline: false,
                  messages: []
              };
              conversations.unshift(targetConv);
          }
      }

      if (targetConv) {
          const newMessage = {
              id: `msg-${Date.now()}`,
              senderId: 'current',
              text: selectedFile.name,
              timestamp: new Date().toISOString(),
              type: 'file',
              fileUrl: selectedFile.url,
              fileName: selectedFile.name,
              fileSize: selectedFile.size * 1024,
              status: 'sent'
          };
          
          targetConv.messages.push(newMessage);
          targetConv.lastMessage = `Shared file: ${selectedFile.name}`;
          targetConv.lastMessageTime = new Date().toISOString();
          
          localStorage.setItem('agencyos_conversations_v3', JSON.stringify(conversations));
          window.dispatchEvent(new Event('storage'));
          
          showToast(`File shared with ${targetConv.participantName}`);
          setIsShareOpen(false);
      }
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Global Drag and Drop Handlers
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
         setIsDraggingOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleBatchUpload(Array.from(e.dataTransfer.files), currentFolderId);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
        window.removeEventListener('dragover', handleDragOver);
        window.removeEventListener('dragleave', handleDragLeave);
        window.removeEventListener('drop', handleDrop);
    };
  }, [currentFolderId]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  const handleBatchUpload = async (uploadedFiles: File[], parentId: string | null) => {
    let successCount = 0;
    for (const file of uploadedFiles) {
        try {
            await uploadFile(file, parentId);
            successCount++;
        } catch (err: any) {
            showToast(err.message || 'Upload failed', 'error');
            if (err.message?.includes('Storage limit reached')) break;
        }
    }
    if (successCount > 0) {
        showToast(`${successCount} files uploaded successfully`);
        refresh();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       handleBatchUpload(Array.from(e.target.files), currentFolderId);
    }
  };

  // Complex folder upload handling
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []) as File[];
    if (rawFiles.length === 0) return;

    let successCount = 0;
    // Use a temporary list to track new folders created in this batch
    // Key: Full Path string -> Value: Folder ID
    const createdFolderIds = new Map<string, string>();

    // Helper to recursively ensure folder exists and return its ID
    const ensureFolder = async (pathSegments: string[], parentId: string | null, parentPathKey: string): Promise<string | null> => {
        if (pathSegments.length === 0) return parentId;

        const currentName = pathSegments[0];
        const remaining = pathSegments.slice(1);
        const fullPathKey = parentPathKey ? `${parentPathKey}/${currentName}` : currentName;

        // Check if we already created this folder in this batch
        if (createdFolderIds.has(fullPathKey)) {
            return ensureFolder(remaining, createdFolderIds.get(fullPathKey)!, fullPathKey);
        }

        // Create the folder via hook
        const newFolder = await createFolder(currentName, parentId);
        const newId = newFolder?.id;

        if (newId) {
            createdFolderIds.set(fullPathKey, newId);
            return ensureFolder(remaining, newId, fullPathKey);
        }
        return null;
    };

    // Process files sequentially to maintain order and structure
    for (const file of rawFiles) {
        const path = file.webkitRelativePath; // e.g. "TopFolder/Sub/File.txt"
        
        try {
            if (!path) {
                await uploadFile(file, currentFolderId);
                successCount++;
                continue;
            }

            const parts = path.split('/');
            const fileName = parts.pop();
            const folderParts = parts; 

            // Get the folder ID where this file should go
            const targetFolderId = await ensureFolder(folderParts, currentFolderId, '');
            
            if (fileName && targetFolderId) {
                await uploadFile(file, targetFolderId);
                successCount++;
            }
        } catch (err: any) {
            showToast(err.message || 'Upload failed', 'error');
            if (err.message?.includes('Storage limit reached')) break;
        }
    }
    
    if (successCount > 0) {
        showToast(`${successCount} files uploaded successfully`);
        refresh();
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newFolderName.trim()) return;
    
    await createFolder(newFolderName, currentFolderId);
    setIsCreateFolderOpen(false);
    setNewFolderName('');
    showToast("Folder Created");
  };

  const handleDelete = async (id: string) => {
      if(confirm('Are you sure you want to delete this file?')) {
          await deleteItem(id);
          if(selectedFile?.id === id) setSelectedFile(null);
          showToast("Item deleted");
      }
  };

  const filteredFiles = useMemo(() => {
     return files.filter(f => {
         const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
         const matchesCategory = filterCategory === 'All' || f.category === filterCategory;
         return matchesSearch && matchesCategory;
     });
  }, [files, searchTerm, filterCategory]);

  const navigateFolder = (folderId: string | null) => {
     if (folderId === null) {
         setFolderPath([]);
         setCurrentFolderId(null);
     } else {
         const targetFolder = files.find(f => f.id === folderId);
         if (targetFolder) {
             setFolderPath(prev => [...prev, { id: targetFolder.id, name: targetFolder.name }]);
             setCurrentFolderId(folderId);
         }
     }
     setSelectedFile(null);
  };
  
  const navigateUp = () => {
      if (folderPath.length === 0) return;
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
      setSelectedFile(null);
  };

  // Render Preview Logic
  const renderPreviewContent = (file: StoredFile) => {
    const ext = file.type.toLowerCase();
    
    if (['jpg', 'png', 'svg', 'jpeg', 'webp', 'gif'].includes(ext)) {
       return <img src={file.url} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" alt={file.name} />;
    }
    
    if (['mp4', 'webm', 'mov'].includes(ext)) {
       return (
         <video controls className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl bg-black">
           <source src={file.url} />
           Your browser does not support the video tag.
         </video>
       );
    }

    if (['mp3', 'wav', 'ogg'].includes(ext)) {
        return (
            <div className="bg-zinc-900 p-10 rounded-3xl flex flex-col items-center gap-6 shadow-2xl">
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center animate-pulse">
                    <Music size={40} className="text-white"/>
                </div>
                <audio controls src={file.url} className="w-full min-w-[300px]" />
                <p className="text-white font-bold">{file.name}</p>
            </div>
        );
    }

    if (ext === 'pdf') {
       return (
          <iframe src={file.url} className="w-full h-[80vh] rounded-2xl shadow-2xl bg-white" title={file.name} />
       );
    }

    return (
       <div className="bg-zinc-900 p-16 rounded-[3rem] text-center max-w-md shadow-2xl">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
             <FileText size={40} className="text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{file.name}</h3>
          <p className="text-zinc-500 mb-8">Preview not available for this file type.</p>
          <a href={file.url} download={file.name} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
             <Download size={16}/> Download File
          </a>
       </div>
    );
  };

  return (
    <div className="max-w-[1800px] mx-auto p-6 md:p-10 pb-40 min-h-screen relative">
       
       {isDraggingOver && (
         <div className="fixed inset-0 z-[10050] bg-blue-600/10 backdrop-blur-sm border-8 border-blue-600 border-dashed m-4 rounded-[3rem] flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
             <Cloud size={100} className="text-blue-500 mb-6 animate-bounce" />
             <h2 className="text-4xl font-black text-white drop-shadow-lg">Drop Files to Upload</h2>
         </div>
       )}

       {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-12 flex items-center gap-4 border border-white/10">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${toastType === 'error' ? 'bg-rose-500' : 'bg-blue-600'}`}>
             {toastType === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          </div>
          {toast}
        </div>
      )}

       <div className="mb-12">
          <StorageHero used={storageUsage / (1024 * 1024)} total={totalStorageGB} />
       </div>

       {/* Toolbar */}
       <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 sticky top-4 z-30 bg-slate-50/80 dark:bg-black/80 backdrop-blur-xl p-2 rounded-[2.5rem] border border-slate-200/50 dark:border-zinc-800/50 shadow-xl">
          <div className="flex items-center gap-4 w-full md:w-auto pl-4">
             {currentFolderId && (
                <button onClick={navigateUp} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                   <ArrowLeft size={20} className="text-slate-500 dark:text-zinc-400" />
                </button>
             )}
             <div className="relative group flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
                <input 
                   type="text" 
                   placeholder={currentFolderId ? `Search in ${folderPath[folderPath.length-1].name}...` : "Search assets..."} 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full bg-slate-100 dark:bg-zinc-900 border border-transparent focus:border-blue-500 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
                />
             </div>
          </div>

          <div className="flex items-center gap-3 pr-2 w-full md:w-auto overflow-x-auto no-scrollbar">
             <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800">
                {['grid', 'list'].map(m => (
                   <button 
                     key={m} 
                     onClick={() => setViewMode(m as any)}
                     className={`p-3 rounded-xl transition-all ${viewMode === m ? 'bg-white dark:bg-black shadow-md text-blue-600 dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`}
                   >
                      {m === 'grid' ? <Grid size={18}/> : <List size={18}/>}
                   </button>
                ))}
             </div>
             
             <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800 mx-2" />
             
             <button onClick={() => setIsCreateFolderOpen(true)} className="p-3.5 bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl transition-all font-bold" title="New Folder">
                <FolderPlus size={20} />
             </button>
             
             <button 
                onClick={() => folderInputRef.current?.click()} 
                className="px-6 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:text-blue-600 dark:hover:text-white transition-all flex items-center gap-2 shadow-sm"
                title="Upload Folder Structure"
             >
                <Folder size={16} /> Upload Folder
             </button>

             <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                <Upload size={16} /> Upload File
             </button>
             
             <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
             <input 
                type="file" 
                ref={folderInputRef} 
                className="hidden" 
                onChange={handleFolderUpload} 
                {...({ webkitdirectory: "", directory: "" } as any)} 
                multiple 
             />
          </div>
       </div>

       <div className="flex flex-col xl:flex-row gap-8 items-start h-[calc(100vh-200px)]">
           {/* File Grid */}
           <div className="flex-1 overflow-y-auto no-scrollbar pt-8">
               {viewMode === 'grid' ? (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${selectedFile ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-6 pb-20`}>
                     {filteredFiles.map(file => (
                        <FileCard 
                           key={file.id} 
                           file={file} 
                           selectedFile={selectedFile} 
                           onSelect={setSelectedFile} 
                           onToggleStar={(id, e) => { e.stopPropagation(); toggleStar(id, !!file.starred); }}
                           onNavigate={navigateFolder}
                           onPreview={setPreviewFile}
                           onDragStart={(e, id) => { e.dataTransfer.setData('fileId', id); setIsDragging(true); }}
                           onDragEnd={() => setIsDragging(false)}
                           onDrop={(e, targetId) => {
                              // Not implemented move logic in hook for simplicity, but UI supports it
                           }}
                        />
                     ))}
                  </div>
               ) : (
                  <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm mb-20">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                           <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                              <th className="px-8 py-6">Name</th>
                              <th className="px-8 py-6">Size</th>
                              <th className="px-8 py-6">Type</th>
                              <th className="px-8 py-6">Date</th>
                              <th className="px-8 py-6 text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                           {filteredFiles.map(file => (
                              <tr 
                                 key={file.id} 
                                 className={`group transition-colors cursor-pointer ${selectedFile?.id === file.id ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                 onClick={() => setSelectedFile(file)}
                                 onDoubleClick={() => file.type === 'folder' ? navigateFolder(file.id) : setPreviewFile(file)}
                              >
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                       {getFileIcon(file.type)}
                                       <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-zinc-400">{formatSize(file.size)}</td>
                                 <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase">{file.type}</td>
                                 <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-zinc-400">{file.date}</td>
                                 <td className="px-8 py-5 text-right">
                                    <button 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(file.id);
                                       }}
                                       className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}

               {filteredFiles.length === 0 && (
                  <div className="py-20 text-center opacity-50 flex flex-col items-center gap-4">
                     <Folder size={64} className="text-slate-300 dark:text-zinc-700" />
                     <p className="text-sm font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Directory Empty</p>
                  </div>
               )}
           </div>

           {/* Details Sidebar */}
           {selectedFile && (
               <div className="w-80 bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 h-full fixed right-0 top-0 pt-20 md:pt-0 md:relative md:border-l-0 md:rounded-[2.5rem] md:shadow-xl md:border z-20 flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                     <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">File Details</h3>
                     <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><X size={16} className="text-slate-400"/></button>
                  </div>
                  
                  <div className="p-6 flex flex-col items-center text-center border-b border-slate-100 dark:border-zinc-800">
                      <div className="w-32 h-32 bg-slate-50 dark:bg-black rounded-[2rem] flex items-center justify-center mb-4 shadow-inner">
                         {getFileIcon(selectedFile.type, 64)}
                      </div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white break-all">{selectedFile.name}</h4>
                      <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase">{selectedFile.type} • {formatSize(selectedFile.size)}</p>
                  </div>

                  <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Information</p>
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-500 dark:text-zinc-400">Owner</span>
                              <span className="font-bold text-slate-900 dark:text-white">{selectedFile.owner}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-500 dark:text-zinc-400">Created</span>
                              <span className="font-bold text-slate-900 dark:text-white">{selectedFile.date}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-500 dark:text-zinc-400">Location</span>
                              <span className="font-bold text-slate-900 dark:text-white">{selectedFile.category}</span>
                           </div>
                        </div>
                     </div>
                     
                     <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-2">Actions</p>
                        <div className="grid grid-cols-3 gap-2">
                           <button onClick={() => setPreviewFile(selectedFile)} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all gap-1 group">
                              <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-bold uppercase">View</span>
                           </button>
                           <a href={selectedFile.url} download={selectedFile.name} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all gap-1 group">
                              <Download size={18} className="group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-bold uppercase">Save</span>
                           </a>
                           <button onClick={() => setIsShareOpen(true)} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all gap-1 group">
                              <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-bold uppercase">Share</span>
                           </button>
                        </div>
                        <button onClick={() => handleDelete(selectedFile.id)} className="w-full mt-2 py-3 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center justify-center gap-2">
                           <Trash2 size={14} /> Delete File
                        </button>
                     </div>
                  </div>
               </div>
           )}
       </div>

       {/* Create Folder Modal */}
       {isCreateFolderOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-zinc-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">New Folder</h3>
                <form onSubmit={handleCreateFolder}>
                   <input 
                      autoFocus
                      className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all mb-6"
                      placeholder="Folder Name"
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                   />
                   <div className="flex gap-3">
                      <button type="button" onClick={() => setIsCreateFolderOpen(false)} className="flex-1 py-3 text-xs font-black uppercase text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all">Cancel</button>
                      <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-blue-700 transition-all">Create</button>
                   </div>
                </form>
             </div>
          </div>
       )}

       {/* Preview Modal */}
       {previewFile && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl animate-in fade-in" onClick={() => setPreviewFile(null)}>
             <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                {renderPreviewContent(previewFile)}
                <div className="mt-8 text-center">
                   <h3 className="text-white font-bold text-xl mb-1">{previewFile.name}</h3>
                   <p className="text-zinc-500 text-sm font-medium">{formatSize(previewFile.size)} • {previewFile.type.toUpperCase()}</p>
                   <button onClick={() => setPreviewFile(null)} className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all backdrop-blur-md border border-white/5">Close Preview</button>
                </div>
             </div>
          </div>
       )}

      {/* Share Modal */}
      {isShareOpen && (
         <div className="fixed inset-0 z-[10005] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsShareOpen(false)}>
             <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Share File</h3>
                    <button onClick={() => setIsShareOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><X size={18} className="text-slate-400"/></button>
                 </div>
                 
                 <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black/20">
                     <input 
                        autoFocus
                        className="w-full bg-transparent outline-none font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                        placeholder="Search people or groups..."
                        value={shareSearchTerm}
                        onChange={e => setShareSearchTerm(e.target.value)}
                     />
                 </div>

                 <div className="flex-1 overflow-y-auto p-2">
                     {shareTargets.filter(t => t.name.toLowerCase().includes(shareSearchTerm.toLowerCase())).map(target => (
                         <button 
                            key={target.id} 
                            onClick={() => handleShare(target.id)}
                            className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-xl transition-all text-left group"
                         >
                            <div className="relative">
                                <img src={target.avatar || `https://i.pravatar.cc/150?u=${target.id}`} className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-all" alt=""/>
                                {target.type === 'Group' && <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-0.5 border border-black"><Users size={8} className="text-white"/></div>}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-900 dark:text-white">{target.name}</p>
                               <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wide">{target.type}</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <Share2 size={16} className="text-blue-500"/>
                            </div>
                         </button>
                     ))}
                     {shareTargets.length === 0 && <p className="text-center text-xs text-slate-400 py-10">No contacts found.</p>}
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};

export default Storage;
