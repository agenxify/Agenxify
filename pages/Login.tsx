import React, { useState, useEffect } from 'react';
import { 
  Check, ArrowLeft, Mail, Lock, User, 
  AlertCircle, RefreshCw, Eye, EyeOff, ArrowRight
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

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'magic-link'>('signup');
  const [selectedRole, setSelectedRole] = useState<UserRole>(invitedRole || 'admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Core redirection logic
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

  const features = [
    "Unlimited access to all core modules",
    "No credit card required to start",
    "Cancel anytime, no questions asked",
    "Dedicated onboarding support"
  ];

  return (
    <div className="h-screen bg-black flex items-center justify-center relative font-sans selection:bg-[#38bdf8]/30 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px]" />
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#38bdf8]/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#38bdf8]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-8 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Column */}
        <div className="flex-1 max-w-[540px] animate-in fade-in slide-in-from-left-8 duration-1000">
          {/* Logo - Icon Only */}
          <div className="flex items-center gap-2 mb-8 cursor-pointer group" onClick={() => window.location.href = 'https://agenxify.com'}>
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-all">
              <ArrowLeft size={20} className="text-white" />
            </div>
          </div>

          {/* Headings */}
          <h1 className="text-[56px] leading-[1.05] font-bold text-white tracking-tight mb-6 font-['Outfit']">
            The operating<br/>system for modern<br/>agencies
          </h1>
          <p className="text-[16px] text-[#a1a1aa] leading-relaxed mb-8 max-w-[480px]">
            Join 12,000+ agencies already using AgencyOS to streamline operations, boost productivity, and scale their business.
          </p>

          {/* Features */}
          <div className="space-y-4 mb-8">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Check size={14} strokeWidth={3} className="text-[#38bdf8]" />
                </div>
                <span className="text-[15px] text-[#e4e4e7] font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-[#09090b]/50 backdrop-blur-xl border border-[#27272a] rounded-[2rem] p-6 mb-8 max-w-[480px] shadow-2xl">
            <p className="text-[15px] text-[#d4d4d8] italic leading-relaxed mb-6">
              "AgencyOS transformed how we run our agency. We've saved 12 hours weekly and increased our client capacity by 3x."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] flex items-center justify-center text-base font-bold text-black shadow-lg shadow-[#38bdf8]/20">
                JD
              </div>
              <div>
                <p className="text-sm font-bold text-white">Jordan Davis</p>
                <p className="text-[13px] text-[#a1a1aa] font-medium">CEO, Velocity Digital</p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-8 text-[13px] font-medium text-[#71717a]">
            <button onClick={() => navigate('/privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/terms-of-service')} className="hover:text-white transition-colors">Terms of Service</button>
          </div>
        </div>

        {/* Right Column - Auth Card */}
        <div className="w-full max-w-[460px] shrink-0 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="bg-[#09090b] border border-[#27272a] rounded-[32px] p-8 shadow-[0_0_50px_-12px_rgba(56,189,248,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-transparent via-[#38bdf8]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Toggle */}
            <div className="flex bg-[#18181b] p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner">
              <button 
                onClick={() => switchMode('login')} 
                className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-300 ${mode === 'login' ? 'bg-[#27272a] text-white shadow-lg ring-1 ring-white/10' : 'text-[#71717a] hover:text-white'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => switchMode('signup')} 
                className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-300 ${mode === 'signup' ? 'bg-[#27272a] text-white shadow-lg ring-1 ring-white/10' : 'text-[#71717a] hover:text-white'}`}
              >
                Sign Up
              </button>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-[28px] font-bold text-white mb-2 tracking-tight font-['Outfit']">
                {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset Password'}
              </h2>
              <p className="text-[15px] text-[#a1a1aa] font-medium">
                {mode === 'login' ? 'Sign in to access your dashboard' : mode === 'signup' ? 'Get started with AgencyOS today' : 'Enter your email to receive a secure link.'}
              </p>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <button className="flex items-center justify-center py-3.5 bg-[#18181b] border border-[#27272a] rounded-2xl hover:bg-[#27272a] hover:border-white/10 transition-all active:scale-95">
                <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" className="w-6 h-6" alt="Google" referrerPolicy="no-referrer" />
              </button>
              <button className="flex items-center justify-center py-3.5 bg-[#18181b] border border-[#27272a] rounded-2xl hover:bg-[#27272a] hover:border-white/10 transition-all active:scale-95">
                <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" className="w-6 h-6 invert" alt="GitHub" referrerPolicy="no-referrer" />
              </button>
              <button className="flex items-center justify-center py-3.5 bg-[#18181b] border border-[#27272a] rounded-2xl hover:bg-[#27272a] hover:border-white/10 transition-all active:scale-95">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/25/Microsoft_icon.svg" className="w-6 h-6" alt="Microsoft" referrerPolicy="no-referrer" />
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#27272a]"></div>
              </div>
              <div className="relative flex justify-center text-[11px] font-bold text-[#52525b] tracking-widest">
                <span className="bg-[#09090b] px-6 uppercase">OR CONTINUE WITH EMAIL</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-white ml-1">Full name</label>
                  <div className="relative group/input">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b] group-focus-within/input:text-[#38bdf8] transition-colors" />
                    <input 
                      required 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Enter your name" 
                      className="w-full pl-11 pr-4 py-3.5 bg-[#18181b] border border-[#27272a] rounded-2xl outline-none text-white text-[15px] focus:border-[#38bdf8] focus:ring-4 focus:ring-[#38bdf8]/10 transition-all placeholder-[#52525b] font-medium" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-white ml-1">Email address</label>
                <div className="relative group/input">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b] group-focus-within/input:text-[#38bdf8] transition-colors" />
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email" 
                    className="w-full pl-11 pr-4 py-3.5 bg-[#18181b] border border-[#27272a] rounded-2xl outline-none text-white text-[15px] focus:border-[#38bdf8] focus:ring-4 focus:ring-[#38bdf8]/10 transition-all placeholder-[#52525b] font-medium" 
                  />
                </div>
              </div>

              {(mode === 'login' || mode === 'signup') && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-white ml-1">Password</label>
                  <div className="relative group/input">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b] group-focus-within/input:text-[#38bdf8] transition-colors" />
                    <input 
                      required 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder={mode === 'login' ? "Enter your password" : "Create a password"} 
                      className="w-full pl-11 pr-11 py-3.5 bg-[#18181b] border border-[#27272a] rounded-2xl outline-none text-white text-[15px] focus:border-[#38bdf8] focus:ring-4 focus:ring-[#38bdf8]/10 transition-all placeholder-[#52525b] font-medium" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                        className="peer w-4.5 h-4.5 rounded border-[#27272a] bg-[#18181b] text-[#38bdf8] focus:ring-[#38bdf8]/20 transition-all cursor-pointer" 
                      />
                    </div>
                    <span className="text-[13px] text-[#a1a1aa] font-medium group-hover:text-white transition-colors">Remember me</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => switchMode('forgot-password')} 
                    className="text-[13px] text-[#38bdf8] hover:text-[#7dd3fc] font-bold transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-in shake">
                   <AlertCircle size={16} className="text-rose-500 shrink-0" />
                   <p className="text-[13px] font-bold text-rose-400">{error}</p>
                </div>
              )}
              
              {successMsg && (
                <div className="p-3 bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-2xl flex items-center gap-3 animate-in fade-in">
                   <Check size={16} className="text-[#38bdf8] shrink-0" />
                   <p className="text-[13px] font-bold text-[#38bdf8]">{successMsg}</p>
                </div>
              )}

              {mode === 'signup' && (
                <p className="text-[12px] text-[#52525b] leading-relaxed pt-1 font-medium">
                  By creating an account, you agree to our <button type="button" onClick={() => navigate('/terms-of-service')} className="text-[#a1a1aa] hover:text-white underline decoration-[#27272a] underline-offset-4">Terms of Service</button> and <button type="button" onClick={() => navigate('/privacy-policy')} className="text-[#a1a1aa] hover:text-white underline decoration-[#27272a] underline-offset-4">Privacy Policy</button>
                </p>
              )}

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-3.5 mt-4 bg-[#38bdf8] hover:bg-[#7dd3fc] text-black rounded-2xl font-bold text-[15px] shadow-[0_20px_40px_-12px_rgba(56,189,248,0.35)] hover:shadow-[0_25px_50px_-12px_rgba(56,189,248,0.45)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
              >
                {isLoading ? <RefreshCw size={18} className="animate-spin" /> : (
                  <>
                    {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send Reset Link'}
                    <ArrowRight size={18} strokeWidth={3} />
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-[14px] text-[#a1a1aa] font-medium">
                  {mode === 'login' ? (
                    <>Don't have an account? <button type="button" onClick={() => switchMode('signup')} className="text-[#38bdf8] hover:text-[#7dd3fc] font-bold transition-colors">Sign up</button></>
                  ) : (
                    <>Already have an account? <button type="button" onClick={() => switchMode('login')} className="text-[#38bdf8] hover:text-[#7dd3fc] font-bold transition-colors">Sign in</button></>
                  )}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
