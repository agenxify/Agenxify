
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, User, Mail, Shield, 
  MapPin, Calendar, Briefcase, CheckCircle2, X, Trash2, Edit3,
  Users, Zap, Activity, Clock, ShieldCheck, ArrowRight,
  TrendingUp, Layers, Code2, Globe, Sparkles, MessageSquare,
  ChevronRight, ChevronLeft, Lock, DollarSign, Database, 
  Smartphone, Monitor, Cpu, Send, Loader2, Check,
  Github, Linkedin, Twitter, Target, Heart, Award,
  FileCheck, ImageIcon, ChevronDown, LayoutGrid,
  ShieldAlert, UserCircle, Settings, ClipboardList, List,
  IdCard, Hexagon, Fingerprint, Radio, Orbit, MonitorIcon,
  Laptop, Cloud, Building2, Bell, Terminal, ShieldAlert as ShieldIcon,
  FileText, Eye, AlertCircle
} from 'lucide-react';
import { AVAILABLE_PLANS, SIDEBAR_MODULES } from '../constants.tsx';
import { Profile } from '../types.ts';
import * as ReactRouterDom from 'react-router-dom';
import { useTeam } from '../hooks/useTeam';
import { useCurrency } from '../context/CurrencyContext.tsx';
import { usePages } from '../hooks/usePages';
import { useAuth } from '../context/AuthContext.tsx';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

const { Link, useNavigate } = ReactRouterDom as any;

// --- 3D Tilt Component ---
const TiltContainer = ({ children, className = "", intensity = 5 }: any) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    ref.current.style.setProperty('--rx', `${rotateX}deg`);
    ref.current.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty('--rx', '0deg');
    ref.current.style.setProperty('--ry', '0deg');
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-300 ease-out will-change-transform ${className}`}
      style={{ transform: 'perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' }}
    >
      {children}
    </div>
  );
};

// --- Telemetry Component ---
const TelemetryStat = ({ label, value, icon: Icon, color, percentage, showOrbit }: any) => (
  <TiltContainer className="h-full">
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden group h-full justify-center">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.07] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
         <Icon size={120} />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
         <div className="relative w-28 h-28 flex items-center justify-center mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 overflow-visible drop-shadow-xl">
               {/* Track */}
               <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-zinc-800/50" />
               {/* Animated Progress Circle */}
               <circle 
                  cx="50" 
                  cy="50" 
                  r="44" 
                  stroke="currentColor" 
                  strokeWidth="7" 
                  fill="transparent" 
                  strokeDasharray={276} 
                  strokeDashoffset={276 - (276 * (percentage || 100)) / 100} 
                  className={`transition-all duration-[1.5s] ease-out animate-pulse-subtle ${color.replace('bg-', 'text-')}`} 
                  strokeLinecap="round"
                />
                {/* Flowing Animation Overlay */}
                {(percentage < 100 || showOrbit) && (
                   <circle 
                     cx="50" 
                     cy="50" 
                     r="44" 
                     stroke="currentColor" 
                     strokeWidth="2.5" 
                     fill="transparent" 
                     strokeDasharray="4, 12" 
                     className={`animate-spin-slow opacity-40 ${color.replace('bg-', 'text-')}`} 
                   />
                )}
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center ${color.replace('bg-', 'text-')} bg-opacity-10 rounded-full m-4`}>
               <Icon size={28} className="animate-bounce-subtle" />
            </div>
         </div>
         <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-0.5">{value}</h4>
         <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">{label}</p>
      </div>
    </div>
  </TiltContainer>
);

const MemberModal = ({ member, isOpen, onClose, onSave, allMembers }: { member: Partial<Profile> | null, isOpen: boolean, onClose: () => void, onSave: (p: Profile) => void, allMembers: Profile[] }) => {
  const { currency } = useCurrency();
  const [step, setStep] = useState(1);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [protocolStep, setProtocolStep] = useState(0);
  
  const [formData, setFormData] = useState<any>({
    name: '', email: '', role: '', department: 'Engineering', location: 'Remote', avatar: '',
    phone: '', bio: '', twitter: '', github: '', linkedin: '', timezone: 'Europe/London',
    level: 'Senior', manager: 'Agency Admin', workingHours: '40h/week',
    primarySkill: 'Full Stack', tools: ['Slack', 'Linear'], os: 'MACOS',
    hardware: 'LAPTOP',
    modulePermissions: {},
    allowedPageIds: [],
    contractType: 'Full-time Employee', salary: 0, startDate: new Date().toISOString().split('T')[0],
    isDraft: false
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const { pages } = usePages();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (member) {
        const normalizedPermissions = { ...(member.modulePermissions || {}) };
        Object.keys(normalizedPermissions).forEach(key => {
            if (typeof normalizedPermissions[key] === 'string') {
                normalizedPermissions[key] = [normalizedPermissions[key]];
            }
        });

        setFormData({ 
          ...formData, 
          ...member, 
          modulePermissions: normalizedPermissions,
          allowedPageIds: (member as any).allowedPageIds || []
        });
        setSkills((member as any).skills || ['Strategy', 'Execution']); 
      } else {
        setFormData({
          name: '', email: '', role: '', department: 'Engineering', location: 'Remote', 
          avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
          phone: '', bio: '', twitter: '', github: '', linkedin: '', timezone: 'Europe/London',
          level: 'Senior', manager: 'Agency Admin', workingHours: '40h/week',
          primarySkill: 'Full Stack', tools: ['Slack', 'Linear'], os: 'MACOS',
          hardware: 'LAPTOP',
          permissions: ['dashboard', 'execution'],
          contractType: 'Full-time Employee', salary: 0, startDate: new Date().toISOString().split('T')[0],
          isDraft: false,
          allowedPageIds: []
        });
        setSkills([]);
      }
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const protocolMessages = [
    "Establishing SMTP Handshake...",
    "Securing Internal Data Packets (AES-256)...",
    "Generating Team Login Uplink...",
    "Broadcasting via Workforce Relay Node...",
    "Finalizing Personnel Provisioning..."
  ];

  const handleNext = () => setStep(prev => Math.min(5, prev + 1));
  const handleBack = () => setStep(prev => Math.max(1, prev - 1));

  const toggleModulePermission = (moduleId: string, type: 'view' | 'edit') => {
    setFormData((prev: any) => {
      let currentPermissions = (prev.modulePermissions || {})[moduleId] || [];
      if (typeof currentPermissions === 'string') {
          currentPermissions = [currentPermissions];
      }
      
      let newPermissions: string[] = [];
      if (type === 'view') {
          if (currentPermissions.includes('view')) {
              // Unselecting view also unselects edit
              newPermissions = [];
          } else {
              newPermissions = ['view'];
          }
      } else if (type === 'edit') {
          if (currentPermissions.includes('edit')) {
              newPermissions = currentPermissions.filter((p: string) => p !== 'edit');
          } else {
              // Selecting edit also selects view
              newPermissions = ['view', 'edit'];
          }
      }
      
      return {
        ...prev,
        modulePermissions: {
          ...(prev.modulePermissions || {}),
          [moduleId]: newPermissions
        }
      };
    });
  };

  const togglePageAccess = (pageId: string) => {
    const current = formData.allowedPageIds || [];
    if (current.includes(pageId)) {
        setFormData({ ...formData, allowedPageIds: current.filter(id => id !== pageId) });
    } else {
        setFormData({ ...formData, allowedPageIds: [...current, pageId] });
    }
  };

  const handleSaveDraft = () => {
    onSave({
      ...formData,
      isDraft: true,
      joinDate: formData.joinDate || new Date().toLocaleDateString(),
      stats: formData.stats || { projects: 0, tasks: 0, activity: 0 },
      skills: skills
    });
  };

  const handleExecuteOnboarding = async () => {
    if (!formData.email) {
      alert("Target registry email is required for transmission.");
      return;
    }

    setIsTransmitting(true);
    
    // UI progression simulation
    for(let i = 0; i < 5; i++) {
        setProtocolStep(i);
        await new Promise(r => setTimeout(r, 600));
    }

    try {
        const loginLink = `${window.location.origin}/#/login?role=team&email=${encodeURIComponent(formData.email)}`;
        const message = `Personnel Deployment Initialized: You have been provisioned as ${formData.role} in ${formData.department}. Access your command terminal via: ${loginLink}`;
        
        const htmlContent = `
          <div style="font-family: 'Inter', sans-serif, system-ui; padding: 40px; background: #09090b; color: white; border-radius: 24px; border: 1px solid #27272a;">
            <div style="margin-bottom: 30px;">
              <h2 style="color: #3b82f6; font-weight: 900; letter-spacing: -0.05em; font-size: 24px; margin: 0;">WORKFORCE_PROVISIONING</h2>
              <p style="color: #71717a; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; margin: 5px 0 0 0;">Official Agency Intelligence Notification</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;">
            <div style="padding: 20px 0;">
              <p style="font-size: 16px; line-height: 1.6;">Hello <b>${formData.name}</b>,</p>
              <p style="font-size: 16px; line-height: 1.6;">Your internal deployment protocol has been finalized. You are assigned to the <b>${formData.department}</b> cluster as <b>${formData.role}</b>.</p>
              <p style="font-size: 16px; line-height: 1.6;">Access your professional terminal via the secure uplink below:</p>
            </div>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${loginLink}" style="display: inline-block; padding: 18px 36px; background: #2563eb; color: white; text-decoration: none; border-radius: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; font-size: 13px; box-shadow: 0 10px 30px rgba(37,99,235,0.4);">Establish Command Link</a>
            </div>
            <p style="color: #52525b; font-size: 9px; margin-top: 50px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3em;">Protocol v4.8 Secured AES-256 Transmission • Node: Global-Relay-Alpha</p>
          </div>
        `;

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                service_id: 'service_eki14se',
                template_id: 'template_tg5pymr',
                user_id: 'SRove_ciDKhUF5QGu',
                template_params: {
                    to_email: formData.email,
                    recipient_email: formData.email,
                    email: formData.email,
                    to_name: formData.name,
                    from_name: 'AgencyOS Workforce Core',
                    message: message,
                    html_content: htmlContent.replace(/\s+/g, ' ').trim()
                }
            })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Email Uplink Failure: ${errText || response.statusText}`);
        }

        onSave({
          ...formData,
          joinDate: formData.joinDate || new Date().toLocaleDateString(),
          stats: formData.stats || { projects: 0, tasks: 0, activity: 0 },
          skills: skills,
          isDraft: false
        });
        
    } catch (err: any) {
        console.error("Critical Transmission Error:", err);
        // Fallback save anyway
        onSave({ ...formData, skills, isDraft: false });
    } finally {
        setIsTransmitting(false);
    }
  };

  const steps = [
    { id: 1, icon: UserCircle },
    { id: 2, icon: Target },
    { id: 3, icon: Cpu },
    { id: 4, icon: ShieldCheck },
    { id: 5, icon: FileCheck },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => !isTransmitting && onClose()} />
      <div className="relative bg-[#09090b] w-full max-w-5xl rounded-[3rem] shadow-2xl p-0 border border-white/10 animate-in zoom-in-95 overflow-hidden flex flex-col h-[90vh]">
        
        {isTransmitting && (
            <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center text-center p-12 backdrop-blur-xl">
                <div className="relative mb-10">
                    <div className="w-32 h-32 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap size={48} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight mb-2">Executing Provisioning</h3>
                <p className="text-blue-500 font-mono text-xs uppercase tracking-[0.4em] mb-12">{protocolMessages[protocolStep]}</p>
                <div className="max-w-sm w-full space-y-2">
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(protocolStep + 1) * 20}%` }} />
                    </div>
                </div>
            </div>
        )}

        {/* Modal Header */}
        <div className="px-10 py-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between bg-black/20 gap-8">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20">
                <UserCircle size={28} />
             </div>
             <div>
                <h3 className="text-3xl font-black text-white tracking-tight">Provision Internal Workforce</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Workforce Intelligence Registry v4.8</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {steps.map((s, i) => (
                <React.Fragment key={s.id}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? 'bg-blue-600 text-white shadow-lg' : step > s.id ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-zinc-600'}`}>
                        {step > s.id ? <CheckCircle2 size={18} strokeWidth={3} /> : <s.icon size={18} />}
                    </div>
                    {i < steps.length - 1 && <div className={`w-8 h-0.5 rounded-full transition-colors ${step > s.id ? 'bg-emerald-500' : 'bg-zinc-800'}`} />}
                </React.Fragment>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-10 md:p-14 no-scrollbar">
          <div className="max-w-4xl mx-auto">
            {step === 1 && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-center">
                        <div className="w-36 h-36 rounded-[2.5rem] border-[4px] border-[#2563eb]/20 p-2 shadow-2xl relative group cursor-pointer overflow-hidden">
                            <div className="w-full h-full rounded-[2rem] overflow-hidden border-2 border-white/10">
                               <img src={formData.avatar || `https://i.pravatar.cc/150?u=${Date.now()}`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Legal Identity Name</label>
                            <div className="relative group">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input className="w-full pl-12 pr-6 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:border-blue-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Alex Henderson" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Internal Registry Email</label>
                            <div className="relative group">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input className="w-full pl-12 pr-6 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:border-blue-600" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="alex@agency.io" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Workforce Twitter</label>
                            <div className="relative group">
                                <Twitter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input className="w-full pl-12 pr-6 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:border-blue-600" value={formData.twitter} onChange={e => setFormData({...formData, twitter: e.target.value})} placeholder="@username" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Developer Github</label>
                            <div className="relative group">
                                <Github size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input className="w-full pl-12 pr-6 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:border-blue-600" value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="github.com/..." />
                            </div>
                        </div>
                        <div className="col-span-full space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Workforce Timezone</label>
                            <div className="relative group">
                                <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input className="w-full pl-12 pr-6 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:border-blue-600" value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})} placeholder="Europe/London" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Internal Department Assignment</label>
                     <div className="grid grid-cols-3 gap-4">
                        {['ENGINEERING', 'CREATIVE', 'OPERATIONS', 'EXECUTIVE', 'SALES', 'SUPPORT'].map(dept => (
                           <button 
                             key={dept}
                             type="button"
                             onClick={() => setFormData({...formData, department: dept})}
                             className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${formData.department === dept ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-[#0c0c0e] text-zinc-600 border-white/5 hover:border-white/10'}`}
                           >
                              {dept}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Official Position Title</label>
                        <input className="w-full px-8 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none focus:border-blue-600" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Lead Technical Architect" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Experience Seniority Level</label>
                        <div className="relative">
                          <select className="w-full px-8 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none appearance-none cursor-pointer" value={formData.level || ''} onChange={e => setFormData({...formData, level: e.target.value})}>
                              {['Junior', 'Senior', 'Lead', 'Executive'].map(l => <option key={l}>{l}</option>)}
                          </select>
                          <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                        </div>
                     </div>
                     <div className="col-span-full space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Reporting Manager</label>
                        <div className="relative">
                          <select className="w-full px-8 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none appearance-none cursor-pointer" value={formData.manager || ''} onChange={e => setFormData({...formData, manager: e.target.value})}>
                              {allMembers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                          <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                        </div>
                     </div>
                  </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Core Tech Specialization</label>
                     <div className="w-full min-h-[140px] bg-[#0c0c0e] border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2">
                           {skills.map(skill => (
                              <span key={skill} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in zoom-in-95">
                                 {skill} <button type="button" onClick={() => setSkills(skills.filter(s => s !== skill))}><X size={10}/></button>
                              </span>
                           ))}
                        </div>
                        <input 
                          className="w-full bg-transparent border-none outline-none font-bold text-sm text-white placeholder:text-zinc-700" 
                          placeholder="Add skill and press Enter..." 
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => {
                             if(e.key === 'Enter' && skillInput.trim()) {
                                setSkills([...skills, skillInput.trim()]);
                                setSkillInput('');
                             }
                          }}
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Primary Development OS</label>
                        <div className="flex bg-[#0c0c0e] p-1.5 rounded-2xl border-2 border-white/5 h-[62px]">
                           {['MACOS', 'WINDOWS', 'LINUX'].map(os => (
                              <button 
                                key={os} 
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, os}))} 
                                className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.os === os ? 'bg-zinc-800 text-white border-blue-600 shadow-xl' : 'text-zinc-600 hover:text-zinc-400 border-transparent'}`}
                              >
                                 {os}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Workstation Hardware Profile</label>
                        <div className="flex bg-[#0c0c0e] p-1.5 rounded-2xl border-2 border-white/5 h-[62px]">
                           {['LAPTOP', 'DESKTOP', 'CLOUD VM'].map(hw => (
                              <button 
                                key={hw} 
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, hardware: hw}))} 
                                className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.hardware === hw ? 'bg-zinc-800 text-white border-white/10 shadow-xl' : 'text-zinc-600 hover:text-zinc-400 border-transparent'}`}
                              >
                                 {hw}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="p-8 bg-blue-600/5 rounded-[2.5rem] border border-blue-600/10 flex items-center gap-6">
                     <div className="p-4 bg-zinc-900 border border-white/10 rounded-2xl text-blue-600 shadow-xl"><Cpu size={24}/></div>
                     <div>
                        <p className="font-black text-sm text-white">Neural Assist Synchronization</p>
                        <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">System will automatically initialize a workforce-optimized AI profile based on these technical specifications.</p>
                     </div>
                  </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-1 gap-4">
                     {SIDEBAR_MODULES.map(module => {
                        const permissions = (formData.modulePermissions || {})[module.id] || [];
                        const hasView = permissions.includes('view');
                        const hasEdit = permissions.includes('edit');
                        return (
                          <div 
                            key={module.id} 
                            className="p-6 rounded-[2rem] border-2 border-white/5 bg-[#0c0c0e] flex items-center justify-between group hover:border-white/10 transition-all"
                          >
                             <div className="flex items-center gap-6">
                               <div className="p-3 rounded-xl bg-zinc-800 text-zinc-600">
                                  <module.icon size={18}/>
                               </div>
                               <span className="text-xs font-black uppercase tracking-widest text-white">{module.label}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <button 
                                  type="button"
                                  onClick={() => toggleModulePermission(module.id, 'view')}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hasView ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-600'}`}
                                >
                                  View
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => toggleModulePermission(module.id, 'edit')}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hasEdit ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-600'}`}
                                >
                                  Edit
                                </button>
                             </div>
                          </div>
                        );
                     })}
                  </div>

                  <div className="space-y-6 pt-8 border-t border-white/5">
                      <div className="flex items-center gap-4 mb-2">
                          <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500"><FileText size={16} /></div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Page Access Permissions</h4>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-600 ml-1 mb-4">Select which internal pages this member can view.</p>
                      <div className="grid grid-cols-2 gap-4">
                         {pages.map((page) => {
                            const isAllowed = formData.isAdmin || (formData.allowedPageIds || []).includes(page.id);
                            return (
                               <div key={page.id} className={`p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between ${isAllowed ? 'bg-zinc-900 border-blue-600 shadow-xl' : 'bg-[#0c0c0e] border-white/5 opacity-60 hover:opacity-100'}`}>
                                  <span className="text-xs font-black text-white truncate">{page.title}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => !formData.isAdmin && togglePageAccess(page.id)} 
                                    disabled={formData.isAdmin}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isAllowed ? 'bg-blue-600 text-white border-blue-600' : 'bg-zinc-800 border-white/5 text-zinc-500 hover:text-white'} ${formData.isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {isAllowed ? 'Allowed' : 'Allow'}
                                  </button>
                               </div>
                            );
                         })}
                      </div>
                  </div>

                  <div 
                    onClick={() => setFormData(prev => ({...prev, isAdmin: !prev.isAdmin}))}
                    className={`p-8 rounded-[2.5rem] border-2 flex items-center justify-between group cursor-pointer transition-all ${formData.isAdmin ? 'bg-rose-950/20 border-rose-900/50' : 'bg-[#0c0c0e] border-white/5 hover:bg-zinc-900 hover:border-white/10'}`}
                  >
                     <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl shadow-xl transition-all ${formData.isAdmin ? 'bg-zinc-900 border border-white/5 text-rose-600' : 'bg-zinc-800 text-zinc-600 group-hover:text-zinc-500'}`}><ShieldIcon size={24}/></div>
                        <div>
                           <p className={`font-black text-sm transition-colors ${formData.isAdmin ? 'text-rose-500' : 'text-zinc-400'}`}>System Administrator Access</p>
                           <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Grant full master-level RWX system clearance.</p>
                        </div>
                     </div>
                     <div className={`w-12 h-6 rounded-full relative transition-all p-1 ${formData.isAdmin ? 'bg-rose-600' : 'bg-zinc-800'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${formData.isAdmin ? 'translate-x-6' : 'translate-x-0'}`} />
                     </div>
                  </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Workforce Contract Type</label>
                        <div className="relative">
                          <select className="w-full px-8 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none appearance-none cursor-pointer" value={formData.contractType || ''} onChange={e => setFormData({...formData, contractType: e.target.value})}>
                              {['Full-time Employee', 'Contractor', 'Part-time'].map(t => <option key={t}>{t}</option>)}
                          </select>
                          <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Onboarding Activation Date</label>
                        <div className="relative">
                           <input type="date" className="w-full px-8 py-5 bg-[#0c0c0e] border border-white/5 rounded-2xl font-bold text-sm text-white outline-none" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                           <Calendar size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Remuneration Plan (Annual Gross)</label>
                     <div className="relative group">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-zinc-700">{currency}</span>
                        <input type="number" className="w-full pl-24 pr-8 py-8 bg-[#0c0c0e] border border-white/5 rounded-[2.5rem] font-black text-4xl text-white outline-none focus:border-blue-600 transition-all" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
                     </div>
                  </div>

                  <div className="p-12 bg-zinc-900/50 rounded-[3.5rem] border border-white/5 text-center space-y-6 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
                     <div className="flex justify-center"><ClipboardList className="text-blue-500" size={32} /></div>
                     <h4 className="text-2xl font-black text-white">Internal Compliance</h4>
                     <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-2xl mx-auto">By finalizing this provisioning, an internal secure activation packet will be broadcasted. Personnel will be required to authenticate via AgencyOS terminal to initialize their workstation.</p>
                     <div className="flex justify-center gap-12 pt-4">
                        {['COMPLIANT', 'AUDITED', 'SECURED'].map(tag => (
                           <div key={tag} className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                              <Check size={12} strokeWidth={4}/> {tag}
                           </div>
                        ))}
                     </div>
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-10 py-10 border-t border-white/5 bg-black/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onClose} disabled={isTransmitting} className="px-10 py-5 bg-zinc-900 border border-white/5 text-zinc-500 font-black text-[11px] uppercase tracking-widest rounded-3xl hover:text-white transition-all">Discard</button>
                <button 
                  onClick={handleSaveDraft} 
                  disabled={isTransmitting} 
                  className={`px-10 py-5 bg-zinc-900 border border-white/5 text-blue-500 font-black text-[11px] uppercase tracking-widest rounded-3xl hover:text-white hover:bg-blue-600 transition-all flex items-center gap-2`}
                >
                   <FileText size={14} /> Save Draft
                </button>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mr-4">Page {step} of 5</span>
                {step > 1 && <button onClick={handleBack} disabled={isTransmitting} className="p-5 bg-zinc-900 border border-white/5 text-zinc-500 rounded-2xl hover:text-white transition-all"><ChevronLeft size={24}/></button>}
                {step < 5 ? (
                    <button onClick={handleNext} className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">Next Sequence <ChevronRight size={18}/></button>
                ) : (
                    <button onClick={handleExecuteOnboarding} disabled={isTransmitting} className="px-12 py-5 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-4">Send Workforce Invitation <Send size={18}/></button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const Team: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
  
  // Use Custom Hook
  const { members, loading, addMember, updateMember, deleteMember, refresh } = useTeam();
  const { canEdit } = useAuth();
  const { checkSharedLimit } = usePlanEnforcement();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [activeActions, setActiveActions] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  useEffect(() => {
    // Refresh members on load (hook does this, but keeping for clarity)
    refresh();
  }, []);

  const handleAddMember = async () => {
     if (!canEdit('team')) {
        setToastType('error');
        setToast('Access Denied: You do not have permission to add team members');
        setTimeout(() => setToast(null), 3000);
        return;
     }

     const canCreate = await checkSharedLimit('workspace_members', 'seatLimit', { column: 'role', operator: 'eq', value: 'team' });
     
     if (!canCreate) {
        setToastType('error');
        setToast('Seat Limit Reached: Upgrade plan to add more team members');
        setTimeout(() => setToast(null), 3000);
        return;
     }

     setEditingMember(null);
     setIsModalOpen(true);
  };

  const handleSaveMember = async (member: Profile) => {
    if (!canEdit('team')) {
        setToastType('error');
        setToast('Access Denied: You do not have permission to save team members');
        setTimeout(() => setToast(null), 3000);
        return;
    }
    const isNew = !editingMember;
    
    if (isNew) {
        await addMember(member);
    } else {
        await updateMember(member.id, member);
    }
    
    setIsModalOpen(false);
    setEditingMember(null);
    setToastType('success');
    setToast('Team Member Provisioned');
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteMember = async (id: string) => {
      if (!canEdit('team')) {
          setToastType('error');
          setToast('Access Denied: You do not have permission to remove team members');
          setTimeout(() => setToast(null), 3000);
          return;
      }
      if(window.confirm("Remove member?")) {
        await deleteMember(id);
        setToastType('success');
        setToast('Member Removed');
        setTimeout(() => setToast(null), 3000);
      }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const name = m.name || '';
      const role = m.role || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' || m.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [members, searchTerm, deptFilter]);

  const stats = useMemo(() => {
    const nonAdmins = members.filter(m => !m.isAdmin);
    return {
      total: nonAdmins.length,
      online: Math.floor(nonAdmins.length * 0.7),
      utilization: 82,
      depts: new Set(nonAdmins.map(m => m.department)).size
    };
  }, [members]);

  const departments = ['All', ...Array.from(new Set(members.map(m => m.department)))];

  const getStatus = (id: string) => {
      const states = ['Online', 'In Focus', 'In Meeting', 'Offline'];
      return states[id.length % 4];
  }
  
  if (loading) return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
          <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-40 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-4 border border-white/10">
          {toastType === 'error' ? <AlertCircle size={18} className="text-rose-500" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
          {toast}
        </div>
      )}

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
        @keyframes pulse-subtle { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .animate-pulse-subtle { animation: pulse-subtle 2s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes glow-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-glow-flow {
          background-size: 200% 200%;
          animation: glow-flow 5s ease infinite;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <ShieldCheck size={20} />
             </div>
             <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.4em]">Workforce Access Terminal</p>
          </div>
          <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Internal Roster</h2>
        </div>
        
        <div className="flex flex-col items-end gap-3">
           <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-inner">
             <button onClick={() => setViewMode('Grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'Grid' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-xl' : 'text-slate-400'}`}><LayoutGrid size={20}/></button>
             <button onClick={() => setViewMode('List')} className={`p-3 rounded-xl transition-all ${viewMode === 'List' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-xl' : 'text-slate-400'}`}><List size={20}/></button>
           </div>
           
           <button 
             onClick={handleAddMember}
             className="relative group overflow-hidden px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] transition-all shadow-[0_20px_50px_-10px_rgba(37,99,235,0.3)] dark:shadow-[0_20px_50px_-10px_rgba(255,255,255,0.1)] active:scale-95 flex items-center gap-4 hover:scale-105"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 opacity-10 group-hover:opacity-20 transition-opacity duration-700 animate-glow-flow" />
             <div className="relative z-10 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:rotate-90 transition-transform duration-500">
                <Plus size={20} strokeWidth={3} />
             </div>
             <span className="relative z-10">Add Team Member</span>
             <div className="absolute bottom-0 left-0 h-[2px] bg-blue-50 transition-all duration-700 w-0 group-hover:w-full" />
           </button>
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <TelemetryStat label="Total Workforce" value={stats.total} icon={Users} color="bg-blue-600" percentage={100} showOrbit />
         <TelemetryStat label="Deployment Strength" value={stats.online} icon={Zap} color="bg-emerald-500" percentage={75} />
         <TelemetryStat label="Avg Task Velocity" value={`${stats.utilization}%`} icon={Activity} color="bg-purple-600" percentage={stats.utilization} />
         <TelemetryStat label="Internal Clusters" value={stats.depts} icon={Layers} color="bg-indigo-600" percentage={60} />
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-4xl mx-auto w-full">
         <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-[2.5rem] opacity-30 blur-2xl group-focus-within:opacity-60 transition-all duration-700 animate-glow-flow" />
         <div className="relative flex items-center bg-white dark:bg-[#0c0c0e] border-2 border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-3 shadow-2xl transition-all group-focus-within:border-blue-500/50 backdrop-blur-xl">
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-[1.75rem] text-slate-400 dark:text-zinc-600 mr-4 shadow-inner group-focus-within:text-blue-500 transition-colors">
               <Search size={22}/>
            </div>
            <input 
              type="text" 
              placeholder="Query workforce by skill, name or role..." 
              className="flex-1 bg-transparent border-none outline-none font-black text-xl text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-800 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="hidden md:flex gap-2 overflow-x-auto no-scrollbar max-w-[40%] px-4">
              {departments.map(dept => (
                <button 
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${deptFilter === dept ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-100 dark:border-zinc-800'}`}
                >
                  {dept}
                </button>
              ))}
            </div>
         </div>
      </div>

      {/* Grid Display */}
      {viewMode === 'Grid' ? (
        filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {filteredMembers.map((member) => {
            const status = (member as any).isDraft ? 'Draft' : getStatus(member.id);
            const utilization = Math.floor(Math.random() * 40) + 60;
            return (
              <TiltContainer key={member.id} className="h-full">
                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 group h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 dark:from-white/5 to-transparent pointer-events-none" />
                  <div className="absolute top-4 left-4 opacity-5 pointer-events-none"><Fingerprint size={100} /></div>

                  <div className="relative mb-8 mt-4">
                     <div className="w-32 h-32 rounded-full p-2 border-2 border-dashed border-slate-200 dark:border-zinc-800 group-hover:border-blue-500 transition-colors duration-500">
                        <div className="w-full h-full rounded-full overflow-hidden shadow-2xl relative">
                           <img src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`} className={`w-full h-full object-cover ${(member as any).isDraft ? 'grayscale opacity-50' : ''}`} alt=""/>
                        </div>
                     </div>
                     <div className={`absolute bottom-2 right-2 w-7 h-7 rounded-full border-4 border-white dark:border-zinc-900 ${
                         status === 'Online' ? 'bg-emerald-500' : status === 'In Focus' ? 'bg-purple-500' : status === 'Draft' ? 'bg-amber-500' : 'bg-slate-400'
                     } shadow-xl z-20 flex items-center justify-center`}>
                        {status === 'Online' && <Zap size={10} fill="white" className="text-white"/>}
                        {status === 'Draft' && <FileText size={10} className="text-white"/>}
                     </div>
                  </div>

                  <div className="space-y-1 mb-6 relative z-10">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{member.name}</h3>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{member.role || 'Provisioning...'}</p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mb-8 relative z-10">
                     {((member as any).skills || ['Strategy']).slice(0, 2).map((skill: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-black text-slate-500 dark:text-zinc-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-zinc-800">
                           {skill}
                        </span>
                     ))}
                  </div>

                  <div className="w-full p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between mb-8 mt-auto relative z-10">
                     <div className="text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Cluster</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-200 truncate">{member.department || 'Awaiting...'}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Load</p>
                        <p className={`text-xs font-black ${utilization > 85 ? 'text-rose-500' : 'text-emerald-500'}`}>{utilization}%</p>
                     </div>
                  </div>

                  <div className="flex gap-2 w-full pt-6 border-t border-slate-50 dark:border-zinc-800 relative z-10">
                     <Link to={`/profile/${member.id}`} className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center">View Profile</Link>
                     <div className="relative">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setActiveActions(activeActions === member.id ? null : member.id); }}
                         className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                       >
                          <Settings size={18}/>
                       </button>
                       {activeActions === member.id && (
                         <div className="absolute bottom-full right-0 mb-3 w-48 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 py-2 animate-in zoom-in-95 overflow-hidden">
                            <button 
                              onClick={() => { 
                                if (!canEdit('team')) {
                                    setToastType('error');
                                    setToast('Access Denied: You do not have permission to edit team members');
                                    setTimeout(() => setToast(null), 3000);
                                    return;
                                }
                                setEditingMember(member); 
                                setIsModalOpen(true); 
                              }} 
                              className="w-full px-5 py-3 text-left text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all flex items-center gap-2"
                            >
                              <Edit3 size={14}/> Edit
                            </button>
                            <button onClick={() => handleDeleteMember(member.id)} className="w-full px-5 py-3 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all flex items-center gap-2"><Trash2 size={14}/> Terminate</button>
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              </TiltContainer>
            );
          })}
        </div>
        ) : (
          <div className="py-32 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 border-dashed">
            <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="text-slate-300 dark:text-zinc-600" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Personnel Found</h3>
            <p className="text-slate-500 dark:text-zinc-500 max-w-xs mx-auto text-sm font-medium">No team members match your current filter or search criteria.</p>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-zinc-950 rounded-[3rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-colors">
           <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                 <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em]">
                    <th className="px-10 py-8">Operator Identity</th>
                    <th className="px-10 py-8">Cluster / Role</th>
                    <th className="px-10 py-8">Intelligence Level</th>
                    <th className="px-10 py-8">Load Factor</th>
                    <th className="px-10 py-8 text-right">Registry</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                 {filteredMembers.length > 0 ? filteredMembers.map(member => (
                   <tr key={member.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer">
                      <td className="px-10 py-8" onClick={() => navigate(`/profile/${member.id}`)}>
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden border-2 border-white dark:border-zinc-700 shadow-xl"><img src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`} className={`w-full h-full object-cover ${(member as any).isDraft ? 'grayscale opacity-50' : ''}`} alt=""/></div>
                            <div>
                               <p className="text-base font-black text-slate-900 dark:text-white">{member.name}</p>
                               <p className={`text-[10px] font-bold uppercase tracking-widest ${(member as any).isDraft ? 'text-amber-500' : 'text-blue-600 dark:text-blue-500'}`}>{(member as any).isDraft ? 'Draft Registry' : getStatus(member.id)}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{member.department || 'Pending'}</p>
                         <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{member.role || 'Provisioning'}</p>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex gap-2">
                           {((member as any).skills || ['N/A']).slice(0, 1).map((s: string) => (
                             <span key={s} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-[9px] font-black uppercase text-slate-500">{s}</span>
                           ))}
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="w-24 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }} />
                         </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <button onClick={() => navigate(`/profile/${member.id}`)} className="p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Eye size={18}/></button>
                      </td>
                   </tr>
                 )) : (
                    <tr>
                       <td colSpan={5} className="px-10 py-20 text-center">
                          <div className="flex flex-col items-center opacity-40">
                             <Users size={48} className="mb-4" />
                             <p className="text-xs font-black uppercase tracking-widest">No Personnel Registry Found</p>
                          </div>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      )}

      <MemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveMember} 
        member={editingMember}
        allMembers={members}
      />
    </div>
  );
};

export default Team;
