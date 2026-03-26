
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Globe, Camera, Edit3, Save, 
  Briefcase, CheckCircle2, Clock, Calendar, Shield, Award,
  Github, Linkedin, Twitter, Link as LinkIcon, Zap, CheckSquare,
  Copy, ExternalLink, Layers, Layout, Code2, Terminal, Cpu,
  BarChart3, TrendingUp, MoreHorizontal, MessageSquare,
  Music, Coffee, Hash, Image as ImageIcon, ShieldCheck, Activity,
  Plus, Trash2, X, Upload, Loader2
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
import { useProfile, ComprehensiveProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';

const { useParams } = ReactRouterDom as any;

const ToolBadge = ({ icon: Icon, label, color }: any) => (
  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all group cursor-default">
    <div className={`p-2 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 mb-2 group-hover:scale-110 transition-transform`}>
      <Icon size={18} className={color.replace('bg-', 'text-')} />
    </div>
    <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400">{label}</span>
  </div>
);

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500 rotate-12 ${color.replace('bg-', 'text-')}`}>
      <Icon size={64} />
    </div>
    <div className="relative z-10">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white mb-3 shadow-md`}>
        <Icon size={18} />
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h4>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-500 mb-1 flex items-center">
            <TrendingUp size={10} className="mr-0.5" /> {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const TimelineItem = ({ id, role, company, period, current, isEditing, onChange, onDelete }: any) => (
  <div className="relative pl-8 pb-8 border-l-2 border-slate-100 dark:border-zinc-800 last:pb-0 last:border-l-0 group">
    <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-900 ${current ? 'bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'bg-slate-300 dark:bg-zinc-700'}`} />
    
    <div className="flex flex-col mb-1 relative">
      {isEditing ? (
        <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 mb-2">
           <div className="flex justify-between items-start gap-2">
             <input 
              value={role} 
              onChange={(e) => onChange('role', e.target.value)}
              className="w-full text-sm font-black text-slate-900 dark:text-white bg-white dark:bg-black/50 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
              placeholder="Role Title"
            />
            <button 
              onClick={() => onDelete(id)}
              className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
              title="Remove Position"
            >
              <Trash2 size={14} />
            </button>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
             <input 
              value={company} 
              onChange={(e) => onChange('company', e.target.value)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-black/50 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none w-full placeholder:text-blue-300"
              placeholder="Company"
            />
             <input 
              value={period} 
              onChange={(e) => onChange('period', e.target.value)}
              className="text-xs font-bold text-slate-500 dark:text-zinc-400 bg-white dark:bg-black/50 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none w-full placeholder:text-slate-400"
              placeholder="Period (e.g. 2020 - 2023)"
            />
           </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full mb-1">
             <h4 className={`text-sm font-black ${current ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400'}`}>{role}</h4>
             <span className="text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit whitespace-nowrap">{period}</span>
          </div>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">{company}</p>
        </>
      )}
    </div>
  </div>
);

const Profile: React.FC = () => {
  const { id: profileId } = useParams();
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ComprehensiveProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  
  // Real Backend Hook
  const { profile: user, loading, updateProfile } = useProfile(profileId);
  
  // Local state for cover image (if not in DB yet)
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Check ownership
  const isOwnProfile = user && authUser && user.email === authUser.email;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(type);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const getLocalTime = () => {
    if (!user) return '--:--:--';
    try {
      return currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        timeZone: user.timezone || 'UTC'
      });
    } catch (e) {
      return currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC'
      });
    }
  };

  const handleTimelineChange = (id: number, field: string, value: string) => {
    if (!editForm) return;
    const newTimeline = editForm.timeline.map((item: any) => 
        item.id === id ? { ...item, [field]: value } : item
    ) || [];
    setEditForm({ ...editForm, timeline: newTimeline });
  };

  const handleAddTimelineItem = () => {
    if (!editForm) return;
    const newItem = {
      id: Date.now(),
      role: '',
      company: '',
      period: '',
      current: false
    };
    setEditForm({ ...editForm, timeline: [newItem, ...(editForm.timeline || [])] });
  };

  const handleRemoveTimelineItem = (id: number) => {
    if (!editForm) return;
    if(window.confirm("Remove this experience?")) {
       const newTimeline = editForm.timeline.filter((item: any) => item.id !== id) || [];
       setEditForm({ ...editForm, timeline: newTimeline });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = field === 'avatar' ? 500 : 1200;
          const MAX_HEIGHT = field === 'avatar' ? 500 : 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality to save space
          const result = canvas.toDataURL('image/jpeg', 0.7);
          
          if (field === 'avatar') {
               if (isEditing && editForm) {
                   setEditForm({ ...editForm, avatar: result });
               } else {
                   updateProfile({ avatar: result });
               }
          } else {
               setCoverImage(result);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      if (editForm) {
          updateProfile(editForm);
      }
      setIsEditing(false);
      setEditForm(null);
    } else {
      if (!user) return;
      setEditForm(JSON.parse(JSON.stringify(user))); // Deep copy to avoid reference issues
      setIsEditing(true);
    }
  };

  if (loading) return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
          <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
  );

  if (!user) return (
      <div className="p-20 text-center text-slate-400">Profile Not Found</div>
  );

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {isOwnProfile && (
        <>
          <input 
            type="file" 
            ref={avatarInputRef} 
            onChange={(e) => handleImageUpload(e, 'avatar')} 
            className="hidden" 
            accept="image/*"
          />
          <input 
            type="file" 
            ref={coverInputRef} 
            onChange={(e) => handleImageUpload(e, 'coverImage')} 
            className="hidden" 
            accept="image/*"
          />
        </>
      )}

      <div className="relative group">
        <div className="h-80 w-full rounded-[3.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" />
          
          {isEditing && isOwnProfile && (
            <div className="absolute top-6 left-6 z-20 w-full max-w-md animate-in slide-in-from-top-4">
               <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl">
                 <div className="p-2 bg-white/10 rounded-xl text-white"><ImageIcon size={18} /></div>
                 <div className="flex-1">
                   <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">Cover Image</p>
                   <div className="flex gap-2">
                     <button 
                        onClick={() => coverInputRef.current?.click()}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                     >
                       <Upload size={12} /> Upload File
                     </button>
                     <input 
                       type="text" 
                       value={coverImage}
                       onChange={(e) => setCoverImage(e.target.value)}
                       placeholder="or paste URL..."
                       className="flex-[2] bg-transparent border-b border-white/30 outline-none text-white text-xs font-bold placeholder:text-white/30 px-2"
                     />
                   </div>
                 </div>
               </div>
            </div>
          )}

          <div className="absolute top-8 right-8 z-20 flex gap-3">
            {isOwnProfile && (
              <button 
                onClick={toggleEdit}
                className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 backdrop-blur-md border border-white/20 shadow-lg transition-all ${
                  isEditing 
                  ? 'bg-emerald-50 text-white border-emerald-400' 
                  : 'bg-black/30 text-white hover:bg-black/50'
                }`}
              >
                {isEditing ? <><Save size={16} /> Save Profile</> : <><Edit3 size={16} /> Edit Profile</>}
              </button>
            )}
          </div>
        </div>

        <div className="relative px-10 -mt-24 z-20 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
          <div className="flex items-end gap-8">
            <div className="relative group/avatar">
              <div className="w-48 h-48 rounded-[3rem] border-[8px] border-white dark:border-[#09090b] bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl relative">
                <img src={(isEditing && editForm) ? editForm.avatar : user.avatar} alt="Profile" className="w-full h-full object-cover" />
                {isEditing && isOwnProfile && (
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in cursor-pointer hover:bg-black/80 transition-colors"
                  >
                    <Camera className="text-white mb-3 opacity-80" size={28} />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Upload</span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-4 right-4 w-8 h-8 bg-emerald-500 border-[5px] border-white dark:border-[#09090b] rounded-full shadow-sm z-20" title="Online" />
            </div>
            
            <div className="pb-4 mb-2 space-y-1 w-full max-w-2xl">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm?.name || ''} 
                    onChange={(e) => setEditForm({ ...editForm!, name: e.target.value })} 
                    className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white bg-white/50 dark:bg-black/50 border border-transparent focus:border-blue-500 rounded-xl px-2 -ml-2 outline-none w-full transition-all"
                    placeholder="Your Name"
                  />
                ) : (
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h1>
                )}
                {!isEditing && user.type === 'team' && <ShieldCheck className="text-blue-500" size={28} />}
              </div>
              
              <div className="flex items-center gap-2 text-lg font-bold text-slate-500 dark:text-zinc-400">
                {isEditing ? (
                  <div className="flex gap-2 w-full">
                    <input 
                      value={editForm?.role || ''} 
                      onChange={(e) => setEditForm({ ...editForm!, role: e.target.value })} 
                      className="bg-white/50 dark:bg-black/50 border border-transparent focus:border-blue-500 rounded-lg px-2 py-1 outline-none text-slate-900 dark:text-white w-64 text-sm"
                      placeholder="Role"
                    />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 self-center" />
                    <input 
                      value={editForm?.location || ''} 
                      onChange={(e) => setEditForm({ ...editForm!, location: e.target.value })} 
                      className="bg-white/50 dark:bg-black/50 border border-transparent focus:border-blue-500 rounded-lg px-2 py-1 outline-none text-slate-900 dark:text-white w-48 text-sm"
                      placeholder="Location"
                    />
                  </div>
                ) : (
                  <>
                    {user.role} <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" /> {user.location}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-6">
             <div className="px-6 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl flex items-center gap-3 min-w-[180px]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                   <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-0.5">Local Time</p>
                   <p className="text-sm font-black text-slate-900 dark:text-white leading-none font-mono tabular-nums">{getLocalTime()}</p>
                </div>
             </div>
             
             {isEditing ? (
               <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl flex items-center gap-2">
                 <Globe size={18} className="text-slate-400" />
                 <input 
                   value={editForm?.website || ''} 
                   onChange={(e) => setEditForm({ ...editForm!, website: e.target.value })} 
                   className="bg-transparent border-none outline-none text-xs font-bold w-32 placeholder:text-slate-300"
                   placeholder="website.com"
                 />
               </div>
             ) : (
               <a href={`https://${user.website || 'agencyos.io'}`} target="_blank" rel="noreferrer" className="p-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl hover:scale-110 transition-transform">
                  <ExternalLink size={20} />
               </a>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 px-2">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Operations Card */}
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{user.type === 'team' ? 'Live Operations' : 'Account Status'}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md">Q3 TARGETS</span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-4xl font-black text-white">Active</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-[98%] shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Projects</p>
                    <p className="text-xl font-black text-white flex items-center gap-2">{user.stats?.projects} <Briefcase size={14} className="text-blue-400"/></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue</p>
                    <p className="text-xl font-black text-white flex items-center gap-2">{user.stats?.tasks} <Layers size={14} className="text-purple-400"/></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" /> Contact Identity
            </h3>
            
            <div className="space-y-5">
              <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all">
                <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">Email Address</p>
                <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.email}</span>
                   <button onClick={() => handleCopy(user.email, 'email')} className="text-slate-400 hover:text-blue-500 transition-colors ml-2">
                    {copyFeedback === 'email' ? <CheckCircle2 size={16} className="text-emerald-500"/> : <Copy size={16} />}
                   </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-800 space-y-3">
              {['twitter', 'github', 'linkedin'].map((platform) => (
                <div key={platform} className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400">
                    {platform === 'twitter' ? <Twitter size={14}/> : platform === 'github' ? <Github size={14}/> : <Linkedin size={14}/>}
                  </div>
                  {isEditing ? (
                    <input 
                      value={(editForm?.socials as any)?.[platform] || ''}
                      onChange={(e) => setEditForm({ ...editForm!, socials: { ...editForm!.socials, [platform]: e.target.value }})}
                      className="text-xs font-bold text-slate-600 dark:text-zinc-300 bg-transparent border-b border-dashed border-slate-300 dark:border-zinc-700 outline-none w-full"
                    />
                  ) : (
                    <a href={`https://${(user.socials as any)[platform]}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-blue-500 transition-colors">
                      {(user.socials as any)[platform] || 'Connect'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Bio Section */}
          <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative">
             <div className="absolute top-8 right-8 text-slate-200 dark:text-zinc-800 rotate-12">
               <MessageSquare size={120} className="opacity-20" />
             </div>
             
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 relative z-10">Professional Manifesto</h3>
             
             {isEditing ? (
               <textarea 
                 value={editForm?.bio || ''}
                 onChange={(e) => setEditForm({ ...editForm!, bio: e.target.value })}
                 className="w-full min-h-[120px] bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 text-slate-600 dark:text-zinc-300 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none relative z-10"
                 placeholder="Tell your story..."
               />
             ) : (
               <p className="text-lg font-medium text-slate-600 dark:text-zinc-300 leading-relaxed max-w-3xl relative z-10">
                 {user.bio || "No professional manifesto logged."}
               </p>
             )}
             
             <div className="mt-8 flex items-center gap-6 pt-8 border-t border-slate-100 dark:border-zinc-800 relative z-10">
                <div className="flex items-center gap-2">
                   <Calendar size={16} className="text-slate-400" />
                   <span className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Joined {user.joined}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Shield size={16} className="text-emerald-500" />
                   <span className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Identity Verified</span>
                </div>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard label="Total Projects" value={user.stats?.projects || "0"} trend="+0% YTD" icon={Briefcase} color="bg-blue-600 text-blue-600" />
             <StatCard label="Tasks Closed" value={user.stats?.tasks || "0"} trend="+0% MoM" icon={CheckSquare} color="bg-purple-600 text-purple-600" />
             <StatCard label="Client Rating" value="5.0/5" icon={Award} color="bg-amber-500 text-amber-500" />
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
             <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black text-slate-900 dark:text-white">Career Trajectory</h3>
               {isEditing && (
                 <button 
                   onClick={handleAddTimelineItem}
                   className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                 >
                   <Plus size={14} /> Add Role
                 </button>
               )}
             </div>
             
             <div className="space-y-2">
                {(isEditing ? editForm?.timeline : user.timeline)?.map((item: any) => (
                  <TimelineItem 
                    key={item.id} 
                    {...item} 
                    isEditing={isEditing}
                    onChange={(field: string, val: string) => handleTimelineChange(item.id, field, val)}
                    onDelete={handleRemoveTimelineItem}
                  />
                ))}
                {(!(isEditing ? editForm?.timeline : user?.timeline) || (isEditing ? editForm?.timeline : user?.timeline)?.length === 0) && (
                   <p className="text-sm text-slate-400 italic">No experience logged.</p>
                )}
             </div>
          </div>
          
          {/* Tools & Skills (Team Only) */}
          {user.type === 'team' && (
              <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">Technical Arsenal</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <ToolBadge icon={Terminal} label="Full Stack" color="bg-slate-900 text-slate-900 dark:bg-white dark:text-white" />
                    <ToolBadge icon={Layout} label="UI Design" color="bg-purple-600 text-purple-600" />
                    <ToolBadge icon={Cpu} label="System Arch" color="bg-blue-600 text-blue-600" />
                    <ToolBadge icon={Zap} label="Automation" color="bg-amber-500 text-amber-500" />
                    <ToolBadge icon={BarChart3} label="Analytics" color="bg-emerald-600 text-emerald-600" />
                    <ToolBadge icon={Coffee} label="Problem Solving" color="bg-rose-500 text-rose-500" />
                 </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
