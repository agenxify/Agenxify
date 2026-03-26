import React, { useState, useEffect } from 'react';
import { 
  Zap, ArrowRight, Mail, Key, User, 
  AlertCircle, RefreshCw, Globe as GlobeIcon,
  Eye, EyeOff, KeyRound, Wand2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import * as ReactRouterDom from 'react-router-dom';
import { UserRole } from '../types.ts';

const { useNavigate, useLocation } = ReactRouterDom as any;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, resetPassword, sendMagicLink, user } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const invitedRole = queryParams.get('role') as UserRole | null;

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'magic-link'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>(invitedRole || 'admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Core redirection logic: Admits user once the context has resolved the user profile
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const switchMode = (newMode: 'login' | 'signup' | 'forgot-password' | 'magic-link') => {
      setMode(newMode);
      setError(null);
      setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        // Success redirect is handled by useEffect listening to 'user' state
      } else if (mode === 'signup') {
        await signup(email, password, name, selectedRole);
        setSuccessMsg("Account created! Please check your email to verify your account.");
        setIsLoading(false);
      } else if (mode === 'forgot-password') {
        await resetPassword(email);
        setSuccessMsg("Password reset link sent! Check your inbox.");
        setIsLoading(false);
      } else if (mode === 'magic-link') {
        await sendMagicLink(email);
        setSuccessMsg("Magic link sent! Check your email to sign in.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Authentication Failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden font-sans selection:bg-blue-600/30">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl p-6 flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1 space-y-8 text-center md:text-left animate-in slide-in-from-left duration-1000">
           <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                 <Zap size={32} fill="white" className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-white">Agencify OS</h1>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1">Intelligence Terminal</p>
              </div>
           </div>
           
           <div className="space-y-4">
             <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">
               Secure <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Environment.</span>
             </h2>
             <p className="text-lg text-zinc-500 font-medium max-w-md leading-relaxed">
               Access your agency dashboard, manage project pipelines, and collaborate in real-time within our high-security ecosystem.
             </p>
           </div>
        </div>

        <div className="w-full md:w-[450px] shrink-0 animate-in slide-in-from-right duration-1000">
           <div className="bg-[#0c0c0e] border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-500"><GlobeIcon size={200}/></div>
              
              <div className="relative z-10 space-y-8">
                 {/* Mode Switcher */}
                 {(mode === 'login' || mode === 'signup') && (
                     <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                        <button onClick={() => switchMode('login')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-zinc-800 text-white shadow-xl ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>Login</button>
                        <button onClick={() => switchMode('signup')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'signup' ? 'bg-zinc-800 text-white shadow-xl ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>Provision</button>
                     </div>
                 )}
                 
                 {(mode === 'forgot-password' || mode === 'magic-link') && (
                     <div className="text-center">
                        <h3 className="text-xl font-black text-white mb-2">{mode === 'forgot-password' ? 'Reset Password' : 'Passwordless Login'}</h3>
                        <p className="text-xs text-zinc-500 font-medium">Enter your email to receive a secure link.</p>
                     </div>
                 )}

                 <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'signup' && (
                       <div className="space-y-2 animate-in slide-in-from-top-2">
                          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Identity Name</label>
                          <div className="relative group">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-blue-500 transition-colors" />
                            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-black border border-zinc-800 rounded-2xl outline-none text-white text-sm font-bold focus:border-blue-600 transition-all" />
                          </div>
                       </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Registry Email</label>
                       <div className="relative group">
                         <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-blue-500 transition-colors" />
                         <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="address@domain.com" className="w-full pl-12 pr-4 py-4 bg-black border border-zinc-800 rounded-2xl outline-none text-white text-sm font-bold focus:border-blue-600 transition-all" />
                       </div>
                    </div>

                    {(mode === 'login' || mode === 'signup') && (
                        <div className="space-y-2">
                           <div className="flex justify-between items-center ml-2 mr-1">
                               <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Secure Key</label>
                               {mode === 'login' && (
                                   <button type="button" onClick={() => switchMode('forgot-password')} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors">Forgot Password?</button>
                               )}
                           </div>
                           <div className="relative group">
                             <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-blue-500 transition-colors" />
                             <input 
                               required 
                               type={showPassword ? 'text' : 'password'} 
                               value={password} 
                               onChange={(e) => setPassword(e.target.value)} 
                               placeholder="••••••••" 
                               className="w-full pl-12 pr-12 py-4 bg-black border border-zinc-800 rounded-2xl outline-none text-white text-sm font-bold focus:border-blue-600 transition-all" 
                             />
                             <button 
                               type="button" 
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-blue-500 transition-colors"
                             >
                               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                             </button>
                           </div>
                        </div>
                    )}

                    {error && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-in shake">
                         <AlertCircle size={16} className="text-rose-500 shrink-0" />
                         <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">{error}</p>
                      </div>
                    )}
                    
                    {successMsg && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in">
                         <Zap size={16} className="text-emerald-500 shrink-0" />
                         <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{successMsg}</p>
                      </div>
                    )}

                    <button type="submit" disabled={isLoading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group">
                      {isLoading ? <RefreshCw size={20} className="animate-spin" /> : (
                          <>
                              {mode === 'login' && 'Establish Link'}
                              {mode === 'signup' && 'Provision Account'}
                              {mode === 'forgot-password' && 'Send Reset Link'}
                              {mode === 'magic-link' && 'Send Magic Link'}
                              {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                          </>
                      )}
                    </button>
                    
                    {/* Alternative Actions */}
                    {mode === 'login' && (
                        <button type="button" onClick={() => switchMode('magic-link')} className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                             <Wand2 size={14} /> Sign in via Magic Link
                        </button>
                    )}

                    {(mode === 'forgot-password' || mode === 'magic-link') && (
                        <button type="button" onClick={() => switchMode('login')} className="w-full text-center text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
                            Back to Login
                        </button>
                    )}
                 </form>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;