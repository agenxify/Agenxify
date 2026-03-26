
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Filter, ShoppingBag, ArrowUpRight, 
  Calendar, CreditCard, Mail, User, CheckCircle2,
  Download, FileText, Clock, AlertCircle, RefreshCw, Loader2, ChevronDown
} from 'lucide-react';
import { Order, Invoice } from '../types';
import { useStore } from '../hooks/useStore.ts';
import { useCurrency } from '../context/CurrencyContext.tsx';
import { supabase } from '../supabase.ts'; 

// --- Portal Component for Unclipped Dropdown ---
const StatusMenuPortal = ({ 
  currentStatus, 
  anchorRect, 
  onClose, 
  onUpdate 
}: { 
  currentStatus: string; 
  anchorRect: DOMRect; 
  onClose: () => void; 
  onUpdate: (status: string) => void;
}) => {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const menuHeight = 170; // Approx height of the menu

  useEffect(() => {
    if (!anchorRect) return;
    
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const showAbove = spaceBelow < menuHeight; // Flip if less space than menu height
    
    setStyle({
      position: 'fixed',
      top: showAbove ? (anchorRect.top - menuHeight - 8) : (anchorRect.bottom + 8),
      left: anchorRect.left,
      width: '160px', // w-40
      zIndex: 9999
    });
  }, [anchorRect]);

  const getStatusIcon = (status: string) => {
      switch (status) {
          case 'Paid': return <CheckCircle2 size={12} />;
          case 'Pending': return <Clock size={12} />;
          case 'Overdue': return <AlertCircle size={12} />;
          case 'Rejected': return <FileText size={12} />;
          default: return <RefreshCw size={12} />;
      }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div 
        className="fixed bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1 animate-in zoom-in-95 duration-200 flex flex-col gap-0.5"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
         {['Paid', 'Pending', 'Overdue', 'Rejected'].map(status => (
             <button
                key={status}
                onClick={() => onUpdate(status)}
                className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${
                    status === currentStatus 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
             >
                 {getStatusIcon(status)} {status}
             </button>
         ))}
      </div>
    </>,
    document.body
  );
};

const Orders: React.FC = () => {
  const { format } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Stores the ID, position, and current status of the active row for the portal
  const [activeStatusMenu, setActiveStatusMenu] = useState<{ id: string, rect: DOMRect, status: string } | null>(null);
  
  const { fetchOrders, updateOrderStatus } = useStore();

  useEffect(() => {
    const loadOrders = async () => {
        setLoading(true);
        const data = await fetchOrders();
        setOrders(data);
        setLoading(false);
    };
    loadOrders();
    
    // Listen for updates
    window.addEventListener('storage', loadOrders);
    window.addEventListener('agencyos_config_updated', loadOrders);
    
    // Realtime Subscriptions
    const orderSub = supabase.channel('orders_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            fetchOrders().then(setOrders);
        })
        .subscribe();
    
    const invoiceSub = supabase.channel('invoices_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
            fetchOrders().then(setOrders);
        })
        .subscribe();

    return () => {
      window.removeEventListener('storage', loadOrders);
      window.removeEventListener('agencyos_config_updated', loadOrders);
      supabase.removeChannel(orderSub);
      supabase.removeChannel(invoiceSub);
    };
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
      setActiveStatusMenu(null);
      
      // DB update
      await updateOrderStatus(id, newStatus);
      
      // Refresh
      const data = await fetchOrders();
      setOrders(data);
  };

  const getStatusStyle = (status: string) => {
      switch (status) {
          case 'Paid': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
          case 'Pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
          case 'Overdue': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
          case 'Rejected': return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
          default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      }
  };

  const getStatusIcon = (status: string) => {
      switch (status) {
          case 'Paid': return <CheckCircle2 size={12} />;
          case 'Pending': return <Clock size={12} />;
          case 'Overdue': return <AlertCircle size={12} />;
          case 'Rejected': return <FileText size={12} />;
          default: return <RefreshCw size={12} />;
      }
  };

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-40 relative min-h-screen">
      
      {/* Portal Menu for Status Dropdown */}
      {activeStatusMenu && (
         <StatusMenuPortal 
            currentStatus={activeStatusMenu.status}
            anchorRect={activeStatusMenu.rect}
            onClose={() => setActiveStatusMenu(null)}
            onUpdate={(status) => handleStatusUpdate(activeStatusMenu.id, status)}
         />
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Order History</h2>
          <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-500 font-medium">
             <ShoppingBag size={16} className="text-blue-500" />
             <p>Global Storefront Transactions</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl shadow-blue-500/5 flex flex-col lg:flex-row items-center gap-6 sticky top-4 z-30">
         <div className="relative flex-1 w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search orders, customers, or products..." 
              className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xl min-h-[400px]">
         {loading ? (
             <div className="flex items-center justify-center h-64">
                 <Loader2 className="animate-spin text-blue-500" size={32} />
             </div>
         ) : (
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                  <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                     <th className="px-8 py-6">Order Ref</th>
                     <th className="px-8 py-6">Customer</th>
                     <th className="px-8 py-6">Product</th>
                     <th className="px-8 py-6">Date</th>
                     <th className="px-8 py-6">Amount</th>
                     <th className="px-8 py-6">Linked Status</th>
                     <th className="px-8 py-6 text-right">Invoice</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredOrders.length > 0 ? (
                     filteredOrders.map((order, idx) => {
                       return (
                         <tr 
                            key={order.id} 
                            className="group transition-all hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                            style={{ animationDelay: `${idx * 50}ms` }}
                         >
                            <td className="px-8 py-6">
                               <span className="font-mono text-xs font-bold text-slate-500 dark:text-zinc-400">#{order.id}</span>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                                     <User size={14} className="text-slate-500" />
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-900 dark:text-white">{order.customerName}</p>
                                     <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium">{order.customerEmail}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">{order.serviceName}</span>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{new Date(order.date).toLocaleDateString()}</span>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-sm font-black text-slate-900 dark:text-white">{format(order.amount)}</span>
                            </td>
                            <td className="px-8 py-6 relative">
                               <button 
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     const rect = e.currentTarget.getBoundingClientRect();
                                     // Toggle logic: Close if same ID, otherwise open new
                                     setActiveStatusMenu(
                                        activeStatusMenu?.id === order.id 
                                        ? null 
                                        : { id: order.id, rect, status: order.status }
                                     );
                                 }}
                                 className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 cursor-pointer ${getStatusStyle(order.status)}`}
                               >
                                  {getStatusIcon(order.status)} {order.status}
                                  <ChevronDown size={10} className="ml-1 opacity-50" />
                               </button>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-950 px-2 py-1 rounded">{order.invoiceId}</span>
                            </td>
                         </tr>
                       );
                     })
                  ) : (
                     <tr>
                        <td colSpan={7} className="py-20 text-center text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest text-xs">
                           No orders found
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
         )}
      </div>

    </div>
  );
};

export default Orders;
