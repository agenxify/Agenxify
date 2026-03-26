
import React, { useState } from 'react';
import { 
  ArrowLeft, CreditCard, Plus, Trash2, CheckCircle2, ShieldCheck, Lock
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';

const { useNavigate } = ReactRouterDom as any;

const MOCK_METHODS = [
  { id: 'pm_1', type: 'Visa', last4: '4242', exp: '12/28', holder: 'Agency Admin', default: true },
  { id: 'pm_2', type: 'Mastercard', last4: '8833', exp: '09/26', holder: 'Agency Admin', default: false },
];

const PaymentMethods: React.FC = () => {
  const navigate = useNavigate();
  const [methods, setMethods] = useState(MOCK_METHODS);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id: string) => {
    if(confirm("Remove this payment method?")) {
        setMethods(methods.filter(m => m.id !== id));
    }
  };

  const handleSetDefault = (id: string) => {
      setMethods(methods.map(m => ({ ...m, default: m.id === id })));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-6 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <button onClick={() => navigate('/personal-billing')} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:scale-105 active:scale-95 transition-all text-slate-400 dark:text-zinc-600 hover:text-blue-600 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Payment Methods</h1>
           <p className="text-slate-500 dark:text-zinc-500 font-medium mt-1">Manage cards and billing sources securely.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {methods.map(method => (
            <div key={method.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-xl transition-all">
               <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="w-20 h-14 bg-slate-100 dark:bg-black rounded-xl flex items-center justify-center text-slate-400 font-black tracking-tighter text-sm border border-slate-200 dark:border-zinc-800">
                     {method.type.toUpperCase()}
                  </div>
                  <div>
                     <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">•••• •••• •••• {method.last4}</h3>
                        {method.default && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-900/50">Primary</span>}
                     </div>
                     <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1">Expires {method.exp} • {method.holder}</p>
                  </div>
               </div>

               <div className="flex items-center gap-3 w-full md:w-auto">
                  {!method.default && (
                      <button onClick={() => handleSetDefault(method.id)} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all">
                          Set Default
                      </button>
                  )}
                  <button onClick={() => handleDelete(method.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                      <Trash2 size={18} />
                  </button>
               </div>
            </div>
         ))}

         {/* Add New Card Button Disabled */}
         <div 
           className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 text-slate-400 opacity-50 cursor-not-allowed"
         >
            <div className="p-4 bg-slate-100 dark:bg-zinc-900 rounded-full">
               <Lock size={32} />
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Payment Methods Disabled</span>
         </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-zinc-600 text-xs font-medium">
         <Lock size={12} />
         Payments are secured by Stripe. We do not store your card details.
      </div>

      {isAdding && (
          <div className="fixed inset-0 z-[10005] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white dark:bg-zinc-900 w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Add Card</h3>
                <div className="space-y-4">
                   <div className="h-12 bg-slate-100 dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center px-4 text-slate-400 text-sm">
                      Card Number
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="h-12 bg-slate-100 dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center px-4 text-slate-400 text-sm">
                         MM / YY
                      </div>
                      <div className="h-12 bg-slate-100 dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center px-4 text-slate-400 text-sm">
                         CVC
                      </div>
                   </div>
                </div>
                <div className="flex gap-3 mt-8">
                   <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all">Cancel</button>
                   <button onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all">Add Card</button>
                </div>
             </div>
          </div>
      )}

    </div>
  );
};

export default PaymentMethods;
