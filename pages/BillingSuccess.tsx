
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const BillingSuccess = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/billing');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-blue-500/30">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 text-center backdrop-blur-xl relative z-10"
            >
                <div className="mb-8 relative inline-block">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                        className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20"
                    >
                        <CheckCircle2 size={48} className="text-emerald-500" />
                    </motion.div>
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-2 -right-2 text-blue-400"
                    >
                        <Sparkles size={24} />
                    </motion.div>
                </div>

                <h1 className="text-3xl font-black text-white mb-4 tracking-tight uppercase italic">
                    Payment <span className="text-blue-500">Confirmed</span>
                </h1>
                
                <p className="text-zinc-400 font-medium mb-10 leading-relaxed">
                    Your account is being synchronized. Your new credits, plan, or addons will be available in just a moment.
                </p>

                <div className="flex flex-col gap-4">
                    <button 
                        onClick={() => navigate('/billing')}
                        className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 group"
                    >
                        Go to Billing <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                        <Loader2 size={12} className="animate-spin" />
                        Redirecting in {countdown}s
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BillingSuccess;
