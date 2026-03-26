
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, ArrowLeft, Check, Upload, Calendar, 
  ChevronDown, X, Monitor, ShieldCheck, Zap, Heart,
  Shield, Globe, Lock, Cpu, Sparkles, RefreshCw,
  Play, MessageSquare, Mail, Terminal, DollarSign,
  CheckCircle2, User, Key, Map, ClipboardList, ThumbsUp,
  Share, Palette, CreditCard, Video, Users,
  ChevronRight, Target, Info, FileText, Layout,
  ShieldAlert, Landmark, Briefcase, Star, Handshake,
  Download, Image as ImageIcon, Send,
  Clock, Copy, Eye, FileSearch, CheckCircle, Hammer,
  Code, Boxes, ExternalLink
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { useTeam } from '../hooks/useTeam';

const { useNavigate, useParams } = ReactRouterDom as any;

const ClientOnboarding: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchFlowById, submitResponse } = useOnboarding();
  const { members } = useTeam();
  const [manifest, setManifest] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bgRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchManifest = async () => {
      if (!id) return;
      
      const data = await fetchFlowById(id);

      if (data) {
        setManifest({
          ...data,
          steps: data.steps || [],
          branding: data.branding || {}
        });
      } else {
        setError("Protocol Not Found");
      }
    };

    fetchManifest();
  }, [id, fetchFlowById]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!bgRef.current || !manifest) return;
        const intensity = manifest.branding.parallaxIntensity || 40;
        const x = ((e.clientX / window.innerWidth) - 0.5) * intensity;
        const y = ((e.clientY / window.innerHeight) - 0.5) * intensity;
        bgRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [manifest]);

  if (error) return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <ShieldAlert size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">Protocol Error</h2>
        <p className="text-xs font-bold text-zinc-500">{error}</p>
      </div>
  );

  if (!manifest) return (
     <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Initializing Secure Uplink...</p>
     </div>
  );

  const step = manifest.steps[currentIndex];
  const branding = manifest.branding;
  const progress = (currentIndex / (manifest.steps.length - 1)) * 100;

  const handleNext = () => {
     if (currentIndex < manifest.steps.length - 1) {
        setIsAnimating(true);
        setDirection('next');
        setTimeout(() => {
           setCurrentIndex(prev => prev + 1);
           setIsAnimating(false);
        }, branding.transitionDuration || 600);
     }
  };

  const handleBack = () => {
     if (currentIndex > 0) {
        setIsAnimating(true);
        setDirection('back');
        setTimeout(() => {
           setCurrentIndex(prev => prev - 1);
           setIsAnimating(false);
        }, branding.transitionDuration || 600);
     }
  };

  const startAudit = () => {
    setIsScanning(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 1;
      setScanProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 500);
      }
    }, 30);
  };

  const generateAndSaveSubmission = async () => {
      setIsSaving(true);
      
      try {
          // 1. Format Data for CSV
          const headers = ['Data Field', 'Value Submitted'];
          const rows = Object.entries(formData).map(([key, value]) => {
              let valStr = String(value);
              if (typeof value === 'boolean') valStr = value ? 'Confirmed/Yes' : 'No';
              if (typeof value === 'object') valStr = JSON.stringify(value);
              
              // Escape quotes for CSV
              const safeKey = String(key).replace(/"/g, '""');
              const safeValue = valStr.replace(/"/g, '""');
              return `"${safeKey}","${safeValue}"`;
          });

          const csvContent = [headers.join(','), ...rows].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          
          const clientName = formData['Full Name'] || formData['Company Name'] || 'Client';
          const fileName = `Submission_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;

          // Trigger Download
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Save to Storage
          const reader = new FileReader();
          
          await new Promise<void>((resolve) => {
              reader.onloadend = async () => {
                  const base64data = reader.result as string;
                  
                  // 2. Save to AgencyOS Storage
                  const storageKey = 'agencyos_storage_files';
                  let currentStorage: any[];
                  try {
                      currentStorage = JSON.parse(localStorage.getItem(storageKey) || '[]');
                  } catch (e) { currentStorage = []; }

                  // Create Folder if needed
                  let folder = currentStorage.find((f: any) => f.type === 'folder' && f.name === 'Onboarding Submissions');
                  if (!folder) {
                      folder = {
                          id: `fol-subs-${Date.now()}`,
                          name: 'Onboarding Submissions',
                          type: 'folder',
                          size: 0,
                          category: 'Database',
                          owner: 'System',
                          date: new Date().toISOString().split('T')[0],
                          parentId: null
                      };
                      currentStorage.push(folder);
                  }

                  const newFile = {
                      id: `file-sub-${Date.now()}`,
                      name: fileName,
                      type: 'csv',
                      size: Math.round(blob.size / 1024),
                      category: 'Database',
                      owner: clientName,
                      date: new Date().toISOString().split('T')[0],
                      url: base64data,
                      parentId: folder.id
                  };

                  const updatedStorage = [...currentStorage, newFile];
                  localStorage.setItem(storageKey, JSON.stringify(updatedStorage));
                  
                  // 3. Dispatch Events to update UI
                  window.dispatchEvent(new Event('storage'));
                  
                  // 4. Save to Supabase
                  await submitResponse(id, formData, clientName);
                  
                  resolve();
              };
              reader.readAsDataURL(blob);
          });

      } catch (error) {
          console.error("Submission Error:", error);
      } finally {
          setIsSaving(false);
          // Redirect to Dashboard after saving
          navigate('/');
      }
  };

  const getAnimationClass = () => {
     if (!isAnimating) return 'translate-x-0 opacity-100 scale-100 rotate-0 blur-0 skew-x-0 brightness-100';
     const type = step.transitionType || 'Slide';
     const isNext = direction === 'next';

     switch(type) {
        case 'SlideUp': return isNext ? '-translate-y-full opacity-0' : 'translate-y-full opacity-0';
        case 'SlideDown': return isNext ? 'translate-y-full opacity-0' : '-translate-y-full opacity-0';
        case 'SlideLeft': return 'translate-x-[-100%] opacity-0';
        case 'SlideRight': return 'translate-x-[100%] opacity-0';
        case 'ZoomIn': return 'scale-150 opacity-0 blur-2xl';
        case 'ZoomOut': return 'scale-50 opacity-0 blur-2xl';
        case 'BlurIn': return 'blur-[100px] opacity-0';
        case 'BlurOut': return 'blur-[50px] scale-110 opacity-0';
        case 'CinematicBlur': return 'blur-[60px] opacity-0 scale-105';
        case 'Hyperspace': return 'scale-x-[10] scale-y-[0.1] opacity-0 brightness-200';
        default: return isNext ? '-translate-x-40 opacity-0' : 'translate-x-40 opacity-0';
     }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    
    // Resolve user for folder
    const clientName = formData['Full Name'] || formData['Company Name'] || 'Client Uploads';
    const storageKey = 'agencyos_storage_files';
    let currentStorage: any[];
    try {
        currentStorage = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (e) { currentStorage = []; }

    // Find/Create Client Folder
    let folder = currentStorage.find((f: any) => f.type === 'folder' && f.name === clientName);
    if (!folder) {
        folder = {
            id: `fol-${Date.now()}`,
            name: clientName,
            type: 'folder',
            size: 0,
            category: 'Client',
            owner: 'System',
            date: new Date().toISOString().split('T')[0],
            parentId: null
        };
        currentStorage.push(folder);
    }

    // Process files
    const newFiles: any[] = [];
    const filePromises = Array.from(files).map((file: File) => {
        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target?.result as string;
                newFiles.push({
                    id: `file-${Date.now()}-${Math.random()}`,
                    name: file.name,
                    type: file.name.split('.').pop() || 'file',
                    size: Math.round(file.size / 1024),
                    category: 'Client',
                    owner: clientName,
                    date: new Date().toISOString().split('T')[0],
                    url: base64,
                    parentId: folder.id
                });
                resolve();
            };
            reader.readAsDataURL(file);
        });
    });

    await Promise.all(filePromises);

    // Save
    localStorage.setItem(storageKey, JSON.stringify([...currentStorage, ...newFiles]));
    window.dispatchEvent(new Event('storage'));

    const fileNames = Array.from(files).map((f: File) => f.name).join(', ');
    setFormData(prev => ({ ...prev, uploadedFiles: fileNames }));
    
    setUploadingFiles(false);
    handleNext();
  };

  const ThemedButton = ({ children, onClick, className = "", style = {}, variant = "primary", disabled = false }: any) => {
    let variantClasses = "";
    const variantStyles: any = {
      paddingLeft: `${branding.buttonPaddingX}px`,
      paddingRight: `${branding.buttonPaddingX}px`,
      paddingTop: `${branding.buttonPaddingY}px`,
      paddingBottom: `${branding.buttonPaddingY}px`,
      borderRadius: `${branding.buttonBorderRadius}px`,
      textTransform: branding.buttonTextTransform,
      letterSpacing: `${branding.buttonLetterSpacing}em`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    if (branding.buttonGlow && !disabled) {
      variantClasses += " hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]";
    }

    switch(variant) {
      case "secondary":
        variantClasses += " bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 shadow-lg";
        break;
      case "success":
        variantClasses += " bg-emerald-600 text-white shadow-[0_10px_30px_-5px_rgba(16,185,129,0.4)] hover:bg-emerald-500";
        break;
      case "outline":
        variantClasses += " bg-transparent border border-white/10 text-white/60 hover:text-white hover:bg-white/5";
        break;
      case "danger":
        variantClasses += " bg-rose-600 text-white shadow-[0_10px_30px_-5px_rgba(225,29,72,0.4)] hover:bg-rose-500";
        break;
      default: // primary
        variantClasses += " text-white hover:brightness-110";
        if (branding.buttonGradient) {
          variantStyles.background = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;
        } else {
          variantStyles.backgroundColor = branding.primaryColor;
        }
        variantStyles.boxShadow = `0 10px 30px -5px rgba(0,0,0,${branding.buttonShadowOpacity})`;
    }

    return (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`font-black text-[11px] transition-all active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-20 disabled:grayscale ${variantClasses} ${className}`}
        style={{
          ...variantStyles,
          ...style,
          '--hover-scale': branding.buttonHoverScale
        } as any}
        onMouseEnter={(e) => e.currentTarget.style.transform = `scale(${branding.buttonHoverScale})`}
        onMouseLeave={(e) => e.currentTarget.style.transform = `scale(1)`}
      >
        {children}
      </button>
    );
  };

  const RenderContent = () => {
    const config = step.config || {};
    
    switch(step.type) {
      case 'video':
        return (
          <div className="space-y-8 w-full max-w-4xl mx-auto">
            <div className={`aspect-video w-full rounded-[2.5rem] border-4 border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative group`}>
               {config.videoUrl ? (
                 <iframe 
                   src={config.videoUrl.replace('watch?v=', 'embed/').split('&')[0] + (config.autoplay ? '?autoplay=1&mute=1' : '')} 
                   className="w-full h-full" 
                   allow="autoplay; encrypted-media" 
                   allowFullScreen 
                 />
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-white/20">
                    <Video size={80} className="mb-4 opacity-50" />
                    <p className="text-xs font-black uppercase tracking-widest">Video Stream Unavailable</p>
                 </div>
               )}
            </div>
            <div className="glass-card flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-6">
                  <div className="p-4 rounded-2xl text-white shadow-lg" style={{ backgroundColor: branding.primaryColor }}><Zap size={24}/></div>
                  <div>
                    <h4 className="text-lg font-black text-white">Directive Briefing</h4>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-widest">Mission Critical Intel</p>
                  </div>
               </div>
               <ThemedButton onClick={handleNext}>Confirm & Continue <ArrowRight size={14}/></ThemedButton>
            </div>
          </div>
        );

      case 'tools':
        return (
          <div className="space-y-8 w-full max-w-3xl mx-auto text-center">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.tools?.map((tool: any, i: number) => (
                  <div key={i} className="glass-card flex flex-col items-center gap-6 group hover:bg-white/5 transition-all relative overflow-hidden">
                     <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: `${branding.primaryColor}11`, borderColor: `${branding.primaryColor}33`, color: branding.primaryColor, borderRadius: `${branding.borderRadius / 2}px` }}>
                        <Boxes size={32} />
                     </div>
                     <h4 className="text-xl font-black text-white">{tool.name || 'External Service'}</h4>
                     <ThemedButton variant="secondary" className="w-full" onClick={() => window.open(tool.url, '_blank')}>
                        Authorize Integration <ExternalLink size={14} />
                     </ThemedButton>
                  </div>
                ))}
             </div>
             <ThemedButton onClick={handleNext} className="mt-8 mx-auto">Integrations Complete</ThemedButton>
          </div>
        );

      case 'audit':
        return (
          <div className="space-y-8 w-full max-w-4xl mx-auto">
             {!isScanning && scanProgress === 0 ? (
                <div className="glass-card text-center space-y-8">
                   <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(37,99,235,0.4)]" style={{ backgroundColor: branding.primaryColor }}>
                      <ShieldCheck size={48} className="text-white" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-4xl font-black text-white tracking-tight">System Audit</h3>
                      <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed">Run our automated diagnostic protocol to ensure your existing systems meet our operational standard.</p>
                   </div>
                   <ThemedButton onClick={startAudit} className="mx-auto">Launch Diagnostic Scan</ThemedButton>
                </div>
             ) : isScanning ? (
                <div className="space-y-12 text-center p-20">
                   <div className="relative w-48 h-48 mx-auto">
                      <svg className="w-full h-full -rotate-90">
                         <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                         <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * scanProgress) / 100} className="transition-all duration-300" style={{ stroke: branding.primaryColor }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-4xl font-black text-white font-mono">{scanProgress}%</span>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">Scanning infrastructure...</h4>
                   </div>
                </div>
             ) : (
                <div className="space-y-8 animate-in zoom-in-95">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {config.checks?.map((check: any, i: number) => (
                        <div key={i} className="glass-card text-center shadow-2xl">
                           <div className="text-emerald-500 mb-4 flex justify-center"><CheckCircle2 size={32} /></div>
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{check.label}</p>
                           <p className="text-3xl font-black text-white">{Math.min(100, check.weight * 9.5)}%</p>
                        </div>
                      ))}
                   </div>
                   <div className="glass-card text-center" style={{ border: `1px solid ${branding.primaryColor}33` }}>
                      <p className="font-black uppercase tracking-widest text-lg" style={{ color: branding.primaryColor }}>Protocol Verification Successful</p>
                      <ThemedButton variant="success" onClick={handleNext} className="mt-8 mx-auto">Complete Module</ThemedButton>
                   </div>
                </div>
             )}
          </div>
        );

      case 'brief':
        return (
          <div className="space-y-12 w-full max-w-3xl mx-auto">
             <div className="space-y-10">
                {config.sections?.map((section: any, i: number) => (
                   <div key={i} className="space-y-4 animate-in slide-in-from-left duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                      <div className="flex items-center gap-4 ml-4">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branding.primaryColor }} />
                         <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] block">{section.title || 'Brief Segment'}</label>
                      </div>
                      <textarea 
                        className="w-full min-h-[180px] onboarding-input outline-none transition-all font-medium text-lg leading-relaxed resize-none shadow-inner" 
                        placeholder={section.placeholder || "Enter details..."}
                        value={formData[`brief_${i}`] || ''}
                        onChange={(e) => setFormData({...formData, [`brief_${i}`]: e.target.value})}
                      />
                   </div>
                ))}
             </div>
             <ThemedButton onClick={handleNext} className="mx-auto">Submit Brief Intel</ThemedButton>
          </div>
        );

      case 'approval':
        return (
          <div className="space-y-12 w-full max-w-2xl mx-auto">
             <div className="glass-card text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-500"><CheckCircle size={200} /></div>
                <div className="relative z-10 space-y-8">
                   <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: branding.primaryColor }}>Formal Approval</span>
                      <h3 className="text-4xl font-black tracking-tight">Scope Validation</h3>
                   </div>
                   <div className="prose prose-sm prose-invert text-white/60 leading-relaxed font-medium whitespace-pre-wrap">
                      {config.scope || "No formal scope description provided. Please verify deliverables manually."}
                   </div>
                   <div className="h-px bg-white/5" />
                   <div onClick={() => setFormData({...formData, approved: !formData.approved})} className="flex items-center gap-6 cursor-pointer group">
                      <div 
                        className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${formData.approved ? 'text-white shadow-lg' : 'border-white/10 group-hover:border-blue-500'}`}
                        style={{ 
                          backgroundColor: formData.approved ? branding.primaryColor : undefined,
                          borderColor: formData.approved ? branding.primaryColor : undefined,
                          borderRadius: `${branding.borderRadius / 2}px`
                        }}
                      >
                         <Check size={24} strokeWidth={4} />
                      </div>
                      <p className="text-sm font-black text-white uppercase tracking-widest">I acknowledge and approve the defined scope</p>
                   </div>
                </div>
             </div>
             <ThemedButton disabled={!formData.approved} onClick={handleNext} className="w-full">Finalize Authorization</ThemedButton>
          </div>
        );

      case 'credentials':
        return (
          <div className="space-y-8 w-full max-w-2xl mx-auto">
             <div className="space-y-6">
                {config.fields?.map((f: any, i: number) => (
                   <div key={i} className="glass-card space-y-6 relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-6 opacity-5"><Key size={80} /></div>
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-xl text-white border" style={{ backgroundColor: `${branding.primaryColor}22`, borderColor: `${branding.primaryColor}44`, color: branding.primaryColor, borderRadius: `${branding.borderRadius / 3}px` }}><Lock size={20} /></div>
                         <h4 className="text-xl font-black text-white">{f.service || 'Security Node'}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-2">Login / User</label>
                            <input 
                              type="text"
                              className="w-full onboarding-input"
                              placeholder={f.login || 'Username'}
                              value={formData[`cred_user_${i}`] || ''}
                              onChange={(e) => setFormData({...formData, [`cred_user_${i}`]: e.target.value})}
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-2">Protocol Passphrase</label>
                            <input 
                              type="password" 
                              className="w-full onboarding-input" 
                              placeholder="Enter secure key..."
                              value={formData[`cred_pass_${i}`] || ''}
                              onChange={(e) => setFormData({...formData, [`cred_pass_${i}`]: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>
                ))}
             </div>
             <ThemedButton onClick={handleNext} className="mx-auto">Submit Security Manifest</ThemedButton>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-8 w-full max-w-2xl mx-auto text-center">
            <div className="glass-card flex flex-col items-center gap-8">
               <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg animate-bounce-subtle" style={{ backgroundColor: branding.primaryColor, borderRadius: `${branding.borderRadius / 2}px` }}>
                  <Calendar size={40} className="text-white" />
               </div>
               <div>
                  <h3 className="text-3xl font-black text-white mb-2">Schedule Strategy Session</h3>
                  <p className="text-zinc-500 font-medium text-sm">Preferred Host: <span className="text-blue-400 font-bold" style={{ color: branding.primaryColor }}>{config.host || 'Agency Director'}</span></p>
               </div>
               <div className="w-full h-px bg-white/5" />
               <ThemedButton className="w-full py-6" onClick={() => window.open(config.bookingUrl || '#', '_blank')}>
                  Sync via {config.provider || 'Gateway'} <ArrowRight size={18}/>
               </ThemedButton>
               <button onClick={handleNext} className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">Already Booked? Skip Proceeding</button>
            </div>
          </div>
        );

      case 'contract':
        return (
          <div className="space-y-8 w-full max-w-3xl mx-auto">
             <div className="glass-card text-zinc-300 h-[500px] overflow-y-auto no-scrollbar relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-white"><Handshake size={200} /></div>
                <div className="relative z-10">
                   <h2 className="text-2xl font-black uppercase text-white tracking-tight mb-8 border-b border-white/10 pb-4">Mutual Service Agreement</h2>
                   <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {config.content || "Legal blueprint content will be displayed here for terminal validation."}
                   </div>
                </div>
             </div>
             <div className="flex gap-4">
                <ThemedButton onClick={handleNext} className="flex-1">
                   Authorize Agreement <ShieldCheck size={20} />
                </ThemedButton>
             </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-8 w-full max-w-2xl mx-auto text-center">
             <div 
               className="glass-card flex flex-col items-center gap-8 group cursor-pointer hover:bg-white/5 transition-all shadow-2xl"
               onClick={() => !uploadingFiles && fileInputRef.current?.click()}
             >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <div className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${branding.primaryColor}11`, borderColor: `${branding.primaryColor}66` }}>
                   {uploadingFiles ? (
                     <RefreshCw size={32} className="animate-spin" style={{ color: branding.primaryColor }} />
                   ) : (
                     <Upload size={32} className="animate-pulse" style={{ color: branding.primaryColor }} />
                   )}
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white mb-2">Resource Transmission</h3>
                   <p className="text-zinc-500 font-medium text-sm">Accepted: <span className="text-blue-400 font-bold" style={{ color: branding.primaryColor }}>{config.formats || 'All'}</span></p>
                </div>
                <div className="flex gap-4 w-full">
                   <ThemedButton className="flex-1" disabled={uploadingFiles} onClick={(e: any) => e.stopPropagation() || fileInputRef.current?.click()}>
                     {uploadingFiles ? 'Transmitting...' : 'Select Files'}
                   </ThemedButton>
                </div>
                <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
                   <span>Capacity: {config.maxSize || 50}MB</span>
                   {config.scanning && (
                    <span className="flex items-center gap-2 text-emerald-500/80">
                      <ShieldCheck size={14} /> ACTIVE_THREAT_SCAN
                    </span>
                   )}
                </div>
             </div>
             <button onClick={handleNext} className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">I'll Upload Later</button>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-12 w-full max-w-xl mx-auto">
             <div className="glass-card text-center relative overflow-hidden group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
                <div className="absolute top-[-10%] right-[-10%] opacity-5 group-hover:rotate-12 transition-transform duration-1000"><CreditCard size={200} /></div>
                <div className="relative z-10">
                   <div className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center mx-auto mb-8 shadow-lg" style={{ backgroundColor: branding.primaryColor, borderRadius: `${branding.borderRadius / 2}px` }}><DollarSign size={32} className="text-white"/></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: branding.primaryColor }}>Protocol Settlement</p>
                   <h3 className="text-5xl font-black text-white mb-2">{config.amount ? `${config.currency || 'USD'} ${config.amount}` : 'Calculated Volume'}</h3>
                   <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Gateway: {config.gateway || 'Stripe'}</p>
                   
                   <div className="mt-12 space-y-4">
                      <ThemedButton onClick={handleNext} className="w-full">
                         Accept & Process
                      </ThemedButton>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-2">
                        <Lock size={10} /> Encrypted via 256-bit TLS Gateway
                      </p>
                </div>
                </div>
             </div>
          </div>
        );

      case 'checklist':
        return (
          <div className="space-y-8 w-full max-w-2xl mx-auto">
             <div className="space-y-4">
                {config.items?.map((item: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => setFormData({...formData, [`chk_${currentIndex}_${i}`]: !formData[`chk_${currentIndex}_${i}`]})} 
                    className={`p-6 border flex items-center gap-6 cursor-pointer transition-all group ${formData[`chk_${currentIndex}_${i}`] ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/10 hover:bg-white/5'}`} 
                    style={{ 
                      borderRadius: `${branding.borderRadius}px`,
                      borderColor: formData[`chk_${currentIndex}_${i}`] ? branding.primaryColor : undefined,
                      backgroundColor: formData[`chk_${currentIndex}_${i}`] ? `${branding.primaryColor}11` : undefined
                    }}
                  >
                     <div 
                        className={`w-8 h-8 border-2 flex items-center justify-center transition-all ${formData[`chk_${currentIndex}_${i}`] ? 'text-white shadow-lg' : 'border-white/10 text-transparent'}`}
                        style={{ 
                          borderRadius: `${branding.borderRadius / 4}px`,
                          backgroundColor: formData[`chk_${currentIndex}_${i}`] ? branding.primaryColor : 'transparent',
                          borderColor: formData[`chk_${currentIndex}_${i}`] ? branding.primaryColor : 'rgba(255,255,255,0.1)'
                        }}
                     >
                        <Check size={18} strokeWidth={4} />
                     </div>
                     <span className={`text-lg font-bold transition-all ${formData[`chk_${currentIndex}_${i}`] ? 'opacity-50 line-through' : 'text-white'}`}>{item.text || 'Verification Point'}</span>
                  </div>
                ))}
             </div>
             <ThemedButton onClick={handleNext} className="mx-auto">Commit Configuration</ThemedButton>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-10 w-full max-xl mx-auto">
             {config.fields?.map((field: any, idx: number) => (
                <div key={idx} className="space-y-4 animate-in slide-in-from-left duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-4 block" style={{ opacity: branding.labelOpacity, color: branding.inputTextColor || '#ffffff' }}>{field.label}</label>
                   {field.type === 'textarea' ? (
                      <textarea className="w-full min-h-[160px] onboarding-input outline-none transition-all font-medium resize-none shadow-inner" placeholder="..." value={formData[field.label] || ''} onChange={(e) => setFormData({...formData, [field.label]: e.target.value})} />
                   ) : (
                      <input className="w-full onboarding-input outline-none transition-all font-black shadow-inner" value={formData[field.label] || ''} onChange={(e) => setFormData({...formData, [field.label]: e.target.value})} />
                   )}
                </div>
             ))}
             <ThemedButton onClick={handleNext} className="mx-auto">Commit Registry</ThemedButton>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-10 w-full max-w-4xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {config.members?.map((mid: string) => {
                  const m = members.find(p => p.id === mid);
                  if (!m) return null;
                  return (
                    <div key={mid} className="glass-card flex items-center gap-8 group hover:bg-white/5 transition-all relative overflow-hidden">
                       <div className="absolute right-0 top-0 p-4 opacity-[0.02] -rotate-12 text-white"><Shield size={120} /></div>
                       <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl shrink-0 group-hover:scale-105 transition-transform" style={{ borderRadius: `${branding.borderRadius / 1.5}px` }}><img src={m.avatar} className="w-full h-full object-cover" alt=""/></div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-black text-white">{m.name}</h4>
                          {config.showRoles && <p className="text-[10px] font-black uppercase tracking-widest mt-1.5" style={{ color: branding.primaryColor }}>{m.role}</p>}
                          <div className="mt-4 flex gap-2">
                             <span className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase text-white/40 border border-white/5">{m.department}</span>
                          </div>
                          {config.interactiveBio && <p className="text-[10px] text-zinc-500 mt-4 line-clamp-2 leading-relaxed">{m.bio}</p>}
                       </div>
                    </div>
                  );
                })}
             </div>
             <ThemedButton onClick={handleNext} className="mx-auto">Proceed to Operations</ThemedButton>
          </div>
        );

      case 'roadmap':
        return (
          <div className="space-y-12 w-full max-w-3xl mx-auto">
             <div className="relative space-y-12">
                <div className="absolute left-[2.45rem] top-8 bottom-8 w-[2px] opacity-30" style={{ background: `linear-gradient(to b, ${branding.primaryColor}, ${branding.secondaryColor}, transparent)` }} />
                {config.milestones?.map((m: any, i: number) => (
                   <div key={i} className="flex gap-10 items-center animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="w-20 h-20 border-4 flex items-center justify-center text-xl font-black text-white relative z-10 shadow-2xl group transition-all" style={{ backgroundColor: branding.backgroundColor, borderColor: 'rgba(255,255,255,0.1)', borderRadius: `${branding.borderRadius / 1.5}px` }}>
                         <span className="group-hover:scale-125 transition-transform duration-500" style={{ color: branding.primaryColor }}>W{m.week}</span>
                      </div>
                      <div className="flex-1 glass-card hover:bg-white/5 transition-all shadow-xl">
                         <h4 className="text-xl font-black text-white">{m.label || 'Phase Objective'}</h4>
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-2" style={{ color: branding.primaryColor }}>Week {m.week} Strategic Implementation</p>
                      </div>
                   </div>
                ))}
             </div>
             <ThemedButton onClick={handleNext} className="mx-auto">Authorize Plan</ThemedButton>
          </div>
        );

      case 'feedback':
        return (
          <div className="space-y-8 w-full max-w-2xl mx-auto text-center">
             <div className="space-y-6 mb-12">
                <h3 className="text-5xl font-black text-white tracking-tighter">Initial Alignment</h3>
                <p className="text-xl text-zinc-400 font-medium">How confident do you feel about the mission roadmap?</p>
             </div>
             <div className="space-y-10">
                {config.questions?.map((q: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <p className="text-lg font-bold text-white/80">{q.label || "How satisfied are you?"}</p>
                    {q.type === 'rating' ? (
                      <div className="flex justify-center gap-4">
                        {[1, 2, 3, 4, 5].map(rating => {
                          const active = formData[`sentiment_${i}`] === rating;
                          return (
                            <button 
                              key={rating}
                              onClick={() => setFormData({...formData, [`sentiment_${i}`]: rating})}
                              className={`w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center text-xl font-black ${active ? 'text-white shadow-xl scale-110' : 'bg-zinc-900 border-white/10 text-white/40 hover:bg-zinc-800'}`}
                              style={{ 
                                backgroundColor: active ? branding.primaryColor : undefined,
                                borderColor: active ? branding.primaryColor : undefined
                              }}
                            >
                              {rating}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea 
                        className="w-full h-32 onboarding-input outline-none text-white font-medium transition-all" 
                        placeholder="Any specific concerns or requests?"
                        value={formData[`sentiment_${i}`] || ''}
                        onChange={(e) => setFormData({...formData, [`sentiment_${i}`]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
             </div>
             <ThemedButton onClick={handleNext} className="mx-auto mt-12">Submit Sentiment</ThemedButton>
          </div>
        );

      case 'referral':
        return (
          <div className="space-y-8 w-full max-w-2xl mx-auto text-center">
             <div className="glass-card relative overflow-hidden group" style={{ background: `linear-gradient(to br, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform duration-700 group-hover:scale-125 text-white"><Zap size={200} fill="currentColor" /></div>
                <div className="relative z-10 space-y-8">
                   <h3 className="text-4xl font-black text-white tracking-tighter leading-tight">Growth Protocol</h3>
                   <p className="text-white/90 font-medium text-lg leading-relaxed">{config.incentive || 'Know another organization that needs an operational upgrade? Distribute the OS and receive priority resource credits.'}</p>
                   <div className="bg-black/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center gap-4">
                      <Globe size={24} className="text-white/60" />
                      <input readOnly value={config.refUrl || "https://agencyos.io/ref/alpha-99"} className="flex-1 bg-transparent border-none outline-none font-bold text-white text-sm" />
                      <ThemedButton variant="outline" className="px-6 py-3" onClick={() => { navigator.clipboard.writeText(config.refUrl || "https://agencyos.io/ref/alpha-99"); }}>Copy Hub</ThemedButton>
                   </div>
                </div>
             </div>
             <button onClick={handleNext} className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">Proceed to Completion</button>
          </div>
        );

      case 'intro':
        return (
          <div className="space-y-10 animate-in fade-in zoom-in duration-1000">
             <div 
               className={`w-20 h-20 backdrop-blur-2xl flex items-center justify-center shadow-2xl mb-12 ${branding.contentAlign === 'center' ? 'mx-auto' : ''}`}
               style={{ 
                 backgroundColor: `rgba(255, 255, 255, ${branding.headerOpacity || 0.1})`,
                 backdropFilter: `blur(${branding.headerBlur || 20}px)`,
                 border: `${branding.headerBorderOpacity || 0.1}px solid rgba(255, 255, 255, 0.1)`,
                 borderRadius: `${branding.borderRadius}px`,
                 filter: `grayscale(${branding.logoGrayscale}) brightness(${branding.logoBrightness}) drop-shadow(0 0 ${branding.logoShadow}px ${branding.primaryColor}44)`
               }}
             >
                <Monitor size={36} style={{ color: branding.primaryColor }} />
             </div>
             <h2 className="text-6xl md:text-8xl font-black tracking-tighter" style={{ fontWeight: branding.headingWeight, fontSize: `${branding.baseTextSize * 4}px` }}>
                Welcome to <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-gradient-x">{manifest.steps[manifest.steps.length-1].title}.</span>
             </h2>
             <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed max-w-xl" style={{ fontWeight: branding.bodyWeight, fontSize: `${branding.baseTextSize * 1.25}px` }}>
                {step.desc}
             </p>
             <div className="pt-8 flex justify-center">
                <ThemedButton onClick={handleNext}>Begin Onboarding <ArrowRight size={18}/></ThemedButton>
             </div>
          </div>
        );

      case 'outro':
        return (
          <div className="space-y-10 text-center animate-in fade-in zoom-in duration-1000">
             <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-xl mb-8">
                <Heart size={44} className="text-white" fill="currentColor" />
             </div>
             <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none" style={{ fontWeight: branding.headingWeight, fontSize: `${branding.baseTextSize * 4}px` }}>
                Protocol Complete.
             </h2>
             <p className="text-2xl text-zinc-500 font-medium max-w-lg mx-auto leading-relaxed" style={{ fontWeight: branding.bodyWeight, fontSize: `${branding.baseTextSize * 1.5}px` }}>
                {step.desc}
             </p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                {[
                   { label: 'Security', icon: Lock, val: 'Verified' },
                   { label: 'Network', icon: Globe, val: 'Primary' },
                   { label: 'Status', icon: Cpu, val: 'Active' }
                ].map(item => (
                   <div key={item.label} className="glass-card">
                      <item.icon size={24} className="mx-auto mb-4" style={{ color: branding.primaryColor, opacity: 0.6 }} />
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.label}</p>
                      <p className="text-base font-black text-white mt-1.5 uppercase tracking-wider">{item.val}</p>
                   </div>
                ))}
             </div>
             <div className="pt-16 flex justify-center">
                <ThemedButton 
                  onClick={generateAndSaveSubmission} 
                  disabled={isSaving}
                  className="mx-auto"
                >
                    {isSaving ? 'Saving Data...' : 'Exit Terminal & Save'}
                </ThemedButton>
             </div>
          </div>
        );

      default:
        return (
          <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 flex flex-col items-center gap-6">
             <Target size={48} />
             <p className="text-xs font-black uppercase tracking-[0.3em]">Module Interface Initializing...</p>
             <button onClick={handleNext} className="mt-4 px-8 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Skip Module</button>
          </div>
        );
    }
  };

  return (
    <div 
       className="fixed inset-0 text-white font-sans overflow-hidden flex flex-col transition-colors selection:bg-blue-600/30"
       style={{ 
          backgroundColor: branding.backgroundColor,
          fontFamily: branding.fontFamily,
          filter: branding.chromaticStrength ? `url(#chromatic-aberration)` : 'none',
          fontSize: `${branding.baseTextSize}px`
       }}
    >
      <style>{`
         @keyframes meshPulse {
           0% { transform: scale(1) translate(0,0); }
           50% { transform: scale(1.2) translate(10%, 10%); }
           100% { transform: scale(1) translate(0,0); }
         }
         @keyframes hueRotate {
            from { filter: hue-rotate(0deg); }
            to { filter: hue-rotate(360deg); }
         }
         @keyframes noiseMove {
           0% { transform: translate(0, 0); }
           10% { transform: translate(-1%, -1%); }
           20% { transform: translate(-2%, 1%); }
           30% { transform: translate(1%, -2%); }
           40% { transform: translate(-1%, 3%); }
           50% { transform: translate(-2%, 1%); }
           60% { transform: translate(3%, 0); }
           70% { transform: translate(0, 2%); }
           80% { transform: translate(-3%, 1%); }
           90% { transform: translate(1%, 2%); }
           100% { transform: translate(0, 0); }
         }
         @keyframes scanMove {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
         }
         @keyframes pPulse {
            0%, 100% { opacity: ${branding.particleOpacity}; transform: scale(1); }
            50% { opacity: ${Math.min(1, branding.particleOpacity * 2)}; transform: scale(1.1); }
         }
         @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
         .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
         .mesh-blob {
           animation: meshPulse ${branding.meshSpeed}s infinite ease-in-out;
           filter: blur(${branding.meshBlur}px);
         }
         .hue-cycle {
            animation: hueRotate ${branding.hueRotateSpeed}s infinite linear;
         }
         .noise-overlay {
            animation: noiseMove ${branding.noiseSpeed}s steps(10) infinite;
            background-size: ${branding.noiseScale}px;
            opacity: ${branding.noiseOpacity};
            mix-blend-mode: ${branding.noiseBlendMode || 'overlay'};
         }
         .scanlines {
            position: fixed;
            inset: 0;
            z-index: 100;
            background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.3) 50%);
            background-size: 100% ${branding.scanlineDensity}px;
            pointer-events: none;
            opacity: ${branding.scanlineOpacity};
         }
         .vignette {
            position: fixed;
            inset: 0;
            z-index: 90;
            background: radial-gradient(circle, transparent ${branding.vignetteRadius}%, ${branding.vignetteColor} 150%);
            pointer-events: none;
            opacity: ${branding.vignetteStrength};
         }
         .particle {
            animation: pPulse ${branding.particlePulse}s infinite ease-in-out;
            background-color: ${branding.particleColor};
            opacity: ${branding.particleOpacity};
         }
         .glass-card {
            background-color: rgba(255, 255, 255, ${branding.glassOpacity});
            backdrop-filter: blur(${branding.blurStrength}px) brightness(${branding.backdropBrightness}) contrast(${branding.glassmorphismContrast || 1});
            border: ${branding.cardBorderWidth}px solid rgba(255, 255, 255, ${branding.cardBorderOpacity});
            border-radius: ${branding.borderRadius}px;
            padding: ${branding.cardPadding}px;
            box-shadow: 0 20px 50px -10px rgba(0,0,0,${branding.cardShadowIntensity / 100});
         }
         .onboarding-input {
            background-color: rgba(0, 0, 0, ${branding.inputBgOpacity});
            border: ${branding.inputBorderWidth}px solid rgba(255, 255, 255, 0.1);
            border-radius: ${branding.inputBorderRadius}px;
            color: ${branding.inputTextColor || '#ffffff'};
            padding: 1.5rem 2rem;
            font-size: ${branding.baseTextSize}px;
            transition: all 0.3s ease;
         }
         .onboarding-input:focus {
            border-color: ${branding.primaryColor};
            box-shadow: 0 0 0 ${branding.inputFocusSpread}px ${branding.primaryColor}33;
            background-color: rgba(0, 0, 0, ${branding.inputBgOpacity + 0.1});
         }
         .onboarding-input::placeholder {
            color: ${branding.inputPlaceholderColor || '#444444'};
         }
         h1, h2, h3, h4 {
            letter-spacing: ${branding.headingLetterSpacing}em;
            line-height: ${branding.headingLineHeight};
         }
         p, span, label, input, textarea {
            letter-spacing: ${branding.globalLetterSpacing}em;
            line-height: ${branding.bodyLineHeight};
         }
      `}</style>

      <svg className="hidden">
        <defs>
          <filter id="chromatic-aberration">
            <feOffset in="SourceGraphic" dx={branding.chromaticStrength} dy="0" result="red" />
            <feOffset in="SourceGraphic" dx={-branding.chromaticStrength} dy="0" result="blue" />
            <feBlend in="red" in2="blue" mode="screen" />
          </filter>
        </defs>
      </svg>

      <div className="scanlines" />
      <div className="vignette" />

      <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50 ${branding.hueRotateSpeed > 0 ? 'hue-cycle' : ''}`}>
         <div ref={bgRef} className="absolute inset-[-10%] w-[120%] h-[120%] transition-transform duration-[4s] ease-out">
            <div className="mesh-blob absolute top-0 left-0 w-[800px] h-[800px] rounded-full mix-blend-screen opacity-20" style={{ backgroundColor: branding.primaryColor }} />
            <div className="mesh-blob absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full mix-blend-screen opacity-20" style={{ backgroundColor: branding.secondaryColor, animationDelay: '-5s' }} />
            <div className="mesh-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-900/10 rounded-full" style={{ animationDelay: '-12s' }} />
            
            {Array.from({ length: branding.particleDensity }).map((_, i) => (
               <div 
                key={i} 
                className="particle absolute rounded-full blur-[1px]" 
                style={{ 
                    width: (Math.random() * branding.particleSize + 1) + 'px', 
                    height: (Math.random() * branding.particleSize + 1) + 'px', 
                    left: Math.random() * 100 + '%', 
                    top: Math.random() * 100 + '%', 
                    animationDelay: `-${Math.random() * 5}s`,
                    animationDuration: `${(10 / branding.particleSpeed) + Math.random() * 5}s`
                }} 
               />
            ))}
         </div>
         <div className="absolute inset-[-200%] noise-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>

      <div className="relative z-50 p-10 md:p-16 flex justify-between items-center shrink-0">
         <div className="flex items-center gap-4 group cursor-default">
            <div 
              className="w-12 h-12 backdrop-blur-xl flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12"
              style={{ 
                backgroundColor: `rgba(255, 255, 255, ${branding.headerOpacity || 0.1})`,
                backdropFilter: `blur(${branding.headerBlur || 20}px)`,
                border: `${branding.headerBorderOpacity || 0.1}px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: `${branding.borderRadius / 2}px`,
                filter: `grayscale(${branding.logoGrayscale}) brightness(${branding.logoBrightness}) drop-shadow(0 0 ${branding.logoShadow}px ${branding.primaryColor}44)`
              }}
            >
               <Zap size={24} style={{ color: branding.primaryColor }} fill="currentColor" />
            </div>
            <div>
               <h1 className="font-black text-xl tracking-tighter leading-none">AgencyOS</h1>
               <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mt-1">Intelligence Protocol</p>
            </div>
         </div>
         <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                  <ShieldCheck size={14} /> Encrypted Session
               </div>
               <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Status: Operational</p>
            </div>
         </div>
      </div>

      <div className={`flex-1 flex flex-col items-center justify-center relative z-10 overflow-y-auto no-scrollbar ${
         branding.contentAlign === 'left' ? 'md:items-start' : 
         branding.contentAlign === 'right' ? 'md:items-end' : 
         'items-center'
      }`}
      style={{ padding: `${branding.containerPadding}px` }}
      >
         <div className="w-full relative" style={{ maxWidth: `${branding.containerMaxWidth}px`, textAlign: branding.contentAlign }}>
            <div className="mb-12 flex items-center justify-between animate-in fade-in duration-1000">
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sequence {currentIndex + 1}</span>
                  <div className="w-8 h-[1px] bg-white/20" />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: branding.primaryColor }}>{step.title}</span>
               </div>
               <div className="text-right"><span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{Math.round(progress)}% Integrity</span></div>
            </div>

            <div className={`transition-all cubic-bezier(0.16, 1, 0.3, 1) transform ${getAnimationClass()}`} style={{ transitionDuration: `${branding.transitionDuration}ms` }}>
               {RenderContent()}
            </div>
         </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full bg-white/5 z-50" style={{ height: `${branding.progressHeight}px` }}>
         <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all ease-[cubic-bezier(0.16, 1, 0.3, 1)]" style={{ width: `${progress}%`, transitionDuration: `${branding.transitionDuration * 2}ms`, boxShadow: `0 0 ${branding.progressGlow}px rgba(37,99,235,0.8)` }} />
      </div>
    </div>
  );
};

export default ClientOnboarding;
