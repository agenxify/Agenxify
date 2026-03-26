
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, Check, Package, Clock, CreditCard, 
  Upload, HelpCircle, DollarSign, List, ShieldCheck, CheckCircle2,
  X, Image as ImageIcon, Sparkles, LayoutTemplate, Briefcase,
  Save, Eye, Globe, Settings, FileText, Layers, Target, PlayCircle,
  Plus, MoreHorizontal, Copy, Trash2, Smartphone, Monitor, Tag,
  BarChart, Search, Link as LinkIcon, Share2, Video, FileQuestion,
  CalendarDays, AlignLeft, MapPin, Hash, GripVertical, Rocket, RefreshCw,
  SearchCode, MousePointerClick, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
import { Service } from '../types';
import { MOCK_SERVICES } from '../constants';
import { useServices } from '../hooks/useServices.ts';
import { useCurrency } from '../context/CurrencyContext.tsx';

const { Link, useNavigate, useParams } = ReactRouterDom as any;

const EditService: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addService, updateService, getServiceById } = useServices();
  const { format } = useCurrency();

  // --- Types & Config ---
  const STEPS = [
    { id: 1, label: 'Identity', icon: Briefcase, desc: 'Name & Positioning' },
    { id: 2, label: 'Visuals', icon: ImageIcon, desc: 'Covers & Gallery' },
    { id: 3, label: 'Commercials', icon: DollarSign, desc: 'Pricing & Terms' },
    { id: 4, label: 'Workflow', icon: Layers, desc: 'Delivery Phases' },
    { id: 5, label: 'Intake', icon: FileQuestion, desc: 'Client Requirements' },
    { id: 6, label: 'Add-ons', icon: Plus, desc: 'Upsell Opportunities' },
    { id: 7, label: 'Publicity', icon: Globe, desc: 'SEO & Visibility' },
    { id: 8, label: 'Launch', icon: Rocket, desc: 'Final Review' }
  ];

  // --- State ---
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Deep Form State
  const [formData, setFormData] = useState<any>({
    id: '',
    name: '',
    tagline: '',
    description: '',
    category: 'Design',
    type: 'One-off',
    pricingType: 'Standard',
    price: 0,
    currency: 'USD',
    image: '',
    gallery: [],
    features: [''],
    phases: [{ title: 'Kickoff', duration: '2 Days', desc: 'Initial alignment.' }],
    intakeFields: [{ label: 'Project Goal', type: 'text', required: true }],
    addons: [], // { name, price, type }
    seoTitle: '',
    seoDesc: '',
    seoTags: [],
    status: 'Draft'
  });

  // --- Load Data ---
  useEffect(() => {
    const loadService = async () => {
        setIsLoading(true);
        if (id) {
            setIsEditMode(true);
            const found = await getServiceById(id);
            if (found) {
                // Ensure arrays exist in merged data
                setFormData(prev => ({ 
                    ...prev, 
                    ...found,
                    gallery: found.gallery || [],
                    features: found.features || [''],
                    phases: found.phases || [{ title: 'Kickoff', duration: '2 Days', desc: 'Initial alignment.' }],
                    intakeFields: found.intakeFields || [{ label: 'Project Goal', type: 'text', required: true }],
                    addons: found.addons || [],
                    seoTags: found.seoTags || []
                }));
            }
        } else {
            // Generate a new ID for drafts
            setFormData(prev => ({ ...prev, id: `s-${Date.now()}` }));
        }
        setIsLoading(false);
    };
    loadService();
  }, [id]);

  // --- Handlers ---
  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'gallery') => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'cover') {
                updateForm('image', reader.result);
            } else {
                updateForm('gallery', [...(formData.gallery || []), reader.result]);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (isEditMode) {
        await updateService(id, formData);
    } else {
        await addService(formData);
    }
    
    // Dispatch events for local updates in other components
    window.dispatchEvent(new Event('agencyos_config_updated'));
    navigate('/services'); // Redirect to main list
  };

  // Helper for List Managements
  const addListItem = (listKey: string, newItem: any) => {
      updateForm(listKey, [...(formData[listKey] || []), newItem]);
  };
  
  const removeListItem = (listKey: string, index: number) => {
      const newList = [...(formData[listKey] || [])];
      newList.splice(index, 1);
      updateForm(listKey, newList);
  };

  const updateListItem = (listKey: string, index: number, field: string | null, value: any) => {
      const newList = [...(formData[listKey] || [])];
      if (typeof newList[index] === 'string' && !field) {
          newList[index] = value; // Handle simple string arrays
      } else if (field) {
          newList[index] = { ...newList[index], [field]: value };
      }
      updateForm(listKey, newList);
  };

  // SEO Tag Handling
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const val = e.currentTarget.value.trim();
          if (val && !formData.seoTags.includes(val)) {
              updateForm('seoTags', [...formData.seoTags, val]);
              e.currentTarget.value = '';
          }
      }
  };

  const removeTag = (tagToRemove: string) => {
      updateForm('seoTags', formData.seoTags.filter((tag: string) => tag !== tagToRemove));
  };

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#09090b]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#09090b] text-white overflow-hidden">
      
      {/* Top Navigation Bar */}
      <div className="h-20 px-8 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between shrink-0 z-20">
         <div className="flex items-center gap-6">
            <button onClick={() => navigate('/services')} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors border border-transparent hover:border-zinc-700"><ArrowLeft size={20}/></button>
            <div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${isEditMode ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                        {isEditMode ? 'EDIT MODE' : 'CREATOR STUDIO'}
                    </span>
                    <span className="text-zinc-500 text-sm mx-1">/</span>
                    <h2 className="font-bold text-base text-white">{formData.name || 'Untitled Product'}</h2>
                </div>
            </div>
         </div>
         
         <div className="flex items-center gap-4">
            <div className="hidden xl:flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
               <button onClick={() => setViewport('desktop')} className={`p-2 rounded-lg transition-all ${viewport === 'desktop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Monitor size={18}/></button>
               <button onClick={() => setViewport('mobile')} className={`p-2 rounded-lg transition-all ${viewport === 'mobile' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Smartphone size={18}/></button>
            </div>
            <div className="h-8 w-px bg-zinc-800 mx-2 hidden md:block" />
            <button onClick={handleSave} className="px-6 py-3 text-zinc-400 hover:text-white text-xs font-bold transition-colors">Save Draft</button>
            <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2">
                <Check size={16} strokeWidth={3} /> {isEditMode ? 'Update Listing' : 'Publish Product'}
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* Vertical Stepper Sidebar */}
         <div className="w-72 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col overflow-y-auto no-scrollbar hidden md:flex">
            <div className="p-6 space-y-2">
                <p className="px-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Configuration</p>
                {STEPS.map((step, idx) => (
                    <button 
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden ${
                            currentStep === step.id 
                            ? 'bg-blue-600/10 border border-blue-600/20' 
                            : 'hover:bg-zinc-900 border border-transparent'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            currentStep === step.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 
                            step.id < currentStep ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300'
                        }`}>
                            {step.id < currentStep ? <Check size={20} /> : <step.icon size={20} />}
                        </div>
                        <div className="text-left">
                            <p className={`text-sm font-bold transition-colors ${currentStep === step.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{step.label}</p>
                            <p className="text-[10px] font-medium text-zinc-600 group-hover:text-zinc-500">{step.desc}</p>
                        </div>
                        {currentStep === step.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                    </button>
                ))}
            </div>
            
            <div className="mt-auto p-6 border-t border-zinc-800">
                <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Completion</span>
                        <span className="text-xs font-black text-white">{Math.round(((currentStep)/8)*100)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStep)/8)*100}%` }} />
                    </div>
                </div>
            </div>
         </div>

         {/* Main Form Area */}
         <div className="flex-1 flex overflow-hidden bg-[#09090b]">
            <div className="flex-1 overflow-y-auto p-8 md:p-16 scroll-smooth">
               <div className="max-w-3xl mx-auto pb-32">
                   
                   {/* STEP 1: IDENTITY */}
                   {currentStep === 1 && (
                       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                           <div>
                               <h1 className="text-4xl font-black text-white mb-2">Product Identity</h1>
                               <p className="text-zinc-400 text-lg">Define the core offering and positioning.</p>
                           </div>
                           
                           <div className="space-y-6">
                               <div className="space-y-2">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Internal SKU / ID</label>
                                   <input value={formData.id} disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 text-sm font-mono cursor-not-allowed" />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Service Name</label>
                                   <input 
                                     autoFocus
                                     value={formData.name} 
                                     onChange={e => updateForm('name', e.target.value)}
                                     className="w-full bg-transparent border-b-2 border-zinc-800 px-0 py-4 text-4xl font-black text-white focus:border-blue-600 transition-colors outline-none placeholder:text-zinc-800"
                                     placeholder="e.g. Enterprise Rebrand"
                                   />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tagline (Short Pitch)</label>
                                   <input 
                                     value={formData.tagline} 
                                     onChange={e => updateForm('tagline', e.target.value)}
                                     className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white text-lg font-medium outline-none focus:border-blue-600 transition-all placeholder:text-zinc-700 hover:bg-zinc-900/80 focus:bg-black"
                                     placeholder="The ultimate package for scaling brands..."
                                   />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Detailed Description</label>
                                   <textarea 
                                     value={formData.description} 
                                     onChange={e => updateForm('description', e.target.value)}
                                     className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-zinc-300 text-base leading-relaxed outline-none focus:border-blue-600 transition-all resize-none placeholder:text-zinc-700 hover:bg-zinc-900/80 focus:bg-black"
                                     placeholder="Describe the value proposition, deliverables, and benefits..."
                                   />
                               </div>
                               
                               <div className="grid grid-cols-2 gap-6">
                                   <div className="space-y-2">
                                       <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                                       <select 
                                           value={formData.category}
                                           onChange={e => updateForm('category', e.target.value)}
                                           className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white text-sm font-bold outline-none focus:border-blue-600 appearance-none cursor-pointer hover:bg-zinc-900/80"
                                       >
                                           {['Design', 'Development', 'Marketing', 'Strategy', 'Consulting', 'Maintenance'].map(c => <option key={c} value={c}>{c}</option>)}
                                       </select>
                                   </div>
                                   <div className="space-y-2">
                                       <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</label>
                                       <select 
                                           value={formData.status}
                                           onChange={e => updateForm('status', e.target.value)}
                                           className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white text-sm font-bold outline-none focus:border-blue-600 appearance-none cursor-pointer hover:bg-zinc-900/80"
                                       >
                                           {['Draft', 'Active', 'Archived', 'Private'].map(s => <option key={s} value={s}>{s}</option>)}
                                       </select>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* STEP 2: VISUALS */}
                   {currentStep === 2 && (
                       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                           <div>
                               <h1 className="text-4xl font-black text-white mb-2">Visual Assets</h1>
                               <p className="text-zinc-400 text-lg">Upload high-fidelity imagery to showcase this service.</p>
                           </div>

                           <div className="space-y-8">
                               <div className="space-y-3">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cover Image (16:9)</label>
                                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
                                   <div 
                                      onClick={() => fileInputRef.current?.click()}
                                      className="w-full aspect-video rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-600 transition-all cursor-pointer relative overflow-hidden group"
                                   >
                                      {formData.image ? (
                                          <>
                                              <img src={formData.image} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Cover" />
                                              <div className="absolute inset-0 flex items-center justify-center">
                                                  <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                                                      <Upload size={14} /> Change Cover
                                                  </div>
                                              </div>
                                          </>
                                      ) : (
                                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                              <div className="p-5 bg-zinc-800 rounded-full group-hover:scale-110 transition-transform"><ImageIcon size={32} className="text-zinc-500" /></div>
                                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Click to upload main visual</p>
                                          </div>
                                      )}
                                   </div>
                               </div>
                               
                               <div className="space-y-3">
                                   <div className="flex justify-between items-center">
                                       <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Gallery & Samples</label>
                                       <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery')} />
                                       <button onClick={() => galleryInputRef.current?.click()} className="text-xs font-bold text-blue-500 hover:text-blue-400">+ Add Media</button>
                                   </div>
                                   <div className="grid grid-cols-3 gap-4">
                                       {(formData.gallery || []).map((img: string, i: number) => (
                                           <div key={i} className="aspect-square rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden relative group">
                                               <img src={img} className="w-full h-full object-cover" alt="" />
                                               <button onClick={() => {
                                                   const newGal = [...formData.gallery];
                                                   newGal.splice(i, 1);
                                                   updateForm('gallery', newGal);
                                               }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"><X size={14} /></button>
                                           </div>
                                       ))}
                                       <button onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-600 flex items-center justify-center transition-colors hover:bg-zinc-900/50">
                                            <Plus size={24} className="text-zinc-600" />
                                       </button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* STEP 3: COMMERCIALS */}
                   {currentStep === 3 && (
                       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                           <div>
                               <h1 className="text-4xl font-black text-white mb-2">Commercial Strategy</h1>
                               <p className="text-zinc-400 text-lg">Define how you monetize this service.</p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div 
                                  onClick={() => updateForm('type', 'One-off')}
                                  className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.type === 'One-off' ? 'bg-blue-600/10 border-blue-600' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                               >
                                   <div className={`p-3 rounded-xl w-fit mb-4 ${formData.type === 'One-off' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}><Package size={24}/></div>
                                   <h4 className="text-lg font-black text-white mb-1">One-Time Project</h4>
                                   <p className="text-xs font-medium text-zinc-400">Fixed scope, single payment delivery.</p>
                               </div>
                               <div 
                                  onClick={() => updateForm('type', 'Recurring')}
                                  className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.type === 'Recurring' ? 'bg-blue-600/10 border-blue-600' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                               >
                                   <div className={`p-3 rounded-xl w-fit mb-4 ${formData.type === 'Recurring' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}><RefreshCw size={24}/></div>
                                   <h4 className="text-lg font-black text-white mb-1">Recurring Sub</h4>
                                   <p className="text-xs font-medium text-zinc-400">Ongoing retainer or monthly service.</p>
                               </div>
                           </div>
                           
                           <div className="space-y-2">
                               <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Base Price</label>
                               <div className="relative">
                                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                   <input 
                                     type="number" 
                                     value={formData.price}
                                     onChange={e => updateForm('price', parseFloat(e.target.value))}
                                     className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-6 py-5 text-3xl font-black text-white outline-none focus:border-blue-600 transition-all placeholder:text-zinc-700 hover:bg-zinc-900/80 focus:bg-black"
                                     placeholder="0.00"
                                   />
                                   <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                                       <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded">USD</span>
                                   </div>
                               </div>
                           </div>
                           
                           <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Included Features</label>
                                   <button onClick={() => addListItem('features', '')} className="text-xs font-bold text-blue-500 hover:text-white">+ Add Feature</button>
                               </div>
                               <div className="space-y-2">
                                   {(formData.features || ['']).map((feat: string, i: number) => (
                                       <div key={i} className="flex gap-2">
                                           <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-blue-500 transition-colors hover:bg-zinc-900/80 focus-within:bg-black">
                                               <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                               <input 
                                                 value={feat} 
                                                 onChange={e => updateListItem('features', i, null, e.target.value)}
                                                 className="bg-transparent w-full text-sm font-bold text-white outline-none placeholder:text-zinc-700"
                                                 placeholder="e.g. 24/7 Priority Support"
                                               />
                                           </div>
                                           <button onClick={() => removeListItem('features', i)} className="p-3 bg-zinc-900 hover:bg-rose-900/20 text-zinc-500 hover:text-rose-500 rounded-xl transition-colors"><Trash2 size={16}/></button>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}

                   {/* STEP 4: WORKFLOW */}
                   {currentStep === 4 && (
                       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                           <div>
                               <h1 className="text-4xl font-black text-white mb-2">Delivery Workflow</h1>
                               <p className="text-zinc-400 text-lg">Map out the journey the client will experience.</p>
                           </div>
                           
                           <div className="space-y-4 relative">
                               <div className="absolute left-[1.65rem] top-4 bottom-4 w-0.5 bg-zinc-800 -z-10" />
                               {(formData.phases || []).map((phase: any, i: number) => (
                                   <div key={i} className="flex gap-4 items-start group">
                                       <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 z-10 font-black text-zinc-500 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors shadow-xl">
                                           {i + 1}
                                       </div>
                                       <div className="flex-1 space-y-2">
                                           <div className="flex gap-2">
                                               <input 
                                                 value={phase.title}
                                                 onChange={e => updateListItem('phases', i, 'title', e.target.value)}
                                                 className="flex-[2] bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-blue-500 transition-colors hover:bg-zinc-900/80 focus:bg-black"
                                                 placeholder="Phase Title"
                                               />
                                               <input 
                                                 value={phase.duration}
                                                 onChange={e => updateListItem('phases', i, 'duration', e.target.value)}
                                                 className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-zinc-400 font-medium outline-none focus:border-blue-500 transition-colors hover:bg-zinc-900/80 focus:bg-black"
                                                 placeholder="Duration"
                                               />
                                               <button onClick={() => removeListItem('phases', i)} className="px-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-900/50 transition-colors"><Trash2 size={16}/></button>
                                           </div>
                                           <textarea 
                                             value={phase.desc}
                                             onChange={e => updateListItem('phases', i, 'desc', e.target.value)}
                                             className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 outline-none focus:border-blue-500 resize-none h-20 transition-colors hover:bg-zinc-900/80 focus:bg-black"
                                             placeholder="Describe what happens in this phase..."
                                           />
                                       </div>
                                   </div>
                               ))}
                               <button 
                                 onClick={() => addListItem('phases', { title: '', duration: '', desc: '' })}
                                 className="ml-[4.5rem] px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                               >
                                   <Plus size={14}/> Add Phase
                               </button>
                           </div>
                       </div>
                   )}

                   {/* STEP 5: INTAKE */}
                   {currentStep === 5 && (
                       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                           <div>
                               <h1 className="text-4xl font-black text-white mb-2">Client Intake</h1>
                               <p className="text-zinc-400 text-lg">Define requirements needed from the client to start.</p>
                           </div>

                           <div className="space-y-4">
                               {(formData.intakeFields || []).map((field: any, i: number) => (
                                   <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] flex flex-col gap-4 group hover:border-zinc-700 transition-all">
                                       <div className="flex justify-between items-center">
                                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2 py-1 rounded">Field {i + 1}</span>
                                           <div className="flex gap-2">
                                               <label className="flex items-center gap-2 cursor-pointer select-none">
                                                   <input 
                                                      type="checkbox" 
                                                      checked={field.required} 
                                                      onChange={e => updateListItem('intakeFields', i, 'required', e.target.checked)}
                                                      className="accent-blue-600 w-4 h-4 rounded"
                                                   />
                                                   <span className="text-xs font-bold text-zinc-400">Required</span>
                                               </label>
                                               <button onClick={() => removeListItem('intakeFields', i)} className="ml-2 text-zinc-600 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                           </div>
                                       </div>
                                       <div className="flex gap-4">
                                           <input 
                                              value={field.label}
                                              onChange={e => updateListItem('intakeFields', i, 'label', e.target.value)}
                                              className="flex-[2] bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 transition-colors"
                                              placeholder="Question Label (e.g. Brand Guidelines URL)"
                                           />
                                           <select 
                                              value={field.type}
                                              onChange={e => updateListItem('intakeFields', i, 'type', e.target.value)}
                                              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 font-medium outline-none focus:border-blue-500 transition-colors"
                                           >
                                              <option value="text">Short Text</option>
                                              <option value="textarea">Long Text</option>
                                              <option value="file">File Upload</option>
                                              <option value="select">Dropdown</option>
                                              <option value="date">Date Picker</option>
                                           </select>
                                       </div>
                                   </div>
                               ))}
                               <button 
                                 onClick={() => addListItem('intakeFields', { label: '', type: 'text', required: true })}
                                 className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-bold hover:border-zinc-600 hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-zinc-900/50"
                               >
                                   <Plus size={16}/> Add Question
                               </button>
                           </div>
                       </div>
                   )}

                   {/* STEP 6: ADD-ONS */}
                   {currentStep === 6 && (
                       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                           <div>
                               <h1 className="text-4xl font-black text-white mb-2">Upsell Add-ons</h1>
                               <p className="text-zinc-400 text-lg">Offer optional extras to increase project value.</p>
                           </div>

                           <div className="space-y-4">
                               {(formData.addons || []).map((addon: any, i: number) => (
                                   <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] flex flex-col gap-4 group hover:border-zinc-700 transition-all">
                                       <div className="flex justify-between items-center">
                                           <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2 py-1 rounded">Add-on {i + 1}</span>
                                              <select 
                                                value={addon.type}
                                                onChange={e => updateListItem('addons', i, 'type', e.target.value)}
                                                className="bg-transparent text-[10px] font-bold text-blue-500 uppercase tracking-wide outline-none border-b border-transparent focus:border-blue-500"
                                              >
                                                <option value="Service">Service</option>
                                                <option value="Product">Product</option>
                                              </select>
                                           </div>
                                           <button onClick={() => removeListItem('addons', i)} className="text-zinc-600 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                       </div>
                                       <div className="flex gap-4">
                                           <input 
                                              value={addon.name}
                                              onChange={e => updateListItem('addons', i, 'name', e.target.value)}
                                              className="flex-[2] bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 transition-colors"
                                              placeholder="Add-on Name (e.g. Rush Delivery)"
                                           />
                                           <div className="flex-1 relative">
                                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                                              <input 
                                                type="number"
                                                value={addon.price}
                                                onChange={e => updateListItem('addons', i, 'price', parseFloat(e.target.value))}
                                                className="w-full bg-black border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-white font-bold outline-none focus:border-blue-500 transition-colors"
                                                placeholder="0.00"
                                              />
                                           </div>
                                       </div>
                                       <input 
                                          value={addon.desc}
                                          onChange={e => updateListItem('addons', i, 'desc', e.target.value)}
                                          className="w-full bg-black/50 border-b border-zinc-800 px-2 py-2 text-zinc-400 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700"
                                          placeholder="Optional description..."
                                       />
                                   </div>
                               ))}
                               <button 
                                 onClick={() => addListItem('addons', { name: '', price: 0, type: 'Service', desc: '' })}
                                 className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-bold hover:border-zinc-600 hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-zinc-900/50"
                               >
                                   <Plus size={16}/> Add Option
                               </button>
                           </div>
                       </div>
                   )}

                   {/* STEP 7: PUBLICITY (SEO) */}
                   {currentStep === 7 && (
                       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                           <div>
                               <h1 className="text-4xl font-black text-white mb-2">Publicity & SEO</h1>
                               <p className="text-zinc-400 text-lg">Optimize how this service appears in search engines and social shares.</p>
                           </div>

                           <div className="space-y-6">
                               <div className="space-y-2">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Meta Title</label>
                                   <input 
                                     value={formData.seoTitle} 
                                     onChange={e => updateForm('seoTitle', e.target.value)}
                                     className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-medium outline-none focus:border-blue-600 transition-all placeholder:text-zinc-700 hover:bg-zinc-900/80 focus:bg-black"
                                     placeholder={formData.name || "Service Name | AgencyOS"}
                                   />
                                   <p className="text-[10px] text-zinc-600 text-right">{formData.seoTitle.length} / 60</p>
                               </div>

                               <div className="space-y-2">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Meta Description</label>
                                   <textarea 
                                     value={formData.seoDesc} 
                                     onChange={e => updateForm('seoDesc', e.target.value)}
                                     className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-zinc-300 text-sm leading-relaxed outline-none focus:border-blue-600 transition-all resize-none placeholder:text-zinc-700 hover:bg-zinc-900/80 focus:bg-black"
                                     placeholder={formData.description ? formData.description.substring(0, 150) + "..." : "A brief summary for search results..."}
                                   />
                                   <p className="text-[10px] text-zinc-600 text-right">{formData.seoDesc.length} / 160</p>
                               </div>

                               <div className="space-y-3">
                                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Keywords (Tags)</label>
                                   <div className="flex flex-wrap gap-2 mb-2">
                                       {(formData.seoTags || []).map((tag: string, i: number) => (
                                           <span key={i} className="px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-800 rounded-lg text-xs font-bold flex items-center gap-2">
                                               {tag} <button onClick={() => removeTag(tag)} className="hover:text-white"><X size={12}/></button>
                                           </span>
                                       ))}
                                   </div>
                                   <input 
                                     onKeyDown={handleTagKeyDown}
                                     className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-medium outline-none focus:border-blue-600 transition-all placeholder:text-zinc-700 hover:bg-zinc-900/80 focus:bg-black"
                                     placeholder="Type tag and press Enter..."
                                   />
                               </div>
                           </div>
                       </div>
                   )}

                   {/* STEP 8: LAUNCH (Summary) */}
                   {currentStep === 8 && (
                       <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                           <div className="text-center space-y-4">
                               <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mx-auto mb-6 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
                                   <Rocket size={40} />
                               </div>
                               <h1 className="text-4xl font-black text-white">Ready for Launch</h1>
                               <p className="text-zinc-400 text-lg max-w-lg mx-auto">Your service is configured and ready to be deployed to the catalog. Review the summary card below.</p>
                           </div>

                           <div className="bg-zinc-900 rounded-[3rem] p-10 max-w-md mx-auto text-white shadow-2xl relative overflow-hidden group transform hover:-translate-y-2 transition-transform duration-500 border border-zinc-800">
                               <div className="absolute top-0 left-0 w-full h-48 bg-zinc-800">
                                   {formData.image ? (
                                       <img src={formData.image} className="w-full h-full object-cover" alt="" />
                                   ) : (
                                       <div className="w-full h-full flex items-center justify-center text-zinc-700 font-black text-4xl bg-zinc-800">PREVIEW</div>
                                   )}
                                   <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-zinc-900" />
                               </div>
                               
                               <div className="relative mt-32 space-y-4">
                                   <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">{formData.category}</span>
                                   <h3 className="text-3xl font-black leading-tight">{formData.name || 'Service Name'}</h3>
                                   <p className="text-zinc-400 font-medium leading-relaxed line-clamp-3">{formData.tagline || formData.description || 'Your service description will appear here...'}</p>
                                   
                                   <div className="py-6 border-y border-zinc-800 space-y-3">
                                       {formData.features?.slice(0,3).map((f: string, i: number) => (
                                           <div key={i} className="flex items-center gap-3 text-sm font-bold text-zinc-300">
                                               <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {f}
                                           </div>
                                       ))}
                                   </div>
                                   
                                   <div className="flex justify-between items-end pt-2">
                                       <div>
                                           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Starting at</p>
                                           <p className="text-4xl font-black">{format(formData.price)}</p>
                                       </div>
                                       <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
                                           <ArrowRight size={20} />
                                       </button>
                                   </div>
                               </div>
                           </div>

                           <div className="flex justify-center gap-4">
                               <button onClick={() => navigate('/services')} className="px-8 py-4 rounded-2xl bg-zinc-900 text-zinc-400 hover:text-white font-bold text-sm transition-colors border border-zinc-800">Discard Draft</button>
                               <button onClick={handleSave} className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">Publish Live</button>
                           </div>
                       </div>
                   )}
               </div>
            </div>

            {/* Context-Aware Live Preview Sidebar */}
            <div className="hidden xl:flex w-[450px] border-l border-zinc-800 bg-[#000000] flex-col overflow-hidden relative">
               <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      {currentStep === 5 ? 'INTAKE FORM PREVIEW' : currentStep === 7 ? 'SEARCH PREVIEW' : 'CLIENT CARD VIEW'}
                  </span>
                  <div className="flex gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-rose-500"/>
                     <div className="w-2 h-2 rounded-full bg-amber-500"/>
                     <div className="w-2 h-2 rounded-full bg-emerald-500"/>
                  </div>
               </div>
               
               <div className={`flex-1 overflow-y-auto p-8 flex items-center justify-center ${viewport === 'mobile' ? 'bg-[#111]' : ''}`}>
                  <div className={`transition-all duration-500 ${viewport === 'mobile' ? 'w-[375px] h-[667px] bg-black border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl relative' : 'w-full'}`}>
                     {viewport === 'mobile' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-20"/>}
                     
                     {/* Preview Content Logic */}
                     {currentStep === 5 ? (
                         <div className="h-full bg-zinc-900 p-8 pt-12 overflow-y-auto no-scrollbar">
                             <h4 className="text-xl font-black text-white mb-2">Project Requirements</h4>
                             <p className="text-xs text-zinc-400 mb-8">Please fill out these details to start.</p>
                             <div className="space-y-6">
                                 {formData.intakeFields.length === 0 && <p className="text-zinc-600 text-sm italic">No fields defined yet.</p>}
                                 {formData.intakeFields.map((f: any, i: number) => (
                                     <div key={i} className="space-y-2">
                                         <label className="text-xs font-bold text-zinc-300 flex justify-between">
                                             {f.label || 'Field Name'}
                                             {f.required && <span className="text-rose-500">*</span>}
                                         </label>
                                         {f.type === 'textarea' ? (
                                             <div className="h-24 bg-black border border-zinc-800 rounded-xl" />
                                         ) : f.type === 'file' ? (
                                             <div className="h-12 bg-black border border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-xs">Upload File</div>
                                         ) : (
                                             <div className="h-10 bg-black border border-zinc-800 rounded-xl" />
                                         )}
                                     </div>
                                 ))}
                                 <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs mt-4">Submit Requirements</button>
                             </div>
                         </div>
                     ) : currentStep === 7 ? (
                         <div className="h-full bg-white p-6 pt-20">
                             <div className="mb-6">
                                 <div className="flex items-center gap-2 mb-1">
                                     <div className="w-7 h-7 bg-gray-200 rounded-full" />
                                     <div className="flex flex-col">
                                         <div className="w-20 h-2 bg-gray-200 rounded mb-0.5" />
                                         <div className="w-32 h-2 bg-gray-100 rounded" />
                                     </div>
                                 </div>
                                 <h3 className="text-xl font-medium text-[#1a0dab] hover:underline cursor-pointer mb-1 leading-snug">
                                     {formData.seoTitle || formData.name || "Service Title"}
                                 </h3>
                                 <p className="text-sm text-[#4d5156] leading-relaxed">
                                     {formData.seoDesc || (formData.description ? formData.description.substring(0, 150) + "..." : "Meta description preview...")}
                                 </p>
                             </div>
                             
                             <div className="flex gap-2 flex-wrap">
                                 {(formData.seoTags || []).map((t: string, i: number) => (
                                     <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">{t}</span>
                                 ))}
                             </div>
                         </div>
                     ) : (
                         // Default Card View
                         <div className="bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-xl relative group h-full flex flex-col">
                             <div className="h-64 relative shrink-0 bg-zinc-800">
                               {formData.image ? (
                                  <img src={formData.image} className="w-full h-full object-cover" alt=""/>
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-700 font-black text-6xl uppercase tracking-tighter">PREVIEW</div>
                               )}
                               <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"/>
                               <div className="absolute top-4 left-4">
                                  <span className="px-3 py-1 bg-blue-600/90 backdrop-blur-md rounded-lg text-white text-[10px] font-black uppercase tracking-widest shadow-lg">{formData.type}</span>
                               </div>
                             </div>
                             
                             <div className="p-8 relative -mt-12 flex-1 flex flex-col">
                                 <h3 className="text-2xl font-black text-white leading-tight mb-2">{formData.name || 'Service Name'}</h3>
                                 <p className="text-sm text-zinc-400 font-medium leading-relaxed line-clamp-3 mb-6">{formData.description || 'Description...'}</p>
                                 
                                 {/* Dynamic Feature Preview based on step */}
                                 {currentStep === 4 ? (
                                     <div className="space-y-4 mb-6">
                                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timeline</p>
                                         {formData.phases.map((p: any, i: number) => (
                                             <div key={i} className="flex gap-3 items-start">
                                                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                                 <div>
                                                     <p className="text-xs font-bold text-white">{p.title}</p>
                                                     <p className="text-[10px] text-zinc-500">{p.duration}</p>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 ) : currentStep === 6 ? (
                                     <div className="space-y-3 mb-6">
                                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Available Add-ons</p>
                                         {formData.addons.length === 0 && <p className="text-xs text-zinc-600 italic">No add-ons configured.</p>}
                                         {formData.addons.map((add: any, i: number) => (
                                             <div key={i} className="flex justify-between items-center p-2 rounded bg-zinc-800/50 border border-zinc-800">
                                                 <span className="text-xs font-bold text-zinc-300">{add.name}</span>
                                                 <span className="text-xs font-mono text-zinc-400">+${add.price}</span>
                                             </div>
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="space-y-3 mb-6">
                                         {formData.features?.slice(0,3).map((f: string, i: number) => (
                                             <div key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                                                 <CheckCircle2 size={14} className="text-blue-500" /> {f}
                                             </div>
                                         ))}
                                     </div>
                                 )}

                                 <div className="mt-auto pt-6 border-t border-zinc-800 flex items-center justify-between">
                                     <div>
                                         <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Investment</p>
                                         <p className="text-3xl font-black text-white tracking-tight">{format(formData.price)}</p>
                                     </div>
                                     <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors">View</button>
                                 </div>
                             </div>
                         </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
      
      {/* Footer Navigation */}
      <div className="h-20 bg-[#09090b] border-t border-zinc-800 px-8 flex items-center justify-between shrink-0 z-20">
          <button 
             onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
             disabled={currentStep === 1}
             className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-bold text-xs hover:text-white hover:border-zinc-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
              Back
          </button>
          <div className="flex gap-1.5">
             {STEPS.map(s => (
                 <div key={s.id} className={`h-1.5 rounded-full transition-all duration-500 ${s.id === currentStep ? 'bg-blue-600 w-8' : s.id < currentStep ? 'bg-zinc-600 w-2' : 'bg-zinc-800 w-2'}`} />
             ))}
          </div>
          <button 
             onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}
             disabled={currentStep === 8}
             className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 hover:scale-105 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
              Continue <ChevronRight size={14} />
          </button>
      </div>
    </div>
  );
};

export default EditService;
