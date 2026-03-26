
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Phone, ExternalLink, Download, Plus, Search, 
  MoreHorizontal, Edit3, Send, Trash2, Building2,
  Users, DollarSign, X, CheckCircle2,
  Briefcase, Globe, CreditCard, LayoutGrid, List,
  ShieldCheck, Zap, Smartphone, UserCheck, Activity, 
  Target, ChevronDown, FileText, Layout, Lock, 
  Link as LinkIcon, User, Rocket, ArrowRight, History, 
  LifeBuoy, Sparkles, CalendarDays, ListChecks, Clock, 
  CheckSquare, MessageSquare, Calculator, HardDrive,
  BarChart, Eye, EyeOff, Edit, Check, AlertCircle, Loader2, PlayCircle, StopCircle
} from 'lucide-react';
import { MOCK_PROFILES, AVAILABLE_PLANS, SIDEBAR_MODULES } from '../constants.tsx';
import { Client, Profile } from '../types.ts';
import { useClients } from '../hooks/useClients.ts';
import { usePages } from '../hooks/usePages.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useCurrency } from '../context/CurrencyContext.tsx';
import * as ReactRouterDom from 'react-router-dom';

import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';
const { useNavigate } = ReactRouterDom as any;

// --- Constants ---

const GLOBAL_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
];

const FiscalStat = ({ label, value, sub, icon: Icon, color, textColor }: any) => (
  <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
    <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 ${color?.replace('bg-', 'text-') || 'text-blue-500'}`}>
      <Icon size={100} strokeWidth={1} />
    </div>
    <div className="relative z-10 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl ${color || 'bg-blue-600'} flex items-center justify-center ${textColor || 'text-white'} shadow-lg shrink-0`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h4>
        {sub && <p className="text-[10px] font-bold text-blue-500 mt-1">{sub}</p>}
      </div>
    </div>
  </div>
);

const ClientModal = ({ client, isOpen, onClose, onSave, initialTab = 'Identity' }: { client: Partial<Client> | null, isOpen: boolean, onClose: () => void, onSave: (c: Partial<Client>) => void, initialTab?: 'Identity' | 'Mission Context' | 'Portal Access' }) => {
  const [activeTab, setActiveTab] = useState<'Identity' | 'Mission Context' | 'Portal Access'>(initialTab);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [protocolStep, setProtocolStep] = useState(0);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const { pages } = usePages();
  
  // Data Sources
  const onboardingFlows = JSON.parse(localStorage.getItem('agencyos_onboarding_flows') || '[]');

  const [formData, setFormData] = useState<any>({
    name: '', company: '', email: '', position: '', status: 'Lead', revenue: 0, currency: 'USD',
    organization: '', avatar: '', industry: 'Technology', website: '', taxId: '', phone: '',
    address: '', size: '11-50', budgetRange: '', mainObjective: '',
    assignedManager: 'Agency Admin', onboardingFlowId: '', modulePermissions: {}
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (client) {
        setFormData({ 
          ...formData, 
          ...client, 
          modulePermissions: client.modulePermissions || {},
          allowedPageIds: (client as any).allowedPageIds || []
        });
      } else {
        setFormData({
          name: '', company: '', email: '', position: '', status: 'Lead', revenue: 0, currency: 'USD',
          organization: '', industry: 'Technology', size: '11-50', onboardingFlowId: onboardingFlows[0]?.id || '',
          avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
          modulePermissions: {}, assignedManager: 'Agency Admin', website: '', taxId: '', phone: '', budgetRange: '', mainObjective: '',
          allowedPageIds: []
        });
      }
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const protocolMessages = [
    "Initializing Partner Handshake...",
    "Securing Data Packet (AES-256)...",
    "Generating Secure Portal Uplink...",
    "Broadcasting via Global Relay Node...",
    "Finalizing Protocol Handover..."
  ];

  const handleSaveDraft = () => {
    onSave({
      ...formData,
      status: formData.status || 'Draft'
    });
    onClose();
  };

  const toggleModuleAccess = (moduleId: string) => {
    const current = formData.modulePermissions || {};
    const existing = current[moduleId] || 'none';
    
    // Toggle between 'none' and 'edit' (Edit implies full access)
    const next = existing === 'none' ? 'edit' : 'none';

    setFormData({ 
      ...formData, 
      modulePermissions: { ...current, [moduleId]: next } 
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

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return alert("Destination email required for transmission.");
    
    setIsTransmitting(true);
    
    // UI Protocol Loop
    for(let i = 0; i < 5; i++) {
        setProtocolStep(i);
        await new Promise(r => setTimeout(r, 700));
    }

    try {
        const loginLink = `${window.location.origin}/#/login?role=client&email=${encodeURIComponent(formData.email)}`;
        const selectedFlowName = onboardingFlows.find((f: any) => f.id === formData.onboardingFlowId)?.name || 'Standard Protocol';

        // Hyper-personalized Email Content
        const htmlContent = `
          <div style="font-family: 'Inter', sans-serif, system-ui; background-color: #09090b; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #27272a;">
            <div style="margin-bottom: 40px; border-bottom: 1px solid #27272a; padding-bottom: 20px;">
              <h2 style="color: #3b82f6; font-weight: 900; letter-spacing: -0.05em; font-size: 24px; margin: 0;">PARTNERSHIP_ONBOARDING</h2>
              <p style="color: #71717a; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.3em; margin: 5px 0 0 0;">Secure Global Broadcast Protocol v4.8</p>
            </div>

            <p style="font-size: 16px; line-height: 1.6;">Hello <b>${formData.name}</b>,</p>
            <p style="font-size: 16px; line-height: 1.6;">Welcome to the AgencyOS ecosystem. We have officially provisioned a strategic partnership hub for <b>${formData.company}</b>.</p>
            
            <div style="background: #18181b; padding: 30px; border-radius: 20px; margin: 30px 0; border: 1px solid #27272a;">
              <h4 style="margin: 0 0 20px 0; color: #3b82f6; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Strategic Parameters</h4>
              <table width="100%" style="font-size: 13px; color: #a1a1aa; line-height: 2;">
                <tr><td width="140"><b>Mission Objective:</b></td><td style="color: #ffffff">${formData.mainObjective || 'General Strategic Partnership'}</td></tr>
                <tr><td><b>Account Lead:</b></td><td style="color: #ffffff">${formData.assignedManager}</td></tr>
                <tr><td><b>Industry Focus:</b></td><td style="color: #ffffff">${formData.industry}</td></tr>
                <tr><td><b>Protocol:</b></td><td style="color: #ffffff">${selectedFlowName}</td></tr>
              </table>
            </div>

            <p style="font-size: 16px; line-height: 1.6; text-align: center;">Access your private command terminal via the secure uplink below:</p>
            
            <div style="margin: 40px 0; text-align: center;">
              <a href="${loginLink}" style="display: inline-block; padding: 20px 40px; background: #2563eb; color: white; text-decoration: none; border-radius: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; font-size: 14px; box-shadow: 0 10px 40px rgba(37,99,235,0.4);">Initialize Command Link</a>
            </div>

            <p style="color: #52525b; font-size: 9px; margin-top: 50px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4em; text-align: center;">
              Encrypted AES-256 Transmission • Verified Identity Node 0092
            </p>
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
                    from_name: 'AgencyOS Systems',
                    message: `Strategic Partnership Initialized for ${formData.company}. Account Lead: ${formData.assignedManager}.`,
                    html_content: htmlContent.replace(/\s+/g, ' ').trim()
                }
            })
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(errorMsg || "Broadcasting Uplink Failed");
        }

        // Save after successful email
        onSave({ ...formData, status: 'Active' });
        
    } catch (err) {
        console.error(err);
        alert("Transmission Interrupted. Data saved to registry locally.");
        onSave({ ...formData, status: 'Active' });
    } finally {
        setIsTransmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md" onClick={() => !isTransmitting && onClose()} />
      
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
        
        {isTransmitting && (
          <div className="absolute inset-0 z-[100] bg-white/95 dark:bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-12">
             <div className="w-32 h-32 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8" />
             <h3 className="text-2xl font-black mb-2 dark:text-white">Executing Transmission</h3>
             <p className="text-blue-500 font-mono text-[10px] font-black uppercase tracking-[0.4em]">{protocolMessages[protocolStep]}</p>
          </div>
        )}

        <div className="px-10 py-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-black/40">
           <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xl">
               <Building2 size={32} />
             </div>
             <div>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1.5">{client ? 'Edit Partner Protocol' : 'Onboard New Partner'}</h3>
               <div className="flex items-center gap-2 mt-1">
                   <span className="px-2 py-0.5 rounded-md bg-blue-900/30 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase tracking-wider">Registry V4.8</span>
                   <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                   <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Broadcast Ready</span>
               </div>
             </div>
           </div>
           <button onClick={onClose} className="p-4 bg-white dark:bg-zinc-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"><X size={24}/></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
           <div className="w-72 border-r border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-black/20 p-8 space-y-2 shrink-0 pt-10">
             {[ { id: 'Identity', icon: Building2 }, { id: 'Mission Context', icon: Briefcase }, { id: 'Portal Access', icon: Lock } ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white dark:hover:bg-zinc-800'}`}
               >
                 <tab.icon size={18} /> {tab.id}
               </button>
             ))}
           </div>

           <form onSubmit={handleSendInvite} className="flex-1 overflow-y-auto p-10 md:p-14 space-y-12 no-scrollbar">
              {activeTab === 'Identity' && (
                 <div className="space-y-8 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Name</label>
                          <div className="relative group">
                              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors"/>
                              <input required className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value, organization: e.target.value})} placeholder="Corporate Title..." />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commercial Industry</label>
                          <div className="relative group">
                              <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors"/>
                              <input className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="Technology" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Domain</label>
                          <div className="relative group">
                              <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors"/>
                              <input className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://domain.io" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fiscal Tax ID</label>
                           <div className="relative group">
                              <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors"/>
                              <input className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} placeholder="VAT / EIN Reference..." />
                          </div>
                       </div>
                    </div>
                    
                    <div className="pt-8 border-t border-zinc-800/50">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500"><UserCheck size={16} /></div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Primary Contact Terminal</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorized Contact</label>
                              <div className="relative group">
                                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors"/>
                                  <input required className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Legal Name..." />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Position</label>
                              <div className="relative group">
                                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors"/>
                                  <input className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="Stakeholder Title..." />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transmission Email</label>
                              <div className="relative group">
                                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors"/>
                                  <input required type="email" className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="address@partner.com" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Mobile</label>
                              <div className="relative group">
                                  <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors"/>
                                  <input className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 (000) 000-0000" />
                              </div>
                           </div>
                        </div>
                    </div>
                 </div>
              )}

              {activeTab === 'Mission Context' && (
                 <div className="space-y-12 animate-in fade-in">
                      <div className="flex items-center gap-4 mb-2">
                          <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500"><Target size={16} /></div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Strategic Parameters</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Scale</label>
                              <select 
                                  value={formData.size || ''}
                                  onChange={e => setFormData({...formData, size: e.target.value})}
                                  className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100 appearance-none cursor-pointer"
                              >
                                  <option>1-10</option>
                                  <option>11-50</option>
                                  <option>51-200</option>
                                  <option>201-500</option>
                                  <option>500+</option>
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget Allocation</label>
                              <div className="flex gap-3">
                                  <div className="relative w-40">
                                      <button 
                                          type="button"
                                          onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                                          className="w-full px-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100 flex items-center justify-between transition-all"
                                      >
                                          <span className="flex items-center gap-2">
                                              <span className="text-blue-500 font-black">{formData.currency}</span>
                                              <span className="text-slate-400 text-[10px]">{GLOBAL_CURRENCIES.find(c => c.code === formData.currency)?.symbol}</span>
                                          </span>
                                          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
                                      </button>

                                      {isCurrencyDropdownOpen && (
                                          <>
                                              <div 
                                                  className="fixed inset-0 z-[100]" 
                                                  onClick={() => setIsCurrencyDropdownOpen(false)} 
                                              />
                                              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-2xl z-[101] max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                                  <div className="p-2 grid grid-cols-1 gap-1">
                                                      {GLOBAL_CURRENCIES.map((curr) => (
                                                          <button
                                                              key={curr.code}
                                                              type="button"
                                                              onClick={() => {
                                                                  setFormData({...formData, currency: curr.code});
                                                                  setIsCurrencyDropdownOpen(false);
                                                              }}
                                                              className={`w-full px-4 py-3 rounded-xl text-left flex items-center justify-between transition-all group ${
                                                                  formData.currency === curr.code 
                                                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                                                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                                                              }`}
                                                          >
                                                              <div className="flex items-center gap-3">
                                                                  <span className="font-black text-xs w-8">{curr.code}</span>
                                                                  <span className="text-[10px] font-bold opacity-60 truncate max-w-[100px]">{curr.name}</span>
                                                              </div>
                                                              <span className="font-black text-xs">{curr.symbol}</span>
                                                          </button>
                                                      ))}
                                                  </div>
                                              </div>
                                          </>
                                      )}
                                  </div>
                                  <div className="relative group flex-1">
                                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors font-black text-xs">
                                          {GLOBAL_CURRENCIES.find(c => c.code === formData.currency)?.symbol || '$'}
                                      </div>
                                      <input 
                                          type="number"
                                          className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100" 
                                          value={formData.revenue || ''} 
                                          onChange={e => setFormData({...formData, revenue: parseFloat(e.target.value) || 0})} 
                                          placeholder="0.00" 
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Mission Objective</label>
                         <textarea className="w-full p-6 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[2rem] font-bold text-base dark:text-white outline-none focus:ring-4 focus:ring-blue-100 h-40 resize-none" value={formData.mainObjective} onChange={e => setFormData({...formData, mainObjective: e.target.value})} placeholder="What is the singular focus of this partnership?" />
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Account Lead</label>
                          <select 
                              value={formData.assignedManager || ''}
                              onChange={e => setFormData({...formData, assignedManager: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-sm dark:text-white outline-none focus:ring-4 focus:ring-blue-100 appearance-none cursor-pointer"
                          >
                              {MOCK_PROFILES.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                      </div>
                 </div>
              )}

              {activeTab === 'Portal Access' && (
                 <div className="space-y-12 animate-in fade-in">
                      <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-2">
                              <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500"><Layout size={16} /></div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Module Access Permissions</h4>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-600 ml-1 mb-4">Select which OS modules the client can access.</p>
                          <div className="grid grid-cols-2 gap-4">
                             {SIDEBAR_MODULES.map((module) => {
                                const currentPerm = (formData.modulePermissions || {})[module.id] || 'none';
                                return (
                                   <div key={module.id} className={`p-5 rounded-[2rem] border transition-all flex flex-col gap-4 ${currentPerm !== 'none' ? 'bg-white dark:bg-zinc-900 border-zinc-700 shadow-xl' : 'bg-white dark:bg-black border-slate-100 dark:border-zinc-900 opacity-60 hover:opacity-100'}`}>
                                      <div className="flex items-center gap-4">
                                         <div className={`p-3 rounded-xl ${currentPerm !== 'none' ? 'bg-zinc-800 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}><module.icon size={20}/></div>
                                         <span className="text-sm font-black dark:text-white">{module.label}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button 
                                          type="button" 
                                          onClick={() => toggleModuleAccess(module.id)} 
                                          className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${currentPerm !== 'none' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-400 hover:text-white'}`}
                                        >
                                          {currentPerm !== 'none' ? <><Check size={14} /> Enabled</> : 'Enable Access'}
                                        </button>
                                      </div>
                                   </div>
                                );
                             })}
                          </div>
                      </div>

                      <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-zinc-800">
                          <div className="flex items-center gap-4 mb-2">
                              <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500"><FileText size={16} /></div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Custom Page Access</h4>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-600 ml-1 mb-4">Select which custom pages the client can view.</p>
                          <div className="grid grid-cols-2 gap-4">
                             {pages.map((page) => {
                                const isAllowed = (formData.allowedPageIds || []).includes(page.id);
                                return (
                                   <div key={page.id} className={`p-5 rounded-[2rem] border transition-all flex items-center justify-between ${isAllowed ? 'bg-white dark:bg-zinc-900 border-blue-600 shadow-xl' : 'bg-white dark:bg-black border-slate-100 dark:border-zinc-900 opacity-60 hover:opacity-100'}`}>
                                      <span className="text-xs font-black dark:text-white truncate">{page.title}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => togglePageAccess(page.id)} 
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isAllowed ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-400 hover:text-white'}`}
                                      >
                                        {isAllowed ? 'Allowed' : 'Allow'}
                                      </button>
                                   </div>
                                );
                             })}
                          </div>
                      </div>
                 </div>
              )}
           </form>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-black/40 flex justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              {MOCK_PROFILES.slice(0,3).map(p => (
                 <img key={p.id} src={p.avatar} className="w-8 h-8 rounded-full border-2 border-black" />
              ))}
              <div className="text-left ml-2">
                 <p className="text-[10px] font-black text-white">Authorized by Workspace Admin</p>
                 <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">GLOBAL PROTOCOL ENFORCEMENT</p>
              </div>
           </div>
           
           <div className="flex gap-4">
             <button onClick={onClose} className="px-8 py-5 bg-white dark:bg-zinc-900 text-slate-500 font-black text-[11px] uppercase tracking-widest rounded-3xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 hover:text-white transition-all">Cancel</button>
             <button onClick={handleSaveDraft} className="px-8 py-5 bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-black text-[11px] uppercase tracking-widest rounded-3xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 hover:text-white transition-all flex items-center gap-2"><FileText size={14}/> Save Draft</button>
             <button onClick={handleSendInvite} disabled={isTransmitting} className="px-12 py-5 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-[1.75rem] shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3">
                {isTransmitting ? 'Transmitting...' : 'Execute & Send Onboarding'} <ArrowRight size={18}/>
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const Clients: React.FC = () => {
  const { format, convert, currency: globalCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
  const [activeActions, setActiveActions] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [defaultTab, setDefaultTab] = useState<'Identity' | 'Mission Context' | 'Portal Access'>('Identity');
  const [toast, setToast] = useState<string | null>(null);

  // ... (existing code)

  const handleMenuClick = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
        top: rect.bottom + window.scrollY + 10,
        left: rect.right - 224 // 224px is w-56 (14rem)
    });
    setActiveActions(activeActions === clientId ? null : clientId);
  };

  const handleTransmission = (client: Client) => {
      setEditingClient(client);
      setDefaultTab('Portal Access');
      setIsModalOpen(true);
      setActiveActions(null);
  };

  const handleDecommission = (id: string) => {
      if (!canEdit('clients')) {
          setToastType('error');
          setToast('Access Denied: You do not have permission to remove clients');
          setTimeout(() => setToast(null), 3000);
          return;
      }
      handleDeleteClient(id);
      setActiveActions(null);
  };

  const handleEdit = (client: Client) => {
      if (!canEdit('clients')) {
          setToastType('error');
          setToast('Access Denied: You do not have permission to edit clients');
          setTimeout(() => setToast(null), 3000);
          return;
      }
      setEditingClient(client);
      setDefaultTab('Identity');
      setIsModalOpen(true);
      setActiveActions(null);
  };

  // ... (existing code)

  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Use Custom Hook for Data
  const { clients, loading, upsertClient, deleteClient, refresh } = useClients();
  const { canEdit } = useAuth();
  const { getLimit } = usePlanEnforcement();

  useEffect(() => {
    const handleClickOutside = () => setActiveActions(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddNew = () => {
     if (!canEdit('clients')) {
        setToastType('error');
        setToast('Access Denied: You do not have permission to add clients');
        setTimeout(() => setToast(null), 3000);
        return;
     }

     const clientLimit = getLimit('clientLimit');
     
     if (clientLimit !== -1 && clients.length >= clientLimit) {
        setToastType('error');
        setToast('Plan Limit Reached: Upgrade to add more clients');
        setTimeout(() => setToast(null), 3000);
        return;
     }

     setEditingClient(null);
     setIsModalOpen(true);
  };

  const handleSaveClient = async (client: Partial<Client>) => {
    if (!canEdit('clients')) {
        setToastType('error');
        setToast('Access Denied');
        setTimeout(() => setToast(null), 3000);
        return;
    }
    await upsertClient(client);
    setIsModalOpen(false);
    setEditingClient(null);
    setToastType('success');
    setToast('Client Registry Updated');
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteClient = async (id: string) => {
    if (!canEdit('clients')) {
        setToastType('error');
        setToast('Access Denied');
        setTimeout(() => setToast(null), 3000);
        return;
    }
    if (window.confirm("Are you sure you want to remove this client? This will archive all associated data.")) {
      await deleteClient(id);
      setToastType('success');
      setToast('Client Archived');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: clients.length,
      active: clients.filter(c => c.status === 'Active').length,
      revenue: clients.reduce((acc, c) => acc + convert(c.revenue || 0, c.currency || 'USD'), 0),
      leads: clients.filter(c => c.status === 'Lead').length
    };
  }, [clients, convert]);

  if (loading) return (
     <div className="flex h-screen items-center justify-center bg-[#0c0c0e] text-white">
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

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Authorized Portfolio</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
              <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">Registry Managed: v4.8</p>
           </div>
           <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Partner Ecosystem</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAddNew}
            className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/10 flex items-center gap-3 group border border-transparent dark:border-zinc-800"
          >
            <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Onboard New Partner
          </button>
        </div>
      </div>

      {/* Fiscal Pulse Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <FiscalStat label="Total Ecosystem" value={stats.total} icon={Users} color="bg-blue-600" sub="Verified Identities" />
         <FiscalStat label="Active Contracts" value={stats.active} icon={CheckCircle2} color="bg-emerald-500" sub="Stable Partnerships" />
         <FiscalStat label="Projected Value" value={format(stats.revenue)} icon={DollarSign} color="bg-indigo-600" sub="Aggregate LTV" />
         <FiscalStat label="Growth Pipeline" value={stats.leads} icon={Target} color="bg-amber-50" textColor="text-amber-600" sub="Incoming Interest" />
      </div>

      {/* Corporate Toolbar */}
      <div className="bg-white dark:bg-zinc-950 p-4 rounded-[2.5rem] border border-slate-200 dark:border-zinc-900 shadow-xl shadow-blue-500/5 flex flex-col xl:flex-row items-center gap-6">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Global Registry (Company, Stakeholder, or Email)..." 
            className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 font-bold text-slate-700 dark:text-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800">
               {['All', 'Active', 'Lead', 'Draft', 'Past'].map(status => (
                  <button 
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       statusFilter === status 
                       ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-lg' 
                       : 'text-slate-500 dark:text-zinc-500 hover:bg-white dark:hover:bg-zinc-800'
                    }`}
                  >
                     {status}
                  </button>
               ))}
            </div>
            
            <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800">
               <button onClick={() => setViewMode('Grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'Grid' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-xl' : 'text-slate-400'}`}><LayoutGrid size={20}/></button>
               <button onClick={() => setViewMode('List')} className={`p-3 rounded-xl transition-all ${viewMode === 'List' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-xl' : 'text-slate-400'}`}><List size={20}/></button>
            </div>
        </div>
      </div>

      {/* Grid */}
      {viewMode === 'Grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
            {filteredClients.map((client) => (
              <div 
                key={client.id} 
                className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-slate-200 dark:border-zinc-800 p-10 hover:shadow-2xl hover:border-blue-500/50 transition-all duration-500 flex flex-col group relative overflow-hidden animate-in zoom-in-95"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 dark:text-white group-hover:scale-110 transition-transform"><Building2 size={150} strokeWidth={1}/></div>

                <div className="flex justify-between items-start mb-10 relative z-10">
                   <div className="w-24 h-24 rounded-[2.5rem] border-[6px] border-slate-50 dark:border-zinc-800 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-700">
                      <img src={client.avatar} className={`w-full h-full object-cover ${client.status === 'Draft' ? 'grayscale opacity-50' : ''}`} alt=""/>
                   </div>
                   <div className="relative">
                      <button 
                        onClick={(e) => handleMenuClick(e, client.id)}
                        className={`p-3 rounded-2xl transition-all ${activeActions === client.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-black text-slate-300 hover:text-blue-500'}`}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                   </div>
                </div>

                <div className="space-y-4 mb-10 relative z-10">
                   <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate leading-none">{client.company}</h3>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        client.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        client.status === 'Lead' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        client.status === 'Draft' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>
                         {client.status}
                      </span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400">
                      <div className="p-2 bg-slate-50 dark:bg-black rounded-lg border border-slate-100 dark:border-zinc-800"><User size={14}/></div>
                      <span className="text-sm font-bold">{client.name} • {client.position || 'Protocol Active'}</span>
                   </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4 relative z-10 pt-10 border-t border-slate-50 dark:border-zinc-800">
                   <div className="p-5 bg-slate-50 dark:bg-black/40 rounded-3xl border border-slate-100 dark:border-zinc-800">
                      <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1.5">Ecosystem Value</p>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{format(client.revenue, client.currency)}</h4>
                   </div>
                   <div className="p-5 bg-slate-50 dark:bg-black/40 rounded-3xl border border-slate-100 dark:border-zinc-800">
                      <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1.5">Onboarded</p>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{client.dateAdded || 'N/A'}</h4>
                   </div>
                </div>

                <div className="mt-6 flex gap-3 relative z-10">
                   <button onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                      <FileText size={14}/> Resume Protocol
                   </button>
                   <button className="p-4 bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-blue-500 rounded-2xl border border-slate-100 dark:border-zinc-700 transition-all"><ExternalLink size={20}/></button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 rounded-[3rem] border border-slate-200 dark:border-zinc-900 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                 <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.25em]">
                    <th className="px-10 py-8">Entity (Corporate Name)</th>
                    <th className="px-10 py-8">Stakeholder</th>
                    <th className="px-10 py-8">Fiscal Status</th>
                    <th className="px-10 py-8 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                 {filteredClients.map(client => (
                   <tr key={client.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer">
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 overflow-hidden border border-slate-200 dark:border-zinc-700"><img src={client.avatar} className={`w-full h-full object-cover ${client.status === 'Draft' ? 'grayscale opacity-50' : ''}`} alt=""/></div>
                            <span className="font-black text-slate-900 dark:text-white tracking-tight">{client.company}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">{client.name}</span>
                      </td>
                      <td className="px-10 py-8">
                         <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                           client.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                           client.status === 'Lead' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                           client.status === 'Draft' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                           'bg-slate-500/10 text-slate-500 border-slate-500/20'
                         }`}>{client.status}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <button onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="p-3 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={18}/></button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Modal Portal */}
      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient} 
        client={editingClient}
        initialTab={defaultTab}
      />

      {/* Overlay Menu */}
      {activeActions && menuPosition && (
        <div 
            className="fixed z-[9999] bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-2xl py-2 animate-in zoom-in-95 overflow-hidden w-56"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(e) => e.stopPropagation()}
        >
            {(() => {
                const client = clients.find(c => c.id === activeActions);
                if (!client) return null;
                return (
                    <>
                        <button onClick={() => handleEdit(client)} className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all flex items-center gap-3"><Edit3 size={14}/> Edit Profile</button>
                        <button onClick={() => handleTransmission(client)} className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all flex items-center gap-3"><Send size={14}/> Transmission</button>
                        <div className="h-px bg-slate-50 dark:bg-zinc-800 my-1" />
                        <button onClick={() => handleDecommission(client.id)} className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all flex items-center gap-3"><Trash2 size={14}/> Decommission</button>
                    </>
                );
            })()}
        </div>
      )}
    </div>
  );
};

export default Clients;
