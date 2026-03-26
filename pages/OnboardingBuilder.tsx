
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, GripVertical, CheckCircle2,
  Play, Sparkles, Layers, RefreshCw, X,
  AlignLeft, AlignCenter, AlignRight,
  ChevronDown, Search, Wand, FileSignature, 
  CreditCard, Video, Users, Zap, Map, Shield, 
  Palette, Key, MessageSquare, ThumbsUp, Share, 
  Heart, SlidersHorizontal, User, Mail, Tag,
  Lock, MonitorPlay, Link as LinkIcon, Check,
  ShieldAlert, Terminal, DollarSign, Globe, Clock,
  FileCheck, LayoutGrid, FileText, Upload, Calendar, List,
  Briefcase, Target, BookOpen, Activity, FileSearch, ShieldCheck,
  CheckCircle, Hammer, Code, Boxes, Rocket, Smartphone,
  Waves, Wind, Ghost, Sun, Move, Eye, Aperture, Layers2,
  Cpu, Database, Cloud, Radio, Workflow,
  Box, MousePointer2, Type, Paintbrush, MoveHorizontal, MoveVertical,
  Focus, SunMoon, Braces, AlignJustify, Layout, Maximize2
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';

import { useOnboarding } from '../hooks/useOnboarding';
import { useTeam } from '../hooks/useTeam';

const { useNavigate, useParams } = ReactRouterDom as any;

// --- DIRECTIVE TYPES ---
const DIRECTIVE_TYPES = [
  { id: 'intro', label: 'Cover / Introduction', icon: LayoutGrid, category: 'General' },
  { id: 'form', label: 'Information Intake', icon: FileText, category: 'Data' },
  { id: 'upload', label: 'Asset Transmission', icon: Upload, category: 'Data' },
  { id: 'video', label: 'Video Briefing', icon: Video, category: 'Media' },
  { id: 'calendar', label: 'Meeting Scheduler', icon: Calendar, category: 'Sync' },
  { id: 'contract', label: 'Legal Agreement', icon: FileSignature, category: 'Legal' },
  { id: 'billing', label: 'Payment Gateway', icon: CreditCard, category: 'Finance' },
  { id: 'checklist', label: 'Process Verification', icon: List, category: 'Operational' },
  { id: 'team', label: 'Team Showcase', icon: Users, category: 'General' },
  { id: 'tools', label: 'Tool Integration', icon: Zap, category: 'Operational' },
  { id: 'roadmap', label: 'Project Roadmap', icon: Map, category: 'Operational' },
  { id: 'audit', label: 'Technical Audit', icon: Shield, category: 'Data' },
  { id: 'brief', label: 'Creative Briefing', icon: Palette, category: 'Data' },
  { id: 'credentials', label: 'Access Credentials', icon: Key, category: 'Security' },
  { id: 'comms', label: 'Communication Sync', icon: MessageSquare, category: 'Sync' },
  { id: 'approval', label: 'Scope Approval', icon: CheckCircle2, category: 'Legal' },
  { id: 'referral', label: 'Growth Referral', icon: Share, category: 'General' },
  { id: 'feedback', label: 'Initial Feedback', icon: ThumbsUp, category: 'Data' },
  { id: 'outro', label: 'Completion Registry', icon: Heart, category: 'General' },
];

const TRANSITION_TYPES = [
  'Slide', 'SlideUp', 'SlideDown', 'SlideLeft', 'SlideRight', 
  'ZoomIn', 'ZoomOut', 'BlurIn', 'BlurOut', 'Reveal', 
  'RevealUp', 'RevealDown', 'FlipX', 'FlipY', 'Rotate', 
  'Bounce', 'Glitch', 'Shimmer', 'Dissolve', 'Hyperspace', 'Ethereal'
];

const DEFAULT_BRANDING = {
  // Existing Core
  primaryColor: '#2563eb',
  secondaryColor: '#8b5cf6',
  backgroundColor: '#000000',
  glassOpacity: 0.1,
  blurStrength: 12,
  borderRadius: 40,
  fontFamily: 'Inter',
  baseTextSize: 16,
  meshSpeed: 10,
  meshBlur: 150,
  noiseOpacity: 0.2,
  noiseSpeed: 0.1,
  noiseScale: 100,
  glowIntensity: 0.5,
  buttonGlow: true,
  buttonGradient: true,
  logoScale: 1,
  showShield: true,
  containerPadding: 48,
  inputStyle: 'Minimal',
  headingWeight: '900',
  bodyWeight: '500',
  contentAlign: 'center',
  inputBorderWidth: 1,
  inputFocusSpread: 4,
  buttonTextTransform: 'uppercase',
  buttonLetterSpacing: 0.2,
  progressHeight: 2,
  progressGlow: 20,
  containerMaxWidth: 700,
  scanlineOpacity: 0.05,
  scanlineSpeed: 0.5,
  scanlineDensity: 4,
  vignetteStrength: 0.5,
  vignetteColor: '#000000',
  vignetteRadius: 50,
  particleDensity: 20,
  particleSpeed: 1,
  particleSize: 3,
  particleOpacity: 0.1,
  particlePulse: 3,
  particleColor: '#ffffff',
  chromaticStrength: 0,
  chromaticFreq: 0.5,
  parallaxIntensity: 40,
  transitionDuration: 600,
  hueRotateSpeed: 0,
  bloomStrength: 0,
  noiseBlendMode: 'overlay',

  // --- 25 NEW IN-DEPTH PROPERTIES ---
  // 1. Header Optics
  headerBlur: 20,
  headerOpacity: 0.8,
  headerBorderOpacity: 0.1,
  
  // 2. Card Specifics
  cardBorderWidth: 1,
  cardShadowIntensity: 40,
  cardBorderOpacity: 0.1,
  cardPadding: 48,
  
  // 3. Typography Nuances
  globalLetterSpacing: 0,
  headingLetterSpacing: -0.05,
  bodyLineHeight: 1.6,
  headingLineHeight: 1.1,
  labelOpacity: 0.6,
  
  // 4. Action Element Tuning
  buttonPaddingX: 40,
  buttonPaddingY: 20,
  buttonBorderRadius: 16,
  buttonHoverScale: 1.05,
  buttonShadowOpacity: 0.3,
  
  // 5. Input Field Dynamics
  inputBorderRadius: 12,
  inputBgOpacity: 0.05,
  inputPlaceholderColor: '#444444',
  inputTextColor: '#ffffff',
  
  // 6. Navigation / Progress
  activeStepColor: '#3b82f6',
  stepIndicatorSize: 8,
  stepIndicatorGap: 12,
  
  // 7. Environmental Refinement
  glassmorphismContrast: 1.1,
  backdropBrightness: 0.8,
  overlayIntensity: 0.2,
  accentGlowRange: 30,
  
  // 8. Brand Logo Controls
  logoGrayscale: 0,
  logoBrightness: 1,
  logoShadow: 10
};

const DEFAULT_STEPS = [
  { id: '1', title: 'Welcome', type: 'intro', desc: "Alignment protocol initialized.", transitionType: 'Reveal', config: {} },
  { id: '2', title: 'Identity', type: 'form', transitionType: 'SlideLeft', config: { fields: [{ label: 'Full Name', type: 'text', required: true }, { label: 'Role', type: 'text' }] } },
  { id: '3', title: 'Strategy', type: 'video', transitionType: 'ZoomIn', config: { videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ', autoplay: true, playerTheme: 'minimal' } },
  { id: '16', title: 'Success', type: 'outro', transitionType: 'Hyperspace', desc: "Dossier transmitted.", config: {} }
];

// --- Functional Helpers ---

const PremiumSlider = ({ label, value, min, max, step = 1, onChange, unit = "", icon: Icon }: any) => (
  <div className="space-y-3 p-4 bg-zinc-900/40 border border-white/5 rounded-3xl hover:bg-zinc-900/60 transition-colors group">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-zinc-500 group-hover:text-blue-500 transition-colors" />}
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{label}</label>
      </div>
      <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded pr-2">{value}{unit}</span>
    </div>
    <div className="relative h-6 flex items-center group/slider">
       <div className="absolute w-full h-1 bg-zinc-800 rounded-full" />
       <div 
          className="absolute h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
       />
       <input 
         type="range" min={min} max={max} step={step} value={value}
         onChange={(e) => onChange(parseFloat(e.target.value))}
         className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
       />
       <div 
         className="absolute w-3 h-3 bg-white rounded-full border-2 border-blue-600 shadow-xl pointer-events-none group-hover/slider:scale-125 transition-transform"
         style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
       />
    </div>
  </div>
);

const TacticalToggle = ({ label, sub, active, onToggle, icon: Icon }: any) => (
  <div onClick={onToggle} className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer group transition-all ${active ? 'bg-blue-600/10 border-blue-600/50 shadow-[0_0_20px_rgba(37,99,235,0.05)]' : 'bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-800/50'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg transition-all ${active ? 'bg-blue-600 text-white scale-110' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
        {Icon && <Icon size={14} />}
      </div>
      <div>
        <p className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-zinc-400'}`}>{label}</p>
        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{sub}</p>
      </div>
    </div>
    <div className={`w-10 h-5 rounded-full relative transition-all ${active ? 'bg-blue-600' : 'bg-zinc-800'}`}>
      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ease-out ${active ? 'left-6' : 'left-1'}`} />
    </div>
  </div>
);

const GenericInput = ({ label, value, onChange, placeholder, type = "text", icon: Icon }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />}
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-11' : 'px-6'} py-4 bg-black/40 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-600 transition-all placeholder:text-zinc-800 focus:bg-black/60`}
      />
    </div>
  </div>
);

// --- SELECTORS ---

const DirectiveSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = DIRECTIVE_TYPES.filter(t => t.label.toLowerCase().includes(search.toLowerCase()));
  const activeType = DIRECTIVE_TYPES.find(t => t.id === value) || DIRECTIVE_TYPES[0];

  return (
    <div className="relative w-full" ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 flex items-center justify-between group hover:border-blue-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <activeType.icon size={16} className="text-blue-500" />
          <span className="text-sm font-black text-white">{activeType.label}</span>
        </div>
        <ChevronDown size={16} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2 bg-black/20">
            <Search size={14} className="text-zinc-500" />
            <input 
              autoFocus
              className="bg-transparent border-none outline-none text-xs font-bold text-white w-full placeholder:text-zinc-600"
              placeholder="Filter directive types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto no-scrollbar p-2 space-y-1">
            {filtered.map(t => (
              <button 
                key={t.id}
                onClick={() => { onChange(t.id); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  value === t.id 
                  ? 'bg-blue-600 text-white shadow-xl' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <t.icon size={14} className={value === t.id ? 'text-white' : 'text-zinc-500'} />
                  {t.label}
                </div>
                {value === t.id && <CheckCircle2 size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TransitionSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = TRANSITION_TYPES.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 flex items-center justify-between group hover:border-blue-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <Wand size={16} className="text-blue-500" />
          <span className="text-sm font-black text-white">{value} Transition</span>
        </div>
        <ChevronDown size={16} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2 bg-black/20">
            <Search size={14} className="text-zinc-500" />
            <input 
              autoFocus
              className="bg-transparent border-none outline-none text-xs font-bold text-white w-full placeholder:text-zinc-600"
              placeholder="Filter effects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto no-scrollbar p-2 space-y-1">
            {filtered.map(t => (
              <button 
                key={t}
                onClick={() => { onChange(t); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  value === t 
                  ? 'bg-blue-600 text-white shadow-xl' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {t}
                {value === t && <CheckCircle2 size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- DIRECTIVE CONFIG PANELS ---

const FormConfig = ({ config, onChange }: any) => {
  const fields = config.fields || [];
  const addField = () => onChange({ ...config, fields: [...fields, { label: 'New Question', type: 'text', required: true }] });
  const updateField = (idx: number, updates: any) => {
    const next = [...fields];
    next[idx] = { ...next[idx], ...updates };
    onChange({ ...config, fields: next });
  };
  const removeField = (idx: number) => onChange({ ...config, fields: fields.filter((_: any, i: number) => i !== idx) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Question Registry</p>
        <button onClick={addField} className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14}/> Add Field</button>
      </div>
      <div className="space-y-4">
        {fields.map((field: any, i: number) => (
          <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-start gap-6 group hover:border-zinc-700 transition-all">
            <div className="p-3 bg-black rounded-xl text-zinc-700 mt-1 cursor-move group-hover:text-zinc-500"><GripVertical size={16}/></div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase">Input ID</label>
                <input value={field.label} onChange={e => updateField(i, { label: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-600" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase">Registry Type</label>
                <select value={field.type} onChange={e => updateField(i, { type: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none">
                  <option value="text">Short Intel</option>
                  <option value="textarea">Paragraph Intel</option>
                  <option value="select">Dropdown Menu</option>
                  <option value="boolean">Binary Yes/No</option>
                  <option value="file">File Transmit</option>
                </select>
              </div>
            </div>
            <button onClick={() => removeField(i)} className="p-3 text-zinc-700 hover:text-rose-500 mt-1"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const VideoConfig = ({ config, onChange }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <GenericInput label="Source URL" value={config.videoUrl || ''} onChange={(v: string) => onChange({ ...config, videoUrl: v })} placeholder="YouTube, Vimeo, or direct link..." icon={MonitorPlay} />
       <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Player Theme</label>
          <select value={config.playerTheme || 'tactical'} onChange={e => onChange({ ...config, playerTheme: e.target.value })} className="w-full px-6 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none">
            <option value="tactical">Tactical Black</option>
            <option value="minimal">Minimal Floating</option>
            <option value="glass">Frosted Glass</option>
          </select>
       </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       <TacticalToggle label="Autoplay" sub="Zero interaction start" active={config.autoplay} onToggle={() => onChange({ ...config, autoplay: !config.autoplay })} icon={Zap} />
       <TacticalToggle label="Looping" sub="Infinite session play" active={config.loop} onToggle={() => onChange({ ...config, loop: !config.loop })} icon={RefreshCw} />
       <TacticalToggle label="Muted" sub="Standard silence mode" active={config.muted} onToggle={() => onChange({ ...config, muted: !config.muted })} icon={X} />
    </div>
  </div>
);

const CalendarConfig = ({ config, onChange }: any) => (
  <div className="space-y-6">
    <GenericInput label="Booking Gateway Link" value={config.bookingUrl || ''} onChange={(v: string) => onChange({ ...config, bookingUrl: v })} placeholder="Calendly, SavvyCal, or internal link..." icon={Calendar} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Sync Provider</label>
          <select value={config.provider || 'Calendly'} onChange={e => onChange({ ...config, provider: e.target.value })} className="w-full px-6 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none">
             <option>Calendly</option><option>SavvyCal</option><option>Google Calendar</option><option>Internal Sync</option>
          </select>
       </div>
       <GenericInput label="Preferred Host" value={config.host || ''} onChange={(v: string) => onChange({ ...config, host: v })} placeholder="Account Director name..." icon={User} />
    </div>
  </div>
);

const ContractConfig = ({ config, onChange }: any) => (
  <div className="space-y-6">
    <div className="space-y-2">
       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Legal Blueprint Content (Markdown)</label>
       <textarea 
          value={config.content || ''} 
          onChange={e => onChange({ ...config, content: e.target.value })}
          className="w-full h-48 bg-black/40 border border-zinc-800 rounded-2xl p-6 text-zinc-300 font-medium text-xs outline-none focus:border-blue-600 transition-all resize-none"
          placeholder="# Agreement Terms... "
       />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <TacticalToggle label="Multi-Sign" sub="Witness identity required" active={config.witness} onToggle={() => onChange({ ...config, witness: !config.witness })} icon={Users} />
       <TacticalToggle label="Stamp of Identity" sub="Agency watermark ink" active={config.stamped} onToggle={() => onChange({ ...config, stamped: !config.stamped })} icon={FileCheck} />
    </div>
  </div>
);

const BillingConfig = ({ config, onChange }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Payment Gateway</label>
          <select value={config.gateway || 'Stripe'} onChange={e => onChange({ ...config, gateway: e.target.value })} className="w-full px-6 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none">
             <option>Stripe</option><option>PayPal</option><option>Bank Transfer</option><option>Credit Protocol</option>
          </select>
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Currency</label>
          <select value={config.currency || 'USD'} onChange={e => onChange({ ...config, currency: e.target.value })} className="w-full px-6 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none">
             <option>USD</option><option>EUR</option><option>GBP</option><option>JPY</option>
          </select>
       </div>
    </div>
    <GenericInput label="Fixed Protocol Amount" type="number" value={config.amount || ''} onChange={(v: string) => onChange({ ...config, amount: v })} placeholder="0.00" icon={DollarSign} />
    <TacticalToggle label="Auto-Pay Enforcement" sub="Debit card on acceptance" active={config.autoPay} onToggle={() => onChange({ ...config, autoPay: !config.autoPay })} icon={Lock} />
  </div>
);

const ChecklistConfig = ({ config, onChange }: any) => {
  const items = config.items || [];
  const addItem = () => onChange({ ...config, items: [...items, { text: '', required: true }] });
  const updateItem = (idx: number, text: string) => {
    const next = [...items];
    next[idx].text = text;
    onChange({ ...config, items: next });
  };
  const removeItem = (idx: number) => onChange({ ...config, items: items.filter((_: any, i: number) => i !== idx) });

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Process Verification Points</p>
          <button onClick={addItem} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14}/> Add Point</button>
       </div>
       <div className="space-y-3">
          {items.map((item: any, i: number) => (
             <div key={i} className="flex gap-3 group animate-in slide-in-from-left duration-300">
                <div className="flex-1 relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700"><CheckCircle2 size={16}/></div>
                   <input 
                      value={item.text} 
                      onChange={e => updateItem(i, e.target.value)} 
                      placeholder="Verification point description..."
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-xs font-bold text-white outline-none focus:border-blue-600 transition-all"
                   />
                </div>
                <button onClick={() => removeItem(i)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-600 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
             </div>
          ))}
          {items.length === 0 && <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem] opacity-30"><p className="text-xs font-bold uppercase tracking-widest">No verification points defined.</p></div>}
       </div>
    </div>
  );
};

const TeamConfig = ({ config, onChange }: any) => {
  const { members } = useTeam();
  const selectedMembers = config.members || [];
  
  const toggleMember = (id: string) => {
    const next = selectedMembers.includes(id) 
      ? selectedMembers.filter((m: string) => m !== id) 
      : [...selectedMembers, id];
    onChange({ ...config, members: next });
  };

  return (
    <div className="space-y-8">
       <div className="space-y-4">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Team Deployment Selection</p>
          <div className="grid grid-cols-2 gap-3">
             {members.length === 0 && (
                <div className="col-span-2 p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                   <p className="text-xs text-zinc-500 font-bold">No team members found.</p>
                </div>
             )}
             {members.map(p => (
                <button 
                  key={p.id}
                  onClick={() => toggleMember(p.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${selectedMembers.includes(p.id) ? 'bg-blue-600 border-blue-500 shadow-lg' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                >
                   <img src={p.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt=""/>
                   <div className="min-w-0">
                      <p className="text-xs font-black truncate text-white">{p.name}</p>
                      <p className={`text-[9px] font-bold truncate ${selectedMembers.includes(p.id) ? 'text-blue-100' : 'text-zinc-500'}`}>{p.role}</p>
                   </div>
                   {selectedMembers.includes(p.id) && <div className="ml-auto bg-white/20 p-1 rounded-full"><Check size={10} strokeWidth={4}/></div>}
                </button>
             ))}
          </div>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <TacticalToggle label="Show Roles" active={config.showRoles} onToggle={() => onChange({ ...config, showRoles: !config.showRoles })} icon={Tag} />
          <TacticalToggle label="Interactive Bio" active={config.interactiveBio} onToggle={() => onChange({ ...config, interactiveBio: !config.interactiveBio })} icon={Search} />
       </div>
    </div>
  );
};

const CommsConfig = ({ config, onChange }: any) => (
  <div className="space-y-6">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GenericInput label="Primary Slack/Discord Link" value={config.channelUrl || ''} onChange={(v: string) => onChange({ ...config, channelUrl: v })} placeholder="https://slack.com/..." icon={MessageSquare} />
        <GenericInput label="Support Email Node" value={config.supportEmail || ''} onChange={(v: string) => onChange({ ...config, supportEmail: v })} placeholder="support@domain.com" icon={Mail} />
     </div>
     <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[2rem] flex items-center gap-6">
        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg"><LinkIcon size={24}/></div>
        <div>
           <h4 className="text-sm font-black text-white uppercase tracking-widest">Protocol Auto-Join</h4>
           <p className="text-xs font-medium text-zinc-500 mt-1 leading-relaxed">System will attempt to automatically generate invite keys for the synchronized identity.</p>
        </div>
     </div>
  </div>
);

const RoadmapConfig = ({ config, onChange }: any) => {
  const milestones = config.milestones || [];
  const addMile = () => onChange({ ...config, milestones: [...milestones, { label: '', week: 1 }] });
  const updateMile = (idx: number, updates: any) => {
    const next = [...milestones];
    next[idx] = { ...next[idx], ...updates };
    onChange({ ...config, milestones: next });
  };
  const removeMile = (idx: number) => onChange({ ...config, milestones: milestones.filter((_: any, i: number) => i !== idx) });

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Project Milestone Logic</p>
          <button onClick={addMile} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14}/> Add Milestone</button>
       </div>
       <div className="space-y-4">
          {milestones.map((m: any, i: number) => (
             <div key={i} className="flex gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl group">
                <div className="flex-1 space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Milestone {i + 1}</span>
                      <button onClick={() => removeMile(i)} className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                   </div>
                   <input value={m.label} onChange={e => updateMile(i, { label: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600" placeholder="Milestone Title..." />
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Week Offset:</span>
                      <input type="number" value={m.week} onChange={e => updateMile(i, { week: parseInt(e.target.value) || 0 })} className="w-20 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xs font-black text-blue-500 outline-none" />
                   </div>
                </div>
             </div>
          ))}
          {milestones.length === 0 && <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem] opacity-30"><p className="text-xs font-bold uppercase tracking-widest">No milestones defined in roadmap.</p></div>}
       </div>
    </div>
  );
};

const UploadConfig = ({ config, onChange }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Accepted Protocol Formats</label>
          <input 
            value={config.formats || '.jpg, .png, .pdf, .zip'} 
            onChange={e => onChange({ ...config, formats: e.target.value })} 
            className="w-full px-6 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-600" 
            placeholder=".jpg, .png, .zip"
          />
       </div>
       <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Maximum Packet Size (MB)</label>
          <input 
            type="number"
            value={config.maxSize || 50} 
            onChange={e => onChange({ ...config, maxSize: parseInt(e.target.value) || 0 })} 
            className="w-full px-6 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-600" 
          />
       </div>
    </div>
    <TacticalToggle label="Auto-Scanning" sub="Wipe malware on upload" active={config.scanning} onToggle={() => onChange({ ...config, scanning: !config.scanning })} icon={ShieldCheck} />
  </div>
);

const ToolsConfig = ({ config, onChange }: any) => {
  const tools = config.tools || [];
  const addTool = () => onChange({ ...config, tools: [...tools, { name: '', url: '', status: 'active' }] });
  const updateTool = (idx: number, updates: any) => {
    const next = [...tools];
    next[idx] = { ...next[idx], ...updates };
    onChange({ ...config, tools: next });
  };
  const removeTool = (idx: number) => onChange({ ...config, tools: tools.filter((_: any, i: number) => i !== idx) });

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stack Integration Logic</p>
          <button onClick={addTool} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14}/> Add Tool</button>
       </div>
       <div className="space-y-4">
          {tools.map((t: any, i: number) => (
             <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col gap-4 group">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tool Hub {i+1}</p>
                   <button onClick={() => removeTool(i)} className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input value={t.name} onChange={e => updateTool(i, { name: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none" placeholder="Tool Name (e.g. Slack)" />
                   <input value={t.url} onChange={e => updateTool(i, { url: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-blue-500 font-bold outline-none" placeholder="Integration Link" />
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

const AuditConfig = ({ config, onChange }: any) => {
  const checks = config.checks || [];
  const addCheck = () => onChange({ ...config, checks: [...checks, { label: '', weight: 10 }] });
  const updateCheck = (idx: number, updates: any) => {
    const next = [...checks];
    next[idx] = { ...next[idx], ...updates };
    onChange({ ...config, checks: next });
  };
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Technical Validation Checks</p>
          <button onClick={addCheck} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14}/> Add Check</button>
       </div>
       <div className="space-y-3">
          {checks.map((c: any, i: number) => (
             <div key={i} className="flex gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl items-center">
                <input value={c.label} onChange={e => updateCheck(i, { label: e.target.value })} className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm" placeholder="Check Objective (e.g. SSL Verification)" />
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Score Weight:</span>
                   <input type="number" value={c.weight} onChange={e => updateCheck(i, { weight: parseInt(e.target.value) })} className="w-16 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-blue-500 text-xs text-center" />
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

const BriefConfig = ({ config, onChange }: any) => {
  const sections = config.sections || [];
  const addSection = () => onChange({ ...config, sections: [...sections, { title: '', placeholder: '' }] });
  const updateSection = (idx: number, updates: any) => {
    const next = [...sections];
    next[idx] = { ...next[idx], ...updates };
    onChange({ ...config, sections: next });
  };
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Creative Blueprint Sections</p>
          <button onClick={addSection} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14}/> Add section</button>
       </div>
       <div className="space-y-4">
          {sections.map((s: any, i: number) => (
             <div key={i} className="space-y-3 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                <input value={s.title} onChange={e => updateSection(i, { title: e.target.value })} className="w-full bg-black border-b border-zinc-800 px-4 py-3 text-white font-black text-base" placeholder="Section Header (e.g. Tone of Voice)" />
                <textarea value={s.placeholder} onChange={e => updateSection(i, { placeholder: e.target.value })} className="w-full bg-black/40 border border-zinc-800 rounded-2xl p-4 text-zinc-400 text-xs h-20" placeholder="Guidance text for client..." />
             </div>
          ))}
       </div>
    </div>
  );
};

const CredentialsConfig = ({ config, onChange }: any) => {
  const fields = config.fields || [];
  const addField = () => onChange({ ...config, fields: [...fields, { service: '', url: '', login: '' }] });
  const updateField = (idx: number, updates: any) => {
    const next = [...fields];
    next[idx] = { ...next[idx], ...updates };
    onChange({ ...config, fields: next });
  };
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Secure Access Matrix</p>
          <button onClick={addField} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14}/> Add access node</button>
       </div>
       <div className="space-y-4">
          {fields.map((f: any, i: number) => (
             <div key={i} className="grid grid-cols-3 gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                <input value={f.service} onChange={e => updateField(i, { service: e.target.value })} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold" placeholder="Service Name" />
                <input value={f.url} onChange={e => updateField(i, { url: e.target.value })} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400" placeholder="Login URL" />
                <input value={f.login} onChange={e => updateField(i, { login: e.target.value })} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400" placeholder="Username / UID" />
             </div>
          ))}
       </div>
    </div>
  );
};

const ApprovalConfig = ({ config, onChange }: any) => (
  <div className="space-y-6">
    <div className="space-y-2">
       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Scope Definition (Markdown)</label>
       <textarea 
          value={config.scope || ''} 
          onChange={e => onChange({ ...config, scope: e.target.value })}
          className="w-full h-48 bg-black/40 border border-zinc-800 rounded-[2.5rem] p-8 text-zinc-300 font-medium text-sm outline-none focus:border-blue-600 transition-all resize-none shadow-inner"
          placeholder="Summarize the project scope being approved..."
       />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <TacticalToggle label="Instant Mission Start" sub="Kickoff on approval" active={config.instantStart} onToggle={() => onChange({ ...config, instantStart: !config.instantStart })} icon={Rocket} />
       <TacticalToggle label="Biometric Sync" sub="Mobile verification" active={config.biometric} onToggle={() => onChange({ ...config, biometric: !config.biometric })} icon={Smartphone} />
    </div>
  </div>
);

const ReferralConfig = ({ config, onChange }: any) => (
  <div className="space-y-6">
    <GenericInput label="Custom Referral Link" value={config.refUrl || ''} onChange={(v: string) => onChange({ ...config, refUrl: v })} placeholder="https://..." icon={Globe} />
    <div className="space-y-2">
       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Incentive Description</label>
       <input 
          value={config.incentive || 'Receive 1,000 production credits for every successful partner sync.'} 
          onChange={e => onChange({ ...config, incentive: e.target.value })}
          className="w-full px-6 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-600" 
        />
    </div>
  </div>
);

const FeedbackConfig = ({ config, onChange }: any) => {
  const questions = config.questions || [];
  const addQ = () => onChange({ ...config, questions: [...questions, { label: '', type: 'rating' }] });
  const updateQ = (idx: number, updates: any) => {
    const next = [...questions];
    next[idx] = { ...next[idx], ...updates };
    onChange({ ...config, questions: next });
  };
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Initial Pulse Questions</p>
          <button onClick={addQ} className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14}/> Add question</button>
       </div>
       <div className="space-y-3">
          {questions.map((q: any, i: number) => (
             <div key={i} className="flex gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl items-center">
                <input value={q.label} onChange={e => updateQ(i, { label: e.target.value })} className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm" placeholder="Question Text..." />
                <select value={q.type} onChange={e => updateQ(i, { type: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white">
                   <option value="rating">Scale (1-5)</option>
                   <option value="text">Paragraph</option>
                </select>
             </div>
          ))}
       </div>
    </div>
  );
};

// --- MAIN BUILDER ---

const OnboardingBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchFlowById, saveFlow } = useOnboarding();
  
  const [activeTab, setActiveTab] = useState<'Sequence' | 'Branding' | 'VFX'>('Sequence');
  const [manifest, setManifest] = useState<any>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load Flow Data
  useEffect(() => {
    const loadFlow = async () => {
      if (!id) return;
      setIsLoading(true);
      const flow = await fetchFlowById(id);
      
      if (flow) {
        const loadedManifest = {
          id: flow.id,
          name: flow.name,
          steps: flow.steps && flow.steps.length > 0 ? flow.steps : DEFAULT_STEPS,
          branding: flow.branding && Object.keys(flow.branding).length > 0 ? flow.branding : DEFAULT_BRANDING
        };
        setManifest(loadedManifest);
        setActiveStepId(loadedManifest.steps[0].id);
      } else {
        // Fallback or redirect if not found
        console.error("Flow not found");
        navigate('/onboarding');
      }
      setIsLoading(false);
    };
    
    loadFlow();
  }, [id, fetchFlowById, navigate]);

  // Auto-Save Changes
  useEffect(() => {
    if (!manifest || !id || isLoading) return;

    const timeoutId = setTimeout(() => {
      saveFlow({
        id: id,
        name: manifest.name || 'Untitled Protocol',
        steps: manifest.steps,
        branding: manifest.branding
      });
      setIsSaved(true);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [manifest, id, saveFlow, isLoading]);

  if (isLoading || !manifest) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Loading Protocol Configuration...</p>
      </div>
    );
  }

  const activeStep = manifest.steps.find((s: any) => s.id === activeStepId) || manifest.steps[0];

  const updateManifest = (updates: any) => {
    setManifest((prev: any) => ({ ...prev, ...updates }));
    setIsSaved(false);
  };

  const updateBranding = (key: string, val: any) => {
    updateManifest({ branding: { ...manifest.branding, [key]: val } });
  };

  const updateStep = (id: string, updates: any) => {
    const newSteps = manifest.steps.map((s: any) => s.id === id ? { ...s, ...updates } : s);
    updateManifest({ steps: newSteps });
  };

  const addStep = () => {
    const newId = `step-${Date.now()}`;
    const newStep = { id: newId, title: 'New Step', type: 'form', transitionType: 'Slide', config: {} };
    updateManifest({ steps: [...manifest.steps, newStep] });
    setActiveStepId(newId);
  };

  const deleteStep = (id: string) => {
    if (manifest.steps.length <= 1) return;
    const newSteps = manifest.steps.filter((s: any) => s.id !== id);
    updateManifest({ steps: newSteps });
    setActiveStepId(newSteps[0].id);
  };

  const RenderDirectiveConfig = () => {
    const props = { config: activeStep.config || {}, onChange: (c: any) => updateStep(activeStepId, { config: c }) };
    switch (activeStep.type) {
      case 'form': return <FormConfig {...props} />;
      case 'video': return <VideoConfig {...props} />;
      case 'calendar': return <CalendarConfig {...props} />;
      case 'contract': return <ContractConfig {...props} />;
      case 'billing': return <BillingConfig {...props} />;
      case 'checklist': return <ChecklistConfig {...props} />;
      case 'team': return <TeamConfig {...props} />;
      case 'comms': return <CommsConfig {...props} />;
      case 'roadmap': return <RoadmapConfig {...props} />;
      case 'upload': return <UploadConfig {...props} />;
      case 'tools': return <ToolsConfig {...props} />;
      case 'audit': return <AuditConfig {...props} />;
      case 'brief': return <BriefConfig {...props} />;
      case 'credentials': return <CredentialsConfig {...props} />;
      case 'approval': return <ApprovalConfig {...props} />;
      case 'referral': return <ReferralConfig {...props} />;
      case 'feedback': return <FeedbackConfig {...props} />;
      case 'intro': 
      case 'outro': 
        return (
          <div className="space-y-3">
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hero Messaging Brief</label>
             <textarea 
                value={activeStep.desc}
                onChange={(e) => updateStep(activeStepId, { desc: e.target.value })}
                className="w-full h-48 bg-black/40 border border-zinc-800 rounded-[2rem] p-8 text-zinc-300 font-medium text-lg outline-none focus:border-blue-600 resize-none shadow-inner"
                placeholder="Enter compelling briefing text..."
             />
          </div>
        );
      default: 
        return (
          <div className="p-20 text-center border-2 border-dashed border-zinc-800 rounded-[3rem] opacity-30 flex flex-col items-center gap-6">
             <SlidersHorizontal size={48} />
             <p className="text-xs font-black uppercase tracking-[0.3em]">Module Interface Initializing...</p>
          </div>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-black text-white overflow-hidden">
      
      {/* Header */}
      <div className="h-24 px-10 border-b border-zinc-800 bg-black flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate('/clients')} className="p-4 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-all"><X size={20}/></button>
           <div>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20"><Sparkles size={16}/></div>
                 <h1 className="text-xl font-black tracking-tight text-white">Onboarding Studio <span className="text-zinc-600 font-bold ml-2">v4.8</span></h1>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                 {isSaved ? (
                   <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-500 tracking-widest">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 
                     Sync Confirmed
                   </span>
                 ) : (
                   <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-500 tracking-widest animate-pulse">
                     <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 
                     Saving Changes...
                   </span>
                 )}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
              {(['Sequence', 'Branding', 'VFX'] as const).map(tab => (
                 <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                   {tab}
                 </button>
              ))}
           </div>
           <div className="h-8 w-px bg-zinc-800 mx-2" />
           <button 
            onClick={() => navigate(`/onboarding/view/${id}`)} 
            className="px-8 py-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] flex items-center gap-3 border border-blue-500/50 group"
           >
              <Play size={14} fill="currentColor" /> Launch Simulation
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar Navigation */}
         <div className="w-96 border-r border-zinc-800 bg-[#080808] flex flex-col overflow-y-auto no-scrollbar shrink-0 rounded-bl-[3rem]">
            {activeTab === 'Sequence' && (
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Phase Inventory</p>
                   <button onClick={addStep} className="p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"><Plus size={16}/></button>
                </div>
                <div className="space-y-3">
                   {manifest.steps.map((step: any, idx: number) => (
                      <div 
                        key={step.id} 
                        onClick={() => setActiveStepId(step.id)}
                        className={`w-full group relative p-5 rounded-[1.75rem] border transition-all cursor-pointer ${activeStepId === step.id ? 'bg-zinc-900 border-zinc-700 shadow-2xl' : 'bg-transparent border-transparent hover:bg-zinc-900/50'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${activeStepId === step.id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                               <p className={`text-sm font-black truncate ${activeStepId === step.id ? 'text-white' : 'text-zinc-500'}`}>{step.title}</p>
                               <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{step.type} • {step.transitionType}</p>
                            </div>
                            {activeStepId === step.id && (
                               <button onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }} className="p-2 text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'Branding' && (
               <div className="p-8 space-y-12 pb-32 no-scrollbar">
                  {/* CATEGORY: OPTICAL CORE */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500"><Palette size={16}/></div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Optical Core</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-zinc-600 uppercase ml-1">Accent One</label>
                           <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                              <input type="color" value={manifest.branding.primaryColor} onChange={(e) => updateBranding('primaryColor', e.target.value)} className="w-6 h-6 bg-transparent rounded cursor-pointer" />
                              <span className="text-[10px] font-mono font-bold uppercase">{manifest.branding.primaryColor}</span>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-zinc-600 uppercase ml-1">Accent Two</label>
                           <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                              <input type="color" value={manifest.branding.secondaryColor} onChange={(e) => updateBranding('secondaryColor', e.target.value)} className="w-6 h-6 bg-transparent rounded cursor-pointer" />
                              <span className="text-[10px] font-mono font-bold uppercase">{manifest.branding.secondaryColor}</span>
                           </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                       <PremiumSlider label="Backdrop Brightness" value={manifest.branding.backdropBrightness * 100} min={0} max={100} unit="%" icon={SunMoon} onChange={(v: any) => updateBranding('backdropBrightness', v / 100)} />
                       <PremiumSlider label="Accent Glow Range" value={manifest.branding.accentGlowRange} min={0} max={100} unit="px" icon={Sparkles} onChange={(v: any) => updateBranding('accentGlowRange', v)} />
                       <PremiumSlider label="Hue Flux Speed" value={manifest.branding.hueRotateSpeed} min={0} max={60} unit="s" icon={RefreshCw} onChange={(v: any) => updateBranding('hueRotateSpeed', v)} />
                    </div>
                  </div>

                  {/* CATEGORY: SURFACES & CONTAINERS */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-500"><LayoutGrid size={16}/></div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Surfaces & Architecture</p>
                    </div>
                    <div className="space-y-3">
                        <PremiumSlider label="Canvas Radius" value={manifest.branding.borderRadius} min={0} max={80} unit="px" icon={Box} onChange={(v: any) => updateBranding('borderRadius', v)} />
                        <PremiumSlider label="Card Inner Padding" value={manifest.branding.cardPadding} min={12} max={120} unit="px" icon={Move} onChange={(v: any) => updateBranding('cardPadding', v)} />
                        <PremiumSlider label="Glass Opacity" value={manifest.branding.glassOpacity * 100} min={0} max={100} unit="%" icon={Layers2} onChange={(v: any) => updateBranding('glassOpacity', v / 100)} />
                        <PremiumSlider label="Glass Distortion" value={manifest.branding.blurStrength} min={0} max={64} unit="px" icon={Ghost} onChange={(v: any) => updateBranding('blurStrength', v)} />
                        <PremiumSlider label="Border Depth" value={manifest.branding.cardBorderWidth} min={0} max={8} unit="px" icon={Braces} onChange={(v: any) => updateBranding('cardBorderWidth', v)} />
                        <PremiumSlider label="Shadow Diffusion" value={manifest.branding.cardShadowIntensity} min={0} max={100} unit="pt" icon={Cloud} onChange={(v: any) => updateBranding('cardShadowIntensity', v)} />
                        
                        {/* Corrected Layout for Gutter and Stack Spacing */}
                        <div className="space-y-3">
                           <PremiumSlider label="Gutter Width" value={manifest.branding.containerMaxWidth} min={400} max={1200} unit="px" icon={MoveHorizontal} onChange={(v: any) => updateBranding('containerMaxWidth', v)} />
                           <PremiumSlider label="Stack Spacing" value={manifest.branding.containerPadding} min={0} max={100} unit="px" icon={MoveVertical} onChange={(v: any) => updateBranding('containerPadding', v)} />
                        </div>
                    </div>
                  </div>

                  {/* CATEGORY: TYPOGRAPHY SCALING */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-500"><Type size={16}/></div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Typography Scaling</p>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-zinc-600 uppercase ml-1">Typeface Family</label>
                           <select 
                             value={manifest.branding.fontFamily}
                             onChange={(e) => updateBranding('fontFamily', e.target.value)}
                             className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-600"
                           >
                             {['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Playfair Display'].map(f => <option key={f}>{f}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                            <PremiumSlider label="Base Text Size" value={manifest.branding.baseTextSize} min={12} max={24} unit="px" icon={Type} onChange={(v: any) => updateBranding('baseTextSize', v)} />
                            <PremiumSlider label="Title Lettering" value={manifest.branding.headingLetterSpacing} min={-0.2} max={1} step={0.01} unit="em" icon={MoveHorizontal} onChange={(v: any) => updateBranding('headingLetterSpacing', v)} />
                            <PremiumSlider label="Body Line Spacing" value={manifest.branding.bodyLineHeight} min={1} max={2.5} step={0.1} unit="x" icon={AlignJustify} onChange={(v: any) => updateBranding('bodyLineHeight', v)} />
                            <PremiumSlider label="Title Line Spacing" value={manifest.branding.headingLineHeight} min={0.8} max={1.5} step={0.05} unit="x" icon={AlignJustify} onChange={(v: any) => updateBranding('headingLineHeight', v)} />
                        </div>
                        <div className="flex justify-between items-center p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                           <span className="text-[9px] font-bold text-zinc-500 uppercase">Text Align</span>
                           <div className="flex gap-1 bg-black p-1 rounded-lg">
                              {(['left', 'center', 'right'] as const).map(a => (
                                 <button key={a} onClick={() => updateBranding('contentAlign', a)} className={`p-1.5 rounded ${manifest.branding.contentAlign === a ? 'bg-zinc-700 text-white' : 'text-zinc-600'}`}>
                                    {a === 'left' ? <AlignLeft size={12}/> : a === 'center' ? <AlignCenter size={12}/> : <AlignRight size={12}/>}
                                 </button>
                              ))}
                           </div>
                        </div>
                    </div>
                  </div>

                  {/* CATEGORY: ACTION DYNAMICS */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500"><MousePointer2 size={16}/></div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Action Dynamics</p>
                    </div>
                    <div className="space-y-3">
                        <PremiumSlider label="Action Curvature" value={manifest.branding.buttonBorderRadius} min={0} max={50} unit="px" icon={Box} onChange={(v: any) => updateBranding('buttonBorderRadius', v)} />
                        <PremiumSlider label="Action Hover Scale" value={manifest.branding.buttonHoverScale} min={1} max={1.2} step={0.01} unit="x" icon={Maximize2} onChange={(v: any) => updateBranding('buttonHoverScale', v)} />
                        <PremiumSlider label="Action Shadow Pct" value={manifest.branding.buttonShadowOpacity * 100} min={0} max={100} unit="%" icon={Cloud} onChange={(v: any) => updateBranding('buttonShadowOpacity', v / 100)} />
                        <PremiumSlider label="Action Letter Spacing" value={manifest.branding.buttonLetterSpacing} min={0} max={1} step={0.05} unit="em" icon={MoveHorizontal} onChange={(v: any) => updateBranding('buttonLetterSpacing', v)} />
                        <TacticalToggle label="Action Gradient" sub="Multi-tone surfacing" active={manifest.branding.buttonGradient} onToggle={() => updateBranding('buttonGradient', !manifest.branding.buttonGradient)} icon={Palette} />
                        <TacticalToggle label="Action Pulsing" sub="Engaging focus state" active={manifest.branding.buttonGlow} onToggle={() => updateBranding('buttonGlow', !manifest.branding.buttonGlow)} icon={Zap} />
                    </div>
                  </div>

                  {/* CATEGORY: NAVIGATION OPTICS */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-500"><Target size={16}/></div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Navigation Optics</p>
                    </div>
                    <div className="space-y-3">
                        <PremiumSlider label="Active Step Weight" value={manifest.branding.stepIndicatorSize} min={2} max={16} unit="px" icon={Aperture} onChange={(v: any) => updateBranding('stepIndicatorSize', v)} />
                        <PremiumSlider label="Node Separation" value={manifest.branding.stepIndicatorGap} min={4} max={32} unit="px" icon={MoveHorizontal} onChange={(v: any) => updateBranding('stepIndicatorGap', v)} />
                        <PremiumSlider label="Progress Velocity" value={manifest.branding.progressHeight} min={1} max={12} unit="px" icon={MoveVertical} onChange={(v: any) => updateBranding('progressHeight', v)} />
                        <PremiumSlider label="Progress Glow" value={manifest.branding.progressGlow} min={0} max={100} unit="px" icon={Sparkles} onChange={(v: any) => updateBranding('progressGlow', v)} />
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'VFX' && (
               <div className="p-8 space-y-12 pb-32 no-scrollbar">
                  {/* ATMOSPHERIC OPTICS */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500"><Aperture size={16}/></div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Atmospheric Optics</p>
                    </div>
                    <div className="space-y-3">
                        <PremiumSlider label="Scanline CRT" value={manifest.branding.scanlineOpacity * 100} min={0} max={20} unit="%" icon={Radio} onChange={(v: any) => updateBranding('scanlineOpacity', v / 100)} />
                        <PremiumSlider label="CRT Velocity" value={manifest.branding.scanlineSpeed} min={0} max={2} step={0.1} unit="x" icon={Wind} onChange={(v: any) => updateBranding('scanlineSpeed', v)} />
                        <PremiumSlider label="Pixel Grain" value={manifest.branding.noiseOpacity * 100} min={0} max={60} unit="%" icon={Zap} onChange={(v: any) => updateBranding('noiseOpacity', v / 100)} />
                        <PremiumSlider label="Grain Dynamics" value={manifest.branding.noiseSpeed} min={0} max={1} step={0.05} unit="s" icon={RefreshCw} onChange={(v: any) => updateBranding('noiseSpeed', v)} />
                        <PremiumSlider label="Vignette Depth" value={manifest.branding.vignetteStrength * 100} min={0} max={100} unit="%" icon={Move} onChange={(v: any) => updateBranding('vignetteStrength', v / 100)} />
                    </div>
                  </div>

                  {/* NEURAL MESH */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-500"><Workflow size={16}/></div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Neural Backdrop</p>
                    </div>
                    <div className="space-y-3">
                        <PremiumSlider label="Mesh Oscillation" value={manifest.branding.meshSpeed} min={1} max={60} unit="s" icon={Waves} onChange={(v: any) => updateBranding('meshSpeed', v)} />
                        <PremiumSlider label="Blur Diffusion" value={manifest.branding.meshBlur} min={50} max={400} unit="px" icon={Ghost} onChange={(v: any) => updateBranding('meshBlur', v)} />
                        <PremiumSlider label="Chromatic Split" value={manifest.branding.chromaticStrength} min={0} max={10} step={0.5} unit="px" icon={Layers2} onChange={(v: any) => updateBranding('chromaticStrength', v)} />
                        <PremiumSlider label="Prismatic Cycle" value={manifest.branding.hueRotateSpeed} min={0} max={60} unit="s" icon={Sun} onChange={(v: any) => updateBranding('hueRotateSpeed', v)} />
                        <PremiumSlider label="Parallax Depth" value={manifest.branding.parallaxIntensity} min={0} max={200} unit="pt" icon={Database} onChange={(v: any) => updateBranding('parallaxIntensity', v)} />
                    </div>
                  </div>

                  {/* QUANTUM PARTICLES */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-500"><Cpu size={16}/></div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">Quantum Physics</p>
                    </div>
                    <div className="space-y-3">
                        <PremiumSlider label="Population" value={manifest.branding.particleDensity} min={0} max={150} icon={Users} onChange={(v: any) => updateBranding('particleDensity', v)} />
                        <PremiumSlider label="Excitation" value={manifest.branding.particleSpeed} min={0.1} max={5} step={0.1} unit="x" icon={Zap} onChange={(v: any) => updateBranding('particleSpeed', v)} />
                        <PremiumSlider label="Atomic Mass" value={manifest.branding.particleSize} min={1} max={10} unit="px" icon={Box} onChange={(v: any) => updateBranding('particleSize', v)} />
                        <PremiumSlider label="Transparency" value={manifest.branding.particleOpacity * 100} min={0} max={100} unit="%" icon={Eye} onChange={(v: any) => updateBranding('particleOpacity', v / 100)} />
                        <PremiumSlider label="Pulse Frequency" value={manifest.branding.particlePulse} min={0} max={10} step={0.1} unit="Hz" icon={Activity} onChange={(v: any) => updateBranding('particlePulse', v)} />
                    </div>
                  </div>
               </div>
            )}
         </div>

         {/* Main Editor */}
         <div className="flex-1 bg-black overflow-y-auto p-12 no-scrollbar">
            <div className="max-w-5xl mx-auto space-y-12">
               
               <div className="p-10 bg-zinc-900/40 rounded-[3rem] border border-zinc-800 shadow-2xl space-y-12">
                  <div className="flex justify-between items-start">
                     <div className="flex-1">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4 block">ACTIVE PHASE CONFIG</span>
                        <input 
                           value={activeStep.title} 
                           onChange={(e) => updateStep(activeStepId, { title: e.target.value })}
                           className="text-5xl font-black text-white bg-transparent outline-none border-b border-transparent focus:border-zinc-800 transition-all w-full placeholder:text-zinc-800"
                           placeholder="Enter Stage Title..."
                        />
                     </div>
                     <div className="p-5 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl"><Layers size={32} className="text-zinc-500"/></div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Phase Directive Type</label>
                        <DirectiveSelector 
                          value={activeStep.type} 
                          onChange={(val) => updateStep(activeStepId, { type: val, config: {} })} 
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Transition Protocol Family</label>
                        <TransitionSelector 
                          value={activeStep.transitionType || 'Slide'} 
                          onChange={(val) => updateStep(activeStepId, { transitionType: val })} 
                        />
                     </div>
                  </div>

                  <div className="h-px bg-zinc-800" />

                  <div className="animate-in fade-in duration-500">
                    <div className="flex items-center gap-3 mb-8">
                       <SlidersHorizontal size={18} className="text-blue-500" />
                       <h3 className="text-lg font-black text-white uppercase tracking-widest">Logic & Behavioral Logic</h3>
                    </div>
                    <RenderDirectiveConfig />
                  </div>
               </div>

            </div>
         </div>
      </div>
    </div>
  );
};

export default OnboardingBuilder;
