import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, Shield, User, Bell, Globe, Save, 
  Moon, Sun, ShieldCheck, CheckCircle2, Monitor, Zap, Eye,
  Layout, Cpu, Briefcase, Calculator, LifeBuoy, BellRing,
  Lock, RefreshCw, Palette, CreditCard, PieChart, Volume2,
  Trash2, Terminal, Target, History, Clock, Percent, Mail,
  Smartphone, Database, AlertTriangle, ChevronDown, Check, Loader2
} from 'lucide-react';
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings';

// Reusable Custom Dropdown Component
const CustomDropdown = ({ 
  value, 
  options, 
  onChange, 
  placeholder, 
  icon: Icon, 
  className = "",
  renderOption
}: {
  value: any;
  options: any[];
  onChange: (val: any) => void;
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

  const selectedOption = options.find(o => (typeof o === 'object' ? o.value : o) === value);
  const displayValue = selectedOption ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : value;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-7 py-5 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white hover:border-blue-500/50 transition-all focus:ring-4 focus:ring-blue-500/10 outline-none"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-slate-400 dark:text-zinc-500" />}
          <span className="truncate">{displayValue || placeholder}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-2 animate-in zoom-in-95 duration-200">
          {options.map((opt, idx) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            const isSelected = value === val;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => { onChange(val); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between mb-1 last:mb-0 ${
                  isSelected 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                   {renderOption ? renderOption(opt) : label}
                </div>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Settings: React.FC = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [config, setConfig] = useState(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);
  const [localTemp, setLocalTemp] = useState(DEFAULT_SETTINGS.aiTemperature);

  // Sync state when data arrives from backend
  useEffect(() => {
    if (settings) {
      setConfig(settings);
      setLocalTemp(settings.aiTemperature);
      
      // Apply immediate visual effects
      if (settings.theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      
      document.documentElement.setAttribute('data-accent', settings.accentColor);
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdate = async (key: string, value: any) => {
    // Handle special feedback requests
    if (key === 'browserNotifs' && value === true) {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          showToast("Notification permission denied by browser");
          return;
        }
      }
    }

    const newConfig = { ...config, [key]: value };
    setConfig(newConfig); // Optimistic UI update
    
    // Instant Visual Feedback
    if (key === 'theme') {
      if (value === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    if (key === 'accentColor') {
      document.documentElement.setAttribute('data-accent', value);
    }

    // Play subtle feedback sound if enabled
    if (newConfig.systemSounds && (typeof value === 'boolean')) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(value ? 660 : 440, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (e) {
        console.error("Audio feedback failed", e);
      }
    }

    // Save to backend
    await updateSettings(newConfig);
  };

  const SectionHeader = ({ icon: Icon, title, desc, color }: any) => (
    <div className="flex items-center space-x-6 mb-10 group">
      <div className={`p-5 rounded-[1.75rem] shadow-inner transition-all group-hover:rotate-6 ${color}`}>
        <Icon size={32} />
      </div>
      <div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-1">{desc}</p>
      </div>
    </div>
  );

  const Toggle = ({ active, onToggle, label, sub }: any) => (
    <div 
      onClick={onToggle}
      className="flex items-center justify-between p-6 bg-slate-50 dark:bg-black/40 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800/50 transition-all group/toggle cursor-pointer select-none"
    >
      <div className="pr-4">
        <p className="text-sm font-black text-slate-900 dark:text-zinc-100">{label}</p>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase mt-0.5">{sub}</p>
      </div>
      <div 
        className={`w-12 h-7 rounded-full relative transition-colors duration-300 shrink-0 ${
          active 
            ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
            : 'bg-slate-200 dark:bg-zinc-800'
        }`}
      >
        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 cubic-bezier(0.2, 0.8, 0.2, 1) ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </div>
    </div>
  );

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#09090b]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-40 transition-colors">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[11000] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2.5rem] font-black text-sm shadow-2xl flex items-center gap-4 border border-white/10 dark:border-white/5 animate-in slide-in-from-top-4">
          <ShieldCheck size={20} className="text-emerald-400" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">System Control</h2>
          <p className="text-slate-500 dark:text-zinc-500 font-medium text-lg">Central nervous system for global agency protocols. Preferences are synchronized in real-time to the cloud.</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 px-6 py-4 rounded-[1.5rem] border border-blue-100 dark:border-blue-900/30">
          <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Cloud Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-lg">
          <SectionHeader icon={User} title="Agency Identity" desc="Primary Entity Manifest" color="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" />
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Authorized Agency Name</label>
              <input type="text" className="w-full px-7 py-5 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl outline-none focus:border-blue-500 dark:focus:border-blue-600 transition-all font-bold text-sm text-slate-900 dark:text-white" value={config.agencyName} onChange={(e) => handleUpdate('agencyName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Legal Business Entity</label>
              <input type="text" className="w-full px-7 py-5 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl outline-none focus:border-blue-500 dark:focus:border-blue-600 transition-all font-bold text-sm text-slate-900 dark:text-white" value={config.agencyLegalName} onChange={(e) => handleUpdate('agencyLegalName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Primary Command Domain</label>
              <input type="text" className="w-full px-7 py-5 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl outline-none focus:border-blue-500 dark:focus:border-blue-600 transition-all font-bold text-sm text-slate-900 dark:text-white" value={config.agencyDomain} onChange={(e) => handleUpdate('agencyDomain', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-lg">
          <SectionHeader icon={Palette} title="Optics & Interface" desc="Visual Spectrum Calibration" color="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" />
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Primary Accent</label>
                  <CustomDropdown 
                    value={config.accentColor}
                    options={[
                        { value: 'blue', label: 'Cyber Blue' },
                        { value: 'indigo', label: 'Deep Indigo' },
                        { value: 'rose', label: 'Neon Rose' },
                        { value: 'emerald', label: 'Ghost Emerald' },
                    ]}
                    onChange={(val) => handleUpdate('accentColor', val)}
                    className="z-50"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Interface Density</label>
                  <CustomDropdown 
                    value={config.uiDensity}
                    options={[
                        { value: 'comfortable', label: 'Comfortable' },
                        { value: 'compact', label: 'Tactical (Compact)' },
                    ]}
                    onChange={(val) => handleUpdate('uiDensity', val)}
                    className="z-40"
                  />
               </div>
            </div>
            <Toggle label="Sidebar Persistence" sub="Keep navigation expanded by default" active={config.sidebarState === 'expanded'} onToggle={() => handleUpdate('sidebarState', config.sidebarState === 'expanded' ? 'collapsed' : 'expanded')} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-lg">
          <SectionHeader icon={Layout} title="Command Matrix" desc="Dashboard Modular Visibility" color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Toggle label="Revenue Trends" sub="Financial monetary analytics" active={config.showRevenue} onToggle={() => handleUpdate('showRevenue', !config.showRevenue)} />
              <Toggle label="Task Queue" sub="Live mission backlog" active={config.showTasks} onToggle={() => handleUpdate('showTasks', !config.showTasks)} />
              <Toggle label="Audit Stream" sub="Recent system activity" active={config.showActivity} onToggle={() => handleUpdate('showActivity', !config.showActivity)} />
              <Toggle label="Fiscal Summary" sub="Pending invoice overview" active={config.showInvoices} onToggle={() => handleUpdate('showInvoices', !config.showInvoices)} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Analytic Chart Style</label>
              <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-2xl gap-1.5 border dark:border-zinc-800 shadow-inner">
                {['area', 'bar', 'line'].map(style => (
                  <button key={style} onClick={() => handleUpdate('chartStyle', style)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${config.chartStyle === style ? 'bg-blue-600 text-white shadow-primary' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'}`}>{style}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-lg">
          <SectionHeader icon={Cpu} title="Neural Intelligence" desc="AI Uplink Calibration" color="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" />
          <div className="space-y-8">
            <div className="space-y-6">
               <div className="flex justify-between items-end ml-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Neural Temperature</label>
                    <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-tighter">Calibration of creative variance and randomness</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-purple-600 tabular-nums">{Math.round(localTemp * 100)}%</span>
                    <span className="text-[8px] font-bold text-purple-400/50 uppercase tracking-widest">Uplink Signal</span>
                  </div>
               </div>
               
               <div className="relative px-6 py-10 bg-black/20 dark:bg-black/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl group overflow-hidden">
                  {/* Background Track Decor */}
                  <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none" />
                  
                  <div className="relative h-12 flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={localTemp} 
                      onInput={(e: any) => setLocalTemp(parseFloat(e.target.value))}
                      onChange={(e) => handleUpdate('aiTemperature', parseFloat(e.target.value))} 
                      className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer relative z-20 
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-6 
                        [&::-webkit-slider-thumb]:h-6 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-white 
                        [&::-webkit-slider-thumb]:border-[3px] 
                        [&::-webkit-slider-thumb]:border-purple-600 
                        [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(147,51,234,0.5),0_5px_10px_rgba(0,0,0,0.3)]
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:active:scale-110
                        [&::-moz-range-thumb]:w-6 
                        [&::-moz-range-thumb]:h-6 
                        [&::-moz-range-thumb]:rounded-full 
                        [&::-moz-range-thumb]:bg-white 
                        [&::-moz-range-thumb]:border-[3px] 
                        [&::-moz-range-thumb]:border-purple-600 
                        [&::-moz-range-thumb]:shadow-[0_0_15px_rgba(147,51,234,0.5)]
                        [&::-moz-range-thumb]:transition-transform
                        [&::-moz-range-thumb]:active:scale-110" 
                    />
                    
                    {/* Active Track Glow */}
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full pointer-events-none shadow-[0_0_20px_rgba(147,51,234,0.4)] z-10"
                      style={{ width: `${localTemp * 100}%` }}
                    />

                    {/* Track Background */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-slate-200 dark:bg-zinc-800 rounded-full z-0" />
                  </div>

                  {/* Scale Markers */}
                  <div className="flex justify-between mt-8 px-2 relative z-10">
                    <div className={`flex flex-col items-start gap-1.5 transition-all duration-300 ${localTemp < 0.25 ? 'scale-110' : 'opacity-40 grayscale'}`}>
                      <div className={`w-px h-3 mx-auto transition-colors ${localTemp < 0.25 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-zinc-700'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${localTemp < 0.25 ? 'text-purple-500' : 'text-zinc-500'}`}>Strategic</span>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">Precise</span>
                    </div>
                    
                    <div className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${localTemp >= 0.35 && localTemp <= 0.65 ? 'scale-110' : 'opacity-40 grayscale'}`}>
                      <div className={`w-px h-2 mx-auto transition-colors ${localTemp >= 0.35 && localTemp <= 0.65 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-zinc-800'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${localTemp >= 0.35 && localTemp <= 0.65 ? 'text-purple-500' : 'text-zinc-600'}`}>Balanced</span>
                    </div>
                    
                    <div className={`flex flex-col items-end gap-1.5 transition-all duration-300 ${localTemp > 0.75 ? 'scale-110' : 'opacity-40 grayscale'}`}>
                      <div className={`w-px h-3 mx-auto transition-colors ${localTemp > 0.75 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-zinc-700'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${localTemp > 0.75 ? 'text-purple-500' : 'text-zinc-500'}`}>Creative</span>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">Fluid</span>
                    </div>
                  </div>

                  {/* Neural Pulse Decor */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Uplink Default Mode</label>
                  <CustomDropdown 
                    value={config.aiDefaultMode}
                    options={['Strategic', 'Creative', 'Technical']}
                    onChange={(val) => handleUpdate('aiDefaultMode', val)}
                    className="z-30"
                  />
               </div>
               <div className="pt-2 space-y-4">
                 <Toggle label="Vision Engine" sub="Enable multimodal uploads" active={config.aiMultimodal} onToggle={() => handleUpdate('aiMultimodal', !config.aiMultimodal)} />
                 <Toggle label="Grounding" sub="Verified search results" active={config.aiGrounding} onToggle={() => handleUpdate('aiGrounding', !config.aiGrounding)} />
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-lg">
          <SectionHeader icon={Clock} title="Operations & Effort" desc="Production Log Protocols" color="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Default Task Priority</label>
                  <CustomDropdown 
                    value={config.defaultTaskPriority}
                    options={['Low', 'Medium', 'High']}
                    onChange={(val) => handleUpdate('defaultTaskPriority', val)}
                    className="z-30"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Default Task Type</label>
                  <CustomDropdown 
                    value={config.defaultTaskType}
                    options={['Operational', 'Strategic', 'Technical']}
                    onChange={(val) => handleUpdate('defaultTaskType', val)}
                    className="z-20"
                  />
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Logging Precision</label>
                <CustomDropdown 
                    value={config.timeIncrement}
                    options={[
                        { value: 5, label: '5 Minute Precision' },
                        { value: 15, label: '15 Minute Precision' },
                        { value: 30, label: '30 Minute Precision' },
                        { value: 60, label: '1 Hour Precision' }
                    ]}
                    onChange={(val) => handleUpdate('timeIncrement', val)}
                    className="z-10"
                />
              </div>
              <div className="pt-2">
                <Toggle label="Billable Logic" sub="Default entries as billable" active={config.defaultBillable} onToggle={() => handleUpdate('defaultBillable', !config.defaultBillable)} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-lg">
          <SectionHeader icon={Calculator} title="Fiscal Command" desc="Monetary Pipeline Configuration" color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Global Currency</label>
                  <CustomDropdown 
                    value={config.currency}
                    options={[
                        { value: 'USD', label: 'USD ($)' },
                        { value: 'EUR', label: 'EUR (€)' },
                        { value: 'GBP', label: 'GBP (£)' },
                        { value: 'JPY', label: 'JPY (¥)' },
                        { value: 'CAD', label: 'CAD ($)' },
                        { value: 'AUD', label: 'AUD (A$)' },
                        { value: 'CHF', label: 'CHF (CHF)' },
                        { value: 'CNY', label: 'CNY (¥)' },
                        { value: 'SEK', label: 'SEK (kr)' },
                        { value: 'NZD', label: 'NZD (NZ$)' },
                        { value: 'KRW', label: 'KRW (₩)' },
                        { value: 'SGD', label: 'SGD (S$)' },
                        { value: 'NOK', label: 'NOK (kr)' },
                        { value: 'MXN', label: 'MXN ($)' },
                        { value: 'INR', label: 'INR (₹)' },
                        { value: 'RUB', label: 'RUB (₽)' },
                        { value: 'ZAR', label: 'ZAR (R)' },
                        { value: 'TRY', label: 'TRY (₺)' },
                        { value: 'BRL', label: 'BRL (R$)' },
                        { value: 'HKD', label: 'HKD (HK$)' }
                    ]}
                    onChange={(val) => handleUpdate('currency', val)}
                    className="z-20"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Base Taxation (%)</label>
                  <input type="number" className="w-full px-7 py-5 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:border-blue-500" value={config.taxRate} onChange={(e) => handleUpdate('taxRate', parseInt(e.target.value))} />
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Invoice Prefix</label>
                  <input type="text" className="w-full px-7 py-5 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm dark:text-white" value={config.invoicePrefix} onChange={(e) => handleUpdate('invoicePrefix', e.target.value)} />
               </div>
               <div className="pt-2">
                 <Toggle label="Auto-Dispatch" sub="Dispatch invoice on creation" active={config.autoDispatchInvoices} onToggle={() => handleUpdate('autoDispatchInvoices', !config.autoDispatchInvoices)} />
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-lg">
          <SectionHeader icon={BellRing} title="System Feedback" desc="Event Notification Channels" color="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Toggle label="Audible SFX" active={config.systemSounds} onToggle={() => handleUpdate('systemSounds', !config.systemSounds)} sub="Audio triggers for events" />
            <Toggle label="Browser Alerts" active={config.browserNotifs} onToggle={() => handleUpdate('browserNotifs', !config.browserNotifs)} sub="Desktop push alerts" />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Fiscal Year Start</label>
              <CustomDropdown 
                value={config.fiscalYearStart}
                options={[
                    { value: '01', label: 'January' },
                    { value: '04', label: 'April' },
                    { value: '07', label: 'July' },
                    { value: '10', label: 'October' }
                ]}
                onChange={(val) => handleUpdate('fiscalYearStart', val)}
                className="z-10"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-[3.5rem] shadow-lg">
          <SectionHeader icon={Shield} title="Security Matrix" desc="Access Control Protocols" color="bg-zinc-900 text-white dark:bg-black dark:border-zinc-700 border shadow-md" />
          <div className="space-y-8">
            <Toggle label="Double Auth (MFA)" active={config.mfaEnabled} onToggle={() => handleUpdate('mfaEnabled', !config.mfaEnabled)} sub="Secondary hardware verification" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Terminal Timeout</label>
                <input type="number" className="w-full px-7 py-5 bg-slate-50 dark:bg-black border-2 border-slate-100 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:border-blue-500" value={config.sessionTimeout} onChange={(e) => handleUpdate('sessionTimeout', parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Audit Retention</label>
                <CustomDropdown 
                    value={config.dataRetentionDays}
                    options={[
                        { value: 30, label: '30 Days' },
                        { value: 90, label: '90 Days' },
                        { value: 365, label: '1 Year' },
                        { value: 0, label: 'Permanent' }
                    ]}
                    onChange={(val) => handleUpdate('dataRetentionDays', val)}
                    className="z-10"
                />
              </div>
            </div>
            <div className="p-8 bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-[2.5rem] flex items-center justify-between group shadow-sm">
               <div className="flex items-center gap-6">
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl text-rose-500 shadow-sm transition-transform group-hover:rotate-12"><Trash2 size={24}/></div>
                  <div>
                    <p className="text-sm font-black text-rose-600 dark:text-rose-400">Purge Memory</p>
                    <p className="text-[10px] text-rose-500/60 font-bold uppercase mt-0.5">Wipe all local datasets</p>
                  </div>
               </div>
               <button 
                onClick={() => { if(confirm("DANGER: Wiping all local data. Confirm?")) { localStorage.clear(); location.reload(); } }}
                className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95"
               >
                Execute Purge
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
