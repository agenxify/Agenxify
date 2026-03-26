
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, FileText, CheckCircle, AlertCircle, AlertTriangle,
  DollarSign, Send, Search, MoreHorizontal, ShieldCheck,
  Edit2, Trash2, ArrowUpRight, Copy, Filter, Calendar,
  TrendingUp, BarChart3, Receipt, Wallet, Clock, ArrowRight,
  Printer, Mail, CheckCircle2, X, Download, XCircle, ChevronDown, Loader2, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AVAILABLE_PLANS } from '../constants';
import { Invoice } from '../types';
import { usePlanEnforcement } from '../src/hooks/usePlanEnforcement';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { useInvoices } from '../hooks/useInvoices';
import { useAgencySubscription } from '../hooks/useAgencySubscription';

import { Link, useNavigate } from 'react-router-dom';

// --- Helper Component: Dynamic Invoice Renderer ---
const RenderInvoiceTemplate = ({ invoice, currency = 'USD' }: { invoice: Invoice, currency?: string }) => {
  // Styles for the specific design requested
  const containerStyle = {
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: 'white',
      color: '#0f172a',
      padding: '60px',
      boxSizing: 'border-box' as const,
      fontFamily: "'Inter', sans-serif",
      position: 'relative' as const,
      boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
      margin: '0 auto'
  };

  // Status Badge Logic
  const getStatusBadge = () => {
    const status = invoice.status || 'Pending';
    let color = '#3b82f6'; // blue
    let text = status.toUpperCase();
    let borderColor = '#3b82f6';

    if (status === 'Paid') {
        color = '#10b981'; // emerald-500
        borderColor = '#10b981';
        text = 'PAID IN FULL';
    } else if (status === 'Overdue') {
        color = '#ef4444'; // red-500
        borderColor = '#ef4444';
        text = 'OVERDUE';
    } else if (status === 'Pending') {
        color = '#f59e0b'; // amber-500
        borderColor = '#f59e0b';
        text = 'PAYMENT PENDING';
    }

    return (
        <div style={{
            border: `2px solid ${borderColor}`,
            color: color,
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '14px',
            display: 'inline-block',
            marginTop: '10px',
            letterSpacing: '1px'
        }}>
            {text}
        </div>
    );
  };

  // Extract items or fallback
  const items = (invoice as any).items || [{ description: 'Services Rendered', quantity: 1, rate: invoice.amount }];
  const lineItems = Array.isArray(items) ? items : [{ description: items || 'Services', quantity: 1, rate: invoice.amount }];
  
  const subtotal = lineItems.reduce((acc: number, item: any) => acc + (item.quantity * item.rate), 0);
  const total = subtotal; // Assuming 0 tax for simple display match

  const formatMoney = (amount: number) => formatCurrencyUtil(amount, currency);

  return (
    <div style={containerStyle}>
       {/* Header */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
          {/* Left Logo */}
          <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ 
                  width: '64px', height: '64px', backgroundColor: '#2563eb', borderRadius: '16px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' 
              }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', margin: 0, lineHeight: 1.1 }}>AgencyOS</h1>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                    123 Innovation Dr.<br/>
                    San Francisco, CA 94103
                  </p>
              </div>
          </div>

          {/* Right Info */}
          <div style={{ textAlign: 'right' }}>
              <h1 style={{ fontSize: '42px', fontWeight: 900, margin: 0, letterSpacing: '-1px', color: '#0f172a' }}>INVOICE</h1>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>#{invoice.id.replace('INV-', '')}</p>
              {getStatusBadge()}
          </div>
       </div>

       {/* Billing Grid */}
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px' }}>
          <div style={{ width: '45%' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>BILL TO</p>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>{invoice.client}</h3>
              <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>{invoice.clientEmail || 'client@example.com'}</p>
              <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>New York, NY</p>
          </div>
          
          <div style={{ width: '45%' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                 <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ISSUE DATE</span>
                 <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{invoice.date}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                 <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DUE DATE</span>
                 <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{invoice.dueDate || invoice.date}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                 <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>BILLING CYCLE</span>
                 <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Annual</span> 
             </div>
          </div>
       </div>

       {/* Items Table */}
       <div style={{ marginBottom: '40px' }}>
           <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
               <div style={{ flex: 3, fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>DESCRIPTION</div>
               <div style={{ flex: 1, textAlign: 'center', fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>QTY</div>
               <div style={{ flex: 1, textAlign: 'right', fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>AMOUNT</div>
           </div>
           
           {lineItems.map((item: any, i: number) => (
               <div key={i} style={{ display: 'flex', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                   <div style={{ flex: 3 }}>
                       <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.description}</p>
                       <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Service Charge</p>
                   </div>
                   <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#334155' }}>{item.quantity}</div>
                   <div style={{ flex: 1, textAlign: 'right', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{formatMoney(item.rate * item.quantity)}</div>
               </div>
           ))}
       </div>

       {/* Totals */}
       <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '80px' }}>
           <div style={{ width: '250px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Subtotal</span>
                   <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{formatMoney(subtotal)}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                   <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Tax (0%)</span>
                   <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>$0.00</span>
               </div>
               <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a' }}>TOTAL</span>
                   <span style={{ fontSize: '32px', fontWeight: 900, color: '#2563eb' }}>{formatMoney(total)}</span>
               </div>
           </div>
       </div>

       {/* Footer */}
       <div style={{ position: 'absolute', bottom: '60px', left: '60px', right: '60px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '30px' }}>
           <p style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Thank you for your business.</p>
           <p style={{ fontSize: '11px', color: '#94a3b8' }}>Securely processed by AgencyOS. Questions? Contact support@agencyos.io</p>
       </div>
    </div>
  );
};

// --- Components ---

const StatCard = ({ title, value, icon: Icon, color, sub, trend }: any) => {
  const colorText = color?.replace('bg-', 'text-') || 'text-blue-600';
  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-full">
      <div className={`absolute top-0 right-0 p-8 opacity-[0.08] dark:opacity-[0.15] transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 ${colorText}`}>
        <Icon size={140} />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-20 dark:bg-opacity-30 flex items-center justify-center mb-6 shadow-sm border border-transparent dark:border-white/5`}>
          <Icon size={24} className={`${colorText} dark:text-white transition-colors`} />
        </div>
        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
          {trend && <span className="text-[10px] font-bold text-emerald-500">+{trend}%</span>}
        </div>
      </div>
      {sub && <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase mt-4">{sub}</p>}
    </div>
  );
};

interface MenuPortalProps {
  invoice: Invoice;
  anchorRect: DOMRect;
  onClose: () => void;
  onStatusChange: (id: string, status: Invoice['status']) => void;
  onDelete: (id: string) => void;
}

const ActionMenuPortal = ({ invoice, anchorRect, onClose, onStatusChange, onDelete }: MenuPortalProps) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: anchorRect.bottom + 8, left: anchorRect.right - 192 });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      let newTop = anchorRect.bottom + 8;
      
      // If menu would go off bottom, flip it to show above the button
      if (newTop + rect.height > windowHeight) {
        newTop = anchorRect.top - rect.height - 8;
      }
      
      setPos({ top: newTop, left: anchorRect.right - rect.width });
    }
  }, [anchorRect]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999]" onClick={onClose} />
      <div 
        ref={menuRef}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          zIndex: 10000,
        }} 
        className="w-48 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Update State</p>
        </div>
        <button onClick={() => { onStatusChange(invoice.id, 'Paid'); onClose(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-emerald-600 flex items-center gap-2 transition-colors">
          <CheckCircle size={14} /> Mark Paid
        </button>
        <button onClick={() => { onStatusChange(invoice.id, 'Pending'); onClose(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-amber-600 flex items-center gap-2 transition-colors">
          <Clock size={14} /> Set Pending
        </button>
        <button onClick={() => { onStatusChange(invoice.id, 'Overdue'); onClose(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-rose-500 flex items-center gap-2 transition-colors">
          <AlertTriangle size={14} /> Mark Overdue
        </button>
        <button onClick={() => { onStatusChange(invoice.id, 'Rejected'); onClose(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 flex items-center gap-2 transition-colors">
          <XCircle size={14} /> Reject
        </button>
        <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
        <button onClick={() => { navigate(`/billing/${invoice.id}`); onClose(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center gap-2 transition-colors">
          <Edit2 size={14} /> Edit Invoice
        </button>
        <button onClick={() => { onDelete(invoice.id); onClose(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 flex items-center gap-2 transition-colors">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </>,
    document.body
  );
};

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const { getLimit } = usePlanEnforcement();
  
  // Use the new hook
  const { invoices, loading: invoicesLoading, deleteInvoice, updateStatus, refresh } = useInvoices();
  const { topupCredits, loading: subLoading } = useAgencySubscription();
  
  const loading = invoicesLoading || subLoading;
  
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('agencyos_global_config');
    return saved ? JSON.parse(saved) : { currency: 'USD', invoicePrefix: 'INV-', taxRate: 0 };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenu, setActiveMenu] = useState<{ id: string, rect: DOMRect } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Preview Modal States
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
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

  const handleStatusChange = async (id: string, status: Invoice['status']) => {
    await updateStatus(id, status);
    showToast(`Invoice ${status}`);
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice(id);
      showToast('Invoice deleted');
    }
    setActiveMenu(null);
  };

  // --- PDF Logic for Invoice (Unique Design) ---
  const handleDownloadPDF = async () => {
    if (!previewInvoice) return;
    setIsDownloading(true);
    const element = document.getElementById('hidden-invoice-template-unique');
    if (element) {
      try {
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Handle multipage if needed
        while (heightLeft >= 0) {
           position = heightLeft - imgHeight;
           pdf.addPage();
           pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
           heightLeft -= pageHeight;
        }

        pdf.save(`Invoice_${previewInvoice.id}.pdf`);
        showToast("Invoice downloaded");
      } catch (e) {
        showToast("Error generating PDF");
        console.error(e);
      }
    }
    setIsDownloading(false);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            inv.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: invoices.reduce((acc, inv) => acc + inv.amount, 0),
      outstanding: invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((acc, i) => acc + i.amount, 0),
      paid: invoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0)
    };
  }, [invoices]);

  const formatCurrency = (val: number) => {
    return formatCurrencyUtil(val, config.currency);
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 relative transition-colors">
      
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-4 border border-white/10">
          <CheckCircle2 size={18} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">Finance Hub</h2>
           <p className="text-slate-500 dark:text-zinc-500 font-medium text-lg">Manage invoices, payments, and subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
           {/* Unlinked Personal Billing for Separation */}
           <button onClick={() => {
              const invoicesLimit = getLimit('invoicesLimit');
              if (invoicesLimit !== -1 && invoices.length >= invoicesLimit) {
                  showToast(`Plan Limit: Max ${invoicesLimit} invoices.`, 'error');
              } else {
                  navigate('/billing/new');
              }
           }} className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3">
              <Plus size={18} strokeWidth={3}/> New Invoice
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard title="Total Revenue" value={formatCurrency(stats.total)} icon={DollarSign} color="bg-emerald-500" trend="12" />
         <StatCard title="Outstanding" value={formatCurrency(stats.outstanding)} icon={Clock} color="bg-amber-500" />
         <StatCard title="Collected" value={formatCurrency(stats.paid)} icon={CheckCircle2} color="bg-blue-600" />
      </div>

      {/* Invoice List */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden">
         <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative flex-1 w-full md:w-auto">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
               <input 
                  type="text" 
                  placeholder="Search invoices..." 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-[2rem] outline-none text-slate-900 dark:text-white font-bold transition-all focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
               {['All', 'Paid', 'Pending', 'Overdue', 'Draft'].map(status => (
                  <button 
                     key={status}
                     onClick={() => setStatusFilter(status)}
                     className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                        statusFilter === status 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-lg' 
                        : 'bg-transparent border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800'
                     }`}
                  >
                     {status}
                  </button>
               ))}
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                  <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                     <th className="px-10 py-6">Invoice ID</th>
                     <th className="px-10 py-6">Client</th>
                     <th className="px-10 py-6">Date</th>
                     <th className="px-10 py-6">Amount</th>
                     <th className="px-10 py-6">Status</th>
                     <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredInvoices.map((inv) => (
                     <tr 
                        key={inv.id} 
                        className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer"
                        onDoubleClick={() => setPreviewInvoice(inv)}
                     >
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-500">
                                 <FileText size={16}/>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{inv.id.replace(/^INV-/, '') || inv.id}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <p className="font-bold text-slate-700 dark:text-zinc-300 text-sm">{inv.client}</p>
                           <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold truncate max-w-[150px]">{inv.clientEmail}</p>
                        </td>
                        <td className="px-10 py-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
                           {inv.date}
                        </td>
                        <td className="px-10 py-6 text-sm font-black text-slate-900 dark:text-white font-mono">
                           {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-10 py-6">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              inv.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                              inv.status === 'Overdue' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                              inv.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                              'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                           }`}>
                              {inv.status}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right relative">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               const rect = e.currentTarget.getBoundingClientRect();
                               setActiveMenu(activeMenu?.id === inv.id ? null : { id: inv.id, rect });
                             }}
                             className="p-2 text-slate-300 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                           >
                              <MoreHorizontal size={20} />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {activeMenu && (
               <ActionMenuPortal 
                 invoice={invoices.find(i => i.id === activeMenu.id)!}
                 anchorRect={activeMenu.rect}
                 onClose={() => setActiveMenu(null)}
                 onStatusChange={handleStatusChange}
                 onDelete={handleDelete}
               />
            )}
            {filteredInvoices.length === 0 && (
               <div className="py-20 text-center opacity-40 flex flex-col items-center">
                  <Receipt size={48} className="text-slate-400 mb-4" strokeWidth={1} />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No invoices found</p>
               </div>
            )}
         </div>
      </div>

      {/* Top-up History */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden mt-8">
         <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
               <Zap size={20} className="text-purple-500" /> Credit Top-up History
            </h3>
         </div>
         
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-slate-50/50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
               <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                 <th className="px-10 py-6">Description</th>
                 <th className="px-10 py-6">Date</th>
                 <th className="px-10 py-6">Credits</th>
                 <th className="px-10 py-6">Cost</th>
                 <th className="px-10 py-6 text-right">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
               {topupCredits.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-20 text-center opacity-40">
                      <div className="flex flex-col items-center">
                         <Zap size={48} className="text-slate-400 mb-4" strokeWidth={1} />
                         <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No top-up history found</p>
                      </div>
                   </td>
                 </tr>
               ) : (
                 topupCredits.map((item) => (
                   <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                     <td className="px-10 py-6">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                           <Zap size={16}/>
                         </div>
                         <div>
                           <p className="text-sm font-bold text-slate-900 dark:text-white">{item.metadata?.description || `${item.amount.toLocaleString()} Credits Top-up`}</p>
                           <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{item.id}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-10 py-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
                       {new Date(item.created_at).toLocaleDateString()}
                     </td>
                     <td className="px-10 py-6 text-sm font-black text-slate-900 dark:text-white">
                       {item.amount.toLocaleString()} CR
                     </td>
                     <td className="px-10 py-6 text-sm font-black text-slate-900 dark:text-white">
                       ${Number(item.cost).toFixed(2)}
                     </td>
                     <td className="px-10 py-6 text-right">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                         item.status === 'active' 
                           ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                           : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                       }`}>
                         {item.status}
                       </span>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
      </div>

      {/* Preview Modal for Invoice (Double Click) */}
      {previewInvoice && createPortal(
        <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
              <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0 z-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl"><FileText size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white">Invoice Preview</h3>
                       <p className="text-xs text-slate-500 dark:text-zinc-400">{previewInvoice.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center gap-2">
                       {isDownloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} PDF
                    </button>
                    <button onClick={() => setPreviewInvoice(null)} className="p-2.5 bg-slate-50 dark:bg-zinc-800 text-slate-400 rounded-xl hover:text-slate-900 dark:hover:text-white"><X size={20}/></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black/50 p-10 flex justify-center">
                 {/* Dynamic Invoice Renderer Matching Invoice Editor */}
                 <div id="hidden-invoice-template-unique">
                    <RenderInvoiceTemplate invoice={previewInvoice} currency={config.currency} />
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Billing;
