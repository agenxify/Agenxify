
import React, { useState } from 'react';
import { 
  MessageCircle, Phone, Mail, Share2, Globe, Smartphone, AtSign, Send,
  Inbox, Search, Filter, MoreVertical, Paperclip, Mic, Image as ImageIcon,
  Check, Archive, Clock, Star, Zap, User, AlertCircle, Plus, Layout,
  GitMerge, Calendar, ArrowRight, Settings, Bell
} from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';

const { useNavigate } = ReactRouterDom as any;

const MarketingOmnichannel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Inbox' | 'Campaigns' | 'Journeys' | 'Settings'>('Inbox');
  const [selectedChat, setSelectedChat] = useState<string>('c1');

  // Unified Inbox Data
  const CHATS = [
    { id: 'c1', user: 'Sarah Connor', platform: 'WhatsApp', lastMsg: 'Is the enterprise plan available?', time: '2m ago', unread: true, avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 'c2', user: 'Mike Ross', platform: 'SMS', lastMsg: 'Confirmed for Tuesday.', time: '15m ago', unread: false, avatar: 'https://i.pravatar.cc/150?u=mike' },
    { id: 'c3', user: 'Jessica Pearson', platform: 'Email', lastMsg: 'Re: Contract Renewal', time: '1h ago', unread: false, avatar: 'https://i.pravatar.cc/150?u=jessica' },
    { id: 'c4', user: 'Harvey Specter', platform: 'Messenger', lastMsg: 'Thanks for the quick reply.', time: '3h ago', unread: false, avatar: 'https://i.pravatar.cc/150?u=harvey' },
    { id: 'c5', user: 'Louis Litt', platform: 'Instagram', lastMsg: 'Love the new branding!', time: '1d ago', unread: false, avatar: 'https://i.pravatar.cc/150?u=louis' },
  ];

  const MESSAGES = [
    { id: 'm1', sender: 'user', text: 'Hi, I was looking at your enterprise tier.', time: '10:00 AM' },
    { id: 'm2', sender: 'agent', text: 'Hello Sarah! Yes, the Enterprise plan is fully available. It includes unlimited seats and 24/7 priority support.', time: '10:02 AM' },
    { id: 'm3', sender: 'user', text: 'Is the enterprise plan available for non-profits?', time: '10:05 AM' },
  ];

  return (
    <div className="h-full bg-[#000000] text-white flex flex-col font-sans overflow-hidden">
      
      {/* Top Navigation */}
      <div className="h-20 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between px-8 shrink-0 z-20">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-500 border border-indigo-500/20">
               <Globe size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tight">Unified Nexus</h1>
            <div className="h-6 w-px bg-zinc-800 mx-2" />
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
               {['Inbox', 'Campaigns', 'Journeys', 'Settings'].map(tab => (
                  <button 
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                  >
                     {tab}
                  </button>
               ))}
            </div>
         </div>
         <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">All Channels Online</span>
             </div>
             <button className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"><Settings size={18}/></button>
         </div>
      </div>

      {activeTab === 'Inbox' && (
         <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Conversation List */}
            <div className="w-96 border-r border-zinc-800 bg-[#050505] flex flex-col shrink-0">
               <div className="p-4 border-b border-zinc-800 space-y-4 shrink-0">
                  <div className="flex justify-between items-center">
                     <h2 className="text-lg font-black pl-2">Messages</h2>
                     <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><Plus size={18}/></button>
                  </div>
                  <div className="relative group">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                     <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:border-indigo-600 transition-all placeholder:text-zinc-600" placeholder="Search chats..." />
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                     {['All', 'Unread', 'WhatsApp', 'SMS', 'Email'].map(f => (
                        <button key={f} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white hover:border-zinc-700 whitespace-nowrap">{f}</button>
                     ))}
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {CHATS.map(chat => (
                     <div 
                        key={chat.id}
                        onClick={() => setSelectedChat(chat.id)}
                        className={`p-4 border-b border-zinc-800/50 cursor-pointer transition-all hover:bg-zinc-900/50 ${selectedChat === chat.id ? 'bg-zinc-900 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                     >
                        <div className="flex gap-3">
                           <div className="relative">
                              <img src={chat.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                              <div className="absolute -bottom-1 -right-1 p-0.5 bg-black rounded-full">
                                 {chat.platform === 'WhatsApp' && <div className="bg-emerald-500 p-1 rounded-full"><MessageCircle size={8} fill="white" className="text-white"/></div>}
                                 {chat.platform === 'SMS' && <div className="bg-blue-500 p-1 rounded-full"><Smartphone size={8} fill="white" className="text-white"/></div>}
                                 {chat.platform === 'Email' && <div className="bg-amber-500 p-1 rounded-full"><Mail size={8} fill="white" className="text-white"/></div>}
                              </div>
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-0.5">
                                 <h4 className={`text-sm ${chat.unread ? 'font-black text-white' : 'font-bold text-zinc-300'}`}>{chat.user}</h4>
                                 <span className="text-[10px] font-bold text-zinc-500">{chat.time}</span>
                              </div>
                              <p className={`text-xs truncate ${chat.unread ? 'font-bold text-indigo-400' : 'text-zinc-500'}`}>{chat.lastMsg}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 flex flex-col bg-[#0c0c0e] min-w-0">
               <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b] shrink-0">
                  <div className="flex items-center gap-4">
                     <img src="https://i.pravatar.cc/150?u=sarah" className="w-9 h-9 rounded-xl" alt="" />
                     <div>
                        <h3 className="text-sm font-black text-white">Sarah Connor</h3>
                        <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">via WhatsApp <span className="w-1 h-1 rounded-full bg-emerald-500"/> Online</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"><Search size={18}/></button>
                     <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"><Archive size={18}/></button>
                     <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"><MoreVertical size={18}/></button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {MESSAGES.map((msg, i) => (
                     <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                           msg.sender === 'agent' 
                           ? 'bg-indigo-600 text-white rounded-tr-none' 
                           : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                        }`}>
                           {msg.text}
                        </div>
                     </div>
                  ))}
               </div>

               <div className="p-6 pt-2 shrink-0">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 flex items-end gap-2 focus-within:border-indigo-600 transition-colors">
                     <div className="flex gap-1 pb-2 pl-2">
                        <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg"><Paperclip size={18}/></button>
                        <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg"><ImageIcon size={18}/></button>
                        <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg"><Zap size={18}/></button>
                     </div>
                     <textarea 
                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-white max-h-32 min-h-[44px] py-3 resize-none placeholder:text-zinc-600"
                        placeholder="Type a message or use / for templates..."
                     />
                     <button className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 mb-0.5">
                        <Send size={18} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Right Context Panel */}
            <div className="w-80 border-l border-zinc-800 bg-[#050505] p-6 hidden xl:block overflow-y-auto custom-scrollbar shrink-0">
               <div className="text-center mb-8">
                  <div className="w-24 h-24 rounded-[2rem] mx-auto mb-4 overflow-hidden border-4 border-zinc-800 shadow-xl">
                     <img src="https://i.pravatar.cc/150?u=sarah" className="w-full h-full object-cover" alt="" />
                  </div>
                  <h3 className="text-lg font-black text-white">Sarah Connor</h3>
                  <p className="text-xs text-zinc-500 font-bold mb-4">sarah.c@skynet.com</p>
                  <div className="flex justify-center gap-3">
                     <button className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-indigo-500 hover:text-indigo-500 transition-all"><User size={16}/></button>
                     <button className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-indigo-500 hover:text-indigo-500 transition-all"><Bell size={16}/></button>
                     <button className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-indigo-500 hover:text-indigo-500 transition-all"><Star size={16}/></button>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-3">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">CRM Data</p>
                     <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Lifecycle</span>
                        <span className="font-bold text-white bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded">Opportunity</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Value</span>
                        <span className="font-bold text-white">$12,500</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Last Deal</span>
                        <span className="font-bold text-white">2 days ago</span>
                     </div>
                  </div>

                  <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-3">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tags</p>
                     <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300">Enterprise</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300">Q4 Promo</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300">VIP</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Campaigns Tab Placeholder for Enterprise Feel */}
      {activeTab === 'Campaigns' && (
         <div className="flex-1 p-10 flex flex-col items-center justify-center space-y-8 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.1),transparent)] overflow-hidden">
            <div className="w-32 h-32 rounded-full bg-indigo-600/20 flex items-center justify-center shadow-[0_0_100px_rgba(79,70,229,0.3)]">
               <Zap size={64} className="text-indigo-500" />
            </div>
            <h2 className="text-4xl font-black text-white">Campaign Command</h2>
            <p className="text-zinc-400 max-w-md text-center text-lg">
               Orchestrate SMS, Email, and WhatsApp blasts from a single timeline.
            </p>
            <button className="px-8 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl">Create Broadcast</button>
         </div>
      )}

    </div>
  );
};

export default MarketingOmnichannel;
