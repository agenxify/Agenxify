import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Calendar, User, Mail, Hash, DollarSign, 
  Save, Send, Download, Eye, EyeOff, MoreHorizontal, Settings2,
  CheckCircle2, AlertCircle, FileText, ChevronDown, GripVertical,
  Printer, X, Copy, RefreshCw, Calculator, CreditCard, Box,
  Zap, ShieldCheck, ExternalLink, Globe, Layout, Layers,
  BellRing, Lock, History, Percent, FileCheck, Landmark,
  QrCode, Stamp, FileSignature, Receipt, Package, Truck,
  HelpCircle, MoreVertical, Search, Upload, XCircle, Check,
  Share2, MousePointer2, ArrowRight, Sparkles, Building2, Bell, Shield, Info,
  Image as ImageIcon,
  CheckCircle as ValidatedIcon,
  Users,
  SearchIcon,
  Loader2,
  Paperclip,
  Flame,
  ShieldAlert,
  Target,
  MessageSquare,
  Moon,
  Sun
} from 'lucide-react';
import { MOCK_CLIENTS, MOCK_SERVICES, MOCK_PROJECTS, MOCK_INVOICES, MOCK_PROFILES, MOCK_MESSAGES } from '../constants';
import { GLOBAL_CURRENCIES } from '../constants';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { Service } from '../types';
import * as ReactRouterDom from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useInvoices } from '../hooks/useInvoices.ts';
import { useClients } from '../hooks/useClients';
import { useTeam } from '../hooks/useTeam';
import { useServices } from '../hooks/useServices.ts';

const { useParams, useNavigate } = ReactRouterDom as any;

// --- Constants ---


const EMAIL_TEMPLATES = [
  { id: 't1', name: 'Standard Brief', thumbnail: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=400&q=80' },
  { id: 't2', name: 'Invoice Focus', thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80' },
  { id: 't3', name: 'Premium Modern', thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80' },
];

// --- Premium UI Components ---

const AgencyToggle = ({ active, onToggle, label, sub }: { active: boolean, onToggle: () => void, label?: string, sub?: string }) => (
  <div className="flex items-center justify-between group cursor-pointer py-1.5" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
    <div className="flex-1 pr-4">
      {label && <p className="text-sm font-black text-slate-900 dark:text-zinc-300 uppercase tracking-widest group-hover:text-blue-500 transition-colors leading-none mb-1.5">{label}</p>}
      {sub && <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-tighter leading-none">{sub}</p>}
    </div>
    <div className={`w-11 h-6 rounded-full relative transition-all duration-500 shadow-inner flex items-center shrink-0 ${active ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-200 dark:bg-zinc-800'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_2px_5px_rgba(0,0,0,0.2)] ${active ? 'left-[24px]' : 'left-1'}`} />
    </div>
  </div>
);

const LogicSection = ({ title, icon: Icon, children, defaultOpen = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden transition-all shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-slate-50/50 dark:bg-black/20 hover:bg-slate-50 dark:hover:bg-black/40 transition-colors border-b border-slate-100 dark:border-zinc-800"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-blue-500" />
          <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">{title}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-500 ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
};

const PremiumSelect = ({ label, value, options, onChange, icon: Icon, isPreviewMode, isAction = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const selected = !isAction ? options.find((o: any) => o.code === value || o.id === value || o.name === value) : null;

  if (isPreviewMode) {
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="font-black text-white">{selected?.name || value}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={ref}>
      {label && <p className="text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.4em] ml-2">{label} :</p>}
      <div className="relative">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-6 py-4 border rounded-2xl font-black text-sm outline-none flex items-center justify-between transition-all group ${
            isAction 
            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/10 hover:bg-blue-700' 
            : 'bg-slate-50 dark:bg-black/40 border-slate-100 dark:border-zinc-800 hover:border-blue-500'
          }`}
        >
          <div className="flex items-center gap-3">
             {Icon && <Icon size={16} className={isAction ? 'text-white' : 'text-blue-500'} />}
             <span className={`${isAction ? 'text-white' : 'dark:text-white'} truncate max-w-[120px]`}>{selected?.name || selected?.label || value}</span>
             {selected?.symbol && <span className="text-blue-500 font-mono ml-1">{selected.symbol}</span>}
          </div>
          <ChevronDown size={14} className={`${isAction ? 'text-white/70' : 'text-slate-300'} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100] max-h-64 overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200 p-1.5">
            {options.map((opt: any) => {
              const isItemActive = !isAction && (opt.code === value || opt.id === value || opt.name === value);
              return (
                <button 
                  key={opt.code || opt.id || opt.name}
                  onClick={() => { onChange(opt.code || opt.id || opt.name); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isItemActive
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {opt.code && <span className="opacity-50 text-[9px] w-8 font-mono">{opt.code}</span>}
                    <span className="truncate">{opt.name || opt.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {opt.type === 'Recurring' && <RefreshCw size={10} className="text-blue-500" />}
                    {opt.symbol && <span className="font-mono">{opt.symbol}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Local Interfaces ---

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceSettings {
  type: 'Single' | 'Retainer';
  currency: string;
  autoPay: boolean;
  removePayment: boolean;
  lateFeeEnabled: boolean;
  lateFeeValue: number;
  taxInclusive: boolean;
  showQuantity: boolean;
  showRates: boolean;
  projectLink: string;
  reminderEnabled: boolean;
  discountRate: number;
  taxRate: number;
  templateId: string;
  installmentPlan: boolean;
  depositPercent: number;
  earlyBirdDiscount: number;
  surcharge: number;
  recurringInterval: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  signatureRequired: boolean;
  verifiedStamp: boolean;
  whiteLabelPortal: boolean;
  autoDispatch: boolean;
  autoArchiving: boolean;
  webhookBroadcast: boolean;
  poNumber: string;
  placeholder: any;
  shippingFee: number;
  handlingFee: number;
}

const InvoiceEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Using Hook for Database Interaction
  const { getInvoiceById, upsertInvoice, updateStatus } = useInvoices();
  const { clients } = useClients();
  const { members: team } = useTeam();
  
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string>('Not saved');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [invoicePreviewTheme, setInvoicePreviewTheme] = useState<'light' | 'dark'>('dark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { services: catalogServices } = useServices();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (catalogServices && catalogServices.length > 0) {
      setServices(catalogServices);
    }
  }, [catalogServices]);

  const [invoice, setInvoice] = useState({
    number: Math.floor(1000 + Math.random() * 9000).toString(),
    client: clients[0]?.name || 'Unknown Client',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: 'Payment is due within 14 days. We appreciate your partnership.',
    logo: null as string | null,
    fromName: 'AgencyOS Global',
    fromAddress: '123 Studio Plaza, San Francisco, CA 94103',
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: 'Technical Infrastructure Audit & Strategy', quantity: 1, rate: 3500 }
  ]);

  const [settings, setSettings] = useState<InvoiceSettings>({
    type: 'Single',
    currency: 'USD',
    autoPay: false,
    removePayment: true,
    lateFeeEnabled: false,
    lateFeeValue: 5,
    taxInclusive: false,
    showQuantity: true,
    showRates: true,
    projectLink: '',
    reminderEnabled: true,
    discountRate: 0,
    taxRate: 0,
    templateId: 't1',
    installmentPlan: false,
    depositPercent: 50,
    earlyBirdDiscount: 0,
    surcharge: 0,
    recurringInterval: 'Monthly',
    signatureRequired: false,
    verifiedStamp: true,
    whiteLabelPortal: false,
    autoDispatch: false,
    autoArchiving: true,
    webhookBroadcast: false,
    poNumber: '',
    placeholder: null,
    shippingFee: 0,
    handlingFee: 0,
  });

  useEffect(() => {
    const handleSync = () => {
        // Clients and projects are still handled via localStorage for now
        const savedClients = localStorage.getItem('agencyos_clients');
        if (savedClients) setClients(JSON.parse(savedClients));
        
        const savedProjects = localStorage.getItem('agencyos_projects');
        if (savedProjects) setProjects(JSON.parse(savedProjects));
    };
    window.addEventListener('agencyos_config_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
        window.removeEventListener('agencyos_config_updated', handleSync);
        window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Use hook to fetch invoice if ID is present
  useEffect(() => {
    if (id) {
        getInvoiceById(id).then((found: any) => {
            if (found) {
                setInvoice({
                    number: found.number || found.id.replace('INV-', ''),
                    client: found.client,
                    date: found.date,
                    dueDate: found.dueDate || '',
                    notes: found.notes || 'Payment is due within 14 days. We appreciate your partnership.',
                    logo: found.logo || null,
                    fromName: found.fromName || 'AgencyOS Global',
                    fromAddress: found.fromAddress || '123 Studio Plaza, San Francisco, CA 94103',
                });
                if (found.items) setItems(found.items);
                if (found.settings) setSettings(found.settings);
                setLastSaved('Loaded from DB');
            }
        });
    }
  }, [id]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const discountVal = subtotal * (settings.discountRate / 100);
    const afterDiscount = subtotal - discountVal;
    
    let taxVal: number;
    if (settings.taxInclusive) {
        taxVal = afterDiscount - (afterDiscount / (1 + settings.taxRate / 100));
    } else {
        taxVal = afterDiscount * (settings.taxRate / 100);
    }
    
    const surchargeVal = afterDiscount * (settings.surcharge / 100);
    const earlyBirdVal = afterDiscount * (settings.earlyBirdDiscount / 100);

    let total = afterDiscount;
    if (!settings.taxInclusive) {
        total += taxVal;
    }
    
    total += surchargeVal;
    total += settings.shippingFee;
    total += settings.handlingFee;
    total -= earlyBirdVal;

    const depositAmount = settings.installmentPlan ? (total * (settings.depositPercent / 100)) : total;
    const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
    
    return { subtotal, discountVal, taxVal, surchargeVal, earlyBirdVal, total, totalQty, depositAmount };
  }, [items, settings]);

  const formatCurrency = (val: number) => {
    return formatCurrencyUtil(val, settings.currency);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const minifyHTML = (html: string) => {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/<!--.*?-->/g, '')
      .trim();
  };

  const handleSaveDraft = async () => {
    const invoiceId = `INV-${invoice.number}`;
    const draftInvoice = {
      id: invoiceId,
      ...invoice,
      items,
      settings,
      amount: totals.total,
      status: 'Draft' as const
    };

    // Use hook to save to DB
    await upsertInvoice(draftInvoice);

    setLastSaved(`Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    showToast("Mission Intel Draft Saved");
    
    // Sync local events if needed (though hook handles internal state)
    window.dispatchEvent(new Event('agencyos_config_updated'));
  };

  const getLinkedProjectName = () => {
      const proj = MOCK_PROJECTS.find(p => p.id === settings.projectLink);
      return proj ? proj.title : null;
  };

  const renderInvoiceHTML = (isForEmail = false, theme: 'light' | 'dark' = 'dark') => {
    const isDark = theme === 'dark';
    const bgCol = isDark ? '#09090b' : '#ffffff';
    const textCol = isDark ? '#f4f4f5' : '#1a202c';
    const subTextCol = isDark ? '#a1a1aa' : '#718096';
    const borderCol = isDark ? '#27272a' : '#edf2f7';
    
    const itemsRows = items.map(item => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid ${borderCol}; font-weight: 600; color: ${textCol};">${item.description}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid ${borderCol}; text-align: center; color: ${textCol};">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid ${borderCol}; text-align: center; color: ${textCol};">${formatCurrency(item.rate)}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid ${borderCol}; text-align: right; font-weight: 700; color: ${textCol};">${formatCurrency(item.quantity * item.rate)}</td>
      </tr>
    `).join('');

    const shouldIncludeLogo = invoice.logo && !isForEmail;
    const accentColor = "#2563eb"; // Blue 600
    
    const projectName = getLinkedProjectName();
    const projectRow = projectName ? `<div style="font-size: 11px; font-weight: 700; color: ${subTextCol}; margin-top: 5px;">PROJECT: ${projectName}</div>` : '';
    const poRow = settings.poNumber ? `<div style="font-size: 12px; font-weight: 800; color: ${textCol}; margin-top: 5px;">PO #: ${settings.poNumber}</div>` : '';
    
    // TEMPLATE LOGIC
    let headerHTML: string;
    let mainContainerStyle = `font-family: 'Inter', sans-serif, system-ui; color: ${textCol}; background-color: ${bgCol}; padding: 40px; max-width: 800px; margin: 0 auto; border: 1px solid ${borderCol}; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);`;
    
    if (settings.templateId === 't2') { // Invoice Focus (Bold Corporate)
      headerHTML = `
        <div style="background: ${accentColor}; padding: 30px; margin: -40px -40px 40px -40px; border-radius: 24px 24px 0 0;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <h1 style="font-size: 32px; margin: 0; color: #fff; text-transform: uppercase; font-weight: 900; letter-spacing: 2px;">INVOICE</h1>
                <div style="font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.7); margin-top: 5px;">#INV-${invoice.number}</div>
                ${settings.poNumber ? `<div style="font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9); margin-top: 2px;">PO: ${settings.poNumber}</div>` : ''}
              </td>
              <td align="right">
                ${shouldIncludeLogo ? `<img src="${invoice.logo}" height="60" style="border-radius: 12px;" />` : `<div style="width: 60px; height: 60px; border-radius: 10px; background: #fff; color: ${accentColor}; font-weight: 900; font-size: 24px; line-height: 60px; text-align: center;">${(invoice.fromName || 'A')[0]}</div>`}
              </td>
            </tr>
          </table>
        </div>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
          <tr>
            <td>
               <div style="font-size: 11px; font-weight: 900; color: ${subTextCol}; text-transform: uppercase; letter-spacing: 1px;">SENDER</div>
               <p style="font-weight: 700; font-size: 14px; margin: 5px 0 0 0;">${invoice.fromName}</p>
               <p style="margin: 4px 0 0 0; font-size: 12px; color: ${subTextCol}; line-height: 1.5; max-width: 250px;">${invoice.fromAddress}</p>
            </td>
            <td align="right" valign="top">
               <div style="font-size: 11px; font-weight: 900; color: ${subTextCol}; text-transform: uppercase; letter-spacing: 1px;">BILL TO</div>
               <p style="font-weight: 700; font-size: 18px; margin: 5px 0 0 0; color: ${accentColor};">${invoice.client}</p>
               <p style="font-weight: 600; font-size: 12px; margin: 10px 0 0 0; color: ${textCol};">Issue Date: ${invoice.date}</p>
               <p style="font-weight: 800; font-size: 12px; margin: 5px 0 0 0; color: #e53e3e;">Due Date: ${invoice.dueDate}</p>
               ${projectRow}
            </td>
          </tr>
        </table>
      `;
    } else if (settings.templateId === 't3') { // Premium Modern (Refined Center)
      mainContainerStyle = `font-family: 'Inter', sans-serif, system-ui; color: ${textCol}; background-color: ${isDark ? '#000000' : '#f8fafc'}; padding: 60px; max-width: 800px; margin: 0 auto; border-radius: 0; min-height: 800px;`;
      headerHTML = `
        <div style="text-align: center; margin-bottom: 60px;">
           ${shouldIncludeLogo ? `<img src="${invoice.logo}" height="80" style="margin-bottom: 20px;" />` : `<div style="width: 80px; height: 80px; margin: 0 auto 20px auto; border-radius: 100px; background: ${accentColor}; color: white; font-weight: 900; font-size: 32px; line-height: 80px;">${(invoice.fromName || 'A')[0]}</div>`}
           <h1 style="font-size: 12px; font-weight: 900; letter-spacing: 6px; color: ${subTextCol}; text-transform: uppercase; margin: 0;">STATEMENT OF SERVICES</h1>
           <p style="font-size: 16px; font-weight: 500; margin-top: 10px; color: ${textCol};">Invoice #INV-${invoice.number}</p>
           ${settings.poNumber ? `<p style="font-size: 12px; color: ${subTextCol};">PO: ${settings.poNumber}</p>` : ''}
        </div>
        <div style="background: ${bgCol}; padding: 40px; border-radius: 32px; border: 1px solid ${borderCol}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px; border-bottom: 2px solid ${borderCol}; padding-bottom: 20px;">
            <tr>
              <td>
                 <div style="font-size: 10px; font-weight: 900; color: ${subTextCol}; text-transform: uppercase; letter-spacing: 2px;">FROM</div>
                 <p style="font-weight: 800; font-size: 14px; margin: 5px 0 0 0; color: ${textCol};">${invoice.fromName}</p>
              </td>
              <td align="right">
                 <div style="font-size: 10px; font-weight: 900; color: ${subTextCol}; text-transform: uppercase; letter-spacing: 2px;">TO</div>
                 <p style="font-weight: 800; font-size: 14px; margin: 5px 0 0 0; color: ${textCol};">${invoice.client}</p>
                 ${projectRow}
              </td>
            </tr>
          </table>
      `;
    } else { // t1 Standard Brief (Default)
      headerHTML = `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
          <tr>
            <td align="left">
               ${shouldIncludeLogo ? `<img src="${invoice.logo}" width="60" style="border-radius: 12px;" />` : `<div style="width: 50px; height: 50px; border-radius: 10px; background: #fff; color: white; font-weight: 900; font-size: 20px; line-height: 50px; text-align: center;">${(invoice.fromName || 'A')[0]}</div>`}
               <h2 style="margin: 15px 0 0 0; font-size: 18px; font-weight: 900; color: ${textCol};">${invoice.fromName}</h2>
               <p style="margin: 5px 0 0 0; font-size: 11px; color: ${subTextCol}; line-height: 1.4; max-width: 250px;">${invoice.fromAddress}</p>
            </td>
            <td align="right" valign="top">
               <h1 style="font-size: 28px; margin: 0; color: ${textCol}; text-transform: uppercase; font-weight: 900; letter-spacing: -1px;">Invoice</h1>
               <div style="font-size: 12px; font-weight: 800; color: ${accentColor}; margin-top: 5px;">#INV-${invoice.number}</div>
               ${poRow}
               <div style="font-size: 11px; font-weight: 700; color: ${subTextCol}; margin-top: 20px;">DATED ${invoice.date}</div>
            </td>
          </tr>
        </table>
        <div style="height: 1px; background: ${borderCol}; margin-bottom: 40px;"></div>
        <div style="margin-bottom: 40px;">
           <div style="font-size: 10px; font-weight: 900; color: ${subTextCol}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">BILLING TO</div>
           <p style="font-weight: 900; font-size: 24px; margin: 0; color: ${textCol};">${invoice.client}</p>
           ${projectRow}
        </div>
      `;
    }

    const watermark = settings.verifiedStamp 
      ? `<div style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: ${accentColor}; opacity: 0.1; font-weight: 900; border: 10px solid ${accentColor}; padding: 20px; border-radius: 20px; text-transform: uppercase;">VERIFIED</div>` 
      : '';

    return `
      <div style="${mainContainerStyle} position: relative;">
        ${watermark}
        ${headerHTML}

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
          <thead>
            <tr style="border-bottom: 2px solid ${isDark ? textCol : '#1a202c'};">
              <th align="left" style="padding: 12px 8px; font-size: 10px; text-transform: uppercase; color: ${subTextCol}; font-weight: 900;">Description</th>
              <th align="center" style="padding: 12px 8px; font-size: 10px; text-transform: uppercase; color: ${subTextCol}; font-weight: 900; width: 40px;">Qty</th>
              <th align="center" style="padding: 12px 8px; font-size: 10px; text-transform: uppercase; color: ${subTextCol}; font-weight: 900; width: 100px;">Rate</th>
              <th align="right" style="padding: 12px 8px; font-size: 10px; text-transform: uppercase; color: ${subTextCol}; font-weight: 900; width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody style="font-size: 13px;">
            ${itemsRows}
          </tbody>
        </table>

        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td width="50%">
               ${settings.autoPay ? `<div style="background: ${accentColor}20; color: ${accentColor}; padding: 10px; border-radius: 8px; font-size: 10px; font-weight: 800; display: inline-block;">AUTO-PAY ENABLED</div>` : ''}
            </td>
            <td>
               <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
                 <tr>
                   <td align="left" style="color: ${subTextCol}; font-size: 11px; text-transform: uppercase; font-weight: 900;">Subtotal</td>
                   <td align="right" style="font-weight: 700; color: ${textCol};">${formatCurrency(totals.subtotal)}</td>
                 </tr>
                 ${settings.discountRate > 0 ? `
                 <tr>
                   <td align="left" style="color: ${subTextCol}; font-size: 11px; text-transform: uppercase; font-weight: 900;">Discount (${settings.discountRate}%)</td>
                   <td align="right" style="font-weight: 700; color: #e53e3e;">-${formatCurrency(totals.discountVal)}</td>
                 </tr>` : ''}
                 ${settings.earlyBirdDiscount > 0 ? `
                 <tr>
                   <td align="left" style="color: ${subTextCol}; font-size: 11px; text-transform: uppercase; font-weight: 900;">Early Bird (${settings.earlyBirdDiscount}%)</td>
                   <td align="right" style="font-weight: 700; color: #10b981;">-${formatCurrency(totals.earlyBirdVal)}</td>
                 </tr>` : ''}
                 ${settings.taxRate > 0 ? `
                 <tr>
                   <td align="left" style="color: ${subTextCol}; font-size: 11px; text-transform: uppercase; font-weight: 900;">Tax ${settings.taxInclusive ? '(Inclusive)' : `(${settings.taxRate}%)`}</td>
                   <td align="right" style="font-weight: 700; color: ${textCol};">${formatCurrency(totals.taxVal)}</td>
                 </tr>` : ''}
                 ${settings.surcharge > 0 ? `
                 <tr>
                   <td align="left" style="color: ${subTextCol}; font-size: 11px; text-transform: uppercase; font-weight: 900;">Surcharge (${settings.surcharge}%)</td>
                   <td align="right" style="font-weight: 700; color: ${textCol};">${formatCurrency(totals.surchargeVal)}</td>
                 </tr>` : ''}
                 ${settings.shippingFee > 0 ? `
                 <tr>
                   <td align="left" style="color: ${subTextCol}; font-size: 11px; text-transform: uppercase; font-weight: 900;">Shipping</td>
                   <td align="right" style="font-weight: 700; color: ${textCol};">${formatCurrency(settings.shippingFee)}</td>
                 </tr>` : ''}
                 ${settings.handlingFee > 0 ? `
                 <tr>
                   <td align="left" style="color: ${subTextCol}; font-size: 11px; text-transform: uppercase; font-weight: 900;">Handling</td>
                   <td align="right" style="font-weight: 700; color: ${textCol};">${formatCurrency(settings.handlingFee)}</td>
                 </tr>` : ''}
                 <tr style="border-top: 2px solid ${borderCol};">
                   <td align="left" style="font-weight: 900; text-transform: uppercase; font-size: 12px; padding-top: 20px; color: ${textCol};">Grand Total</td>
                   <td align="right" style="font-weight: 900; font-size: 26px; color: ${accentColor}; padding-top: 20px; letter-spacing: -1px;">${formatCurrency(totals.total)}</td>
                 </tr>
                 ${settings.installmentPlan ? `
                 <tr>
                   <td align="left" style="font-weight: 900; text-transform: uppercase; font-size: 12px; color: ${textCol}; padding-top: 5px;">Deposit Due Now (${settings.depositPercent}%)</td>
                   <td align="right" style="font-weight: 900; font-size: 18px; color: ${textCol}; padding-top: 5px;">${formatCurrency(totals.depositAmount)}</td>
                 </tr>` : ''}
               </table>
            </td>
          </tr>
        </table>

        <div style="margin-top: 60px; background: ${isDark ? '#1c1c1e' : '#f8fafc'}; padding: 25px; border-radius: 16px; font-size: 12px; color: ${textCol}; line-height: 1.6; border: 1px solid ${borderCol};">
          <strong style="display: block; margin-bottom: 8px; text-transform: uppercase; font-size: 10px; color: ${subTextCol}; letter-spacing: 1px;">Important Instructions</strong>
          ${invoice.notes.substring(0, 500)}
          ${settings.lateFeeEnabled ? `<p style="margin-top: 10px; color: #e53e3e; font-weight: 700;">Note: A late fee of ${settings.lateFeeValue}% will be applied to overdue payments.</p>` : ''}
          ${settings.reminderEnabled ? `<p style="margin-top: 5px; color: ${subTextCol}; font-size: 10px;">Please pay by due date to avoid automated reminders.</p>` : ''}
        </div>
        
        ${settings.signatureRequired ? `
        <div style="margin-top: 60px; display: flex; justify-content: space-between; border-top: 1px solid ${borderCol}; padding-top: 40px;">
           <div style="width: 45%;">
              <div style="border-bottom: 1px solid ${subTextCol}; height: 40px;"></div>
              <p style="font-size: 10px; font-weight: 900; color: ${subTextCol}; margin-top: 8px;">AUTHORIZED SIGNATURE</p>
           </div>
           <div style="width: 45%;">
              <div style="border-bottom: 1px solid ${subTextCol}; height: 40px;"></div>
              <p style="font-size: 10px; font-weight: 900; color: ${subTextCol}; margin-top: 8px;">DATE</p>
           </div>
        </div>
        ` : ''}

        <div style="margin-top: 60px; text-align: center; border-top: 1px solid ${borderCol}; padding-top: 20px;">
           ${!settings.whiteLabelPortal ? `<p style="font-size: 10px; color: ${subTextCol}; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Verified & Secured via AgencyOS SMTP Gateway v4.2</p>` : ''}
           ${settings.type === 'Retainer' ? `<p style="font-size: 10px; color: ${accentColor}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Recurring Billing: ${settings.recurringInterval}</p>` : ''}
        </div>

        ${settings.templateId === 't3' ? '</div>' : ''}
      </div>
    `;
  };

  const executeTransmission = async (recipientEmail: string, emailBody: string, recipientName?: string) => {
    if (!recipientEmail || recipientEmail.trim() === "" || !recipientEmail.includes('@')) {
        throw new Error("SMTP Logic Error: Destination address is invalid or empty.");
    }

    const invoiceId = `INV-${invoice.number}`;
    
    // --- EMAILJS CONFIG ---
    const styledHtmlContent = minifyHTML(renderInvoiceHTML(true, invoicePreviewTheme));

    const payload = JSON.stringify({
        to: recipientEmail,
        name: recipientName || invoice.client,
        fromName: invoice.fromName,
        subject: `Invoice Shared: #INV-${invoice.number}`,
        invoiceId: invoiceId,
        message: emailBody.substring(0, 350),
        htmlContent: styledHtmlContent,
        amount: formatCurrency(totals.total)
    });

    if (payload.length > 45000) {
        throw new Error("Payload too large. The invoice contains too much data to be sent via email relay.");
    }

    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: payload
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Uplink Rejected: ${errorText || response.statusText}`);
        }
        
        // --- ADD MESSAGE TO INBOX REGISTRY ---
        const newMessage = {
          id: `msg-inv-${Date.now()}`,
          sender: invoice.fromName,
          subject: `Invoice Shared: #INV-${invoice.number}`,
          preview: emailBody.substring(0, 120),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true,
          avatar: invoice.logo || 'https://i.pravatar.cc/150?u=agency'
        };
        const existingMessages = JSON.parse(localStorage.getItem('agencyos_messages') || JSON.stringify(MOCK_MESSAGES));
        localStorage.setItem('agencyos_messages', JSON.stringify([newMessage, ...existingMessages]));

        // Update local ledger on success via hook
        const newInvoiceObject = {
          id: invoiceId,
          ...invoice,
          items,
          settings,
          clientEmail: recipientEmail,
          amount: totals.total,
          status: 'Sent' as const
        };

        await upsertInvoice(newInvoiceObject);
        
        window.dispatchEvent(new Event('agencyos_config_updated'));
        window.dispatchEvent(new Event('storage'));

        showToast("Transmission protocol executed successfully");
        setIsSendModalOpen(false);
        setTimeout(() => navigate('/billing'), 1200);

    } catch (err: any) {
        console.error("Transmission Failure:", err);
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
            throw new Error("Network protocol rejected. Check firewall/connectivity or disable adblockers.", { cause: err });
        }
        throw err;
    }
  };

  const generatePDF = (mode: 'download' | 'print' = 'print') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the document.');
      return;
    }

    const htmlContent = renderInvoiceHTML(false, invoicePreviewTheme);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #INV-${invoice.number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: ${invoicePreviewTheme === 'dark' ? '#000000' : '#f3f4f6'}; }
            @media print {
              body { padding: 0; background: ${invoicePreviewTheme === 'dark' ? '#09090b' : 'white'}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF generated for ${mode}`);
  };

  // --- SEND MODAL COMPONENT ---

  const SendModal = () => {
    const [sendTab, setSendTab] = useState<'Contact' | 'Custom'>('Contact');
    
    // Use clients from hook which is already available in the parent scope
    // But we need to make sure we use the latest list when filtering
    
    const initialRecipient = useMemo(() => {
        const found = clients.find(c => c.name === invoice.client || c.company === invoice.client);
        return found?.email || '';
    }, [invoice.client, clients]);

    const [selectedRecipient, setSelectedRecipient] = useState<string>(initialRecipient);
    const [customEmail, setCustomEmail] = useState('');
    const [customName, setCustomName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Standard manual message state
    const [emailDraft, setEmailDraft] = useState(`Hi ${invoice.client},\n\nPlease find attached invoice #INV-${invoice.number} for ${formatCurrency(totals.total)}, due on ${invoice.dueDate}.\n\nBest regards,\n${invoice.fromName}`);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [protocolStep, setProtocolStep] = useState(0);

    const protocolSteps = [
        "Initializing SMTP Handshake...",
        "Synchronizing Ledger Metadata...",
        "Authenticating Security TLS Layers...",
        "Broadcasting via Global Relay Node...",
        "Finalizing Packet Transmission..."
    ];

    useEffect(() => {
        let interval: any;
        if (isTransmitting) {
            interval = setInterval(() => {
                setProtocolStep(prev => (prev + 1) % protocolSteps.length);
            }, 1200);
        }
        return () => clearInterval(interval);
    }, [isTransmitting]);

    const filteredContacts = useMemo(() => {
        const query = searchTerm.toLowerCase();
        // Use real data from hooks
        const clientList = clients.map(c => ({ ...c, type: 'Client' }));
        const teamList = team.map(p => ({ ...p, company: 'Internal Team', type: 'Team' }));
        return [...clientList, ...teamList].filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.email.toLowerCase().includes(query)
        );
    }, [searchTerm, clients, team]);

    const activeEmail = sendTab === 'Contact' ? selectedRecipient : customEmail;

    const handleExecuteSend = async () => {
        if (!activeEmail || activeEmail.trim() === "") {
            showToast("Recipients address is required.");
            return;
        }
        setIsTransmitting(true);
        try {
            await new Promise(r => setTimeout(r, 4500));
            await executeTransmission(activeEmail, emailDraft, sendTab === 'Custom' ? customName : undefined);
        } catch (e: any) {
            console.error("Handshake Failure", e);
            showToast(e.message || "Uplink Error");
            setIsTransmitting(false);
            
            setTimeout(() => {
                const subject = `Invoice INV-${invoice.number} from ${invoice.fromName}`;
                window.location.href = `mailto:${activeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailDraft)}`;
            }, 1000);
        }
    };

    return (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md" onClick={() => !isTransmitting && setIsSendModalOpen(false)} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-zinc-800">
                
                {isTransmitting && (
                   <div className="absolute inset-0 z-[100] bg-white dark:bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-12 animate-in fade-in duration-500 overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                      </div>

                      <div className="relative flex flex-col items-center">
                         <div className="relative">
                            <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(37,99,235,0.4)] animate-bounce-subtle">
                               <Globe size={64} className="animate-pulse" />
                            </div>
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-xl border-4 border-blue-600 animate-spin-slow">
                               <Loader2 className="text-blue-600" size={24} />
                            </div>
                         </div>
                      </div>

                      <div className="text-center space-y-6 max-w-md w-full px-8 relative z-10">
                         <div className="space-y-2">
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight animate-in slide-in-from-bottom-2">Deep Transmission Hub</h4>
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.4em] mb-4">UPLINK_STATUS: {protocolSteps[protocolStep]}</p>
                         </div>

                         <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-slate-200 dark:border-zinc-700">
                            <div 
                               className="h-full bg-blue-600 transition-all duration-700 ease-in-out relative overflow-hidden" 
                               style={{ width: `${((protocolStep + 1) / protocolSteps.length) * 100}%` }}
                            >
                               <div className="absolute inset-0 bg-white/40 animate-[shimmer_1.5s_infinite]" />
                            </div>
                         </div>
                         
                         <div className="flex justify-center gap-8 opacity-40">
                            <Zap size={14} className="text-blue-500" />
                            <Shield size={14} className="text-blue-500" />
                            <Target size={14} className="text-blue-500" />
                         </div>
                      </div>

                      <style>{`
                         @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                         @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                         .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
                         .animate-spin-slow { animation: spin 4s linear infinite; }
                      `}</style>
                   </div>
                )}

                <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900 z-10">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-blue-600 text-white rounded-[1.25rem] shadow-xl shadow-blue-500/20">
                            <Send size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Transmission Hub</h3>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-0.5">Transmitting #INV-{invoice.number}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSendModalOpen(false)} className="p-4 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-black rounded-2xl"><X size={24}/></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 flex flex-col border-r border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-black/20 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex gap-2">
                            <button onClick={() => setSendTab('Contact')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${sendTab === 'Contact' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Contact Registry</button>
                            <button onClick={() => setSendTab('Custom')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${sendTab === 'Custom' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Direct Entry</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            {sendTab === 'Contact' ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Lookup contact..." 
                                            className="w-full pl-11 pr-4 py-4 bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-2xl outline-none text-sm font-bold shadow-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {filteredContacts.map(c => (
                                            <button 
                                                key={c.id} 
                                                onClick={() => setSelectedRecipient(c.email)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${selectedRecipient === c.email ? 'bg-blue-600 border-blue-600 shadow-lg' : 'bg-white dark:bg-zinc-800/50 border-slate-100 dark:border-zinc-800 hover:border-blue-200'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 border-2 ${selectedRecipient === c.email ? 'border-white/20' : 'border-slate-50 dark:border-zinc-700'}`}>
                                                    <img src={c.avatar} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-black truncate ${selectedRecipient === c.email ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{c.name}</p>
                                                    <p className={`text-[10px] font-bold truncate ${selectedRecipient === c.email ? 'text-blue-100' : 'text-slate-400'}`}>{c.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Recipient Name</label>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-100"
                                            placeholder="Client Name"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Destination Email</label>
                                        <input 
                                            type="email" 
                                            className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-100"
                                            placeholder="address@domain.com"
                                            value={customEmail}
                                            onChange={(e) => setCustomEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="h-px bg-slate-100 dark:bg-zinc-800" />

                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <MessageSquare size={16} className="text-blue-500" />
                                     <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Message Briefing</p>
                                  </div>
                               </div>

                               <div className="relative group">
                                  <textarea 
                                    className="w-full h-64 p-8 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[2rem] text-sm font-medium text-slate-700 dark:text-zinc-300 leading-relaxed outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-sm"
                                    value={emailDraft}
                                    onChange={(e) => setEmailDraft(e.target.value)}
                                    placeholder="Enter mission briefing..."
                                  />
                               </div>
                               
                               <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                                  <Paperclip size={16} className="text-blue-500" />
                                  <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Attached: Styled Invoice Hub</p>
                               </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-80 p-8 flex flex-col gap-8 bg-white dark:bg-zinc-900 shrink-0">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Protocols</p>
                            <button 
                                onClick={() => generatePDF('print')}
                                className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white rounded-2xl border border-slate-100 dark:border-zinc-700 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Printer size={20} className="text-slate-400 group-hover:text-white" />
                                    <span className="text-sm font-black tracking-tight">Print Hardcopy</span>
                                </div>
                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button 
                                onClick={() => generatePDF('download')}
                                className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white rounded-2xl border border-slate-100 dark:border-zinc-700 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Download size={20} className="text-slate-400 group-hover:text-white" />
                                    <span className="text-sm font-black tracking-tight">Download PDF</span>
                                </div>
                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>

                        <div className="mt-auto space-y-4">
                             <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
                                <ShieldCheck size={24} className="text-emerald-500" />
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified Ready</p>
                                    <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">Ledger entries locked.</p>
                                </div>
                             </div>
                             <button 
                                onClick={handleExecuteSend}
                                disabled={!activeEmail || activeEmail.trim() === "" || isTransmitting}
                                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/40 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                             >
                                <span>Finalize & Send</span>
                                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-40 animate-in fade-in duration-700 relative transition-all">
      
      {isSendModalOpen && createPortal(<SendModal />, document.body)}

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[11000] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
          <CheckCircle2 size={20} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* ... Rest of JSX is identical to previous, just wrapped with hooks ... */}
      {/* (Omitting repeating the ~1000 lines of JSX for brevity unless explicitly requested - logic is updated in hooks/handlers above) */}
      
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 no-print">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/billing')} className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:scale-105 active:scale-95 transition-all text-slate-400 dark:text-zinc-600 hover:text-blue-600 shadow-sm group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1.5">Invoice Terminal</h2>
            <div className="flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-black uppercase text-[9px] tracking-[0.3em] flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                <ShieldCheck size={11}/> PROTOCOL 4.2 SECURE
              </span>
              <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
              <span className="text-slate-400 dark:text-zinc-600 font-bold uppercase text-[9px] tracking-widest">REFERENCE ID: #{invoice.number}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 mr-4 hidden md:flex">
             <button 
               onClick={handleSaveDraft}
               className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
               title="Save Draft (Command+S)"
             >
                <Save size={18} className="group-active:scale-90 transition-transform" />
             </button>
             <div className="flex flex-col items-end opacity-60">
                <p className="text-[9px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-1">State: Drafting</p>
                <p className="text-[10px] font-bold text-slate-300 dark:text-zinc-700 font-mono">{lastSaved}</p>
             </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 p-1 rounded-2xl shadow-inner relative w-[260px] h-[54px] shrink-0 z-50">
            <div 
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-700 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isPreviewMode ? 'translate-x-full' : 'translate-x-0'}`} 
            />
            <button 
               onClick={() => setIsPreviewMode(false)}
               className={`relative z-10 flex-1 h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${!isPreviewMode ? 'text-blue-600 dark:text-white' : 'text-slate-400'}`}
            >
              Editor
            </button>
            <button 
               onClick={() => setIsPreviewMode(true)}
               className={`relative z-10 flex-1 h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-500 flex items-center justify-center gap-2 ${isPreviewMode ? 'text-blue-600 dark:text-white' : 'text-slate-400'}`}
            >
              <Eye size={14} /> Preview
            </button>
          </div>

          <button 
            onClick={() => setIsSendModalOpen(true)}
            className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 group relative overflow-hidden shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
            <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
            <span>Send Invoice</span>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-10 w-full relative">
        <div 
          className={`shrink-0 no-print transition-all duration-700 ease-in-out overflow-hidden ${isPreviewMode ? 'w-0 opacity-0 -mr-10' : 'w-[340px] opacity-100'}`}
        >
           <div className="space-y-6 w-[340px] pb-20">
             <LogicSection title="Financial Strategy" icon={Calculator}>
               <AgencyToggle label="Auto-Pay Enforcement" sub="Charge card on dispatch" active={settings.autoPay} onToggle={() => setSettings({...settings, autoPay: !settings.autoPay})} />
               <AgencyToggle label="Inclusive Tax Mode" sub="Prices include all taxes" active={settings.taxInclusive} onToggle={() => setSettings({...settings, taxInclusive: !settings.taxInclusive})} />
               <AgencyToggle label="Installment Plan" sub="Enable milestone payments" active={settings.installmentPlan} onToggle={() => setSettings({...settings, installmentPlan: !settings.installmentPlan})} />
               <AgencyToggle label="Penalty System" sub="Auto +5% late fee" active={settings.lateFeeEnabled} onToggle={() => setSettings({...settings, lateFeeEnabled: !settings.lateFeeEnabled})} />
               
               <div className="h-px bg-slate-100 dark:bg-zinc-800 my-2" />
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Deposit %</label>
                   <input type="number" className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold" value={settings.depositPercent} onChange={e => setSettings({...settings, depositPercent: parseFloat(e.target.value) || 0})} />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Surcharge %</label>
                   <input type="number" className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold" value={settings.surcharge} onChange={e => setSettings({...settings, surcharge: parseFloat(e.target.value) || 0})} />
                 </div>
               </div>
               <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Early Bird Discount %</label>
                   <input type="number" className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold" value={settings.earlyBirdDiscount} onChange={e => setSettings({...settings, earlyBirdDiscount: parseFloat(e.target.value) || 0})} />
               </div>
               
               {/* OUTPUT THEME SWITCHER */}
               <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="pr-4">
                    <p className="text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-widest leading-none mb-1.5">Output Base</p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-tighter leading-none">Toggle Generated Theme</p>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-black p-1 rounded-xl gap-1 shrink-0 border border-slate-200 dark:border-zinc-800 shadow-inner">
                    <button 
                      onClick={() => setInvoicePreviewTheme('light')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${invoicePreviewTheme === 'light' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
                    >
                      <Sun size={12} /> light
                    </button>
                    <button 
                      onClick={() => setInvoicePreviewTheme('dark')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${invoicePreviewTheme === 'dark' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
                    >
                      <Moon size={12} /> dark
                    </button>
                  </div>
               </div>
             </LogicSection>

             <LogicSection title="Operational Logic" icon={Zap}>
               <AgencyToggle label="Smart Reminders" sub="3, 7, 14 day cadence" active={settings.reminderEnabled} onToggle={() => setSettings({...settings, reminderEnabled: !settings.reminderEnabled})} />
               <AgencyToggle label="Auto-Dispatch" sub="Send instantly on save" active={settings.autoDispatch} onToggle={() => setSettings({...settings, autoDispatch: !settings.autoDispatch})} />
               <AgencyToggle label="Auto-Archiving" sub="Cleanup on settlement" active={settings.autoArchiving} onToggle={() => setSettings({...settings, autoArchiving: !settings.autoArchiving})} />
               <AgencyToggle label="Webhook Broadcast" sub="Notify Slack/API" active={settings.webhookBroadcast} onToggle={() => setSettings({...settings, webhookBroadcast: !settings.webhookBroadcast})} />
               <div className="space-y-1.5 pt-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Recurring Interval</label>
                 <select className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={settings.recurringInterval} onChange={e => setSettings({...settings, recurringInterval: e.target.value as any})}>
                   <option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Yearly</option>
                 </select>
               </div>
             </LogicSection>

             <LogicSection title="Compliance & Security" icon={Shield}>
               <AgencyToggle label="Require Signature" sub="Legal client commitment" active={settings.signatureRequired} onToggle={() => setSettings({...settings, signatureRequired: !settings.signatureRequired})} />
               <AgencyToggle label="Verified Identity" sub="Security watermark" active={settings.verifiedStamp} onToggle={() => setSettings({...settings, verifiedStamp: !settings.verifiedStamp})} />
               <AgencyToggle label="White-Label Portal" sub="Hide AgencyOS branding" active={settings.whiteLabelPortal} onToggle={() => setSettings({...settings, whiteLabelPortal: !settings.whiteLabelPortal})} />
             </LogicSection>

             <LogicSection title="Logistics & Metadata" icon={Truck} defaultOpen={false}>
               <div className="space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Link to Mission</label>
                   <select className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={settings.projectLink} onChange={e => setSettings({...settings,projectLink: e.target.value})}>
                     <option value="">Unlinked</option>
                     {MOCK_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference PO #</label>
                   <input type="text" className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold" placeholder="P-9002-X" value={settings.poNumber} onChange={e => setSettings({...settings, poNumber: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Shipping</label>
                      <input type="number" className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold" value={settings.shippingFee} onChange={e => setSettings({...settings, shippingFee: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Handling</label>
                      <input type="number" className="w-full bg-slate-100 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold" value={settings.handlingFee} onChange={e => setSettings({...settings, handlingFee: parseFloat(e.target.value) || 0})} />
                    </div>
                 </div>
               </div>
             </LogicSection>

             <LogicSection title="Document Optics" icon={Layout} defaultOpen={false}>
                <AgencyToggle label="Show Line Qty" active={settings.showQuantity} onToggle={() => setSettings({...settings, showQuantity: !settings.showQuantity})} />
                <AgencyToggle label="Show Unit Rates" active={settings.showRates} onToggle={() => setSettings({...settings, showRates: !settings.showRates})} />
             </LogicSection>
             
             <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 flex items-center gap-4 group">
               <div className="p-3.5 bg-white dark:bg-zinc-800 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm transition-transform group-hover:scale-110">
                 <Shield size={22} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none mb-1.5">PCI COMPLIANT</p>
                 <p className="text-[9px] font-bold text-blue-800 dark:text-blue-200 leading-tight">Encryption layer v8.1 enabled.</p>
               </div>
             </div>
             
             <button 
                onClick={() => setIsSendModalOpen(true)}
                className="w-full py-4 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2 shadow-sm"
             >
                <Send size={16} /> Quick Send
             </button>
           </div>
        </div>

        <div className="flex-1 transition-all duration-700 ease-in-out min-w-0 h-full">
          {/* INVOICE RENDER AREA: PERMANENT DARK MODE PREVIEW */}
          <div id="invoice-render-area" className={`rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-zinc-800 overflow-hidden transition-all duration-700 bg-zinc-950 text-white ${isPreviewMode ? `max-w-[1000px] mx-auto scale-[0.98] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.7)]` : `w-full`}`} style={{ backgroundColor: '#09090b', color: '#ffffff' }}>
             
             <div className="p-12 md:p-20 relative">
                {isPreviewMode && settings.verifiedStamp && (
                  <div className="absolute top-12 right-12 flex flex-col items-center gap-2 opacity-30 select-none">
                     <div className="w-20 h-20 rounded-full border-4 border-blue-600 flex items-center justify-center text-blue-600">
                        <ValidatedIcon size={40} />
                     </div>
                     <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">VERIFIED ENTITY</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-24">
                   <div className="space-y-20">
                      {!isPreviewMode && (
                        <div className="space-y-6">
                          <p className="text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.4em]">PROTOCOL TYPE :</p>
                          <div className="flex flex-col gap-6">
                             {[
                               { id: 'Single', label: 'Single Transaction', sub: '(ONE-TIME PAYMENT)' },
                               { id: 'Retainer', label: 'Retainer Subscription', sub: '(CYCLICAL BILLING)' }
                             ].map(type => (
                               <button 
                                 key={type.id}
                                 onClick={() => setSettings({...settings, type: type.id as any})}
                                 className="flex items-center gap-5 group cursor-pointer"
                               >
                                 <div className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${settings.type === type.id ? 'border-blue-600 bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.5)]' : 'border-slate-300 dark:border-zinc-700'}`}>
                                   {settings.type === type.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                 </div>
                                 <div className="text-left">
                                   <span className={`text-base font-black transition-colors ${settings.type === type.id ? 'text-white' : 'text-slate-400 dark:text-zinc-600'}`}>{type.label}</span>
                                   <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-0.5">{type.sub}</p>
                                 </div>
                               </button>
                             ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-12 pt-4">
                        <div className="space-y-3">
                           <p className="text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.4em]">REFERENCE CODE :</p>
                           <div className={`flex items-center border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-100 transition-all shadow-sm bg-black/40`}>
                              <span className={`px-6 py-5 text-sm font-black text-slate-400 dark:text-zinc-600 border-r border-slate-100 dark:border-zinc-800 uppercase bg-zinc-900/50`}>INV</span>
                              <input 
                                className={`w-full px-6 py-5 bg-transparent font-black text-xl outline-none text-white`}
                                value={invoice.number}
                                onChange={e => setInvoice({...invoice, number: e.target.value})}
                                disabled={isPreviewMode}
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <p className="text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.4em]">RECIPIENT ENTITY :</p>
                           {isPreviewMode ? (
                             <p className="text-2xl font-black text-blue-600" style={{ color: '#2563eb' }}>{invoice.client}</p>
                           ) : (
                             <div className="relative group">
                               <select 
                                 className={`w-full px-8 py-5 border border-slate-100 dark:border-zinc-800 rounded-2xl font-black text-xl outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-100 transition-all shadow-sm bg-black/40 text-white`}
                                 value={invoice.client}
                                 onChange={e => setInvoice({...invoice, client: e.target.value})}
                               >
                                 {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                               </select>
                               <ChevronDown size={24} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-zinc-700 pointer-events-none group-hover:text-blue-500 transition-colors" />
                             </div>
                           )}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <PremiumSelect 
                           label="GLOBAL CURRENCY"
                           value={settings.currency}
                           options={GLOBAL_CURRENCIES.map(c => ({ id: c.code, label: `${c.code} (${c.symbol})` }))}
                           onChange={(val: string) => setSettings({...settings, currency: val})}
                           icon={Globe}
                           isPreviewMode={isPreviewMode}
                         />
                         
                         <div className="space-y-3">
                            <p className="text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.4em]">SETTLEMENT DATE :</p>
                            <div className="relative">
                               <input 
                                 type="date" 
                                 className={`w-full px-7 py-5 border border-slate-100 dark:border-zinc-800 rounded-2xl font-black text-sm outline-none shadow-sm bg-black/40 text-white`} 
                                 value={invoice.date} 
                                 onChange={e => setInvoice({...invoice, date: e.target.value})} 
                                 disabled={isPreviewMode}
                               />
                               <Calendar size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            </div>
                         </div>
                      </div>

                      {!isPreviewMode && (
                        <div className={`p-8 rounded-[3rem] border border-slate-200 dark:border-zinc-800 space-y-8 shadow-inner bg-slate-100/50 dark:bg-white/5`}>
                          <div className="flex items-center justify-between">
                            <div className="pr-4">
                              <p className="text-sm font-black text-slate-900 dark:text-white">Authorized Auto-Pay</p>
                              <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-medium uppercase tracking-tighter">Automatic vault processing on deadline.</p>
                            </div>
                            <AgencyToggle active={settings.autoPay} onToggle={() => setSettings({...settings, autoPay: !settings.autoPay})} />
                          </div>

                          <div className="pt-8 border-t border-slate-100 dark:border-zinc-800">
                             <PremiumSelect 
                               label="IMPORT FROM CATALOG"
                               value="Select item..."
                               options={services.map(s => ({ ...s, label: `${s.name} (${formatCurrency(s.price)})` }))}
                               isAction={true}
                               onChange={(val: string) => {
                                 const s = services.find(srv => srv.id === val || srv.name === val);
                                 if (s) {
                                   setItems(prevItems => [...prevItems, { id: `li-${Date.now()}`, description: s.name, quantity: 1, rate: s.price }]);
                                   if (s.type === 'Recurring' && settings.type === 'Single') {
                                       setSettings(prev => ({ ...prev, type: 'Retainer' }));
                                       showToast(`Appended ${s.name}. Mode updated to Retainer.`);
                                   } else {
                                       showToast(`Added ${s.name} to manifest`);
                                   }
                                 }
                               }}
                               icon={Package}
                               isPreviewMode={false}
                             />
                             <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-tighter mt-3 ml-2">Selected services are appended to line items.</p>
                          </div>
                        </div>
                      )}
                      
                      {isPreviewMode && settings.poNumber && (
                        <div className={`p-8 rounded-[2rem] border bg-zinc-900 border-zinc-800`}>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Order Reference</p>
                           <p className={`text-xl font-black font-mono tracking-wider text-white`}>{settings.poNumber}</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-8 mb-24">
                   <p className="text-[11px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.4em]">MANIFEST SOURCE :</p>
                   <div className={`flex flex-col md:flex-row items-center gap-12 p-10 rounded-[3.5rem] border relative shadow-inner bg-black/40 border-zinc-800`}>
                      <div className="relative group/logo">
                         <div className={`w-44 h-44 rounded-full border-[6px] border-zinc-800 flex flex-col items-center justify-center bg-zinc-900 shadow-2xl overflow-hidden transition-all duration-500`}>
                            {invoice.logo ? (
                              <img src={invoice.logo} className="w-full h-full object-cover" alt="Identity" />
                            ) : (
                              <div className="text-center opacity-30 flex flex-col items-center gap-2">
                                <ImageIcon size={32} className="text-slate-400" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">LOGO</p>
                              </div>
                            )}
                         </div>
                         {!isPreviewMode && (
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             className="absolute bottom-3 right-3 p-3.5 bg-blue-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all ring-8 ring-zinc-900"
                           >
                              <Upload size={18} strokeWidth={3} />
                           </button>
                         )}
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onload = (ev) => setInvoice(prev => ({ ...prev, logo: ev.target?.result as string }));
                               reader.readAsDataURL(file);
                             }
                         }} />
                      </div>

                      <div className="flex-1 w-full space-y-4">
                         <input 
                            className={`bg-transparent text-3xl font-black outline-none border-none w-full tracking-tighter text-white`}
                            value={invoice.fromName}
                            onChange={e => setInvoice({...invoice, fromName: e.target.value})}
                            disabled={isPreviewMode}
                         />
                         {isPreviewMode ? (
                             <p className={`text-sm font-medium max-w-sm whitespace-pre-wrap text-slate-400`}>{invoice.fromAddress}</p>
                         ) : (
                             <textarea 
                               className={`w-full h-24 border border-zinc-800 rounded-[1.75rem] p-6 text-sm font-medium outline-none transition-all resize-none shadow-sm bg-zinc-900/50 text-slate-400`}
                               placeholder="Legal Address & Contact Manifest..."
                               value={invoice.fromAddress}
                               onChange={e => setInvoice({...invoice, fromAddress: e.target.value})}
                             />
                         )}
                      </div>
                   </div>
                </div>

                <div className="space-y-8 mb-24 overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                         <tr className="bg-slate-900 dark:bg-slate-900 text-white">
                            <th className="px-10 py-6 rounded-tl-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em]">Operational Directive</th>
                            {settings.showQuantity && <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-center">Qty</th>}
                            {settings.showRates && <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-center">Unit Price</th>}
                            <th className="px-10 py-6 rounded-tr-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-right">Line Total</th>
                         </tr>
                      </thead>
                      <tbody className={`divide-y rounded-b-[2.5rem] shadow-sm border-x border-b bg-zinc-900/30 divide-zinc-800 border-zinc-800`}>
                         {items.map(item => (
                           <tr key={item.id} className="group">
                             <td className="px-10 py-10">
                                {isPreviewMode ? (
                                  <p className="font-black text-xl text-white">{item.description}</p>
                                ) : (
                                  <textarea 
                                    className={`w-full bg-transparent font-black text-xl outline-none resize-none tracking-tight text-white`}
                                    style={{ color: '#ffffff' }}
                                    rows={1}
                                    value={item.description}
                                    onChange={e => setItems(items.map(i => i.id === item.id ? {...i, description: e.target.value} : i))}
                                  />
                                )}
                             </td>
                             {settings.showQuantity && (
                                <td className="px-10 py-10 text-center">
                                  <input 
                                    type="number" 
                                    className={`w-16 bg-transparent text-center font-black text-xl outline-none text-white`}
                                    value={item.quantity}
                                    onChange={e => setItems(items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i))}
                                    disabled={isPreviewMode}
                                  />
                                </td>
                             )}
                             {settings.showRates && (
                                <td className="px-10 py-10 text-center">
                                  <input 
                                    type="number" 
                                    className={`w-28 bg-transparent text-center font-black text-xl outline-none text-white`}
                                    value={item.rate}
                                    onChange={e => setItems(items.map(i => i.id === item.id ? {...i, rate: parseFloat(e.target.value) || 0} : i))}
                                    disabled={isPreviewMode}
                                  />
                                </td>
                             )}
                             <td className="px-10 py-10 text-right relative">
                                <div className="flex items-end flex-col">
                                   <span className="text-2xl font-black tracking-tighter text-white">{formatCurrency(item.quantity * item.rate)}</span>
                                   {!isPreviewMode && items.length > 1 && (
                                     <button 
                                       onClick={() => setItems(items.filter(i => i.id !== item.id))}
                                       className="absolute -right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                     >
                                        <XCircle size={24} />
                                     </button>
                                   )}
                                </div>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                   {!isPreviewMode && (
                     <button 
                       onClick={() => setItems([...items, { id: `li-${Date.now()}`, description: '', quantity: 1, rate: 0 }])}
                       className={`flex items-center gap-4 px-12 py-6 transition-all font-black text-xs uppercase tracking-[0.2em] rounded-3xl border-2 border-dashed mt-8 bg-black text-zinc-600 border-zinc-800 hover:text-blue-400 hover:border-blue-900`}
                     >
                       <Plus size={20} /> Add Mission Line Item
                     </button>
                   )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-20 items-start">
                   <div className="space-y-12">
                      <div className="space-y-6">
                        <p className={`text-[11px] font-black uppercase tracking-[0.4em] text-white`}>Strategic Notes :</p>
                        {isPreviewMode ? (
                          <div className={`p-10 rounded-[3rem] border bg-zinc-900/50 border-zinc-800`}>
                             <p className={`text-sm font-medium leading-relaxed whitespace-pre-line text-zinc-300`}>{invoice.notes}</p>
                          </div>
                        ) : (
                          <textarea 
                            className={`w-full h-72 border-2 rounded-[3.5rem] p-10 text-base font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-sm bg-zinc-900 border-zinc-800 text-white`}
                            placeholder="Type internal notes..."
                            value={invoice.notes}
                            onChange={e => setInvoice({...invoice, notes: e.target.value})}
                          />
                        )}
                      </div>
                      
                      {!isPreviewMode && (
                        <div className="space-y-8">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Transmission Templates</p>
                           <div className="flex gap-6 overflow-x-auto no-scrollbar pt-10 pb-6 px-4">
                              {EMAIL_TEMPLATES.map(t => (
                                <button 
                                  key={t.id} 
                                  onClick={() => setSettings({...settings, templateId: t.id})}
                                  className={`relative shrink-0 w-44 aspect-[3/4] rounded-[2rem] border-4 transition-all duration-500 overflow-hidden ${settings.templateId === t.id ? 'border-blue-600 scale-105 shadow-xl' : 'border-slate-800 grayscale opacity-40'}`}
                                >
                                  <img src={t.thumbnail} className="w-full h-full object-cover" alt={t.name}/>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex items-end">
                                     <p className="text-Circle font-black text-white uppercase tracking-widest">{t.name}</p>
                                  </div>
                                  {settings.templateId === t.id && (
                                    <div className="absolute top-4 right-4 p-1.5 bg-blue-600 text-white rounded-full"><Check size={14} strokeWidth={4}/></div>
                                  )}
                                </button>
                              ))}
                           </div>
                        </div>
                      )}

                      {isPreviewMode && settings.signatureRequired && (
                        <div className="pt-20 space-y-6">
                           <div className={`h-px w-full opacity-20 bg-white`} />
                           <div className="flex justify-between items-end">
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Authorized Signature</p>
                                 <div className={`h-20 w-80 border-b flex items-center justify-center font-serif italic text-2xl text-slate-400 select-none border-white/10`}>Place signature here</div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Date of Execution</p>
                                 <p className={`text-lg font-black font-mono tracking-widest text-white`}>{new Date().toLocaleDateString()}</p>
                              </div>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-12">
                      <div className={`p-12 rounded-[4rem] border-2 shadow-2xl space-y-10 relative overflow-hidden group/card bg-zinc-900 border-zinc-800`}>
                         <div className={`absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform group-hover/card:scale-110 text-white`}><Landmark size={120}/></div>
                         
                         <div className="flex justify-between items-center px-6">
                            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Raw Sub-Total</span>
                            <span className="text-2xl font-black font-mono text-white">{formatCurrency(totals.subtotal)}</span>
                         </div>

                         <div className="flex justify-between items-center gap-10 px-6">
                            <span className="text-sm font-black text-slate-500 uppercase tracking-widest shrink-0">Strategic Discount %</span>
                            <div className="relative">
                               <input 
                                 type="number" 
                                 className={`w-32 border rounded-xl px-4 py-3 text-right font-black text-lg focus:border-blue-600 outline-none bg-black border-zinc-800 text-white`}
                                 value={settings.discountRate} 
                                 onChange={e => setSettings({...settings, discountRate: parseFloat(e.target.value) || 0})} 
                                 disabled={isPreviewMode}
                               />
                               {!isPreviewMode && <Percent size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />}
                               {isPreviewMode && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">-</span>}
                            </div>
                         </div>

                         <div className="flex justify-between items-center gap-10 px-6">
                            <span className="text-sm font-black text-slate-500 uppercase tracking-widest shrink-0">Global Tax %</span>
                            <div className="relative">
                               <input 
                                 type="number" 
                                 className={`w-32 border rounded-xl px-4 py-3 text-right font-black text-lg focus:border-blue-600 outline-none bg-black border-zinc-800 text-white`} 
                                 value={settings.taxRate} 
                                 onChange={e => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})} 
                                 disabled={isPreviewMode}
                               />
                               {!isPreviewMode && <Landmark size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />}
                               {isPreviewMode && <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-white">+</span>}
                            </div>
                         </div>

                         <div className={`pt-10 border-t-[6px] flex justify-between items-end px-6 border-white`}>
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Final Balance Due</p>
                               <span className="text-xl font-black text-blue-400 uppercase tracking-widest">{settings.currency} Net Total</span>
                            </div>
                            <span className="text-6xl font-black text-blue-400 tracking-tighter tabular-nums font-mono drop-shadow-sm">{formatCurrency(totals.total)}</span>
                         </div>
                      </div>

                      <div className="flex flex-col items-end text-right px-10 space-y-3 opacity-40">
                         <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">WORKSPACE METRICS</p>
                         <div className="flex items-center gap-4">
                            <p className="text-sm font-black text-white">Verified Total :</p>
                            <span className="text-lg font-black text-blue-400">{formatCurrency(totals.total)}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <p className="text-sm font-black text-white">Directive Qty :</p>
                            <span className="text-lg font-black text-blue-400">{totals.totalQty}</span>
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
