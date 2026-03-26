
import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Layout, Type, Save, ArrowLeft, Monitor, Smartphone, 
  Check, X, Image as ImageIcon, SlidersHorizontal, Grid, AlignCenter,
  AlignLeft, AlignRight, Box, CreditCard, Layers, Eye, Upload,
  Plus, Trash2, GripVertical, Link as LinkIcon, Instagram, Twitter, Linkedin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicStore, { DEFAULT_STORE_CONFIG } from './PublicStore';
import { StoreConfig } from '../types';
import { useStore } from '../hooks/useStore.ts';

// --- Helper Components (Same as before) ---
const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="flex items-center gap-2 mb-4 px-1">
     <Icon size={14} className="text-blue-500" />
     <span className="text-xs font-bold text-white uppercase tracking-widest">{title}</span>
  </div>
);

const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="space-y-2">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
          <input 
              type="color" 
              value={value} 
              onChange={(e) => onChange(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
          />
          <input 
              type="text" 
              value={value} 
              onChange={(e) => onChange(e.target.value)}
              className="bg-transparent text-xs font-mono text-zinc-300 outline-none w-full uppercase"
          />
      </div>
  </div>
);

const PremiumSlider = ({ label, value, min, max, step = 1, onChange, unit = "" }: any) => (
  <div className="space-y-3 p-4 bg-zinc-900/40 border border-white/5 rounded-3xl hover:bg-zinc-900/60 transition-colors group">
    <div className="flex justify-between items-center px-1">
      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{label}</label>
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

const PremiumToggle = ({ label, active, onToggle }: any) => (
  <div 
     onClick={onToggle}
     className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${active ? 'bg-blue-600/10 border-blue-600/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
  >
     <span className={`text-xs font-bold ${active ? 'text-white' : 'text-zinc-400'}`}>{label}</span>
     <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-zinc-800'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-md ${active ? 'left-6' : 'left-1'}`} />
     </div>
  </div>
);

const PremiumDropdown = ({ value, options, onChange, label }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="space-y-2 relative">
             {label && <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>}
             <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none flex justify-between items-center hover:border-zinc-700 transition-all"
             >
                 {value}
                 <Check size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
             </button>
             {isOpen && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden p-1 animate-in zoom-in-95">
                     {options.map((opt: string) => (
                         <button 
                            key={opt}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${value === opt ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                         >
                             {opt}
                         </button>
                     ))}
                 </div>
             )}
        </div>
    );
};

const DraggableBox = ({ children }: { children?: React.ReactNode }) => {
    const [position, setPosition] = useState({ x: 0, y: 30 });
    const [isDragging, setIsDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - offset.current.x,
                y: e.clientY - offset.current.y
            });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div 
            className="absolute z-[1000] cursor-grab active:cursor-grabbing"
            style={{ 
                top: 0, 
                left: '50%',
                transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)` 
            }}
            onMouseDown={handleMouseDown}
        >
            {children}
        </div>
    );
};

const StoreEditor: React.FC = () => {
  const navigate = useNavigate();
  // Use hook
  const { config, saveConfig, loading } = useStore();
  const [localConfig, setLocalConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);

  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'Theme' | 'Hero' | 'Catalog' | 'Content'>('Theme');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const updateConfig = (key: keyof StoreConfig, value: any) => {
      setLocalConfig(prev => ({ ...prev, [key]: value }));
  };
  
  const updateSocialLink = (platform: 'twitter' | 'instagram' | 'linkedin', value: string) => {
      setLocalConfig(prev => ({
          ...prev,
          socialLinks: {
              ...prev.socialLinks,
              [platform]: value
          }
      }));
  };

  const handleSave = async () => {
      setIsSaving(true);
      await saveConfig(localConfig);
      setIsSaving(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: keyof StoreConfig) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
           updateConfig(key, reader.result as string);
        };
        reader.readAsDataURL(file);
     }
  };

  // Footer Link Handlers
  const addFooterLink = () => {
    updateConfig('footerLinks', [...(localConfig.footerLinks || []), { label: 'New Link', url: '#' }]);
  };
  
  const updateFooterLink = (idx: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...(localConfig.footerLinks || [])];
    newLinks[idx] = { ...newLinks[idx], [field]: value };
    updateConfig('footerLinks', newLinks);
  };
  
  const removeFooterLink = (idx: number) => {
    updateConfig('footerLinks', (localConfig.footerLinks || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="flex h-screen bg-[#000000] text-white overflow-hidden font-sans">
        
        {/* Editor Sidebar */}
        <div className="w-80 border-r border-zinc-800 bg-[#050505] flex flex-col shrink-0 z-30 shadow-2xl">
            <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0 gap-3 bg-[#09090b]">
                <button onClick={() => navigate('/services')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
                <h2 className="font-black text-xs uppercase tracking-widest text-white">Store Designer</h2>
            </div>
            
            {/* Tab Navigation */}
            <div className="p-2 grid grid-cols-4 gap-1 border-b border-zinc-800 bg-zinc-900/30">
                {[
                   { id: 'Theme', icon: Palette }, 
                   { id: 'Hero', icon: Layout }, 
                   { id: 'Catalog', icon: Grid }, 
                   { id: 'Content', icon: Type }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all gap-1 ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <tab.icon size={16} />
                        <span className="text-[9px] font-black uppercase tracking-wider">{tab.id}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* ... (Existing Tab Content Logic with localConfig) ... */}
                {/* THEME TAB */}
                {activeTab === 'Theme' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                        <SectionHeader title="Colors" icon={Palette} />
                        <div className="space-y-4">
                           <ColorInput label="Primary Brand" value={localConfig.primaryColor} onChange={v => updateConfig('primaryColor', v)} />
                           <ColorInput label="Secondary Accent" value={localConfig.secondaryColor} onChange={v => updateConfig('secondaryColor', v)} />
                           <ColorInput label="Background Base" value={localConfig.backgroundColor} onChange={v => updateConfig('backgroundColor', v)} />
                           <ColorInput label="Card Surface" value={localConfig.cardBackgroundColor} onChange={v => updateConfig('cardBackgroundColor', v)} />
                           <ColorInput label="Text Main" value={localConfig.textColor} onChange={v => updateConfig('textColor', v)} />
                        </div>

                        <SectionHeader title="Typography & Shape" icon={Type} />
                        <div className="space-y-6">
                           <PremiumDropdown 
                             label="Font Family"
                             value={localConfig.fontFamily}
                             options={['Inter', 'Roboto', 'Playfair Display', 'Space Grotesk', 'DM Sans']}
                             onChange={(v: string) => updateConfig('fontFamily', v)}
                           />
                           <PremiumSlider label="Corner Radius" value={localConfig.radius} min={0} max={40} onChange={(v: number) => updateConfig('radius', v)} unit="px" />
                        </div>
                    </div>
                )}
                {/* HERO TAB */}
                {activeTab === 'Hero' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                         <SectionHeader title="Layout Structure" icon={Layout} />
                         <div className="grid grid-cols-2 gap-3">
                             {['Center', 'Split Left', 'Split Right', 'Minimal'].map(l => (
                                <button 
                                  key={l} 
                                  onClick={() => updateConfig('heroLayout', l)}
                                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${localConfig.heroLayout === l ? 'border-blue-600 bg-blue-600/10 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600'}`}
                                >
                                   {l === 'Center' && <AlignCenter size={16} />}
                                   {l === 'Split Left' && <AlignLeft size={16} />}
                                   {l === 'Split Right' && <AlignRight size={16} />}
                                   {l === 'Minimal' && <Box size={16} />}
                                   <span className="text-[9px] font-black uppercase tracking-wider">{l}</span>
                                </button>
                             ))}
                         </div>

                         <div className="space-y-4 pt-4 border-t border-zinc-800">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Headline</label>
                                <textarea 
                                    value={localConfig.heroHeadline}
                                    onChange={e => updateConfig('heroHeadline', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600 min-h-[80px]"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Subheadline</label>
                                <textarea 
                                    value={localConfig.heroSubheadline}
                                    onChange={e => updateConfig('heroSubheadline', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 outline-none focus:border-blue-600 min-h-[80px]"
                                />
                             </div>
                         </div>

                         <div className="space-y-2 pt-4 border-t border-zinc-800">
                             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Hero Image</label>
                             <div className="relative group cursor-pointer">
                                <input type="file" className="hidden" id="hero-upload" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImage')} />
                                <label htmlFor="hero-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 rounded-xl hover:bg-zinc-900 hover:border-zinc-600 transition-all cursor-pointer relative overflow-hidden">
                                   {localConfig.heroImage ? (
                                      <img src={localConfig.heroImage} className="w-full h-full object-cover opacity-50" />
                                   ) : (
                                      <ImageIcon size={24} className="text-zinc-600 mb-2" />
                                   )}
                                   <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">Upload Image</span>
                                   </div>
                                </label>
                             </div>
                         </div>
                    </div>
                )}
                {/* CATALOG TAB */}
                {activeTab === 'Catalog' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                         <SectionHeader title="Grid Display" icon={Grid} />
                         <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Columns</label>
                                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                                    {[1, 2, 3, 4].map(c => (
                                        <button 
                                          key={c}
                                          onClick={() => updateConfig('gridColumns', c)}
                                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${localConfig.gridColumns === c ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                           {c}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             <PremiumDropdown 
                                label="Card Style"
                                value={localConfig.cardStyle}
                                options={['Glass', 'Bordered', 'Minimal']}
                                onChange={(v: string) => updateConfig('cardStyle', v)}
                             />
                         </div>

                         <div className="space-y-4 pt-4 border-t border-zinc-800">
                             <SectionHeader title="Visibility" icon={Eye} />
                             <PremiumToggle label="Show Ratings" active={localConfig.showRatings} onToggle={() => updateConfig('showRatings', !localConfig.showRatings)} />
                             <PremiumToggle label="Show Price" active={localConfig.showPrice} onToggle={() => updateConfig('showPrice', !localConfig.showPrice)} />
                         </div>
                    </div>
                )}
                {/* CONTENT TAB */}
                {activeTab === 'Content' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                         <SectionHeader title="Global Metadata" icon={Type} />
                         <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Store Name</label>
                                <input 
                                    value={localConfig.storeName}
                                    onChange={e => updateConfig('storeName', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600"
                                />
                             </div>
                             
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Logo Asset</label>
                                <div className="flex gap-2">
                                    <input 
                                        value={localConfig.logoUrl}
                                        onChange={e => updateConfig('logoUrl', e.target.value)}
                                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
                                        placeholder="https://..."
                                    />
                                    <label htmlFor="logo-upload" className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors">
                                        <Upload size={14} className="text-zinc-400"/>
                                        <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'logoUrl')} />
                                    </label>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Payment Gateway Link</label>
                                <div className="relative">
                                    <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                                    <input 
                                        value={localConfig.paymentGatewayUrl || ''}
                                        onChange={e => updateConfig('paymentGatewayUrl', e.target.value)}
                                        className="w-full pl-10 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-blue-600"
                                        placeholder="https://buy.stripe.com/..."
                                    />
                                </div>
                                <p className="text-[9px] text-zinc-600 ml-1">Direct link to your payment processor checkout page.</p>
                             </div>
                         </div>
                         
                         <SectionHeader title="About Page Config" icon={Type} />
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Section Title</label>
                                <input 
                                    value={localConfig.aboutTitle || ''}
                                    onChange={e => updateConfig('aboutTitle', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600"
                                    placeholder="e.g. Our Mission"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Headline</label>
                                <input 
                                    value={localConfig.aboutHeadline || ''}
                                    onChange={e => updateConfig('aboutHeadline', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600"
                                    placeholder="e.g. Elevating Brands"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Description</label>
                                <textarea 
                                    value={localConfig.aboutText || ''}
                                    onChange={e => updateConfig('aboutText', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-600 min-h-[100px]"
                                    placeholder="Tell your story..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Contact Email</label>
                                <input 
                                    value={localConfig.contactEmail || ''}
                                    onChange={e => updateConfig('contactEmail', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600"
                                    placeholder="hello@agency.com"
                                />
                            </div>
                         </div>
                         
                         <SectionHeader title="Contact Page Config" icon={Type} />
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Section Title</label>
                                <input 
                                    value={localConfig.contactTitle || ''}
                                    onChange={e => updateConfig('contactTitle', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600"
                                    placeholder="e.g. Contact Us"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Headline</label>
                                <input 
                                    value={localConfig.contactHeadline || ''}
                                    onChange={e => updateConfig('contactHeadline', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600"
                                    placeholder="e.g. Get in Touch"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Subheadline</label>
                                <textarea 
                                    value={localConfig.contactSubheadline || ''}
                                    onChange={e => updateConfig('contactSubheadline', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-600 min-h-[80px]"
                                    placeholder="Subtitle text..."
                                />
                            </div>
                         </div>

                         <SectionHeader title="Social Connect" icon={Grid} />
                         <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Twitter size={12}/> Twitter URL</label>
                                <input 
                                    value={localConfig.socialLinks?.twitter || ''}
                                    onChange={e => updateSocialLink('twitter', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600"
                                    placeholder="https://twitter.com/..."
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Instagram size={12}/> Instagram URL</label>
                                <input 
                                    value={localConfig.socialLinks?.instagram || ''}
                                    onChange={e => updateSocialLink('instagram', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600"
                                    placeholder="https://instagram.com/..."
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Linkedin size={12}/> LinkedIn URL</label>
                                <input 
                                    value={localConfig.socialLinks?.linkedin || ''}
                                    onChange={e => updateSocialLink('linkedin', e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600"
                                    placeholder="https://linkedin.com/in/..."
                                />
                             </div>
                         </div>

                         <SectionHeader title="Footer Navigation" icon={Grid} />
                         <div className="space-y-4">
                            {(localConfig.footerLinks || []).map((link, i) => (
                                <div key={i} className="flex gap-2">
                                    <input 
                                        value={link.label}
                                        onChange={e => updateFooterLink(i, 'label', e.target.value)}
                                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-600"
                                        placeholder="Label"
                                    />
                                    <input 
                                        value={link.url}
                                        onChange={e => updateFooterLink(i, 'url', e.target.value)}
                                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-600"
                                        placeholder="URL"
                                    />
                                    <button onClick={() => removeFooterLink(i)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-rose-500"><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <button onClick={addFooterLink} className="w-full py-3 border-2 border-dashed border-zinc-800 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:border-zinc-700 transition-all">+ Add Link</button>
                         </div>
                    </div>
                )}
            </div>

            {/* Save Action */}
            <div className="p-6 border-t border-zinc-800 bg-[#0c0c0e]">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? 'Syncing...' : 'Publish Changes'} <Save size={14} />
                </button>
            </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col relative bg-[#18181b] min-w-0">
            {/* Draggable Viewport Controls */}
            <DraggableBox>
                <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 shadow-2xl cursor-grab active:cursor-grabbing">
                     <div className="p-2 text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-400">
                        <GripVertical size={14} />
                     </div>
                     <button onClick={() => setViewport('desktop')} className={`p-2.5 rounded-xl transition-all ${viewport === 'desktop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}><Monitor size={16}/></button>
                     <button onClick={() => setViewport('mobile')} className={`p-2.5 rounded-xl transition-all ${viewport === 'mobile' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}><Smartphone size={16}/></button>
                     <div className="w-px h-4 bg-zinc-700 mx-1" />
                     <a href="/#/store" target="_blank" className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors flex items-center gap-2" title="Open Live Site">Live View</a>
                </div>
            </DraggableBox>

            <div className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-[#050505]">
                <div 
                    className={`transition-all duration-500 ease-in-out shadow-2xl relative overflow-hidden bg-black ${viewport === 'mobile' ? 'w-[375px] h-[720px] rounded-[3rem] border-[12px] border-zinc-900' : 'w-full h-full rounded-3xl border border-zinc-800'}`}
                >
                    <div className="w-full h-full overflow-y-auto no-scrollbar relative">
                        <PublicStore previewConfig={localConfig} />
                    </div>
                </div>
            </div>
        </div>

    </div>
  );
};

export default StoreEditor;
