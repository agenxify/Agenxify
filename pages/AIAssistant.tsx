
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, Lightbulb, TrendingUp, ShieldAlert, 
  Zap, Trash2, Copy, Download, Image as ImageIcon, X, 
  Settings2, Terminal, PenTool, BarChart3, ChevronRight, CheckCircle2,
  Paperclip, Maximize2, Share2, StopCircle, Sliders, MessageSquare, Users as UsersIcon,
  Globe, ExternalLink, Coins, Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AVAILABLE_PLANS } from '../constants';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../hooks/useClients';
import { useTeam } from '../hooks/useTeam';


import { useAgencySubscription } from '../hooks/useAgencySubscription';

interface FilePreview {
  name: string;
  data: string;
  type: string;
}

interface GroundingSource {
  title: string;
  uri: string;
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
  attachments?: FilePreview[];
  mode?: 'Strategic' | 'Creative' | 'Technical';
  sources?: GroundingSource[];
}

const SmallToggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className={`w-11 h-6 rounded-full relative transition-all duration-300 shadow-inner ${
      active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-zinc-800'
    }`}
  >
    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ease-out ${
      active ? 'left-6' : 'left-1'
    }`} />
  </button>
);

const ZifyAI: React.FC = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { clients, loading: clientsLoading } = useClients();
  const { members: team, loading: teamLoading } = useTeam();

  // Sync with global config
  const getGlobalConfig = () => {
    const saved = localStorage.getItem('agencyos_global_config');
    return saved ? JSON.parse(saved) : {
      aiDefaultMode: 'Strategic',
      aiTemperature: 0.7,
      aiMultimodal: true,
      aiGrounding: false
    };
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('agencyos_ai_messages');
    return saved ? JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [
      {
        id: '1',
        role: 'assistant',
        text: "I am Zify AI, your strategic partner. How can I help you scale your business today?",
        timestamp: new Date(),
        mode: 'Strategic'
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<FilePreview[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { workspace, subscription, deductCredits, addons, totalCredits, loading: subLoading } = useAgencySubscription();
  
  // Preference states linked to global config
  const [activeMode, setActiveMode] = useState<'Strategic' | 'Creative' | 'Technical'>(getGlobalConfig().aiDefaultMode);
  const [aiTemperature, setAiTemperature] = useState(getGlobalConfig().aiTemperature);
  const [isGroundingEnabled, setIsGroundingEnabled] = useState(getGlobalConfig().aiGrounding);
  const [isMultimodalEnabled, setIsMultimodalEnabled] = useState(getGlobalConfig().aiMultimodal);
  
  // Credit System
  const credits = totalCredits;

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal state with external changes (e.g. from Settings page)
  useEffect(() => {
    const syncWithGlobal = (newConf?: any) => {
      const config = newConf || getGlobalConfig();
      if (config.aiDefaultMode) setActiveMode(config.aiDefaultMode);
      if (config.aiTemperature !== undefined) setAiTemperature(config.aiTemperature);
      if (config.aiGrounding !== undefined) setIsGroundingEnabled(config.aiGrounding);
      if (config.aiMultimodal !== undefined) setIsMultimodalEnabled(config.aiMultimodal);
    };

    const handleUpdate = (e: any) => syncWithGlobal(e.detail);
    window.addEventListener('agencyos_config_updated', handleUpdate);
    window.addEventListener('storage', () => syncWithGlobal());

    return () => {
      window.removeEventListener('agencyos_config_updated', handleUpdate);
    };
  }, []);

  // Persist local preference changes to global registry
  const updateGlobalPref = (key: string, value: any) => {
    const current = getGlobalConfig();
    const updated = { ...current, [key]: value };
    localStorage.setItem('agencyos_global_config', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('agencyos_config_updated', { detail: updated }));
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    localStorage.setItem('agencyos_ai_messages', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, attachments]);

  if (authLoading || subLoading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Synchronizing Intelligence Core...</p>
        </div>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMultimodalEnabled) {
      showToast("Multimodal processing is currently disabled in settings.");
      return;
    }
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          name: file.name,
          data: (reader.result as string).split(',')[1],
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const generateResponse = async (prompt: string, currentAttachments: FilePreview[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = 'gemini-3-flash-preview';
    
    const AIC_BASE = `You are Zify AI.
Senior operations executive and financial analyst persona.
CORE DIRECTIVES: Accuracy > Speed. No fabrications. Structured reasoning only.
DATA DOMAINS: Requests, Clients, Finance, Production, Users, Audit Logs.
RESPONSE FORMAT: SUMMARY, KEY INSIGHTS, RISKS, RECOMMENDED ACTIONS, EXPECTED BUSINESS IMPACT.`;

    const systemInstructions = {
      Strategic: `${AIC_BASE}\nFocus: ROI, Revenue Flow, Expansion, and Fiscal Compliance. Analyzes high-level agency growth.`,
      Creative: `${AIC_BASE}\nFocus: Innovation, Brand Storytelling, Design Deliverables, and Creative Production Velocity.`,
      Technical: `${AIC_BASE}\nFocus: System Architecture, Infrastructure Security, Technical Audit logs, and Development Efficiencies.`
    };

    const modeTemp = activeMode === 'Creative' ? 0.9 : activeMode === 'Technical' ? 0.1 : 0.4;
    const finalTemp = Math.min(1, Math.max(0, modeTemp * (aiTemperature / 0.7)));

    try {
      const parts: any[] = [{ text: prompt }];
      if (isMultimodalEnabled) {
        currentAttachments.forEach(att => {
          parts.push({
            inlineData: {
              data: att.data,
              mimeType: att.type
            }
          });
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts }],
        config: {
          systemInstruction: systemInstructions[activeMode],
          temperature: finalTemp,
          tools: isGroundingEnabled ? [{ googleSearch: {} }] : undefined,
        }
      });

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        })) || [];

      return { text: response.text || "", sources };
    } catch (error) {
      console.error("AI Error:", error);
      return { text: "CRITICAL UPLINK ERROR: Neural connection severed.", sources: [] };
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // Credit Check
    if (credits < 3) {
        showToast("Insufficient Credits. Please top up.");
        return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
      attachments: isMultimodalEnabled ? [...attachments] : [],
      mode: activeMode
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentAttachments = [...attachments];
    
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    // Deduct Credits
    deductCredits(3);
    
    const result = await generateResponse(currentInput, currentAttachments);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: result.text,
      timestamp: new Date(),
      mode: activeMode,
      sources: result.sources
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  const clearChat = () => {
    if (window.confirm("PURGE PROTOCOL: Are you sure you want to erase all session memory?")) {
      const initialMsg = messages[0];
      setMessages([initialMsg]);
      showToast("Memory Purged");
    }
  };

  const exportIntel = () => {
    const content = messages.map(m => {
      const time = m.timestamp.toLocaleString();
      const role = m.role === 'assistant' ? `Zify AI (${m.mode})` : 'User';
      const text = m.text;
      return `[${time}] ${role}: ${text}\n${'='.repeat(50)}\n`;
    }).join('\n');

    const blob = new Blob([`AGENCYOS INTEL EXPORT\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgencyOS_Intel_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    showToast("Intel Exported");
  };

  const handleShareToPerson = (name: string) => {
    setIsShareModalOpen(false);
    showToast(`Intel shared with ${name}`);
  };

  const FormattedText = ({ text, role }: { text: string, role: 'assistant' | 'user' }) => {
    const isUser = role === 'user';
    const textColorClass = isUser ? 'text-white' : 'text-slate-700 dark:text-zinc-300';
    const headerColorClass = isUser ? 'text-white' : 'text-slate-900 dark:text-white';
    const strongColorClass = isUser ? 'text-white' : 'text-slate-900 dark:text-white';

    const parseInline = (inputText: string) => {
      const parts = inputText.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className={`font-black ${strongColorClass}`}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    const lines = text.split('\n');
    return (
      <div className="space-y-4">
        {lines.map((line, i) => {
          if (line.startsWith('### ')) {
            return <h4 key={i} className={`text-xl font-black mt-6 mb-2 ${headerColorClass}`}>{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={i} className={`text-2xl font-black mt-8 mb-4 ${headerColorClass}`}>{line.replace('## ', '')}</h3>;
          }
          if (line.startsWith('# ')) {
            return <h2 key={i} className={`text-3xl font-black mt-10 mb-6 ${headerColorClass}`}>{line.replace('# ', '')}</h2>;
          }
          
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            return (
              <div key={i} className="flex items-start gap-3 ml-4">
                <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isUser ? 'bg-white' : 'bg-blue-500'}`} />
                <span className={`${textColorClass} font-medium`}>{parseInline(line.replace(/^(\*|-)\s*/, ''))}</span>
              </div>
            );
          }

          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={i} className="flex items-start gap-3 ml-4">
                <span className={`${isUser ? 'text-white' : 'text-blue-600 dark:text-blue-400'} font-black text-xs mt-1 shrink-0`}>{line.trim().split('.')[0]}.</span>
                <span className={`${textColorClass} font-medium`}>{parseInline(line.replace(/^\d+\.\s*/, ''))}</span>
              </div>
            );
          }

          return <p key={i} className={`leading-relaxed font-medium ${textColorClass}`}>{parseInline(line)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 relative transition-colors">
      
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 dark:bg-zinc-800 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-3 border border-white/10 animate-in slide-in-from-top-4">
           <CheckCircle2 size={16} className="text-blue-400" /> {toast}
        </div>
      )}

      {/* Sidebar */}
      <div className={`hidden xl:flex flex-col w-80 shrink-0 space-y-6 transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 pointer-events-none'}`}>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 shadow-sm flex flex-col h-full overflow-hidden rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Command Center</h3>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-xl transition-all ${isSettingsOpen ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Settings2 size={18} />
            </button>
          </div>

          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <Coins size={18} className="text-purple-600 dark:text-purple-400" />
                  <div>
                      <p className="text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 tracking-widest">Credits</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{credits}</p>
                  </div>
              </div>
              <Link to="/billing/topup" className="text-[9px] font-bold bg-white dark:bg-black px-2 py-1 rounded-lg shadow-sm text-purple-600 hover:text-purple-500 transition-colors uppercase">
                  Refill
              </Link>
          </div>

          {isSettingsOpen ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Parameter Tuning</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-400">Creativity Engine</label>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{Math.round(aiTemperature * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={aiTemperature} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setAiTemperature(val);
                      updateGlobalPref('aiTemperature', val);
                    }}
                    className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="pt-4 border-t border-slate-50 dark:border-zinc-800 space-y-5">
                  <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs font-bold text-slate-700 dark:text-zinc-400">Deep Search Grounding</p>
                       <p className="text-[10px] text-slate-400 dark:text-zinc-600">Verified real-time data</p>
                     </div>
                     <SmallToggle active={isGroundingEnabled} onToggle={() => {
                        const newVal = !isGroundingEnabled;
                        setIsGroundingEnabled(newVal);
                        updateGlobalPref('aiGrounding', newVal);
                     }} />
                  </div>
                  <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs font-bold text-slate-700 dark:text-zinc-400">Multimodal Processing</p>
                       <p className="text-[10px] text-slate-400 dark:text-zinc-600">Analyze images & files</p>
                     </div>
                     <SmallToggle active={isMultimodalEnabled} onToggle={() => {
                        const newVal = !isMultimodalEnabled;
                        setIsMultimodalEnabled(newVal);
                        updateGlobalPref('aiMultimodal', newVal);
                     }} />
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-blue-700 transition-all"
              >
                Save Protocol
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 flex-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-4">Intel Mode</p>
                <ModeSelector 
                  active={activeMode === 'Strategic'} icon={BarChart3} label="Strategic" desc="ROI & Growth analysis"
                  onClick={() => { setActiveMode('Strategic'); updateGlobalPref('aiDefaultMode', 'Strategic'); }} color="blue"
                />
                <ModeSelector 
                  active={activeMode === 'Creative'} icon={PenTool} label="Creative" desc="Brand & Storytelling"
                  onClick={() => { setActiveMode('Creative'); updateGlobalPref('aiDefaultMode', 'Creative'); }} color="purple"
                />
                <ModeSelector 
                  active={activeMode === 'Technical'} icon={Terminal} label="Technical" desc="Systems & Logic"
                  onClick={() => { setActiveMode('Technical'); updateGlobalPref('aiDefaultMode', 'Technical'); }} color="emerald"
                />
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                 <button onClick={clearChat} className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all font-black text-[10px] uppercase tracking-widest">
                    Purge History <Trash2 size={14} />
                 </button>
                 <button onClick={exportIntel} className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 hover:bg-slate-900 dark:hover:bg-zinc-800 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest">
                    Export Intel <Download size={14} />
                 </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[3.5rem] shadow-2xl shadow-blue-500/5 overflow-hidden relative">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center space-x-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 ${
              activeMode === 'Strategic' ? 'bg-blue-600 shadow-blue-200' :
              activeMode === 'Creative' ? 'bg-purple-600 shadow-purple-200' : 'bg-emerald-600 shadow-emerald-200'
            }`}>
              <Bot className="text-white" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Zify AI</h2>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                  activeMode === 'Strategic' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' :
                  activeMode === 'Creative' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30' : 
                  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                }`}>{activeMode} Mode</span>
              </div>
              <p className="text-slate-400 dark:text-zinc-500 text-xs font-medium">Synced with Zify AI Global Core • 3 Credits / Query</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsShareModalOpen(true)} className="p-4 text-slate-300 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-slate-50 dark:bg-zinc-800 rounded-2xl"><Share2 size={20}/></button>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-4 transition-all rounded-2xl ${!isSidebarOpen ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 dark:text-zinc-500 dark:hover:text-white bg-slate-50 dark:bg-zinc-800'}`} title={isSidebarOpen ? "Focus Mode" : "Show Sidebar"}><Maximize2 size={20}/></button>
          </div>
        </div>

        {/* Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/20 dark:bg-black scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
              <div className={`max-w-[85%] flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-5`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-4 border-white dark:border-zinc-800 overflow-hidden transition-all ${
                  msg.role === 'assistant' 
                    ? (msg.mode === 'Creative' ? 'bg-purple-600 text-white' : msg.mode === 'Technical' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white')
                    : 'bg-white dark:bg-zinc-800 border-transparent shadow-sm'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={22} /> : <img src={currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.uid}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                </div>
                
                <div className="space-y-3 flex flex-col group">
                  <div className={`p-8 rounded-[2.5rem] shadow-sm relative transition-colors ${
                    msg.role === 'assistant' 
                      ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-tl-none border border-slate-100 dark:border-zinc-800' 
                      : 'bg-slate-900 dark:bg-blue-600 text-white rounded-tr-none'
                  }`}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-xl group/img">
                            <img src={`data:${att.type};base64,${att.data}`} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <FormattedText text={msg.text} role={msg.role} />

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                         <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                           <Globe size={12} className="text-blue-500" /> Research Data Sources
                         </p>
                         <div className="flex flex-wrap gap-2">
                           {msg.sources.map((s, i) => (
                             <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                               {s.title} <ExternalLink size={10} />
                             </a>
                           ))}
                         </div>
                      </div>
                    )}
                    
                    {msg.role === 'assistant' && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-1">
                        <button onClick={() => copyToClipboard(msg.text)} className="p-2 bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-700 rounded-xl shadow-sm transition-all"><Copy size={14} /></button>
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-3 px-4 text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'justify-end text-slate-400 dark:text-zinc-500' : 'text-slate-300 dark:text-zinc-600'}`}>
                    {msg.role === 'user' && <span className="text-blue-600 dark:text-blue-400">{currentUser?.name || 'User'}</span>}
                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.role === 'assistant' && (
                       <>
                         <span className="w-1 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                         <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Verified Intel</span>
                         <span className="w-1 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                         <span className="opacity-50">Zify AI Strategy</span>
                       </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse border-4 border-white dark:border-zinc-800 shadow-lg ${
                   activeMode === 'Strategic' ? 'bg-blue-600 text-white' :
                   activeMode === 'Creative' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  <Bot size={22} />
                </div>
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-tl-none flex items-center space-x-3 shadow-sm">
                  <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-8 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-6 animate-in slide-in-from-bottom-2">
              {attachments.map((att, i) => (
                <div key={i} className="group relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-100 dark:border-blue-900 shadow-xl">
                  <img src={`data:${att.type};base64,${att.data}`} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => removeAttachment(i)} className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><X size={20} /></button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative flex items-center gap-4">
            <input type="file" className="hidden" ref={fileInputRef} multiple accept="image/*" onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} className={`p-5 rounded-2xl transition-all shrink-0 ${isMultimodalEnabled ? 'text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-zinc-800' : 'text-slate-200 dark:text-zinc-800 bg-slate-50/50 dark:bg-zinc-900 cursor-not-allowed'}`} title="Upload visual data"><Paperclip size={24} /></button>
            <div className="relative flex-1 group">
              <input 
                type="text" className="w-full pl-8 pr-16 py-6 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all font-bold text-lg text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                placeholder={`Ask ${activeMode} Mode something (3 Credits)...`}
                value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend} disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all shadow-xl ${
                  isLoading ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-700' : (activeMode === 'Strategic' ? 'bg-blue-600' : activeMode === 'Creative' ? 'bg-purple-600' : 'bg-emerald-600') + ' text-white hover:scale-110 active:scale-95'
                }`}
              >
                {isLoading ? <StopCircle size={24} className="animate-pulse" /> : <Send size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 md:p-12 overflow-hidden animate-in fade-in duration-500">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-zinc-800">
            <div className="p-10">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Distribute Intel</h3>
               <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Team Members</p>
                    <div className="grid grid-cols-2 gap-3">
                       {team.slice(0, 6).map(p => (
                         <button key={p.id} onClick={() => handleShareToPerson(p.name)} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800 group">
                            <img src={p.avatar} className="w-8 h-8 rounded-lg shadow-sm" alt="" referrerPolicy="no-referrer" />
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">{p.name}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Clients</p>
                    <div className="grid grid-cols-2 gap-3">
                       {clients.slice(0, 6).map(c => (
                         <button key={c.id} onClick={() => handleShareToPerson(c.name)} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 group">
                            <img src={c.avatar} className="w-8 h-8 rounded-lg shadow-sm" alt="" referrerPolicy="no-referrer" />
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 truncate">{c.name}</span>
                         </button>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ModeSelector = ({ active, icon: Icon, label, desc, onClick, color }: any) => {
  const colors: any = {
    blue: active 
      ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100 dark:shadow-blue-900/20 shadow-xl' 
      : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-500 dark:text-zinc-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-white dark:hover:bg-zinc-700',
    purple: active 
      ? 'bg-purple-600 border-purple-600 text-white shadow-purple-100 dark:shadow-purple-900/20 shadow-xl' 
      : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-500 dark:text-zinc-400 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-white dark:hover:bg-zinc-700',
    emerald: active 
      ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-100 dark:shadow-emerald-900/20 shadow-xl' 
      : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-500 dark:text-zinc-400 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-white dark:hover:bg-zinc-700',
  };
  return (
    <button onClick={onClick} className={`w-full flex items-start gap-4 p-5 rounded-3xl border-2 transition-all text-left ${colors[color]}`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${active ? 'bg-white/20' : 'bg-slate-200/50 dark:bg-zinc-900/50'}`}><Icon size={20} /></div>
      <div><p className="font-black text-xs uppercase tracking-widest">{label}</p><p className={`text-[10px] font-medium mt-0.5 leading-tight ${active ? 'text-white/70' : 'text-slate-400 dark:text-zinc-500'}`}>{desc}</p></div>
    </button>
  );
};

export default ZifyAI;
