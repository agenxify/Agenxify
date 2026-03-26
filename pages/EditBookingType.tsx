
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Info, 
  Plus, Trash2, Video, Phone, User, Monitor, 
  Clock, Calendar, Shield, Globe, 
  Mail, Bell, Lock, Sparkles, RefreshCw, X,
  Save, AlertCircle, Eye, Share2, Target, Users,
  CheckCircle2, Building2, Terminal, Landmark,
  Layout, Briefcase, Type, Edit3, Image as ImageIcon,
  MapPin, ShieldCheck, CheckCircle, Loader2, Bold, Italic, Palette,
  ExternalLink, Trash, Zap, Layers, LayoutTemplate, FileEdit,
  Link as LinkIcon, Code, Copy, MousePointer2, Camera,
  Languages, LogOut, AlignLeft, AlignCenter, AlignRight, Underline, MoveVertical
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { AVAILABLE_PLANS } from '../constants';
import { useBookings } from '../hooks/useBookings.ts';
import { useWorkspace } from '../context/WorkspaceContext.tsx';

const { useNavigate, useParams, useLocation } = ReactRouterDom as any;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKS = ['1st', '2nd', '3rd', '4th', '5th', 'Last'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ALL_TIMEZONES = (Intl as any).supportedValuesOf('timeZone');

const CONFERENCE_PROVIDERS = [
  { id: 'custom', name: 'Custom Link', icon: Video }
];

const PRESET_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-600', 'bg-pink-600', 'bg-cyan-500'];

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+91', country: 'IN' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
  { code: '+86', country: 'CN' },
  { code: '+55', country: 'BR' },
  { code: '+52', country: 'MX' },
  { code: '+27', country: 'ZA' },
  { code: '+971', country: 'AE' },
  { code: '+65', country: 'SG' },
  { code: '+34', country: 'ES' },
  { code: '+39', country: 'IT' },
  { code: '+7', country: 'RU' },
  { code: '+82', country: 'KR' },
  { code: '+90', country: 'TR' },
  { code: '+31', country: 'NL' },
  { code: '+46', country: 'SE' },
  { code: '+41', country: 'CH' },
  { code: '+43', country: 'AT' },
  { code: '+32', country: 'BE' },
  { code: '+45', country: 'DK' },
  { code: '+47', country: 'NO' },
  { code: '+358', country: 'FI' },
  { code: '+48', country: 'PL' },
  { code: '+351', country: 'PT' },
  { code: '+30', country: 'GR' },
  { code: '+353', country: 'IE' },
  { code: '+64', country: 'NZ' },
  { code: '+972', country: 'IL' },
  { code: '+60', country: 'MY' },
  { code: '+62', country: 'ID' },
  { code: '+63', country: 'PH' },
  { code: '+66', country: 'TH' },
  { code: '+84', country: 'VN' },
  { code: '+92', country: 'PK' },
  { code: '+880', country: 'BD' },
  { code: '+94', country: 'LK' },
  { code: '+234', country: 'NG' },
  { code: '+254', country: 'KE' },
  { code: '+20', country: 'EG' },
  { code: '+212', country: 'MA' },
  { code: '+54', country: 'AR' },
  { code: '+56', country: 'CL' },
  { code: '+57', country: 'CO' },
  { code: '+51', country: 'PE' },
  { code: '+58', country: 'VE' },
];

// --- Sub-Components ---
const Section = ({ title, children, icon: Icon }: any) => (
  <div className="bg-[#0f172a] border border-blue-500/10 rounded-[2.5rem] mb-10 transition-all hover:border-blue-500/20 relative overflow-visible">
    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
       {Icon && (
         <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
           <Icon size={240} />
         </div>
       )}
    </div>
    <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-blue-900/10 relative z-10">
      <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
      <div className="p-2 bg-zinc-800/50 rounded-full">
        <ChevronUp size={18} className="text-zinc-500" />
      </div>
    </div>
    <div className="p-10 space-y-10 relative z-20 overflow-visible">{children}</div>
  </div>
);

const Label = ({ children, required }: any) => (
  <label className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.25em] mb-4 block ml-1">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

const GridSelector = ({ items, selected, onToggle }: any) => (
  <div className="grid grid-cols-7 gap-2">
    {items.map((item: string) => {
      const isActive = selected.includes(item);
      return (
        <button 
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
            isActive 
            ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
          }`}
        >
          {item}
        </button>
      );
    })}
  </div>
);

const BlueCheckbox = ({ checked, onChange, label }: any) => (
  <label className="flex items-center gap-3 cursor-pointer group select-none">
    <div className="relative">
      <input 
        type="checkbox" 
        className="sr-only" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
      />
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
        checked 
        ? 'bg-blue-600 border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
        : 'bg-zinc-900 border-zinc-700 group-hover:border-blue-500/50'
      }`}>
        {checked && <Check size={14} strokeWidth={4} className="text-white" />}
      </div>
    </div>
    {label && <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">{label}</span>}
  </label>
);

const PremiumInput = ({ value, onChange, placeholder, icon: Icon, type = "text" }: any) => (
  <div className="relative group">
    {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />}
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full ${Icon ? 'pl-16' : 'px-8'} py-5 bg-zinc-900 border border-zinc-800 rounded-2xl font-bold text-white outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-zinc-700`}
      placeholder={placeholder}
    />
  </div>
);

const PremiumDropdown = ({ value, options, onChange, icon: Icon, onSpecialAction, isAuthError }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('dropdown-portal-root');
        if (portal && portal.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (opt: any) => {
    const val = typeof opt === 'string' ? opt : opt.name || opt.id;
    onChange(val);
    setIsOpen(false);
    if (onSpecialAction) onSpecialAction(opt);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        type="button"
        onClick={toggleDropdown}
        className={`w-full bg-zinc-900 border ${isAuthError ? 'border-rose-500/50' : 'border-zinc-800'} rounded-2xl px-6 py-5 flex items-center justify-between group hover:border-blue-600 transition-all focus:ring-4 focus:ring-blue-500/10`}
      >
        <div className="flex items-center gap-4">
          {Icon && <Icon size={18} className="text-blue-500" />}
          <span className="text-sm font-bold text-white truncate max-w-[200px]">{value || 'Select Protocol...'}</span>
          {isAuthError && (
             <div className="flex items-center gap-2 px-2 py-0.5 bg-rose-500/10 rounded-lg animate-pulse">
                <AlertCircle size={12} className="text-rose-500" />
                <span className="text-[8px] font-black uppercase text-rose-500">Action Required</span>
             </div>
          )}
        </div>
        <ChevronDown size={18} className={`text-zinc-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          id="dropdown-portal-root"
          style={{ 
              position: 'absolute', 
              top: coords.top + 8, 
              left: coords.left, 
              width: coords.width,
              zIndex: 99999
          }}
          className="bg-[#111114] border border-white/20 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10 p-2"
        >
          <div className="max-h-72 overflow-y-auto custom-scrollbar p-1">
            {options.map((opt: any) => {
              const optValue = typeof opt === 'string' ? opt : opt.name || opt.id;
              const isSelected = optValue === value;
              return (
                <button 
                  key={typeof opt === 'string' ? opt : opt.id}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all mb-1 ${
                    isSelected 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    {opt.icon && (typeof opt.icon === 'string' ? <img src={opt.icon} className="w-4 h-4" alt="" /> : <opt.icon size={14} />)}
                    <span className="truncate">{optValue}</span>
                  </div>
                  {isSelected && <CheckCircle size={14} />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- Embed & Share Modal (Kept same) ---
const EmbedShareModal = ({ form, onClose, onDone, formatCurrency }: any) => {
  const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');
  const [embedOption, setEmbedOption] = useState<'inline' | 'button'>('inline');
  const [bookingPageSettings, setBookingPageSettings] = useState({
    backgroundColor: '#ffffff',
    textColor: '#0F172A',
    buttonColor: '#2563EB'
  });

  const bookingUrl = `${window.location.origin}/#/book/${form.slug || form.id}`;
  const embedCode = `<script> const widgetSettings = {"btnText":"Book","btnBg":"${bookingPageSettings.buttonColor}","btnColor":"#ffffff"}; const pageSettings = {"bgColor":"${bookingPageSettings.backgroundColor}","textColor":"${bookingPageSettings.textColor}","primaryColor":"${bookingPageSettings.buttonColor}"}; </script> <script type="text/javascript" id="agencify-embed" src="https://app.agencify.com/widget/embed-app.js?inviteId=invite-${form.id}&type=${embedOption === 'inline' ? '1' : '2'}"></script>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-[#0c0f17]/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0f172a] w-full max-w-xl rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-400">
        
        {/* Modal Header */}
        <div className="p-10 pb-6 shrink-0">
           <div className="flex justify-between items-start mb-6">
              <div className="space-y-4">
                 <h2 className="text-3xl font-black text-white tracking-tight leading-none">{form.name || 'Untitled Event'}</h2>
                 <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> 1 → 1</span>
                    <span className="flex items-center gap-2"><Clock size={14} className="text-blue-500" /> {form.duration} Minutes</span>
                    <span className="flex items-center gap-2">Web conference</span>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white transition-all hover:rotate-90">
                <X size={32} strokeWidth={1.5} />
              </button>
           </div>

           {/* Tab Nav */}
           <div className="flex items-center justify-center gap-12 border-b border-white/5">
              <button 
                onClick={() => setActiveTab('link')}
                className={`py-5 flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'link' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                 <LinkIcon size={18} className={activeTab === 'link' ? 'text-blue-500' : ''} /> Share Link
                 {activeTab === 'link' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]" />}
              </button>
              <button 
                onClick={() => setActiveTab('embed')}
                className={`py-5 flex items-center gap-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'embed' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                 <Code size={18} className={`activeTab === 'embed' ? 'text-blue-500' : ''`} /> Website Embed
                 {activeTab === 'embed' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]" />}
              </button>
           </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-10 pt-4 space-y-10 custom-scrollbar no-scrollbar">
           {activeTab === 'link' ? (
             <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <p className="text-sm font-black text-white">Your booking page link</p>
                <div className="flex items-center gap-4 bg-black/40 border border-blue-500/20 rounded-full p-2 pl-8 transition-all hover:border-blue-500/40">
                   <span className="flex-1 text-xs font-bold text-blue-400 truncate">{bookingUrl}</span>
                   <button 
                     onClick={() => copyToClipboard(bookingUrl)}
                     className="px-8 py-3 bg-transparent text-blue-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                      Copy Link
                   </button>
                </div>
             </div>
           ) : (
             <div className="space-y-10 animate-in slide-in-from-bottom-4">
                {/* Embed options */}
                <div className="bg-[#111114] border border-blue-500/10 rounded-[2rem] p-8 space-y-6 relative group/code">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Booking code</p>
                      <button onClick={() => copyToClipboard(embedCode)} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Copy Code</button>
                   </div>
                   <div className="font-mono text-xs text-blue-100/40 leading-relaxed break-all select-all h-28 overflow-y-auto custom-scrollbar no-scrollbar">
                      {embedCode}
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/5 bg-black/40 shrink-0 flex justify-end">
           <button 
             onClick={onDone}
             className="px-14 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 transition-all active:scale-95"
           >
              Done
           </button>
        </div>
      </div>
    </div>
  );
};

// Simple localized helper for buttons
const ThemedButton = ({ children, onClick, className = "" }: any) => (
  <button onClick={onClick} className={`bg-[#1e293b] border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${className}`}>
    {children}
  </button>
);

import { useAgencySubscription } from '../hooks/useAgencySubscription';

const EditBookingType: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const { id: bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const templateId = queryParams.get('templateId');

  const { eventTypes, addEventType, loading: bookingsLoading } = useBookings();
  const { updateCreditsBalance: deductCredits } = useAgencySubscription();

  const isEditing = !!bookingId || !!templateId;

  const [isSaved, setIsSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showFormatPopup, setShowFormatPopup] = useState(false);
  const [activeMessageEdit, setActiveMessageEdit] = useState<string | null>(null);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  
  const [toast, setToast] = useState<string | null>(null);

  const formatPopupRef = useRef<HTMLDivElement>(null);
  const saveAsRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     // Component mounted
  }, []);

  const initialFormState = {
    id: bookingId || `bt-${Date.now()}`,
    name: '',
    slug: '',
    type: 'One-on-One',
    status: 'Active',
    color: 'bg-blue-500', 
    description: '',
    descriptionStyle: { color: '#ffffff', fontWeight: '500', fontStyle: 'normal', textAlign: 'left', textDecoration: 'none', fontSize: '16px', fontFamily: 'Inter', lineHeight: '1.5' },
    duration: 30,
    locationType: 'Web Conference',
    locationProvider: 'Custom Link',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autoTimezone: true,
    hideExternal: false,
    availability: {
      months: [...MONTHS], weeks: [...WEEKS], days: [...DAYS],
      hours: {
        Sunday: { active: false, slots: [{ id: 's1', start: '09:00', end: '18:00' }] },
        Monday: { active: true, slots: [{ id: 's2', start: '09:00', end: '18:00' }] },
        Tuesday: { active: true, slots: [{ id: 's3', start: '09:00', end: '18:00' }] },
        Wednesday: { active: true, slots: [{ id: 's4', start: '09:00', end: '18:00' }] },
        Thursday: { active: true, slots: [{ id: 's5', start: '09:00', end: '18:00' }] },
        Friday: { active: true, slots: [{ id: 's6', start: '09:00', end: '18:00' }] },
        Saturday: { active: false, slots: [{ id: 's7', start: '09:00', end: '18:00' }] },
      }
    },
    limits: { bufferBefore: 10, bufferAfter: 10, noticeValue: 4, noticeUnit: 'Hour', dailyLimit: 'No Limit', timeInterval: 15, bookWindowValue: 30, bookWindowUnit: 'Days' },
    notifications: { confirmation: 'Hello, your meeting is confirmed.', cancellation: 'Unfortunately, the meeting was cancelled.', reminders: 'Friendly reminder: Meeting in 24 hours.', followUpEnabled: false, followUpMessage: '' },
    intakeFields: [
      { id: '1', label: 'Full Name', type: 'text', required: true },
      { id: '2', label: 'Email Address', type: 'text', required: true }
    ],
    successRedirectUrl: '',
    location_url: '',
    country_code: '+1',
    phone_number: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: '',
    host: { firstName: 'Agency', lastName: 'Lead', title: 'Director of Growth', avatar: 'https://i.pravatar.cc/150?u=admin' }
  };

  const [form, setForm] = useState<any>(initialFormState);

  useEffect(() => {
    if (bookingId && eventTypes.length > 0) {
      const found = eventTypes.find((t: any) => t.id === bookingId);
      if (found) {
          setForm({
              ...initialFormState,
              ...found,
              name: found.name || found.title,
              descriptionStyle: { ...initialFormState.descriptionStyle, ...(found.descriptionStyle || {}) },
              availability: { ...initialFormState.availability, ...(found.availability || {}), hours: { ...initialFormState.availability.hours, ...(found.availability?.hours || {}) } },
              limits: { ...initialFormState.limits, ...(found.limits || {}) },
              notifications: { ...initialFormState.notifications, ...(found.notifications || {}) },
              host: { ...initialFormState.host, ...(found.host || {}) },
              intakeFields: found.intakeFields || initialFormState.intakeFields
          });
      }
    } else if (templateId && eventTypes.length > 0) {
      const foundTemplate = eventTypes.find((t: any) => t.id === templateId);
      if (foundTemplate) {
        setForm({
            ...initialFormState,
            ...foundTemplate,
            id: `bt-${Date.now()}`,
            status: 'Active',
            name: `${foundTemplate.name || foundTemplate.title || 'Custom'} (Custom)`
        });
      }
    }
  }, [bookingId, templateId, eventTypes]);

  if (isEditing && bookingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Retrieving Protocol Configuration...</p>
        </div>
      </div>
    );
  }

  const handleCommit = (status: 'Active' | 'Draft' | 'Template' = 'Active', andPreview = false) => {
    const finalColor = form.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    const payload = { 
      ...form, 
      title: form.name || 'Untitled Protocol',
      active: status === 'Active',
      locationType: form.locationType, 
      locationProvider: form.locationType === 'Web Conference' ? form.locationProvider : form.locationType,
      status,
      color: finalColor,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `meeting-${form.id}`
    };
    
    addEventType(payload);
    setIsSaved(true);
    
    if (andPreview) {
      navigate(`/book/${payload.slug}`);
    } else {
      navigate('/bookings');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalColor = form.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
      const payload = { 
        ...form, 
        title: form.name || 'Untitled Protocol',
        active: form.status === 'Active',
        locationType: form.locationType, 
        locationProvider: form.locationType === 'Web Conference' ? form.locationProvider : form.locationType,
        status: form.status || 'Active',
        color: finalColor,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `meeting-${form.id}`
      };
      
      await addEventType(payload);
      setIsSaved(true);
      showToast("Protocol Updated");
    } catch (e) {
      console.error(e);
      showToast("Save Failed");
    } finally {
      setSaving(false);
    }
  };

  const update = (path: string, val: any) => {
    setIsSaved(false);
    const keys = path.split('.');
    setForm((prev: any) => {
      const next = { ...prev };
      let current = next;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = val;
      return next;
    });
  };

  const toggleListItem = (path: string, item: string) => {
    const keys = path.split('.');
    const currentList = keys.reduce((o: any, k: string) => o?.[k], form) as string[] || [];
    const newList = currentList.includes(item) ? currentList.filter(i => i !== item) : [...currentList, item];
    update(path, newList);
  };

  const deductCreditsFn = async () => {
    await deductCredits(3);
  };

  const handleAiGenerate = async () => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Write a professional description for a booking type named "${form.name || 'a meeting'}". The duration is ${form.duration} minutes. Focus on strategic alignment.`;
      await deductCreditsFn();
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (response.text) update('description', response.text.trim());
    } catch (e) { 
        console.error(e); 
        showToast("AI Uplink Failed");
    } finally { 
        setIsAiGenerating(false); 
    }
  };

  const toggleFormat = (key: 'bold' | 'italic') => {
    const style = { ...form.descriptionStyle };
    if (key === 'bold') style.fontWeight = style.fontWeight === 'bold' ? '500' : 'bold';
    if (key === 'italic') style.fontStyle = style.fontStyle === 'italic' ? 'normal' : 'italic';
    update('descriptionStyle', style);
  };
  const addIntakeField = () => {
    const newField: any = { id: `field-${Date.now()}`, label: '', type: 'text', required: false };
    update('intakeFields', [...(form.intakeFields || []), newField]);
  };

  const removeIntakeField = (id: string) => {
    update('intakeFields', (form.intakeFields || []).filter((f: any) => f.id !== id));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { update('host.avatar', reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const showToast = (msg: string) => {
     setToast(msg);
     setTimeout(() => setToast(null), 3000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white overflow-hidden">
      <style>{`
        .premium-textarea::-webkit-scrollbar { width: 6px; }
        .premium-textarea::-webkit-scrollbar-track { background: transparent; }
        .premium-textarea::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
        .premium-textarea::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
      
      {isEmbedModalOpen && <EmbedShareModal form={form} onClose={() => setIsEmbedModalOpen(false)} onDone={() => handleCommit()} formatCurrency={formatCurrency} />}

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 text-white px-8 py-4 rounded-full font-black text-sm shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 border border-white/10">
          <CheckCircle2 size={18} className="text-blue-500" /> {toast}
        </div>
      )}

      {/* Content Container - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
      
        {/* Sticky Header */}
        <div className="sticky top-0 z-[5000] bg-[#09090b]/95 backdrop-blur-xl border-b border-white/10 px-8 py-3.5 flex items-center justify-between">
            <button onClick={() => navigate('/bookings')} className="flex items-center gap-1.5 text-slate-400 hover:text-white font-bold text-sm transition-all group">
                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" /> Back
            </button>
            
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                <span className="text-xs font-bold text-slate-400">Hide External Calendar Slots</span>
                <button 
                    onClick={() => update('hideExternal', !form.hideExternal)}
                    className={`w-11 h-6 rounded-full relative transition-all duration-300 ${form.hideExternal ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${form.hideExternal ? 'left-6' : 'left-1'}`} />
                </button>
                </div>
                
                <div className="flex items-center gap-3">
                <div className="relative" ref={saveAsRef}>
                    <button 
                        onClick={() => setIsSaveAsOpen(!isSaveAsOpen)}
                        className={`px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm ${isSaveAsOpen ? 'border-blue-600' : 'border-zinc-800 hover:bg-zinc-800'}`}
                    >
                        Save As <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isSaveAsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isSaveAsOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-[5001] p-1.5">
                        <button onClick={() => { handleCommit('Draft'); setIsSaveAsOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-all group">
                            <FileEdit size={18} className="text-zinc-500 group-hover:text-amber-500" /> Save as Draft
                        </button>
                        <button onClick={() => { handleCommit('Template'); setIsSaveAsOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-all group">
                            <LayoutTemplate size={18} className="text-zinc-500 group-hover:text-indigo-500" /> Save as Template
                        </button>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => handleCommit('Active', true)}
                    className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold border border-zinc-800 hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-sm"
                >
                    <Eye size={16} className="text-blue-500" /> Preview
                </button>
                <button 
                    onClick={() => setIsEmbedModalOpen(true)}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-blue-900/20"
                >
                    {bookingId ? 'Update' : 'Create'}
                </button>
                </div>
            </div>
        </div>

        <div className="max-w-5xl mx-auto mt-12 space-y-12 px-4 md:px-0 pb-40">
            
            {/* EVENT CORE */}
            <Section title="System Parameters" icon={Target}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                <div className="space-y-3">
                    <Label required>Event Strategy</Label>
                    <PremiumDropdown 
                    value={form.type}
                    options={['One-on-One', 'Group Session', 'Collective', 'Round Robin']}
                    onChange={(v: string) => update('type', v)}
                    icon={Users}
                    />
                </div>
                <div className="space-y-3">
                    <Label required>Protocol Identity (Name)</Label>
                    <PremiumInput 
                    value={form.name}
                    onChange={(v: string) => update('name', v)}
                    placeholder="e.g. Strategic Discovery Call"
                    icon={Type}
                    />
                </div>
                <div className="space-y-3">
                    <Label required>Global Timezone Sync</Label>
                    <PremiumDropdown 
                    value={form.timezone}
                    options={ALL_TIMEZONES.map((tz: string) => ({ id: tz, name: tz }))}
                    onChange={(v: string) => update('timezone', v)}
                    icon={Languages}
                    />
                </div>
            </div>
            
            <div className="space-y-3 relative z-10">
                <Label>Directive Briefing</Label>
                <div className="relative">
                    <textarea 
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-10 font-medium h-64 outline-none focus:border-blue-600 transition-all resize-none shadow-inner text-white premium-textarea"
                    style={{ 
                        color: form.descriptionStyle?.color || '#ffffff',
                        fontWeight: form.descriptionStyle?.fontWeight || '500',
                        fontStyle: form.descriptionStyle?.fontStyle || 'normal',
                        textAlign: form.descriptionStyle?.textAlign || 'left',
                        textDecoration: form.descriptionStyle?.textDecoration || 'none',
                        fontSize: form.descriptionStyle?.fontSize || '15px',
                        fontFamily: form.descriptionStyle?.fontFamily || 'Inter',
                        lineHeight: '1.8'
                    }}
                    placeholder="Detail the intent of this mission window..."
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    />
                    
                    <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-zinc-800/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/5 shadow-2xl z-10">
                    <div className="relative" ref={formatPopupRef}>
                        <button 
                            type="button"
                            onClick={() => setShowFormatPopup(!showFormatPopup)}
                            className={`p-1.5 transition-all rounded-lg ${showFormatPopup ? 'text-blue-500 bg-white/10' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Edit3 size={16} />
                        </button>
                        
                        {showFormatPopup && (
                            <div className="absolute bottom-full right-0 mb-4 bg-[#1e293b] border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[280px] animate-in zoom-in-95 origin-bottom-right z-[10005] max-h-[400px] overflow-y-auto custom-scrollbar">
                                <div className="space-y-4">
                                    {/* Style Toggles */}
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Typography</p>
                                        <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                                             <button onClick={() => update('descriptionStyle.fontWeight', form.descriptionStyle?.fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex-1 p-2 rounded-lg transition-all ${form.descriptionStyle?.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><Bold size={14}/></button>
                                             <button onClick={() => update('descriptionStyle.fontStyle', form.descriptionStyle?.fontStyle === 'italic' ? 'normal' : 'italic')} className={`flex-1 p-2 rounded-lg transition-all ${form.descriptionStyle?.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><Italic size={14}/></button>
                                             <button onClick={() => update('descriptionStyle.textDecoration', form.descriptionStyle?.textDecoration === 'underline' ? 'none' : 'underline')} className={`flex-1 p-2 rounded-lg transition-all ${form.descriptionStyle?.textDecoration === 'underline' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><Underline size={14}/></button>
                                        </div>
                                    </div>

                                    {/* Alignment */}
                                     <div className="space-y-2">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Alignment</p>
                                        <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                                             {['left', 'center', 'right'].map(align => (
                                                <button 
                                                    key={align} 
                                                    onClick={() => update('descriptionStyle.textAlign', align)}
                                                    className={`flex-1 p-2 rounded-lg transition-all ${form.descriptionStyle?.textAlign === align ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {align === 'left' && <AlignLeft size={14}/>}
                                                    {align === 'center' && <AlignCenter size={14}/>}
                                                    {align === 'right' && <AlignRight size={14}/>}
                                                </button>
                                             ))}
                                        </div>
                                    </div>

                                    {/* Font Size */}
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Size</p>
                                        <div className="flex items-center bg-black/20 rounded-xl px-2">
                                            <Type size={12} className="text-zinc-500 mr-2"/>
                                            <input 
                                                type="number" 
                                                className="w-full bg-transparent py-2 text-xs font-bold text-white outline-none" 
                                                value={parseInt(form.descriptionStyle?.fontSize) || 16}
                                                onChange={(e) => update('descriptionStyle.fontSize', `${e.target.value}px`)}
                                            />
                                        </div>
                                    </div>

                                    {/* Colors */}
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Color</p>
                                        <div className="grid grid-cols-5 gap-2">
                                            {['#ffffff', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#06b6d4', '#94a3b8', '#1e293b'].map(c => (
                                                <button 
                                                    key={c} 
                                                    onClick={() => update('descriptionStyle.color', c)}
                                                    className={`w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110 ${form.descriptionStyle?.color === c ? 'border-white' : 'border-transparent'}`} 
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-px h-4 bg-zinc-700" />
                    <button 
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={isAiGenerating}
                        className={`p-1.5 transition-all rounded-lg ${isAiGenerating ? 'text-blue-500' : 'text-zinc-400 hover:text-blue-500'}`}
                        title="Generate with AI (3 Credits)"
                    >
                        {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                    </div>
                </div>
            </div>

            <div className="pt-10 border-t border-white/5 relative z-10">
                <h4 className="text-lg font-black text-white mb-10 flex items-center gap-3">Stakeholder Intel <ChevronUp size={16} className="text-zinc-700"/></h4>
                <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="relative group">
                    <div className="w-32 h-32 rounded-[2.5rem] border-[4px] border-blue-500/20 p-1 bg-zinc-900 shadow-2xl relative overflow-hidden">
                        <img src={form.host?.avatar} className="w-full h-full object-cover rounded-[2rem]" alt=""/>
                    </div>
                    <button 
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-full shadow-lg border-4 border-[#0f172a] hover:scale-110 transition-transform active:scale-95"
                    >
                        <Camera size={12}/>
                    </button>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-8 w-full">
                    <div className="space-y-3">
                        <Label>Primary Name</Label>
                        <input className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-7 py-4 text-white font-bold outline-none focus:border-blue-600 transition-all" value={form.host?.firstName} onChange={e => update('host.firstName', e.target.value)} placeholder="Given Name" />
                    </div>
                    <div className="space-y-3">
                        <Label>Secondary Name</Label>
                        <input className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-7 py-4 text-white font-bold outline-none focus:border-blue-600 transition-all" value={form.host?.lastName} onChange={e => update('host.lastName', e.target.value)} placeholder="Surname" />
                    </div>
                    <div className="col-span-full space-y-3">
                        <Label>Authorized Title</Label>
                        <input className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-7 py-4 text-white font-bold outline-none focus:border-blue-600 transition-all" value={form.host?.title} onChange={e => update('host.title', e.target.value)} placeholder="e.g. Chief of Operations" />
                    </div>
                    </div>
                </div>
            </div>
            </Section>

            {/* APPOINTMENT SCHEDULING */}
            <Section title="Tactical Scheduling" icon={Calendar}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                <div className="space-y-4">
                    <Label>Operational Window (Duration)</Label>
                    <PremiumDropdown 
                    value={`${form.duration} Minutes`}
                    options={[15, 30, 45, 60, 90, 120].map(m => ({ id: m, name: `${m} Minutes` }))}
                    onChange={(v: string) => update('duration', parseInt(v))}
                    icon={Clock}
                    />
                </div>
                
                <div className="space-y-4">
                    <Label required>Rendezvous Protocol</Label>
                    <div className="flex gap-6 items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 h-[64px]">
                    {['Web Conference', 'Phone Call', 'In-Person'].map(t => (
                        <div key={t} onClick={() => update('locationType', t)} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.locationType === t ? 'border-blue-600 bg-blue-600' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                                {form.locationType === t && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${form.locationType === t ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{t}</span>
                        </div>
                    ))}
                    </div>
                    {form.locationType === 'Web Conference' && (
                    <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                        <div className="bg-zinc-900/50 border border-blue-500/20 rounded-[2rem] p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                    <Video className="text-blue-500" size={18} />
                                </div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Customize your meeting link</h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden focus-within:border-blue-600 transition-all">
                                    <div className="px-6 py-5 bg-zinc-900/50 text-zinc-500 text-sm font-bold border-r border-zinc-800 select-none whitespace-nowrap">
                                        https://meet.jit.si/agencify/
                                    </div>
                                    <input 
                                        type="text"
                                        value={form.location_url || ''}
                                        onChange={e => update('location_url', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                        className="flex-1 px-6 py-5 bg-transparent text-white text-sm font-bold outline-none placeholder:text-zinc-700"
                                        placeholder="enter here"
                                    />
                                </div>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    {saving ? 'Saving Changes...' : 'Save Meeting Link'}
                                </button>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                                A unique 5-digit security code will be appended to this link for every booking.
                            </p>
                        </div>
                    </div>
                    )}

                    {form.locationType === 'Phone Call' && (
                    <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                        <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-[2rem] p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-600/20 rounded-lg">
                                    <Phone className="text-emerald-500" size={18} />
                                </div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Host Phone Number</h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden focus-within:border-emerald-600 transition-all">
                                    <select 
                                        value={form.country_code || '+1'}
                                        onChange={e => update('country_code', e.target.value)}
                                        className="px-6 py-5 bg-zinc-900/50 text-white text-sm font-bold border-r border-zinc-800 outline-none cursor-pointer appearance-none"
                                    >
                                        {COUNTRY_CODES.map(c => (
                                            <option key={c.code} value={c.code}>{c.country} ({c.code})</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="tel"
                                        value={form.phone_number || ''}
                                        onChange={e => update('phone_number', e.target.value)}
                                        className="flex-1 px-6 py-5 bg-transparent text-white text-sm font-bold outline-none placeholder:text-zinc-700"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    {saving ? 'Saving Changes...' : 'Save Phone Number'}
                                </button>
                            </div>
                        </div>
                    </div>
                    )}

                    {form.locationType === 'In-Person' && (
                    <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                        <div className="bg-zinc-900/50 border border-amber-500/20 rounded-[2rem] p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-600/20 rounded-lg">
                                    <MapPin className="text-amber-500" size={18} />
                                </div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Meeting Location Details</h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <input 
                                        type="text"
                                        value={form.address_street || ''}
                                        onChange={e => update('address_street', e.target.value)}
                                        className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white text-sm font-bold outline-none focus:border-amber-600 transition-all placeholder:text-zinc-700"
                                        placeholder="Street Address"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            type="text"
                                            value={form.address_city || ''}
                                            onChange={e => update('address_city', e.target.value)}
                                            className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white text-sm font-bold outline-none focus:border-amber-600 transition-all placeholder:text-zinc-700"
                                            placeholder="City"
                                        />
                                        <input 
                                            type="text"
                                            value={form.address_state || ''}
                                            onChange={e => update('address_state', e.target.value)}
                                            className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white text-sm font-bold outline-none focus:border-amber-600 transition-all placeholder:text-zinc-700"
                                            placeholder="State / Province"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            type="text"
                                            value={form.address_zip || ''}
                                            onChange={e => update('address_zip', e.target.value)}
                                            className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white text-sm font-bold outline-none focus:border-amber-600 transition-all placeholder:text-zinc-700"
                                            placeholder="ZIP / Postal Code"
                                        />
                                        <input 
                                            type="text"
                                            value={form.address_country || ''}
                                            onChange={e => update('address_country', e.target.value)}
                                            className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white text-sm font-bold outline-none focus:border-amber-600 transition-all placeholder:text-zinc-700"
                                            placeholder="Country"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-800 space-y-3">
                                    <Label>Contact Phone (Optional)</Label>
                                    <div className="flex items-center bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden focus-within:border-amber-600 transition-all">
                                        <select 
                                            value={form.country_code || '+1'}
                                            onChange={e => update('country_code', e.target.value)}
                                            className="px-6 py-4 bg-zinc-900/50 text-white text-sm font-bold border-r border-zinc-800 outline-none cursor-pointer appearance-none"
                                        >
                                            {COUNTRY_CODES.map(c => (
                                                <option key={c.code} value={c.code}>{c.country} ({c.code})</option>
                                            ))}
                                        </select>
                                        <input 
                                            type="tel"
                                            value={form.phone_number || ''}
                                            onChange={e => update('phone_number', e.target.value)}
                                            className="flex-1 px-6 py-4 bg-transparent text-white text-sm font-bold outline-none placeholder:text-zinc-700"
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 mt-4"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    {saving ? 'Saving Changes...' : 'Save Location Details'}
                                </button>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            </div>

            <div className="pt-10 border-t border-white/5">
                <Label required>Availability Matrix</Label>
                {/* ... (Existing availability UI) ... */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    <div className="xl:col-span-7 space-y-10">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Select Period (Months)</span>
                            <BlueCheckbox 
                                label="ALL_PERIODS"
                                checked={form.availability?.months?.length === 12} 
                                onChange={() => update('availability.months', form.availability?.months?.length === 12 ? [] : [...MONTHS])} 
                            />
                        </div>
                        <GridSelector items={MONTHS} selected={form.availability?.months || []} onToggle={(i: string) => toggleListItem('availability.months', i)} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Select Frequency (Weeks)</span>
                            <BlueCheckbox 
                                label="ALL_CYCLES"
                                checked={form.availability?.weeks?.length === 6} 
                                onChange={() => update('availability.weeks', form.availability?.weeks?.length === 6 ? [] : [...WEEKS])} 
                            />
                        </div>
                        <GridSelector items={WEEKS} selected={form.availability?.weeks || []} onToggle={(i: string) => toggleListItem('availability.weeks', i)} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Select Active Nodes (Days)</span>
                            <BlueCheckbox 
                                label="ALL_NODES"
                                checked={form.availability?.days?.length === 7} 
                                onChange={() => update('availability.days', form.availability?.days?.length === 7 ? [] : [...DAYS])} 
                            />
                        </div>
                        <GridSelector items={DAYS} selected={form.availability?.days || []} onToggle={(i: string) => toggleListItem('availability.days', i)} />
                    </div>
                    </div>

                    <div className="xl:col-span-5 border-l border-white/5 pl-10 space-y-10">
                    <div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] block mb-6">General Operating Hours</span>
                        <div className="space-y-5">
                            {Object.entries(form.availability?.hours || {}).map(([day, config]: [string, any]) => (
                                <div key={day} className={`flex items-start gap-4 animate-in fade-in slide-in-from-right-2 ${!config.active ? 'opacity-40' : ''}`}>
                                    <span className={`w-10 text-[10px] font-black uppercase mt-4 transition-colors ${config.active ? 'text-blue-500' : 'text-zinc-700'}`}>{day.substring(0,3)}</span>
                                    {config.active ? (
                                    <div className="flex-1 space-y-2">
                                        {(config.slots || []).map((slot: any, i: number) => (
                                            <div key={slot.id} className="flex items-center gap-3 bg-zinc-900/80 border border-white/5 rounded-2xl px-4 py-3 group/slot hover:border-blue-500/20 transition-all">
                                                <input type="time" className="bg-transparent text-[11px] font-black text-white outline-none focus:text-blue-500" value={slot.start} onChange={e => {
                                                const newSlots = [...config.slots];
                                                newSlots[i] = { ...newSlots[i], start: e.target.value };
                                                update(`availability.hours.${day}.slots`, newSlots);
                                                }} />
                                                <span className="text-zinc-700 font-bold opacity-30">—</span>
                                                <input type="time" className="bg-transparent text-[11px] font-black text-white outline-none focus:text-blue-500" value={slot.end} onChange={e => {
                                                const newSlots = [...config.slots];
                                                newSlots[i] = { ...newSlots[i], end: e.target.value };
                                                update(`availability.hours.${day}.slots`, newSlots);
                                                }} />
                                                <div className="flex gap-1 ml-auto opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => {
                                                    const newSlots = [...config.slots, { id: `s-${Date.now()}`, start: '13:00', end: '17:00' }];
                                                    update(`availability.hours.${day}.slots`, newSlots);
                                                }} className="p-1.5 text-zinc-600 hover:text-blue-500"><Plus size={14}/></button>
                                                <button type="button" onClick={() => {
                                                    if (config.slots.length === 1) update(`availability.hours.${day}.active`, false);
                                                    else update(`availability.hours.${day}.slots`, config.slots.filter((s: any) => s.id !== slot.id));
                                                }} className="p-1.5 text-zinc-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    ) : (
                                    <button type="button" onClick={() => update(`availability.hours.${day}.active`, true)} className="flex-1 py-3 text-left text-[10px] font-black text-zinc-700 uppercase hover:text-zinc-500 transition-colors border-b border-transparent hover:border-zinc-800">Closed Registry</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
                </div>
            </div>
            </Section>

            {/* LIMITS HUB */}
            <Section title="Throughput Controls" icon={Shield}>
               {/* ... (Existing Limits UI) ... */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                <div className="space-y-6">
                    <div>
                    <Label>Buffer Protocols</Label>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">Secure operational gaps between adjacent appointments.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Pre-Event (MIN)</span>
                        <PremiumDropdown 
                            value={`${form.limits?.bufferBefore || 0} MIN`}
                            options={[0, 5, 10, 15, 30, 60].map(m => ({ id: m, name: `${m} MIN` }))}
                            onChange={(v: string) => update('limits.bufferBefore', parseInt(v))}
                        />
                        </div>
                        <div className="space-y-2">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Post-Event (MIN)</span>
                        <PremiumDropdown 
                            value={`${form.limits?.bufferAfter || 0} MIN`}
                            options={[0, 5, 10, 15, 30, 60].map(m => ({ id: m, name: `${m} MIN` }))}
                            onChange={(v: string) => update('limits.bufferAfter', parseInt(v))}
                        />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <Label>Minimum Tactical Notice</Label>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">Prevention of immediate calendar interruptions.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Magnitude</span>
                        <PremiumDropdown 
                            value={form.limits?.noticeValue || 4}
                            options={[1, 2, 4, 8, 12, 24, 48].map(v => ({ id: v, name: v }))}
                            onChange={(v: any) => update('limits.noticeValue', parseInt(v))}
                        />
                        </div>
                        <div className="space-y-2">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Unit</span>
                        <PremiumDropdown 
                            value={form.limits?.noticeUnit || 'Hour'}
                            options={['Hour', 'Day', 'Week'].map(u => ({ id: u, name: u }))}
                            onChange={(v: string) => update('limits.noticeUnit', v)}
                        />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Daily Throughput Cap</Label>
                    <PremiumDropdown 
                        value={form.limits?.dailyLimit || 'No Limit'}
                        options={['No Limit', '1', '2', '5', '10'].map(l => ({ id: l, name: l }))}
                        onChange={(v: string) => update('limits.dailyLimit', v)}
                    />
                </div>

                <div className="space-y-3">
                    <Label>Registry Interval</Label>
                    <PremiumDropdown 
                        value={`${form.limits?.timeInterval || 15} Minutes`}
                        options={[10, 15, 30, 60].map(i => ({ id: i, name: `${i} Minutes` }))}
                        onChange={(v: string) => update('limits.timeInterval', parseInt(v))}
                    />
                </div>

                <div className="col-span-full pt-10 border-t border-white/5">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                        <Label>Booking Horizon (Days)</Label>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed mb-6">Specify the maximum future window available for public scheduling.</p>
                        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-3 shadow-inner max-w-sm">
                            <button onClick={() => update('limits.bookWindowValue', Math.max(1, (form.limits?.bookWindowValue || 30) - 5))} className="p-4 bg-zinc-800 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><ChevronLeft size={20}/></button>
                            <div className="flex-1 text-center">
                                <span className="text-4xl font-black text-white">{form.limits?.bookWindowValue || 30}</span>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Days</span>
                            </div>
                            <button onClick={() => update('limits.bookWindowValue', (form.limits?.bookWindowValue || 30) + 5)} className="p-4 bg-zinc-800 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><ChevronRight size={20}/></button>
                        </div>
                        </div>
                        <div className="p-10 bg-indigo-600/5 border border-indigo-500/10 rounded-[3rem] flex items-center gap-6 max-w-sm">
                        <div className="p-4 bg-zinc-900 rounded-2xl text-indigo-500 shadow-xl border border-white/5"><Shield size={28}/></div>
                        <div>
                            <p className="text-sm font-black text-white">Horizon Security</p>
                            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Limits long-range tactical clutter in the registry.</p>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
            </Section>

            {/* NOTIFICATIONS */}
            <Section title="Automation & Outreach" icon={Zap}>
              {/* ... (Existing Notifications UI) ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[
                    { id: 'confirmation', label: 'Acceptance Manifest', icon: Mail, color: 'blue' },
                    { id: 'cancellation', label: 'Cancellation Notice', icon: AlertCircle, color: 'rose' },
                    { id: 'reminders', label: 'Tactical Reminders', icon: Bell, color: 'amber' },
                ].map(notif => (
                    <div key={notif.id} className={`bg-zinc-950 p-8 rounded-[2.5rem] border border-white/5 group hover:border-blue-600/20 transition-all`}>
                    <div className="flex items-center justify-between mb-6">
                        <Label>{notif.label}</Label>
                        <div className={`p-2 bg-blue-600 text-white rounded-lg shadow-lg`}>
                            <notif.icon size={14}/>
                        </div>
                    </div>
                    {activeMessageEdit === notif.id ? (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <textarea 
                            autoFocus
                            className="w-full bg-zinc-900 border border-blue-500/30 rounded-2xl p-4 text-xs text-white outline-none h-24"
                            value={form.notifications?.[notif.id] || ''}
                            onChange={(e) => update(`notifications.${notif.id}`, e.target.value)}
                            />
                            <button onClick={() => setActiveMessageEdit(null)} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg">Apply Protocol</button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                            <span className="text-xs font-bold text-zinc-400 truncate pr-4">{form.notifications?.[notif.id] || 'N/A'}</span>
                            <button onClick={() => setActiveMessageEdit(notif.id)} className={`p-2 text-blue-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all`}><Edit3 size={14}/></button>
                        </div>
                    )}
                    </div>
                ))}

                <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-white/5 group hover:border-emerald-600/20 transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <Label>Post-Mission Sync</Label>
                        <button 
                        onClick={() => update('notifications.followUpEnabled', !form.notifications?.followUpEnabled)}
                        className={`w-11 h-6 rounded-full relative transition-all ${form.notifications?.followUpEnabled ? 'bg-emerald-600' : 'bg-zinc-800'}`}
                        >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${form.notifications?.followUpEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                    <div className={`flex items-center justify-between bg-zinc-900 rounded-2xl p-4 border border-zinc-800 ${!form.notifications?.followUpEnabled ? 'opacity-30' : ''}`}>
                        <span className="text-xs font-bold text-zinc-400">Automated feedback protocol...</span>
                        <button disabled={!form.notifications?.followUpEnabled} className="p-2 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"><Edit3 size={14}/></button>
                    </div>
                </div>
            </div>
            </Section>

            {/* BOOKING OPTIONS */}
            <Section title="Intake Framework" icon={Landmark}>
                {/* ... (Existing Intake UI) ... */}
                <div className="flex justify-between items-center mb-8 px-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Required Information Nodes</p>
                <button onClick={addIntakeField} className="flex items-center gap-2 text-blue-500 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Plus size={16} strokeWidth={3}/></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Append Node</span>
                </button>
            </div>
            
            <div className="space-y-4">
                {(form.intakeFields || []).map((field: any, idx: number) => (
                    <div key={field.id} className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between group hover:border-blue-600/20 transition-all shadow-inner gap-6 animate-in slide-in-from-left duration-300">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="p-4 bg-zinc-900 rounded-2xl text-zinc-600 shadow-xl border border-white/5"><Lock size={20}/></div>
                        <div className="flex-1">
                            {idx === 0 || idx === 1 ? (
                                <>
                                <p className="text-sm font-black text-white">{field.label}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Core Registry Segment • Mandatory</p>
                                </>
                            ) : (
                                <div className="space-y-2">
                                <input 
                                    className="w-full bg-transparent border-b border-zinc-800 focus:border-blue-500 outline-none text-sm font-black text-white py-1"
                                    value={field.label}
                                    onChange={(e) => {
                                        const next = [...form.intakeFields];
                                        next[idx].label = e.target.value;
                                        update('intakeFields', next);
                                    }}
                                />
                                <div className="flex gap-4 items-center">
                                    <select 
                                        className="bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase rounded px-2 py-1 outline-none text-zinc-400"
                                        value={field.type}
                                        onChange={(e) => {
                                        const next = [...form.intakeFields];
                                        next[idx].type = e.target.value as any;
                                        update('intakeFields', next);
                                        }}
                                    >
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Paragraph</option>
                                        <option value="boolean">Switch</option>
                                    </select>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input 
                                        type="checkbox" 
                                        className="w-3 h-3 accent-blue-600" 
                                        checked={field.required}
                                        onChange={(e) => {
                                            const next = [...form.intakeFields];
                                            next[idx].required = e.target.checked;
                                            update('intakeFields', next);
                                        }}
                                        />
                                        <span className="text-[9px] font-black text-zinc-600 uppercase">Required</span>
                                    </label>
                                </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {idx === 0 || idx === 1 ? (
                        <CheckCircle2 className="text-blue-600" size={24}/>
                    ) : (
                        <button onClick={() => removeIntakeField(field.id)} className="p-3 text-zinc-700 hover:text-rose-500 hover:bg-rose-50/10 rounded-xl transition-all"><Trash2 size={20}/></button>
                    )}
                    </div>
                ))}
            </div>
            
            <div className="pt-12 border-t border-white/5 mt-12">
                <Label>Success Uplink Redirection</Label>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed mb-6">System behavior upon successful mission acceptance. Redirect to custom partner node or default dashboard.</p>
                <div className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] shadow-inner">
                    <div className="flex items-center gap-4">
                        <Globe size={18} className="text-blue-500" />
                        <input 
                        className="flex-1 bg-transparent outline-none border-b border-zinc-800 focus:border-blue-500 text-sm font-black text-white py-1 placeholder:text-zinc-700"
                        placeholder="https://..."
                        value={form.successRedirectUrl}
                        onChange={(e) => update('successRedirectUrl', e.target.value)}
                        />
                    </div>
                    {!form.successRedirectUrl && <p className="text-[10px] font-black text-zinc-700 italic mt-4 uppercase tracking-widest">Initialize default AgencyOS confirmation terminal...</p>}
                </div>
            </div>
            </Section>

        </div>
      </div>
    </div>
  );
};

export default EditBookingType;
