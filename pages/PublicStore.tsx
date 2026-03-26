
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Star, CheckCircle2, ArrowRight, ShieldCheck, 
  CreditCard, Loader2, X, Globe, Mail, User, Search, Menu, Instagram, Twitter, Linkedin,
  ShoppingCart, Lock, Receipt, Plus, Minus, Trash2, ExternalLink, Calendar, Building, MapPin,
  Package, LayoutGrid
} from 'lucide-react';
import { Service, StoreConfig, CartItem, StoreUser, StoreMessage } from '../types';
import * as ReactRouterDom from 'react-router-dom';
import { useStore } from '../hooks/useStore.ts';
import { useCurrency } from '../context/CurrencyContext.tsx';

const { useNavigate } = ReactRouterDom as any;

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: 'Agency Store',
  heroHeadline: 'Premium Digital Solutions.',
  heroSubheadline: 'Access our expert service catalog. Purchase directly and start your project today.',
  heroLayout: 'Split Right',
  primaryColor: '#3b82f6', 
  secondaryColor: '#6366f1',
  backgroundColor: '#09090b',
  textColor: '#ffffff',
  cardBackgroundColor: '#18181b',
  cardStyle: 'Glass',
  showRatings: true,
  showPrice: true,
  gridColumns: 3,
  fontFamily: 'Inter',
  radius: 24,
  logoUrl: '',
  heroImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2000&auto=format&fit=crop',
  aboutTitle: 'Our Mission',
  aboutHeadline: 'Elevating Brands',
  aboutText: 'We build the future, one pixel at a time. Our team of experts is dedicated to providing top-tier digital solutions.',
  contactTitle: 'Get in Touch',
  contactHeadline: 'Start a Project',
  contactSubheadline: "We'd love to hear from you. Send us a message or reach out via our social channels.",
  contactEmail: 'hello@agency.com',
  footerLinks: [
    { label: 'Services', url: '#' },
    { label: 'Case Studies', url: '#' },
    { label: 'Pricing', url: '#' }
  ]
};

// --- Product Detail Modal ---
const ProductModal = ({ service, onClose, onAddToCart, onBuyNow, config }: { 
    service: Service; 
    onClose: () => void; 
    onAddToCart: (s: Service) => void; 
    onBuyNow: (s: Service) => void;
    config: StoreConfig;
}) => {
    if (!service) return null;

    // Simulate gallery images if none exist in metadata
    const gallery = (service as any).gallery || [service.image, service.image, service.image];

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div 
                className="relative bg-[#0c0c0e] w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl border border-white/10 flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-3 bg-black/50 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-md transition-all border border-white/10">
                    <X size={20} />
                </button>

                {/* Left: Visuals */}
                <div className="w-full md:w-1/2 bg-zinc-900 relative">
                    <div className="h-[50vh] md:h-full w-full">
                        <img src={service.image} className="w-full h-full object-cover" alt={service.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-80" />
                    </div>
                    {/* Gallery Thumbnails */}
                    <div className="absolute bottom-8 left-8 right-8 flex gap-3 overflow-x-auto no-scrollbar">
                        {gallery.map((img: string, i: number) => (
                            <div key={i} className="w-20 h-20 rounded-2xl border-2 border-white/20 overflow-hidden cursor-pointer hover:border-blue-500 transition-all shadow-lg">
                                <img src={img} className="w-full h-full object-cover" alt="" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-10 md:p-14 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-500 border border-blue-600/20">
                            {service.type}
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {service.pricingType}
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">{service.name}</h2>
                    
                    <div className="flex items-center gap-2 mb-8">
                        <div className="flex text-yellow-500">
                            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                        </div>
                        <span className="text-sm font-bold text-zinc-500 ml-2">5.0 (Verified)</span>
                    </div>

                    <p className="text-lg text-zinc-400 leading-relaxed font-medium mb-10">
                        {service.description}
                    </p>

                    <div className="space-y-4 mb-10">
                         <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                            <CheckCircle2 className="text-emerald-500" size={20} />
                            <span className="text-sm font-bold text-zinc-300">Professional Grade Quality</span>
                         </div>
                         <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                            <ShieldCheck className="text-emerald-500" size={20} />
                            <span className="text-sm font-bold text-zinc-300">Secure Delivery Protocol</span>
                         </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-zinc-800 flex flex-col gap-6">
                        <div className="flex items-end gap-2">
                             <span className="text-4xl font-black text-white">{format(service.price)}</span>
                             <span className="text-sm font-bold text-zinc-500 mb-1">{currency}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => { onAddToCart(service); onClose(); }}
                                className="py-4 rounded-2xl font-bold text-sm uppercase tracking-widest border border-zinc-700 hover:bg-zinc-800 text-white transition-all"
                            >
                                Add to Cart
                            </button>
                            <button 
                                onClick={() => { onBuyNow(service); onClose(); }}
                                className="py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 hover:scale-105 transition-all"
                                style={{ backgroundColor: config.primaryColor }}
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Store Auth Modal ---
const AuthModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (user: StoreUser) => void }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', dob: '', company: '' });
    const { registerStoreUser } = useStore();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const user = await registerStoreUser(formData);
        setLoading(false);
        
        if (user) {
            onLogin(user);
            onClose();
        } else {
            alert("Login failed. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#18181b] border border-white/10 w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
                
                <h2 className="text-2xl font-black text-white mb-6">Welcome Back</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative group">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="John Doe" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="you@example.com" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Phone</label>
                            <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="+1 (555) 000-0000" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Date of Birth</label>
                            <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Company (Optional)</label>
                        <div className="relative group">
                            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                            <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="Acme Inc." />
                        </div>
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all mt-4 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Sign In / Register'}
                    </button>
                </form>
            </div>
        </div>
    );
};

interface PublicStoreProps {
    previewConfig?: StoreConfig;
}

const PublicStore: React.FC<PublicStoreProps> = ({ previewConfig }) => {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const { config: storedConfig, fetchPublicServices, createOrder, sendMessage } = useStore();
  
  // Use previewConfig if available (for editor), otherwise use stored config from DB
  const config = previewConfig || storedConfig;

  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Service | null>(null);
  
  // Navigation State
  const [activePage, setActivePage] = useState<'home' | 'about' | 'contact'>('home');
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<StoreUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  // Checkout Wizard State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutData, setCheckoutData] = useState({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      zip: '',
      country: ''
  });
  const [orderReference, setOrderReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const catalogRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadData = async () => {
        const publicServices = await fetchPublicServices();
        setServices(publicServices);
    };
    loadData();
  }, []);

  const handleLogin = (user: StoreUser) => {
      setCurrentUser(user);
      setCheckoutData(prev => ({
          ...prev,
          fullName: user.name,
          email: user.email,
          phone: user.phone || ''
      }));
  };

  const navigateTo = (page: 'home' | 'about' | 'contact') => {
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (service: Service) => {
      setCart(prev => [...prev, { ...service, cartId: `item-${Date.now()}` }]);
      setIsCartOpen(true);
      if (viewProduct) setViewProduct(null); // Close modal if open
  };

  const removeFromCart = (cartId: string) => {
      setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Checkout Handlers
  const handleStartCheckout = () => {
      setIsCartOpen(false);
      // Generate ID here to ensure UI matches DB
      setOrderReference(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
      setCheckoutStep(1);
      setIsCheckoutOpen(true);
  };

  const handleBuyNow = (service: Service) => {
      setCart([{ ...service, cartId: `item-${Date.now()}` }]);
      setIsCartOpen(false);
      if (viewProduct) setViewProduct(null);
      setOrderReference(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
      setCheckoutStep(1);
      setIsCheckoutOpen(true);
  };

  const handleCheckoutNext = () => {
      if (checkoutStep === 1) {
          if (!checkoutData.fullName || !checkoutData.email) {
              alert("Please fill in required fields.");
              return;
          }
          setCheckoutStep(2);
      }
  };

  const handleProceedToPayment = () => {
      if (config.paymentGatewayUrl) {
          window.open(config.paymentGatewayUrl, '_blank');
          setCheckoutStep(3);
      } else {
          // If no gateway, just simulate
          setCheckoutStep(3);
      }
  };

  const handleCompleteOrder = async () => {
      setIsProcessing(true);
      
      const orderPayload = {
          name: checkoutData.fullName,
          email: checkoutData.email,
          amount: cartTotal,
          ...checkoutData
      };
      
      // Pass the generated orderReference as custom ID to ensure syncing
      await createOrder(orderPayload, cart, orderReference);

      // Reset
      setCart([]);
      setIsCheckoutOpen(false);
      setIsProcessing(false);
      alert(`Thank you for your purchase! Invoice generated for Order #${orderReference}.`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!contactForm.name || !contactForm.email || !contactForm.message) {
          alert("Please fill in all fields.");
          return;
      }
      
      await sendMessage(contactForm);

      setContactForm({ name: '', email: '', message: '' });
      alert("Message sent successfully!");
  };

  // --- Styles Generator ---
  const getStyles = () => ({
      fontFamily: config.fontFamily,
      backgroundColor: config.backgroundColor,
      color: config.textColor,
  });

  const getButtonStyle = () => ({
      backgroundColor: config.primaryColor,
      color: '#fff',
      borderRadius: `${config.radius}px`,
  });

  const getCardStyle = () => {
      const base = { borderRadius: `${config.radius}px`, overflow: 'hidden' as const };
      if (config.cardStyle === 'Glass') {
          return { ...base, backgroundColor: `${config.cardBackgroundColor}80`, backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' };
      }
      if (config.cardStyle === 'Bordered') {
          return { ...base, backgroundColor: config.cardBackgroundColor, border: '1px solid rgba(255,255,255,0.15)' };
      }
      return { ...base, backgroundColor: config.cardBackgroundColor }; // Minimal
  };

  return (
    <div className="min-h-screen overflow-y-auto font-sans selection:bg-blue-500/30 transition-colors duration-500 relative" style={getStyles()}>
       {/* Auth Modal */}
       <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} />

       {/* Product Detail Modal */}
       {viewProduct && (
           <ProductModal 
               service={viewProduct} 
               onClose={() => setViewProduct(null)}
               onAddToCart={addToCart}
               onBuyNow={handleBuyNow}
               config={config}
           />
       )}

       {/* Font Loader Simulation */}
       <style>{`
         @import url('https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(' ', '+')}:wght@300;400;500;700;900&display=swap');
         .store-font { font-family: '${config.fontFamily}', sans-serif; }
         .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
       `}</style>
       
       {/* Background Noise Texture */}
       <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />

       {/* Navigation */}
       <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl" style={{ backgroundColor: `${config.backgroundColor}CC` }}>
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
                  {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                  ) : (
                      <div className="p-2 rounded-xl" style={{ backgroundColor: config.primaryColor }}>
                          <ShoppingBag size={20} className="text-white" />
                      </div>
                  )}
                  <span className="font-black text-lg tracking-tight">{config.storeName}</span>
              </div>
              <div className="hidden md:flex items-center gap-8 text-sm font-bold opacity-70">
                  <button onClick={() => navigateTo('home')} className={`hover:opacity-100 transition-opacity hover:text-white ${activePage === 'home' ? 'text-white opacity-100' : ''}`}>Catalog</button>
                  <button onClick={() => navigateTo('about')} className={`hover:opacity-100 transition-opacity hover:text-white ${activePage === 'about' ? 'text-white opacity-100' : ''}`}>About</button>
                  <button onClick={() => navigateTo('contact')} className={`hover:opacity-100 transition-opacity hover:text-white ${activePage === 'contact' ? 'text-white opacity-100' : ''}`}>Contact</button>
              </div>
              <div className="flex items-center gap-4">
                  <div className="relative cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsCartOpen(true)}>
                     <ShoppingCart size={20} />
                     {cart.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                            {cart.length}
                        </span>
                     )}
                  </div>
                  
                  {currentUser ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                          <User size={14} />
                          <span className="text-xs font-bold">{currentUser.name}</span>
                      </div>
                  ) : (
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="hidden md:block px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-transform hover:scale-105" 
                        style={{ border: `1px solid ${config.primaryColor}`, color: config.primaryColor }}
                      >
                          Sign In
                      </button>
                  )}
              </div>
          </div>
       </nav>

       {/* HOME PAGE VIEW */}
       {activePage === 'home' && (
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Hero Section - Dynamic Layouts */}
             <section className="relative pt-20 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                   {config.heroLayout === 'Center' && (
                       <div className="text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                           <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 border" style={{ borderColor: `${config.primaryColor}40`, color: config.primaryColor, backgroundColor: `${config.primaryColor}10` }}>
                              Premium Services
                           </span>
                           <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to bottom right, ${config.textColor}, ${config.textColor}80)` }}>
                               {config.heroHeadline}
                           </h1>
                           <p className="text-xl md:text-2xl font-medium opacity-60 leading-relaxed max-w-2xl mx-auto">
                               {config.heroSubheadline}
                           </p>
                           <div className="flex justify-center gap-4 pt-4">
                              <button onClick={() => scrollToSection(catalogRef)} className="px-8 py-4 text-sm font-bold rounded-full transition-transform hover:scale-105 hover:shadow-lg" style={getButtonStyle()}>
                                  Explore Catalog
                              </button>
                           </div>
                       </div>
                   )}

                   {(config.heroLayout === 'Split Left' || config.heroLayout === 'Split Right') && (
                       <div className={`flex flex-col lg:flex-row items-center gap-16 ${config.heroLayout === 'Split Right' ? '' : 'lg:flex-row-reverse'}`}>
                           <div className="flex-1 space-y-8 animate-in slide-in-from-left duration-700">
                              <div className="w-12 h-1 bg-gradient-to-r from-transparent to-transparent" style={{ backgroundColor: config.primaryColor }} />
                              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1]">{config.heroHeadline}</h1>
                              <p className="text-lg opacity-60 max-w-lg leading-relaxed">{config.heroSubheadline}</p>
                              <button onClick={() => scrollToSection(catalogRef)} className="px-10 py-5 text-sm font-bold rounded-full transition-transform hover:scale-105 shadow-xl" style={getButtonStyle()}>
                                  Get Started
                              </button>
                           </div>
                           <div className="flex-1 w-full relative group">
                              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-[100px] rounded-full opacity-50" />
                              <img 
                                src={config.heroImage || "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000"} 
                                alt="Hero" 
                                className="relative w-full aspect-square object-cover rounded-[3rem] shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700" 
                                style={{ borderRadius: `${config.radius * 1.5}px` }}
                              />
                           </div>
                       </div>
                   )}

                   {config.heroLayout === 'Minimal' && (
                       <div className="max-w-3xl space-y-6 animate-in fade-in duration-1000">
                           <h1 className="text-6xl md:text-8xl font-black tracking-tighter">{config.heroHeadline}</h1>
                           <div className="h-px w-32" style={{ backgroundColor: config.primaryColor }} />
                           <p className="text-xl opacity-60 max-w-xl">{config.heroSubheadline}</p>
                       </div>
                   )}
                </div>
             </section>

             {/* Catalog Grid */}
             <section className="px-6 pb-40" id="catalog" ref={catalogRef}>
                 <div className="max-w-7xl mx-auto">
                     <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
                        <h3 className="text-2xl font-bold">Latest Offerings</h3>
                     </div>
                     
                     <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${config.gridColumns || 3} gap-8`}>
                         {services.map((service, idx) => (
                             <div 
                               key={service.id} 
                               onDoubleClick={() => setViewProduct(service)}
                               className="group relative flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                               style={getCardStyle()}
                             >
                                 {/* Image Area */}
                                 <div className="aspect-[4/3] overflow-hidden relative">
                                     <img src={service.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={service.name} />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                     
                                     <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md rounded-lg text-white border border-white/10">
                                           {service.type}
                                        </span>
                                     </div>
                                 </div>

                                 {/* Content Area */}
                                 <div className="p-8 flex flex-col flex-1 relative">
                                     <div className="mb-4">
                                        <h3 className="text-2xl font-bold leading-tight mb-2 group-hover:text-transparent group-hover:bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})` }}>
                                            {service.name}
                                        </h3>
                                        {config.showRatings && (
                                            <div className="flex items-center gap-1 text-yellow-500 text-xs">
                                                <Star size={12} fill="currentColor"/>
                                                <Star size={12} fill="currentColor"/>
                                                <Star size={12} fill="currentColor"/>
                                                <Star size={12} fill="currentColor"/>
                                                <Star size={12} fill="currentColor"/>
                                                <span className="text-white/40 ml-2 font-medium">(4.9)</span>
                                            </div>
                                        )}
                                     </div>
                                     
                                     <p className="text-sm opacity-60 leading-relaxed mb-8 line-clamp-3 font-medium flex-1">
                                         {service.description}
                                     </p>

                                     <div className="flex items-center justify-between pt-6 border-t border-white/10">
                                         {config.showPrice && (
                                             <div>
                                                 <p className="text-[10px] font-bold opacity-40 uppercase tracking-wider">Investment</p>
                                                 <p className="text-2xl font-black">{format(service.price)}</p>
                                             </div>
                                         )}
                                         <div className="flex gap-2">
                                             <button 
                                                  onClick={(e) => { e.stopPropagation(); addToCart(service); }}
                                                  className="p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                                  title="Add to Cart"
                                              >
                                                  <ShoppingCart size={18} />
                                              </button>
                                             <button 
                                                  onClick={(e) => { e.stopPropagation(); handleBuyNow(service); }}
                                                  className="px-6 py-3 text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
                                                  style={getButtonStyle()}
                                              >
                                                  Buy Now
                                              </button>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             </section>
         </div>
       )}

       {/* ABOUT PAGE VIEW */}
       {activePage === 'about' && (
           <section className="px-6 py-20 min-h-[60vh] flex items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
               <div className="max-w-7xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] p-12 md:p-20 relative overflow-hidden w-full">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                      <ShoppingBag size={200} />
                   </div>
                   <div className="relative z-10 max-w-3xl">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 block" style={{ color: config.primaryColor }}>{config.aboutTitle || 'Our Mission'}</span>
                       <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-tight">{config.aboutHeadline || 'Elevating Brands'}</h2>
                       <p className="text-xl md:text-2xl opacity-70 leading-relaxed font-medium">
                           {config.aboutText || 'We build the future, one pixel at a time. Our team of experts is dedicated to providing top-tier digital solutions.'}
                       </p>
                       <div className="mt-12">
                          <button 
                            onClick={() => navigateTo('contact')} 
                            className="px-10 py-5 text-white font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all shadow-lg"
                            style={getButtonStyle()}
                          >
                              Contact Us
                          </button>
                       </div>
                   </div>
               </div>
           </section>
       )}

       {/* CONTACT PAGE VIEW */}
       {activePage === 'contact' && (
           <section className="px-6 py-20 min-h-[60vh] animate-in fade-in slide-in-from-bottom-8 duration-500">
               <div className="max-w-5xl mx-auto">
                   <div className="text-center mb-16">
                       <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">{config.contactHeadline || 'Get in Touch'}</h1>
                       <p className="text-xl opacity-60 max-w-2xl mx-auto">{config.contactSubheadline || "We'd love to hear from you. Send us a message or reach out via our social channels."}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-8">
                           <div className="p-10 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl">
                               <h3 className="text-2xl font-bold mb-8">{config.contactTitle || 'Contact Info'}</h3>
                               <div className="space-y-6">
                                   {config.contactEmail && (
                                       <div className="flex items-center gap-4">
                                           <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-500"><Mail size={24}/></div>
                                           <div>
                                               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</p>
                                               <span className="text-lg font-bold">{config.contactEmail}</span>
                                           </div>
                                       </div>
                                   )}
                                   <div className="flex items-center gap-4">
                                       <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-500"><MapPin size={24}/></div>
                                       <div>
                                           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Location</p>
                                           <span className="text-lg font-bold">Remote / Global</span>
                                       </div>
                                   </div>
                               </div>
                               
                               <div className="mt-12 pt-8 border-t border-white/10">
                                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Socials</p>
                                   <div className="flex gap-4">
                                       {config.socialLinks?.twitter && (
                                           <a href={config.socialLinks.twitter} target="_blank" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Twitter size={20}/></a>
                                       )}
                                       {config.socialLinks?.instagram && (
                                           <a href={config.socialLinks.instagram} target="_blank" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Instagram size={20}/></a>
                                       )}
                                       {config.socialLinks?.linkedin && (
                                           <a href={config.socialLinks.linkedin} target="_blank" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Linkedin size={20}/></a>
                                       )}
                                   </div>
                               </div>
                           </div>
                       </div>
                       
                       <form className="space-y-6 p-10 rounded-[2.5rem] bg-white/5 border border-white/10" onSubmit={handleSendMessage}>
                           <h3 className="text-2xl font-bold mb-2">Send Message</h3>
                           <div className="space-y-2">
                               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Name</label>
                               <input 
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all" 
                                  placeholder="Your Name" 
                                  required
                                  value={contactForm.name}
                                  onChange={e => setContactForm({...contactForm, name: e.target.value})}
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
                               <input 
                                  type="email" 
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all" 
                                  placeholder="you@example.com" 
                                  required
                                  value={contactForm.email}
                                  onChange={e => setContactForm({...contactForm, email: e.target.value})}
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Message</label>
                               <textarea 
                                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all resize-none" 
                                  placeholder="How can we help?" 
                                  required
                                  value={contactForm.message}
                                  onChange={e => setContactForm({...contactForm, message: e.target.value})}
                               />
                           </div>
                           <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">Send Message</button>
                       </form>
                   </div>
               </div>
           </section>
       )}

       {/* Footer */}
       <footer className="border-t border-white/5 bg-black/20 pt-20 pb-12 px-6" ref={contactRef}>
           <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
               <div className="col-span-1 md:col-span-2">
                   <h4 className="text-2xl font-black mb-6 tracking-tight">{config.storeName}</h4>
                   <p className="opacity-50 max-w-sm leading-relaxed text-sm mb-6">
                       Elevating brands through strategic digital solutions. We build the future, one pixel at a time.
                   </p>
                   {config.contactEmail && (
                      <div className="flex items-center gap-2 text-sm font-bold opacity-80">
                         <Mail size={16} style={{ color: config.primaryColor }} /> {config.contactEmail}
                      </div>
                   )}
               </div>
               <div>
                   <h5 className="font-bold mb-6 text-sm uppercase tracking-widest opacity-40">Explore</h5>
                   <ul className="space-y-4 text-sm font-medium opacity-70">
                       {config.footerLinks && config.footerLinks.length > 0 ? (
                           config.footerLinks.map((link, i) => (
                               <li key={i}><a href={link.url} className="hover:text-white transition-colors">{link.label}</a></li>
                           ))
                       ) : (
                           <>
                               <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
                               <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                               <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                           </>
                       )}
                   </ul>
               </div>
               <div>
                   <h5 className="font-bold mb-6 text-sm uppercase tracking-widest opacity-40">Connect</h5>
                   <div className="flex gap-4">
                       {config.socialLinks?.twitter && (
                           <a href={config.socialLinks.twitter} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><Twitter size={18}/></a>
                       )}
                       {config.socialLinks?.instagram && (
                           <a href={config.socialLinks.instagram} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><Instagram size={18}/></a>
                       )}
                       {config.socialLinks?.linkedin && (
                           <a href={config.socialLinks.linkedin} target="_blank" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"><Linkedin size={18}/></a>
                       )}
                   </div>
               </div>
           </div>
           <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 text-xs font-medium">
               <p>&copy; {new Date().getFullYear()} {config.storeName}. All rights reserved.</p>
           </div>
       </footer>

       {/* Cart Drawer */}
       {isCartOpen && (
           <div className="fixed inset-0 z-[100] flex justify-end">
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
               <div className="relative w-full max-w-md bg-[#18181b] border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                   <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                       <h3 className="text-xl font-black text-white">Your Cart</h3>
                       <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20}/></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-6 space-y-4">
                       {cart.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                               <ShoppingBag size={48} className="opacity-20" />
                               <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
                           </div>
                       ) : (
                           cart.map(item => (
                               <div key={item.cartId} className="flex gap-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 relative group">
                                   <div className="w-16 h-16 bg-zinc-800 rounded-xl overflow-hidden shrink-0">
                                       <img src={item.image} className="w-full h-full object-cover" alt="" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                                       <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{item.description}</p>
                                       <p className="text-sm font-black text-blue-500 mt-2">{format(item.price)}</p>
                                   </div>
                                   <button onClick={() => removeFromCart(item.cartId)} className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                       <Trash2 size={14} />
                                   </button>
                               </div>
                           ))
                       )}
                   </div>

                   <div className="p-6 border-t border-zinc-800 bg-[#0c0c0e]">
                       <div className="flex justify-between items-center mb-6">
                           <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Subtotal</span>
                           <span className="text-2xl font-black text-white">{format(cartTotal)}</span>
                       </div>
                       <button 
                           onClick={handleStartCheckout}
                           disabled={cart.length === 0}
                           className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           Proceed to Checkout
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Full Screen Checkout Wizard */}
       {isCheckoutOpen && (
           <div className="fixed inset-0 z-[200] bg-[#0c0c0e] animate-in fade-in duration-300 flex flex-col">
               <div className="h-20 border-b border-zinc-800 flex items-center justify-between px-8 shrink-0">
                   <div className="flex items-center gap-4">
                       <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors"><X size={20}/></button>
                       <h2 className="text-lg font-black text-white uppercase tracking-widest">Secure Checkout</h2>
                   </div>
                   <div className="flex items-center gap-2">
                       {[1, 2, 3].map(s => (
                           <div key={s} className={`w-3 h-3 rounded-full ${checkoutStep >= s ? 'bg-blue-600' : 'bg-zinc-800'}`} />
                       ))}
                   </div>
               </div>

               <div className="flex-1 overflow-y-auto p-8">
                   <div className="max-w-2xl mx-auto space-y-12 py-12">
                       
                       {checkoutStep === 1 && (
                           <div className="space-y-8 animate-in slide-in-from-right">
                               <div>
                                   <h3 className="text-3xl font-black text-white mb-2">Customer Details</h3>
                                   <p className="text-zinc-500">Please provide your billing information.</p>
                               </div>
                               <div className="space-y-6">
                                   <div className="grid grid-cols-2 gap-6">
                                       <div className="space-y-2">
                                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Full Name</label>
                                           <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-600 transition-colors" value={checkoutData.fullName} onChange={e => setCheckoutData({...checkoutData, fullName: e.target.value})} />
                                       </div>
                                       <div className="space-y-2">
                                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Email Address</label>
                                           <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-600 transition-colors" value={checkoutData.email} onChange={e => setCheckoutData({...checkoutData, email: e.target.value})} />
                                       </div>
                                   </div>
                                   <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-zinc-500 uppercase">Address</label>
                                       <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-600 transition-colors" value={checkoutData.address} onChange={e => setCheckoutData({...checkoutData, address: e.target.value})} />
                                   </div>
                                   <div className="grid grid-cols-3 gap-6">
                                       <div className="space-y-2">
                                           <label className="text-[10px] font-bold text-zinc-500 uppercase">City</label>
                                           <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-600 transition-colors" value={checkoutData.city} onChange={e => setCheckoutData({...checkoutData, city: e.target.value})} />
                                       </div>
                                       <div className="space-y-2">
                                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Zip / Postal</label>
                                           <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-600 transition-colors" value={checkoutData.zip} onChange={e => setCheckoutData({...checkoutData, zip: e.target.value})} />
                                       </div>
                                       <div className="space-y-2">
                                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Country</label>
                                           <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-600 transition-colors" value={checkoutData.country} onChange={e => setCheckoutData({...checkoutData, country: e.target.value})} />
                                       </div>
                                   </div>
                                   <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-zinc-500 uppercase">Phone (Optional)</label>
                                       <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-600 transition-colors" value={checkoutData.phone} onChange={e => setCheckoutData({...checkoutData, phone: e.target.value})} />
                                   </div>
                               </div>
                               <div className="pt-8 flex justify-end">
                                   <button onClick={handleCheckoutNext} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all">
                                       Proceed to Breakdown
                                   </button>
                               </div>
                           </div>
                       )}

                       {checkoutStep === 2 && (
                           <div className="space-y-8 animate-in slide-in-from-right">
                               <div>
                                   <h3 className="text-3xl font-black text-white mb-2">Order Summary</h3>
                                   <p className="text-zinc-500">Review your order and payment reference.</p>
                               </div>
                               
                               <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                                   {cart.map((item, i) => (
                                       <div key={i} className="flex justify-between items-center pb-4 border-b border-zinc-800 last:border-0 last:pb-0">
                                           <div>
                                               <p className="font-bold text-white">{item.name}</p>
                                               <p className="text-xs text-zinc-500">{item.description.substring(0, 50)}...</p>
                                           </div>
                                           <p className="font-bold text-white">{format(item.price)}</p>
                                       </div>
                                   ))}
                                   <div className="pt-4 border-t-2 border-zinc-800 flex justify-between items-center">
                                       <p className="text-lg font-black text-white uppercase tracking-widest">Total</p>
                                       <p className="text-3xl font-black text-blue-500">{format(cartTotal)}</p>
                                   </div>
                               </div>

                               <div className="bg-blue-900/20 border border-blue-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-4">
                                   <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Payment Reference Code</p>
                                   <div className="text-4xl font-black text-white font-mono bg-blue-900/40 px-6 py-3 rounded-xl border border-blue-500/20 select-all">
                                       {orderReference}
                                   </div>
                                   <p className="text-sm font-medium text-blue-200/80">Please add this reference code in the payment note.</p>
                               </div>

                               <div className="pt-8 flex justify-between items-center">
                                   <button onClick={() => setCheckoutStep(1)} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">Back</button>
                                   <button onClick={handleProceedToPayment} className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2">
                                       Proceed to Payment <ExternalLink size={16} />
                                   </button>
                               </div>
                           </div>
                       )}

                       {checkoutStep === 3 && (
                           <div className="space-y-8 animate-in slide-in-from-right text-center py-12">
                               <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                                   <CreditCard size={48} className="text-zinc-600" />
                               </div>
                               <div>
                                   <h3 className="text-3xl font-black text-white mb-4">Payment Processing</h3>
                                   <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
                                       Payments are processed externally. Your order will be confirmed once the seller verifies the transaction with reference 
                                       <span className="text-white font-bold ml-1">{orderReference}</span>.
                                   </p>
                               </div>
                               <button 
                                 onClick={handleCompleteOrder}
                                 disabled={isProcessing}
                                 className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 mt-8 disabled:opacity-50"
                               >
                                   {isProcessing ? 'Processing Order...' : "I've Completed Payment"}
                               </button>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};

export default PublicStore;
