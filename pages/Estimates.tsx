
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, FileText, CheckCircle, AlertCircle,
  DollarSign, Send, Search, MoreHorizontal, ShieldCheck,
  Trash2, Eye, Calendar, Filter, X, ChevronDown,
  User, Printer, CreditCard, Briefcase, ArrowUpRight, Copy,
  Check, Clock, FileCheck, ArrowRight, XCircle, RotateCcw,
  Loader2, Download, CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Estimate, Client, Service } from '../types';
import * as ReactRouterDom from 'react-router-dom';
import { useEstimates } from '../hooks/useEstimates.ts';
import { useInvoices } from '../hooks/useInvoices.ts';
import { useServices } from '../hooks/useServices.ts';
import { useClients } from '../hooks/useClients.ts';
import { useCurrency } from '../context/CurrencyContext';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';

const { useNavigate } = ReactRouterDom as any;

// --- Extended Types for Local Use ---
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface ExtendedEstimate extends Estimate {
  items?: LineItem[];
  taxRate?: number;
  notes?: string;
  terms?: string;
  subtotal?: number;
  validUntil?: string; // ISO Date
}

// --- Portal Menu Component ---
interface EstimateMenuPortalProps {
  estimate: ExtendedEstimate;
  anchorRect: DOMRect;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onConvertToInvoice: (estimate: ExtendedEstimate) => void;
}

const EstimateActionMenuPortal = ({ estimate, anchorRect, onClose, onStatusChange, onDelete, onConvertToInvoice }: EstimateMenuPortalProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: anchorRect.bottom + 8, left: anchorRect.right - 192 });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      let newTop = anchorRect.bottom + 8;
      
      // Flip if menu goes off screen
      if (newTop + rect.height > windowHeight) {
        newTop = anchorRect.top - rect.height - 8;
      }
      
      setPos({ top: newTop, left: anchorRect.right - 192 });
    }
  }, [anchorRect]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div 
        ref={menuRef}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          zIndex: 9999,
        }} 
        className="w-48 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <button onClick={(e) => { e.stopPropagation(); onStatusChange(estimate.id, 'Sent'); }} className="w-full px-4 py-3 text-left text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2">
          <Send size={14} /> Mark Sent
        </button>
        <button onClick={(e) => { e.stopPropagation(); onStatusChange(estimate.id, 'Accepted'); }} className="w-full px-4 py-3 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2">
          <CheckCircle size={14} /> Mark Accepted
        </button>
        <button onClick={(e) => { e.stopPropagation(); onStatusChange(estimate.id, 'Declined'); }} className="w-full px-4 py-3 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2">
          <XCircle size={14} /> Mark Declined
        </button>
        <div className="h-px bg-slate-100 dark:bg-zinc-700" />
        <button onClick={(e) => { e.stopPropagation(); onConvertToInvoice(estimate); }} className="w-full px-4 py-3 text-left text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-blue-900/20 flex items-center gap-2">
          <ArrowRight size={14} /> Convert to Invoice
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(estimate.id); }} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </>,
    document.body
  );
};

const Estimates: React.FC = () => {
  const navigate = useNavigate();
  const { getLimit } = usePlanEnforcement();
  
  // --- Backend Hooks ---
  const { estimates, loading, upsertEstimate, deleteEstimate, updateEstimateStatus } = useEstimates();
  const { upsertInvoice } = useInvoices();
  const { services } = useServices();
  const { clients } = useClients();
  const { format } = useCurrency();

  // --- Configuration State ---
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('agencyos_global_config');
    return saved ? JSON.parse(saved) : { currency: 'USD', invoicePrefix: 'EST-', taxRate: 0, agencyName: 'AgencyOS' };
  });

  // --- UI State ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<ExtendedEstimate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenu, setActiveMenu] = useState<{ id: string, rect: DOMRect } | null>(null);
  
  // Preview Modal States
  const [previewEstimate, setPreviewEstimate] = useState<ExtendedEstimate | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // Send Email Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  // --- Form State ---
  const [newEstimate, setNewEstimate] = useState<Partial<ExtendedEstimate>>({
    client: '',
    items: [{ id: Date.now().toString(), description: 'Consultation', quantity: 1, rate: 0 }],
    date: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Draft',
    taxRate: config.taxRate || 0,
    notes: 'We look forward to working with you.',
    terms: '50% deposit required to commence work. Estimate valid for 30 days.'
  });

  useEffect(() => {
    const handleSync = () => {
      const savedConfig = localStorage.getItem('agencyos_global_config');
      if (savedConfig) setConfig(JSON.parse(savedConfig));
    };
    window.addEventListener('agencyos_config_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
        window.removeEventListener('agencyos_config_updated', handleSync);
        window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Helpers ---
  const calculateTotal = (items: LineItem[] = [], taxRate: number = 0) => {
    const sub = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const tax = sub * (taxRate / 100);
    return { subtotal: sub, tax, total: sub + tax };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-emerald-500 text-white shadow-emerald-200';
      case 'Sent': return 'bg-blue-500 text-white shadow-blue-200';
      case 'Declined': return 'bg-rose-500 text-white shadow-rose-200';
      case 'Invoiced': return 'bg-purple-500 text-white shadow-purple-200';
      case 'Pending': return 'bg-amber-500 text-white shadow-amber-200';
      default: return 'bg-slate-400 text-white shadow-slate-200'; // Draft
    }
  };

  const getExpiryStatus = (dateStr: string, status: string) => {
    if (status === 'Accepted' || status === 'Invoiced' || status === 'Declined') return null;
    const daysLeft = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <span className="text-rose-500 font-bold text-[10px] uppercase">Expired</span>;
    if (daysLeft <= 3) return <span className="text-amber-500 font-bold text-[10px] uppercase">Expires in {daysLeft}d</span>;
    return <span className="text-slate-400 font-bold text-[10px] uppercase">{daysLeft} days left</span>;
  };

  // --- Actions ---
  const handleAddItem = () => {
    setNewEstimate(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]
    }));
  };

  const handleAddServiceItem = (serviceName: string, price: number) => {
    setNewEstimate(prev => ({
        ...prev,
        items: [...(prev.items || []), { 
            id: Date.now().toString(), 
            description: serviceName, 
            quantity: 1, 
            rate: price 
        }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    setNewEstimate(prev => ({
      ...prev,
      items: (prev.items || []).filter(i => i.id !== id)
    }));
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setNewEstimate(prev => ({
      ...prev,
      items: (prev.items || []).map(i => i.id === id ? { ...i, [field]: value } : i)
    }));
  };

  const handleSaveEstimate = async () => {
    const totals = calculateTotal(newEstimate.items, newEstimate.taxRate);
    const estimate: any = {
      id: `${config.invoicePrefix}${Math.floor(1000 + Math.random() * 9000)}`,
      client: newEstimate.client || 'Unknown Client',
      clientEmail: clients.find(c => c.name === newEstimate.client)?.email || '',
      date: newEstimate.date || new Date().toISOString().split('T')[0],
      expiryDate: newEstimate.expiryDate || '',
      status: newEstimate.status,
      items: newEstimate.items,
      amount: totals.total,
      taxRate: newEstimate.taxRate,
      notes: newEstimate.notes,
      terms: newEstimate.terms
    };
    
    await upsertEstimate(estimate);
    setIsCreateOpen(false);
    showToast("Estimate Created");

    // Reset Form
    setNewEstimate({
      client: '',
      items: [{ id: Date.now().toString(), description: 'Consultation', quantity: 1, rate: 0 }],
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      taxRate: config.taxRate || 0,
      terms: '50% deposit required to commence work. Estimate valid for 30 days.'
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Permanently delete this estimate?")) {
      await deleteEstimate(id);
      showToast("Estimate Deleted");
      if (selectedEstimate?.id === id) {
        setIsViewOpen(false);
        setSelectedEstimate(null);
      }
    }
    setActiveMenu(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateEstimateStatus(id, status);
    showToast(`Status updated to ${status}`);
    setActiveMenu(null);
  };

  const handleConvertToInvoice = async (estimate: ExtendedEstimate) => {
      // 1. Create invoice object
      const invoiceIdBase = estimate.id.startsWith('EST-') ? estimate.id.replace('EST-', 'INV-') : `INV-${Math.floor(Math.random() * 9000)}`;
      const newInvoice = {
          id: invoiceIdBase,
          client: estimate.client,
          clientEmail: estimate.clientEmail || '',
          amount: estimate.amount,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Pending',
          items: estimate.items, // Pass line items
          notes: estimate.notes
      };

      // 2. Save Invoice to DB
      await upsertInvoice(newInvoice);

      // 3. Update Estimate status to Invoiced
      await updateEstimateStatus(estimate.id, 'Invoiced');

      // 4. Dispatch Events for UI
      window.dispatchEvent(new Event('agencyos_config_updated'));
      window.dispatchEvent(new Event('storage'));

      // 5. Cleanup & Redirect
      setIsViewOpen(false);
      setSelectedEstimate(null);
      setActiveMenu(null);
      showToast("Invoice Generated");
      navigate('/billing');
  };

  // --- PDF & Email Logic for Estimates (Unique Design) ---
  const handleDownloadPDF = async () => {
    if (!previewEstimate) return;
    setIsDownloading(true);
    const element = document.getElementById('hidden-estimate-template-unique');
    if (element) {
      try {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Estimate_${previewEstimate.id}.pdf`);
        showToast("Estimate downloaded");
      } catch (e) {
        showToast("Error generating PDF");
      }
    }
    setIsDownloading(false);
  };

  const openSendModal = () => {
    if (!previewEstimate) return;
    setRecipientEmail(previewEstimate.clientEmail || '');
    setIsSendModalOpen(true);
  };

  const generateEstimateHTML = (estimate: any, agencyName: string) => {
    const itemsHtml = (estimate.items || []).map((item: any) => `
      <tr>
        <td style="padding: 24px 0; font-weight: 700; color: #ffffff; border-bottom: 1px solid #27272a; font-size: 16px;">${item.description}</td>
        <td style="padding: 24px 0; text-align: center; font-weight: 700; color: #ffffff; border-bottom: 1px solid #27272a; font-size: 16px;">${item.quantity}</td>
        <td style="padding: 24px 0; text-align: right; font-weight: 700; color: #ffffff; border-bottom: 1px solid #27272a; font-size: 16px;">$${(item.rate * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #09090b; color: #ffffff; padding: 64px; border-radius: 24px;">
        <div style="border-bottom: 4px solid #6366f1; padding-bottom: 32px; margin-bottom: 48px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 56px; font-weight: 900; color: #6366f1; margin: 0; letter-spacing: -2px; line-height: 1;">QUOTE</h1>
            <p style="font-size: 18px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 2px; margin: 12px 0 0 0;">#${estimate.id}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.5px;">${agencyName}</h2>
            <p style="font-size: 15px; color: #a1a1aa; font-weight: 500; margin: 4px 0 0 0;">123 Agency Way, Creative City</p>
          </div>
        </div>

        <div style="background: #eff6ff; padding: 40px; border-radius: 20px; margin-bottom: 64px; display: flex; justify-content: space-between;">
          <div style="flex: 1;">
            <p style="font-size: 13px; font-weight: 900; color: #818cf8; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Prepared For</p>
            <h3 style="font-size: 28px; font-weight: 800; color: #312e81; margin: 0 0 4px 0; letter-spacing: -0.5px;">${estimate.client}</h3>
            <p style="font-size: 15px; color: #4338ca; font-weight: 500; margin: 0;">${estimate.clientEmail}</p>
          </div>
          <div style="flex: 1; text-align: right; display: flex; flex-direction: column; justify-content: center; gap: 16px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #c7d2fe; padding-bottom: 8px;">
              <span style="font-size: 14px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px;">Date</span>
              <span style="font-weight: 800; color: #312e81; font-size: 16px;">${estimate.date}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #c7d2fe; padding-bottom: 8px;">
              <span style="font-size: 14px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px;">Valid Until</span>
              <span style="font-weight: 800; color: #312e81; font-size: 16px;">${estimate.expiryDate}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 64px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #ffffff;">
                <th style="text-align: left; padding: 16px 0; font-size: 13px; font-weight: 900; color: #818cf8; text-transform: uppercase; letter-spacing: 2px;">Description</th>
                <th style="text-align: center; padding: 16px 0; font-size: 13px; font-weight: 900; color: #818cf8; text-transform: uppercase; letter-spacing: 2px; width: 100px;">Qty</th>
                <th style="text-align: right; padding: 16px 0; font-size: 13px; font-weight: 900; color: #818cf8; text-transform: uppercase; letter-spacing: 2px; width: 140px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 64px;">
          <div style="width: 380px; background: #0f172a; color: #ffffff; padding: 40px; border-radius: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 600; color: #94a3b8; margin-bottom: 24px;">
              <span>Subtotal</span>
              <span>$${estimate.amount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 36px; font-weight: 900; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; letter-spacing: -1px;">
              <span>Total</span>
              <span>$${estimate.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #27272a; padding-top: 40px; color: #a1a1aa; font-size: 15px;">
          <p style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; color: #ffffff;">Terms & Conditions</p>
          <p style="line-height: 1.6; margin: 0;">${estimate.terms}</p>
        </div>
      </div>
    `;
  };

  const handleConfirmSend = async () => {
    if (!previewEstimate || !recipientEmail) return;
    setIsSending(true);
    try {
         const htmlContent = generateEstimateHTML(previewEstimate, config.agencyName);
         const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: recipientEmail,
                name: previewEstimate.client,
                fromName: 'AgencyOS Estimates',
                subject: `Estimate ${previewEstimate.id} from AgencyOS`,
                message: `Please review attached Estimate #${previewEstimate.id}.`,
                htmlContent: htmlContent
            })
        });
        if (response.ok) {
            showToast("Estimate sent via Email");
            await updateEstimateStatus(previewEstimate.id, 'Sent');
            setIsSendModalOpen(false);
        } else {
            const text = await response.text();
            throw new Error(`Email Error: ${text}`);
        }
    } catch (e) {
      console.error(e);
      showToast("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // --- Analytics Data ---
  const chartData = useMemo(() => {
    const safeEstimates = Array.isArray(estimates) ? estimates : [];
    
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();

      // Filter estimates for this specific month and year
      const monthEstimates = safeEstimates.filter(est => {
        if (!est.date) return false;
        const estDate = new Date(est.date);
        return estDate.getMonth() === month && estDate.getFullYear() === year;
      });

      // "Sent" value: Sum of all estimates that are NOT in 'Draft' status
      const sent = monthEstimates
        .filter(est => est.status !== 'Draft')
        .reduce((acc, est) => acc + (Number(est.amount) || 0), 0);
        
      // "Accepted" value: Sum of estimates that are 'Accepted' or 'Invoiced'
      const accepted = monthEstimates
        .filter(est => est.status === 'Accepted' || est.status === 'Invoiced')
        .reduce((acc, est) => acc + (Number(est.amount) || 0), 0);

      return {
        name: monthName,
        sent,
        accepted,
      };
    });
  }, [estimates]);

  const stats = useMemo(() => {
    const safeEstimates = Array.isArray(estimates) ? estimates : [];
    const totalPipeline = safeEstimates.filter((e: any) => e && e.status !== 'Declined' && e.status !== 'Draft').reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
    const acceptedValue = safeEstimates.filter((e: any) => e && (e.status === 'Accepted' || e.status === 'Invoiced')).reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
    const pendingCount = safeEstimates.filter((e: any) => e && (e.status === 'Sent' || e.status === 'Pending')).length;
    const conversionRate = totalPipeline > 0 ? Math.round((acceptedValue / totalPipeline) * 100) : 0;
    
    return { totalPipeline, acceptedValue, pendingCount, conversionRate };
  }, [estimates]);

  const filteredEstimates = useMemo(() => {
    const safeEstimates = Array.isArray(estimates) ? estimates : [];
    return safeEstimates.filter((est: any) => {
      if (!est) return false;
      const clientName = est.client || '';
      const estId = est.id || '';
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) || estId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || est.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [estimates, searchTerm, statusFilter]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 relative transition-colors animate-in fade-in duration-500">

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-4 border border-white/10">
          <CheckCircle2 size={18} className="text-emerald-400" /> {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Deal Flow & Quotes</h2>
          <p className="text-slate-500 dark:text-zinc-500 font-medium">Build, track, and convert project estimates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const estimatesLimit = getLimit('estimatesLimit');
              if (estimatesLimit !== -1 && estimates.length >= estimatesLimit) {
                showToast(`Plan Limit: Max ${estimatesLimit} estimates.`, 'error');
              } else {
                setIsCreateOpen(true);
              }
            }}
            className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Draft Quote
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-slate-800 dark:border-zinc-800">
            <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:rotate-12 transition-transform duration-700"><FileCheck size={140} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Accepted Value (YTD)</p>
            <h3 className="text-4xl font-black mb-4">{format(stats.acceptedValue)}</h3>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wide border border-emerald-500/20 flex items-center gap-1"><ArrowUpRight size={10}/> {stats.conversionRate}% Conversion</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3"><Clock size={20}/></div>
              <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Pending Deals</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3"><Briefcase size={20}/></div>
              <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Total Pipeline</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1 truncate">{format(stats.totalPipeline)}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Quote Velocity</h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider"><div className="w-2 h-2 rounded-full bg-slate-300"/> Sent</span>
               <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider"><div className="w-2 h-2 rounded-full bg-blue-600"/> Accepted</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'}} 
                />
                <Area type="monotone" dataKey="sent" stroke="#cbd5e1" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="accepted" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAccepted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600" size={20} />
            <input 
              type="text" 
              placeholder="Search estimates by ID or Client..." 
              className="w-full pl-16 pr-6 py-4.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl text-base outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 font-bold text-slate-700 dark:text-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide py-2 px-1">
            {['All', 'Sent', 'Accepted', 'Draft', 'Declined', 'Invoiced'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  statusFilter === status 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-105' 
                  : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
              <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Reference</th>
                <th className="px-10 py-6">Client</th>
                <th className="px-10 py-6">Validity</th>
                <th className="px-10 py-6">Value</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredEstimates.map((est: any) => (
                <tr 
                   key={est.id} 
                   className="hover:bg-blue-50/30 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer" 
                   onDoubleClick={() => setPreviewEstimate(est)}
                >
                  <td className="px-10 py-6">
                    <span className="font-mono font-bold text-slate-600 dark:text-zinc-400 text-sm bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">{est.id}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {(est.client || '??').substring(0,2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{est.client || 'Unknown Client'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">{est.expiryDate || 'No date'}</span>
                       {est.expiryDate && getExpiryStatus(est.expiryDate, est.status)}
                    </div>
                  </td>
                  <td className="px-10 py-6 font-black text-slate-900 dark:text-white text-base">{format(est.amount || 0)}</td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(est.status)}`}>
                      {est.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveMenu(activeMenu?.id === est.id ? null : { id: est.id, rect });
                      }}
                      className="p-2 text-slate-300 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeMenu && (
            <EstimateActionMenuPortal 
              estimate={estimates.find((e: any) => e.id === activeMenu.id)!}
              anchorRect={activeMenu.rect}
              onClose={() => setActiveMenu(null)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onConvertToInvoice={handleConvertToInvoice}
            />
          )}
          {filteredEstimates.length === 0 && (
            <div className="py-20 text-center text-slate-400 dark:text-zinc-600">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No estimates found</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE ESTIMATE MODAL */}
      {isCreateOpen && createPortal(
        <div className="fixed inset-0 z-[10001] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-zinc-800">
            <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Plus size={24} /></div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">New Estimate</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-400 rounded-xl hover:text-slate-900 dark:hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 bg-slate-50/50 dark:bg-black/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Client</label>
                    <div className="relative">
                      <select 
                        className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white appearance-none outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                        value={newEstimate.client}
                        onChange={(e) => setNewEstimate({...newEstimate, client: e.target.value})}
                      >
                        <option value="" disabled>Select a client...</option>
                        {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Issued</label>
                      <input type="date" className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" value={newEstimate.date} onChange={(e) => setNewEstimate({...newEstimate, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Valid Until</label>
                      <input type="date" className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" value={newEstimate.expiryDate} onChange={(e) => setNewEstimate({...newEstimate, expiryDate: e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Terms & Conditions</label>
                      <textarea className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-medium text-slate-600 dark:text-zinc-400 outline-none resize-none h-[140px] text-xs" value={newEstimate.terms} onChange={(e) => setNewEstimate({...newEstimate, terms: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Scope of Work</h4>
                  <div className="flex gap-2">
                     <select onChange={(e) => { if(e.target.value) handleAddServiceItem(e.target.value.split('|')[0], parseFloat(e.target.value.split('|')[1])); e.target.value = ""; }} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-zinc-400 outline-none">
                        <option value="">+ Add Service Template</option>
                        {services.map(s => <option key={s.id} value={`${s.name}|${s.price}`}>{s.name} (${s.price})</option>)}
                     </select>
                     <button onClick={handleAddItem} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1"><Plus size={12}/> Custom Item</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {(newEstimate.items || []).map((item, idx) => (
                    <div key={item.id} className="flex gap-4 items-start animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex-1 space-y-1">
                        <input 
                          type="text" 
                          placeholder="Description" 
                          className="w-full px-4 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <input 
                          type="number" 
                          placeholder="Qty" 
                          className="w-full px-4 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none text-center"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <input 
                          type="number" 
                          placeholder="Rate" 
                          className="w-full px-4 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none text-right"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                        />
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 border-t border-slate-200 dark:border-zinc-800 pt-6">
                 <div className="w-64 flex justify-between text-sm font-bold text-slate-500 dark:text-zinc-400">
                    <span>Subtotal</span>
                    <span>{format(calculateTotal(newEstimate.items, newEstimate.taxRate).subtotal)}</span>
                 </div>
                 <div className="w-64 flex justify-between text-sm font-bold text-slate-500 dark:text-zinc-400 items-center">
                    <span>Tax (%)</span>
                    <input 
                      type="number" 
                      className="w-16 px-2 py-1 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-right outline-none" 
                      value={newEstimate.taxRate}
                      onChange={(e) => setNewEstimate({...newEstimate, taxRate: Number(e.target.value)})}
                    />
                 </div>
                 <div className="w-64 flex justify-between text-xl font-black text-slate-900 dark:text-white mt-2 pt-4 border-t border-dashed border-slate-300 dark:border-zinc-700">
                    <span>Total Estimate</span>
                    <span>{format(calculateTotal(newEstimate.items, newEstimate.taxRate).total)}</span>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0 z-10 flex justify-between items-center">
               <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                  <Briefcase size={14} /> {config.agencyName} Quotes
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setIsCreateOpen(false)} className="px-8 py-4 text-slate-600 dark:text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl transition-all">Discard</button>
                  <button onClick={handleSaveEstimate} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">Create Estimate</button>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal for Estimate (Double Click) */}
      {previewEstimate && createPortal(
        <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
              <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600 text-white rounded-2xl"><FileText size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white">Estimate Preview</h3>
                       <p className="text-xs text-slate-500 dark:text-zinc-400">{previewEstimate.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={openSendModal} disabled={isSending} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2">
                       {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Send
                    </button>
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center gap-2">
                       {isDownloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} PDF
                    </button>
                    <button onClick={() => setPreviewEstimate(null)} className="p-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-400 rounded-xl hover:text-slate-900 dark:hover:text-white"><X size={20}/></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black/50 p-10 flex justify-center">
                 {/* Unique PDF Layout for Estimate */}
                 <div id="hidden-estimate-template-unique" className="bg-white text-black p-12 shadow-xl rounded-none w-[210mm] min-h-[297mm] relative font-sans">
                    <div className="border-b-4 border-indigo-600 pb-8 mb-12 flex justify-between items-start">
                        <div className="space-y-2">
                           <h1 className="text-6xl font-black text-indigo-600 tracking-tighter">QUOTE</h1>
                           <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">#{previewEstimate.id}</p>
                        </div>
                        <div className="text-right">
                           <h2 className="text-2xl font-bold text-slate-900">{config.agencyName}</h2>
                           <p className="text-sm text-slate-500 font-medium">123 Agency Way, Creative City</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-8 rounded-2xl mb-12 grid grid-cols-2 gap-12">
                       <div>
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Prepared For</p>
                          <h3 className="text-2xl font-bold text-indigo-900">{previewEstimate.client}</h3>
                          <p className="text-sm text-indigo-700 font-medium">{previewEstimate.clientEmail}</p>
                       </div>
                       <div className="text-right space-y-2">
                          <div className="flex justify-between border-b border-indigo-200 pb-1">
                             <span className="text-sm font-bold text-indigo-400 uppercase tracking-wide">Date</span>
                             <span className="font-bold text-indigo-900">{previewEstimate.date}</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-200 pb-1">
                             <span className="text-sm font-bold text-indigo-400 uppercase tracking-wide">Valid Until</span>
                             <span className="font-bold text-indigo-900">{previewEstimate.expiryDate}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mb-12">
                       <table className="w-full">
                          <thead>
                             <tr className="border-b-2 border-indigo-100">
                                <th className="text-left py-4 text-xs font-black text-indigo-400 uppercase tracking-widest">Description</th>
                                <th className="text-center py-4 text-xs font-black text-indigo-400 uppercase tracking-widest w-24">Qty</th>
                                <th className="text-right py-4 text-xs font-black text-indigo-400 uppercase tracking-widest w-32">Total</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-50">
                             {(previewEstimate.items || []).map((item, i) => (
                                <tr key={i}>
                                   <td className="py-6 font-bold text-slate-800">{item.description}</td>
                                   <td className="py-6 text-center font-bold text-slate-500">{item.quantity}</td>
                                   <td className="py-6 text-right font-bold text-slate-800">${(item.rate * item.quantity).toFixed(2)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="flex justify-end mb-12">
                       <div className="w-1/2 bg-slate-900 text-white p-8 rounded-2xl space-y-4">
                          <div className="flex justify-between text-sm font-medium opacity-70">
                             <span>Subtotal</span>
                             <span>${previewEstimate.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-3xl font-black border-t border-white/20 pt-4">
                             <span>Total</span>
                             <span>${previewEstimate.amount.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>

                    <div className="border-t-2 border-slate-100 pt-8 text-slate-500 text-sm">
                       <p className="font-bold text-xs uppercase tracking-widest mb-2 text-slate-300">Terms & Conditions</p>
                       <p className="leading-relaxed">{previewEstimate.terms}</p>
                    </div>

                    <div className="absolute bottom-12 left-12 right-12 text-center">
                       <p className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Authorized Proposal</p>
                    </div>
                 </div>
              </div>
              
              {/* Send Email Modal Overlay */}
              {isSendModalOpen && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                     <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="text-xl font-black text-slate-900 dark:text-white">Send Estimate</h3>
                             <button onClick={() => setIsSendModalOpen(false)} className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={16}/></button>
                         </div>
                         <div className="space-y-4">
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-2">Recipient Email</label>
                                 <input 
                                     autoFocus
                                     type="email" 
                                     value={recipientEmail}
                                     onChange={(e) => setRecipientEmail(e.target.value)}
                                     placeholder="client@example.com"
                                     className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all"
                                 />
                             </div>
                             <div className="flex gap-3 pt-4">
                                 <button onClick={() => setIsSendModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all">Cancel</button>
                                 <button 
                                     onClick={handleConfirmSend}
                                     disabled={!recipientEmail || isSending}
                                     className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                 >
                                     {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Now
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
              )}
           </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Estimates;
      const windowHeight = window.innerHeight;
      let newTop = anchorRect.bottom + 8;
      
      // Flip if menu goes off screen
      if (newTop + rect.height > windowHeight) {
        newTop = anchorRect.top - rect.height - 8;
      }
      
      setPos({ top: newTop, left: anchorRect.right - 192 });
    }
  }, [anchorRect]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div 
        ref={menuRef}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          zIndex: 9999,
        }} 
        className="w-48 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <button onClick={(e) => { e.stopPropagation(); onStatusChange(estimate.id, 'Sent'); }} className="w-full px-4 py-3 text-left text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2">
          <Send size={14} /> Mark Sent
        </button>
        <button onClick={(e) => { e.stopPropagation(); onStatusChange(estimate.id, 'Accepted'); }} className="w-full px-4 py-3 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2">
          <CheckCircle size={14} /> Mark Accepted
        </button>
        <button onClick={(e) => { e.stopPropagation(); onStatusChange(estimate.id, 'Declined'); }} className="w-full px-4 py-3 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2">
          <XCircle size={14} /> Mark Declined
        </button>
        <div className="h-px bg-slate-100 dark:bg-zinc-700" />
        <button onClick={(e) => { e.stopPropagation(); onConvertToInvoice(estimate); }} className="w-full px-4 py-3 text-left text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-blue-900/20 flex items-center gap-2">
          <ArrowRight size={14} /> Convert to Invoice
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(estimate.id); }} className="w-full px-4 py-3 text-left text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-2">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </>,
    document.body
  );
};

const Estimates: React.FC = () => {
  const navigate = useNavigate();
  const { getLimit } = usePlanEnforcement();
  
  // --- Backend Hooks ---
  const { estimates, loading, upsertEstimate, deleteEstimate, updateEstimateStatus } = useEstimates();
  const { upsertInvoice } = useInvoices();
  const { services } = useServices();
  const { clients } = useClients();
  const { format } = useCurrency();

  // --- Configuration State ---
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('agencyos_global_config');
    return saved ? JSON.parse(saved) : { currency: 'USD', invoicePrefix: 'EST-', taxRate: 0, agencyName: 'AgencyOS' };
  });

  // --- UI State ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<ExtendedEstimate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenu, setActiveMenu] = useState<{ id: string, rect: DOMRect } | null>(null);
  
  // Preview Modal States
  const [previewEstimate, setPreviewEstimate] = useState<ExtendedEstimate | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  // Send Email Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  // --- Form State ---
  const [newEstimate, setNewEstimate] = useState<Partial<ExtendedEstimate>>({
    client: '',
    items: [{ id: Date.now().toString(), description: 'Consultation', quantity: 1, rate: 0 }],
    date: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Draft',
    taxRate: config.taxRate || 0,
    notes: 'We look forward to working with you.',
    terms: '50% deposit required to commence work. Estimate valid for 30 days.'
  });

  useEffect(() => {
    const handleSync = () => {
      const savedConfig = localStorage.getItem('agencyos_global_config');
      if (savedConfig) setConfig(JSON.parse(savedConfig));
    };
    window.addEventListener('agencyos_config_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
        window.removeEventListener('agencyos_config_updated', handleSync);
        window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Helpers ---
  const calculateTotal = (items: LineItem[] = [], taxRate: number = 0) => {
    const sub = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const tax = sub * (taxRate / 100);
    return { subtotal: sub, tax, total: sub + tax };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-emerald-500 text-white shadow-emerald-200';
      case 'Sent': return 'bg-blue-500 text-white shadow-blue-200';
      case 'Declined': return 'bg-rose-500 text-white shadow-rose-200';
      case 'Invoiced': return 'bg-purple-500 text-white shadow-purple-200';
      case 'Pending': return 'bg-amber-500 text-white shadow-amber-200';
      default: return 'bg-slate-400 text-white shadow-slate-200'; // Draft
    }
  };

  const getExpiryStatus = (dateStr: string, status: string) => {
    if (status === 'Accepted' || status === 'Invoiced' || status === 'Declined') return null;
    const daysLeft = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <span className="text-rose-500 font-bold text-[10px] uppercase">Expired</span>;
    if (daysLeft <= 3) return <span className="text-amber-500 font-bold text-[10px] uppercase">Expires in {daysLeft}d</span>;
    return <span className="text-slate-400 font-bold text-[10px] uppercase">{daysLeft} days left</span>;
  };

  // --- Actions ---
  const handleAddItem = () => {
    setNewEstimate(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]
    }));
  };

  const handleAddServiceItem = (serviceName: string, price: number) => {
    setNewEstimate(prev => ({
        ...prev,
        items: [...(prev.items || []), { 
            id: Date.now().toString(), 
            description: serviceName, 
            quantity: 1, 
            rate: price 
        }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    setNewEstimate(prev => ({
      ...prev,
      items: (prev.items || []).filter(i => i.id !== id)
    }));
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setNewEstimate(prev => ({
      ...prev,
      items: (prev.items || []).map(i => i.id === id ? { ...i, [field]: value } : i)
    }));
  };

  const handleSaveEstimate = async () => {
    const totals = calculateTotal(newEstimate.items, newEstimate.taxRate);
    const estimate: any = {
      id: `${config.invoicePrefix}${Math.floor(1000 + Math.random() * 9000)}`,
      client: newEstimate.client || 'Unknown Client',
      clientEmail: clients.find(c => c.name === newEstimate.client)?.email || '',
      date: newEstimate.date || new Date().toISOString().split('T')[0],
      expiryDate: newEstimate.expiryDate || '',
      status: newEstimate.status,
      items: newEstimate.items,
      amount: totals.total,
      taxRate: newEstimate.taxRate,
      notes: newEstimate.notes,
      terms: newEstimate.terms
    };
    
    await upsertEstimate(estimate);
    setIsCreateOpen(false);
    showToast("Estimate Created");

    // Reset Form
    setNewEstimate({
      client: '',
      items: [{ id: Date.now().toString(), description: 'Consultation', quantity: 1, rate: 0 }],
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      taxRate: config.taxRate || 0,
      terms: '50% deposit required to commence work. Estimate valid for 30 days.'
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Permanently delete this estimate?")) {
      await deleteEstimate(id);
      showToast("Estimate Deleted");
      if (selectedEstimate?.id === id) {
        setIsViewOpen(false);
        setSelectedEstimate(null);
      }
    }
    setActiveMenu(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateEstimateStatus(id, status);
    showToast(`Status updated to ${status}`);
    setActiveMenu(null);
  };

  const handleConvertToInvoice = async (estimate: ExtendedEstimate) => {
      // 1. Create invoice object
      const invoiceIdBase = estimate.id.startsWith('EST-') ? estimate.id.replace('EST-', 'INV-') : `INV-${Math.floor(Math.random() * 9000)}`;
      const newInvoice = {
          id: invoiceIdBase,
          client: estimate.client,
          clientEmail: estimate.clientEmail || '',
          amount: estimate.amount,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Pending',
          items: estimate.items, // Pass line items
          notes: estimate.notes
      };

      // 2. Save Invoice to DB
      await upsertInvoice(newInvoice);

      // 3. Update Estimate status to Invoiced
      await updateEstimateStatus(estimate.id, 'Invoiced');

      // 4. Dispatch Events for UI
      window.dispatchEvent(new Event('agencyos_config_updated'));
      window.dispatchEvent(new Event('storage'));

      // 5. Cleanup & Redirect
      setIsViewOpen(false);
      setSelectedEstimate(null);
      setActiveMenu(null);
      showToast("Invoice Generated");
      navigate('/billing');
  };

  // --- PDF & Email Logic for Estimates (Unique Design) ---
  const handleDownloadPDF = async () => {
    if (!previewEstimate) return;
    setIsDownloading(true);
    const element = document.getElementById('hidden-estimate-template-unique');
    if (element) {
      try {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Estimate_${previewEstimate.id}.pdf`);
        showToast("Estimate downloaded");
      } catch (e) {
        showToast("Error generating PDF");
      }
    }
    setIsDownloading(false);
  };

  const openSendModal = () => {
    if (!previewEstimate) return;
    setRecipientEmail(previewEstimate.clientEmail || '');
    setIsSendModalOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!previewEstimate || !recipientEmail) return;
    setIsSending(true);
    try {
         const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: recipientEmail,
                name: previewEstimate.client,
                fromName: 'AgencyOS Estimates',
                subject: `Estimate ${previewEstimate.id} from AgencyOS`,
                message: `Please review attached Estimate #${previewEstimate.id}.`,
                htmlContent: `<p>Please review attached Estimate #${previewEstimate.id}.</p>`
            })
        });
        if (response.ok) {
            showToast("Estimate sent via Email");
            await updateEstimateStatus(previewEstimate.id, 'Sent');
            setIsSendModalOpen(false);
        } else {
            const text = await response.text();
            throw new Error(`EmailJS Error: ${text}`);
        }
    } catch (e) {
      console.error(e);
      showToast("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // --- Analytics Data ---
  const chartData = useMemo(() => {
    const safeEstimates = Array.isArray(estimates) ? estimates : [];
    
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const month = d.getMonth();

      // Filter estimates for this specific month and year
      const monthEstimates = safeEstimates.filter(est => {
        if (!est.date) return false;
        const estDate = new Date(est.date);
        return estDate.getMonth() === month && estDate.getFullYear() === year;
      });

      // "Sent" value: Sum of all estimates that are NOT in 'Draft' status
      const sent = monthEstimates
        .filter(est => est.status !== 'Draft')
        .reduce((acc, est) => acc + (Number(est.amount) || 0), 0);
        
      // "Accepted" value: Sum of estimates that are 'Accepted' or 'Invoiced'
      const accepted = monthEstimates
        .filter(est => est.status === 'Accepted' || est.status === 'Invoiced')
        .reduce((acc, est) => acc + (Number(est.amount) || 0), 0);

      return {
        name: monthName,
        sent,
        accepted,
      };
    });
  }, [estimates]);

  const stats = useMemo(() => {
    const safeEstimates = Array.isArray(estimates) ? estimates : [];
    const totalPipeline = safeEstimates.filter((e: any) => e && e.status !== 'Declined' && e.status !== 'Draft').reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
    const acceptedValue = safeEstimates.filter((e: any) => e && (e.status === 'Accepted' || e.status === 'Invoiced')).reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
    const pendingCount = safeEstimates.filter((e: any) => e && (e.status === 'Sent' || e.status === 'Pending')).length;
    const conversionRate = totalPipeline > 0 ? Math.round((acceptedValue / totalPipeline) * 100) : 0;
    
    return { totalPipeline, acceptedValue, pendingCount, conversionRate };
  }, [estimates]);

  const filteredEstimates = useMemo(() => {
    const safeEstimates = Array.isArray(estimates) ? estimates : [];
    return safeEstimates.filter((est: any) => {
      if (!est) return false;
      const clientName = est.client || '';
      const estId = est.id || '';
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) || estId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || est.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [estimates, searchTerm, statusFilter]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 relative transition-colors animate-in fade-in duration-500">

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-4 border border-white/10">
          <CheckCircle2 size={18} className="text-emerald-400" /> {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Deal Flow & Quotes</h2>
          <p className="text-slate-500 dark:text-zinc-500 font-medium">Build, track, and convert project estimates.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const estimatesLimit = getLimit('estimatesLimit');
              if (estimatesLimit !== -1 && estimates.length >= estimatesLimit) {
                showToast(`Plan Limit: Max ${estimatesLimit} estimates.`, 'error');
              } else {
                setIsCreateOpen(true);
              }
            }}
            className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-blue-900/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Draft Quote
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-slate-800 dark:border-zinc-800">
            <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:rotate-12 transition-transform duration-700"><FileCheck size={140} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Accepted Value (YTD)</p>
            <h3 className="text-4xl font-black mb-4">{format(stats.acceptedValue)}</h3>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wide border border-emerald-500/20 flex items-center gap-1"><ArrowUpRight size={10}/> {stats.conversionRate}% Conversion</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3"><Clock size={20}/></div>
              <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Pending Deals</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3"><Briefcase size={20}/></div>
              <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Total Pipeline</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1 truncate">{format(stats.totalPipeline)}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Quote Velocity</h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider"><div className="w-2 h-2 rounded-full bg-slate-300"/> Sent</span>
               <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider"><div className="w-2 h-2 rounded-full bg-blue-600"/> Accepted</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'}} 
                />
                <Area type="monotone" dataKey="sent" stroke="#cbd5e1" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="accepted" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAccepted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600" size={20} />
            <input 
              type="text" 
              placeholder="Search estimates by ID or Client..." 
              className="w-full pl-16 pr-6 py-4.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl text-base outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 font-bold text-slate-700 dark:text-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide py-2 px-1">
            {['All', 'Sent', 'Accepted', 'Draft', 'Declined', 'Invoiced'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  statusFilter === status 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-105' 
                  : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
              <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Reference</th>
                <th className="px-10 py-6">Client</th>
                <th className="px-10 py-6">Validity</th>
                <th className="px-10 py-6">Value</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredEstimates.map((est: any) => (
                <tr 
                   key={est.id} 
                   className="hover:bg-blue-50/30 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer" 
                   onDoubleClick={() => setPreviewEstimate(est)}
                >
                  <td className="px-10 py-6">
                    <span className="font-mono font-bold text-slate-600 dark:text-zinc-400 text-sm bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">{est.id}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {(est.client || '??').substring(0,2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{est.client || 'Unknown Client'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">{est.expiryDate || 'No date'}</span>
                       {est.expiryDate && getExpiryStatus(est.expiryDate, est.status)}
                    </div>
                  </td>
                  <td className="px-10 py-6 font-black text-slate-900 dark:text-white text-base">{format(est.amount || 0)}</td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(est.status)}`}>
                      {est.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveMenu(activeMenu?.id === est.id ? null : { id: est.id, rect });
                      }}
                      className="p-2 text-slate-300 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeMenu && (
            <EstimateActionMenuPortal 
              estimate={estimates.find((e: any) => e.id === activeMenu.id)!}
              anchorRect={activeMenu.rect}
              onClose={() => setActiveMenu(null)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onConvertToInvoice={handleConvertToInvoice}
            />
          )}
          {filteredEstimates.length === 0 && (
            <div className="py-20 text-center text-slate-400 dark:text-zinc-600">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No estimates found</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE ESTIMATE MODAL */}
      {isCreateOpen && createPortal(
        <div className="fixed inset-0 z-[10001] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-zinc-800">
            <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Plus size={24} /></div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">New Estimate</h3>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-400 rounded-xl hover:text-slate-900 dark:hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 bg-slate-50/50 dark:bg-black/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Client</label>
                    <div className="relative">
                      <select 
                        className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white appearance-none outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                        value={newEstimate.client}
                        onChange={(e) => setNewEstimate({...newEstimate, client: e.target.value})}
                      >
                        <option value="" disabled>Select a client...</option>
                        {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Issued</label>
                      <input type="date" className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" value={newEstimate.date} onChange={(e) => setNewEstimate({...newEstimate, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Valid Until</label>
                      <input type="date" className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold text-slate-900 dark:text-white outline-none" value={newEstimate.expiryDate} onChange={(e) => setNewEstimate({...newEstimate, expiryDate: e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest ml-4">Terms & Conditions</label>
                      <textarea className="w-full px-6 py-4 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl font-medium text-slate-600 dark:text-zinc-400 outline-none resize-none h-[140px] text-xs" value={newEstimate.terms} onChange={(e) => setNewEstimate({...newEstimate, terms: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Scope of Work</h4>
                  <div className="flex gap-2">
                     <select onChange={(e) => { if(e.target.value) handleAddServiceItem(e.target.value.split('|')[0], parseFloat(e.target.value.split('|')[1])); e.target.value = ""; }} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-zinc-400 outline-none">
                        <option value="">+ Add Service Template</option>
                        {services.map(s => <option key={s.id} value={`${s.name}|${s.price}`}>{s.name} (${s.price})</option>)}
                     </select>
                     <button onClick={handleAddItem} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1"><Plus size={12}/> Custom Item</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {(newEstimate.items || []).map((item, idx) => (
                    <div key={item.id} className="flex gap-4 items-start animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex-1 space-y-1">
                        <input 
                          type="text" 
                          placeholder="Description" 
                          className="w-full px-4 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <input 
                          type="number" 
                          placeholder="Qty" 
                          className="w-full px-4 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none text-center"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <input 
                          type="number" 
                          placeholder="Rate" 
                          className="w-full px-4 py-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none text-right"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                        />
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 border-t border-slate-200 dark:border-zinc-800 pt-6">
                 <div className="w-64 flex justify-between text-sm font-bold text-slate-500 dark:text-zinc-400">
                    <span>Subtotal</span>
                    <span>{format(calculateTotal(newEstimate.items, newEstimate.taxRate).subtotal)}</span>
                 </div>
                 <div className="w-64 flex justify-between text-sm font-bold text-slate-500 dark:text-zinc-400 items-center">
                    <span>Tax (%)</span>
                    <input 
                      type="number" 
                      className="w-16 px-2 py-1 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-right outline-none" 
                      value={newEstimate.taxRate}
                      onChange={(e) => setNewEstimate({...newEstimate, taxRate: Number(e.target.value)})}
                    />
                 </div>
                 <div className="w-64 flex justify-between text-xl font-black text-slate-900 dark:text-white mt-2 pt-4 border-t border-dashed border-slate-300 dark:border-zinc-700">
                    <span>Total Estimate</span>
                    <span>{format(calculateTotal(newEstimate.items, newEstimate.taxRate).total)}</span>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky bottom-0 z-10 flex justify-between items-center">
               <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                  <Briefcase size={14} /> {config.agencyName} Quotes
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setIsCreateOpen(false)} className="px-8 py-4 text-slate-600 dark:text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl transition-all">Discard</button>
                  <button onClick={handleSaveEstimate} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">Create Estimate</button>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal for Estimate (Double Click) */}
      {previewEstimate && createPortal(
        <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
              <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600 text-white rounded-2xl"><FileText size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white">Estimate Preview</h3>
                       <p className="text-xs text-slate-500 dark:text-zinc-400">{previewEstimate.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={openSendModal} disabled={isSending} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2">
                       {isSending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} Send
                    </button>
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center gap-2">
                       {isDownloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} PDF
                    </button>
                    <button onClick={() => setPreviewEstimate(null)} className="p-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-400 rounded-xl hover:text-slate-900 dark:hover:text-white"><X size={20}/></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black/50 p-10 flex justify-center">
                 {/* Unique PDF Layout for Estimate */}
                 <div id="hidden-estimate-template-unique" className="bg-white text-black p-12 shadow-xl rounded-none w-[210mm] min-h-[297mm] relative font-sans">
                    <div className="border-b-4 border-indigo-600 pb-8 mb-12 flex justify-between items-start">
                        <div className="space-y-2">
                           <h1 className="text-6xl font-black text-indigo-600 tracking-tighter">QUOTE</h1>
                           <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">#{previewEstimate.id}</p>
                        </div>
                        <div className="text-right">
                           <h2 className="text-2xl font-bold text-slate-900">{config.agencyName}</h2>
                           <p className="text-sm text-slate-500 font-medium">123 Agency Way, Creative City</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-8 rounded-2xl mb-12 grid grid-cols-2 gap-12">
                       <div>
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Prepared For</p>
                          <h3 className="text-2xl font-bold text-indigo-900">{previewEstimate.client}</h3>
                          <p className="text-sm text-indigo-700 font-medium">{previewEstimate.clientEmail}</p>
                       </div>
                       <div className="text-right space-y-2">
                          <div className="flex justify-between border-b border-indigo-200 pb-1">
                             <span className="text-sm font-bold text-indigo-400 uppercase tracking-wide">Date</span>
                             <span className="font-bold text-indigo-900">{previewEstimate.date}</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-200 pb-1">
                             <span className="text-sm font-bold text-indigo-400 uppercase tracking-wide">Valid Until</span>
                             <span className="font-bold text-indigo-900">{previewEstimate.expiryDate}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mb-12">
                       <table className="w-full">
                          <thead>
                             <tr className="border-b-2 border-indigo-100">
                                <th className="text-left py-4 text-xs font-black text-indigo-400 uppercase tracking-widest">Description</th>
                                <th className="text-center py-4 text-xs font-black text-indigo-400 uppercase tracking-widest w-24">Qty</th>
                                <th className="text-right py-4 text-xs font-black text-indigo-400 uppercase tracking-widest w-32">Total</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-50">
                             {(previewEstimate.items || []).map((item, i) => (
                                <tr key={i}>
                                   <td className="py-6 font-bold text-slate-800">{item.description}</td>
                                   <td className="py-6 text-center font-bold text-slate-500">{item.quantity}</td>
                                   <td className="py-6 text-right font-bold text-slate-800">${(item.rate * item.quantity).toFixed(2)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="flex justify-end mb-12">
                       <div className="w-1/2 bg-slate-900 text-white p-8 rounded-2xl space-y-4">
                          <div className="flex justify-between text-sm font-medium opacity-70">
                             <span>Subtotal</span>
                             <span>${previewEstimate.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-3xl font-black border-t border-white/20 pt-4">
                             <span>Total</span>
                             <span>${previewEstimate.amount.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>

                    <div className="border-t-2 border-slate-100 pt-8 text-slate-500 text-sm">
                       <p className="font-bold text-xs uppercase tracking-widest mb-2 text-slate-300">Terms & Conditions</p>
                       <p className="leading-relaxed">{previewEstimate.terms}</p>
                    </div>

                    <div className="absolute bottom-12 left-12 right-12 text-center">
                       <p className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Authorized Proposal</p>
                    </div>
                 </div>
              </div>
              
              {/* Send Email Modal Overlay */}
              {isSendModalOpen && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                     <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="text-xl font-black text-slate-900 dark:text-white">Send Estimate</h3>
                             <button onClick={() => setIsSendModalOpen(false)} className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={16}/></button>
                         </div>
                         <div className="space-y-4">
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-2">Recipient Email</label>
                                 <input 
                                     autoFocus
                                     type="email" 
                                     value={recipientEmail}
                                     onChange={(e) => setRecipientEmail(e.target.value)}
                                     placeholder="client@example.com"
                                     className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all"
                                 />
                             </div>
                             <div className="flex gap-3 pt-4">
                                 <button onClick={() => setIsSendModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all">Cancel</button>
                                 <button 
                                     onClick={handleConfirmSend}
                                     disabled={!recipientEmail || isSending}
                                     className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                 >
                                     {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Now
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
              )}
           </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Estimates;
