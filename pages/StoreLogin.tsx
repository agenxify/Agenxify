
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Lock, Mail, User, Loader2 } from 'lucide-react';
import { useStore } from '../hooks/useStore.ts';

const StoreLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { loginStoreUser, registerStoreUser } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
        if (isLogin) {
            const user = await loginStoreUser(formData.email);
            if (user) {
                // Success - typically you would set a session token context here.
                // For this demo structure, we just redirect. 
                // Ideally, PublicStore should check auth state.
                navigate('/store'); 
            } else {
                setError("User not found or invalid credentials.");
            }
        } else {
            const user = await registerStoreUser({ 
                name: formData.name, 
                email: formData.email 
                // Password handling omitted for simplicity in this frontend-heavy demo
            });
            if (user) {
                navigate('/store');
            } else {
                setError("Registration failed.");
            }
        }
    } catch (err: any) {
        setError(err.message || "An error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
       <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-blue-500"><ShoppingBag size={140} /></div>
          
          <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-900/20">
                  <ShoppingBag size={32} />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-2">{isLogin ? 'Welcome Back' : 'Join the Store'}</h2>
              <p className="text-zinc-500 text-sm font-medium mb-8">Access your orders and premium downloads.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                          <div className="relative">
                              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                              <input 
                                  required 
                                  className="w-full bg-black border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-600 transition-all" 
                                  placeholder="John Doe"
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                          </div>
                      </div>
                  )}
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                          <input 
                              type="email"
                              required 
                              className="w-full bg-black border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-600 transition-all" 
                              placeholder="you@example.com"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                      <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                          <input 
                              type="password"
                              required 
                              className="w-full bg-black border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-600 transition-all" 
                              placeholder="••••••••"
                              value={formData.password}
                              onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                      </div>
                  </div>

                  {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  >
                      {isLoading ? <Loader2 className="animate-spin" size={16} /> : (isLogin ? 'Sign In' : 'Create Account')} <ArrowRight size={16} />
                  </button>
              </form>

              <div className="mt-8 text-center">
                  <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">
                      {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};

export default StoreLogin;
