
import React, { useState, useEffect } from 'react';
import { Search, Download, User, ShoppingBag, MessageSquare, Mail, Loader2 } from 'lucide-react';
import { StoreUser, StoreMessage } from '../types';
import { useStore } from '../hooks/useStore.ts';

const StoreUsers: React.FC = () => {
  const [users, setUsers] = useState<StoreUser[]>([]);
  const [messages, setMessages] = useState<StoreMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const { fetchStoreUsers, fetchMessages } = useStore();

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        const [usersData, messagesData] = await Promise.all([
            fetchStoreUsers(),
            fetchMessages()
        ]);
        setUsers(usersData);
        setMessages(messagesData);
        setLoading(false);
    };
    loadData();
    
    // Listen for updates (e.g. new message sent from PublicStore)
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-500 pb-40 relative min-h-screen">
       <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">Store Customers</h2>
          <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-500 font-medium">
             <ShoppingBag size={16} className="text-blue-500" />
             <p>Registered Accounts & Inquiries</p>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col lg:flex-row items-center gap-6 sticky top-4 z-30">
             <div className="relative flex-1 w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search customers..." 
                  className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all text-slate-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xl min-h-[300px]">
             {loading ? (
                 <div className="flex items-center justify-center h-64">
                     <Loader2 className="animate-spin text-blue-500" size={32} />
                 </div>
             ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                      <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                         <th className="px-8 py-6">Customer</th>
                         <th className="px-8 py-6">Registered</th>
                         <th className="px-8 py-6">Last Login</th>
                         <th className="px-8 py-6 text-center">Orders</th>
                         <th className="px-8 py-6 text-right">Total Spent</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {filteredUsers.map((user) => (
                         <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-400">
                                     <User size={18} />
                                  </div>
                                  <div>
                                     <p className="font-bold text-sm text-slate-900 dark:text-white">{user.name}</p>
                                     <p className="text-xs text-slate-500">{user.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
                               {user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-zinc-400">
                               {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-8 py-6 text-center font-bold text-slate-900 dark:text-white">
                               {user.ordersCount}
                            </td>
                            <td className="px-8 py-6 text-right font-black text-slate-900 dark:text-white">
                               ${(user.totalSpent || 0).toLocaleString()}
                            </td>
                         </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                         <tr>
                            <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No customers found</td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
             )}
          </div>
      </div>

      {/* Messages Section */}
      <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
             <MessageSquare size={20} className="text-blue-500" />
             <h3 className="text-2xl font-black text-slate-900 dark:text-white">Contact Inquiries</h3>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xl min-h-[200px]">
             {loading ? (
                 <div className="flex items-center justify-center h-48">
                     <Loader2 className="animate-spin text-blue-500" size={24} />
                 </div>
             ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 dark:bg-black border-b border-slate-100 dark:border-zinc-800">
                      <tr className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                         <th className="px-8 py-6">Sender</th>
                         <th className="px-8 py-6">Message</th>
                         <th className="px-8 py-6 text-right">Date</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {messages.map((msg) => (
                         <tr key={msg.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                            <td className="px-8 py-6 align-top w-64">
                               <div className="flex items-start gap-4">
                                  <div className="mt-1 w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-900/30">
                                     <Mail size={14} />
                                  </div>
                                  <div>
                                     <p className="font-bold text-sm text-slate-900 dark:text-white">{msg.name}</p>
                                     <p className="text-xs text-slate-500 break-all">{msg.email}</p>
                                  </div>
                                </div>
                            </td>
                            <td className="px-8 py-6 align-top">
                               <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </td>
                            <td className="px-8 py-6 text-right align-top w-48">
                               <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{new Date(msg.date).toLocaleString()}</span>
                            </td>
                         </tr>
                      ))}
                      {messages.length === 0 && (
                         <tr>
                            <td colSpan={3} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No inquiries yet</td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
             )}
          </div>
      </div>
    </div>
  );
};

export default StoreUsers;
