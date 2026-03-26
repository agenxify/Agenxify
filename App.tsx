import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Briefcase, CheckSquare, 
  Clock, Target, Users, Search, Bell, ChevronDown, 
  Sparkles, Settings as SettingsIcon, HelpCircle, PanelLeftClose, PanelLeftOpen, 
  Package, LifeBuoy, CreditCard, MessageSquare, Database, BarChart, Plus,
  TrendingUp, History, X, Check, Trash2, ArrowRight, Zap, ShieldCheck, 
  CalendarDays, UserCheck, Command, ExternalLink, Calculator, LogOut, User as UserIcon,
  HardDrive, Layers, FileText, ListChecks, Rocket, CalendarCheck,
  Calendar, CheckCircle2, Info, ShieldAlert, DollarSign, Shield,
  Cpu, Workflow, Lock, ShoppingBag, Compass, Camera
} from 'lucide-react';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import { useAuth } from './context/AuthContext.tsx';
import { useWorkspace } from './context/WorkspaceContext.tsx';
import { supabase } from './supabase.ts';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Clients from './pages/Clients.tsx';
import Team from './pages/Team.tsx';
import Billing from './pages/Billing.tsx';
import InvoiceEditor from './pages/InvoiceEditor.tsx';
import PersonalBilling from './pages/PersonalBilling.tsx';
import UpcomingInvoice from './pages/UpcomingInvoice.tsx';
import Plans from './pages/Plans.tsx';
import PlanDetails from './pages/PlanDetails.tsx';
import TopUp from './pages/TopUp.tsx';
import PaymentMethods from './pages/PaymentMethods.tsx';
import Addons from './pages/Addons.tsx';
import ZifyAI from './pages/AIAssistant.tsx';
import Inbox from './pages/Inbox.tsx';
import Tasks from './pages/Tasks.tsx';
import Activity from './pages/Activity.tsx';
import Timesheets from './pages/Timesheets.tsx';
import Pipeline from './pages/Pipeline.tsx';
import CalendarPage from './pages/CalendarPage.tsx';
import Bookings from './pages/Bookings.tsx';
import EditBookingType from './pages/EditBookingType.tsx';
import PublicBookingPage from './pages/PublicBookingPage.tsx';
import Estimates from './pages/Estimates.tsx';
import Reports from './pages/Reports.tsx';
import Storage from './pages/Storage.tsx';
import Pages from './pages/Pages.tsx';
import PageEditor from './pages/PageEditor.tsx';
import PageView from './pages/PageView.tsx';
import OnboardingHome from './pages/OnboardingHome.tsx';
import OnboardingBuilder from './pages/OnboardingBuilder.tsx';
import ClientOnboarding from './pages/ClientOnboarding.tsx';
import Settings from './pages/Settings.tsx';
import Help from './pages/Help.tsx';
import Services from './pages/Services.tsx';
import EditService from './pages/EditService.tsx';
import ServiceCatalog from './pages/ServiceCatalog.tsx';
import Orders from './pages/Orders.tsx';
import PublicStore from './pages/PublicStore.tsx';
import StoreEditor from './pages/StoreEditor.tsx';
import StoreUsers from './pages/StoreUsers.tsx';
import StoreLogin from './pages/StoreLogin.tsx';
import Profile from './pages/Profile.tsx';
import RequestDetail from './pages/RequestDetail.tsx';
import Requests from './pages/Requests.tsx';
import Tickets from './pages/Tickets.tsx';
import Automation from './pages/Automation.tsx';
import Marketing from './pages/Marketing.tsx';
import MarketingAutomation from './pages/MarketingAutomation.tsx';
import MarketingSegmentation from './pages/MarketingSegmentation.tsx';
import MarketingEmail from './pages/MarketingEmail.tsx';
import MarketingAnalytics from './pages/MarketingAnalytics.tsx';
import MarketingOptimization from './pages/MarketingOptimization.tsx';
import MarketingFunnels from './pages/MarketingFunnels.tsx';
import MarketingOmnichannel from './pages/MarketingOmnichannel.tsx';
import DataMigration from './pages/DataMigration.tsx';
import { AVAILABLE_PLANS } from './constants.tsx';
import { useActivity } from './hooks/useActivity.ts';
import { useSystemData } from './hooks/useSystemData.ts';
import { useAgencySubscription } from './hooks/useAgencySubscription.ts';
import { useTeam } from './hooks/useTeam.ts';
import { usePages } from './hooks/usePages.ts';

// Handle React Router imports safely for ESM environment


const AG_LOGO_LIGHT = "https://jumpshare.com/embed/qWnO1jsFRAVhFD0X8Boj";
const AG_LOGO_DARK = "https://i.ibb.co/67Dy6sPd/Agencify-BLACK.png";

// --- AUTOMATION ENGINE ---
const AutomationEngine = () => {
  return null;
};

const SidebarSection = ({ title, children, isCollapsed, action }: React.PropsWithChildren<{ title: string, isCollapsed: boolean, action?: React.ReactNode }>) => (
  <div className="mb-6 px-4">
    <div className={`flex items-center justify-between px-4 mb-2 min-h-[20px] ${isCollapsed ? 'justify-center' : ''}`}>
      {!isCollapsed && (
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </h3>
      )}
      {action && (
        <div className={`${isCollapsed ? '' : 'ml-auto'}`}>
          {action}
        </div>
      )}
    </div>
    <div className="space-y-1">{children}</div>
  </div>
);

const SubSidebarItem = ({ to, label }: { to: string, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`
        relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 group
        ${isActive 
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-bold shadow-sm' 
          : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/50 font-medium'
        }
      `}
    >
      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shrink-0 ${isActive ? 'bg-blue-600 dark:bg-blue-400 scale-100' : 'bg-slate-300 dark:bg-zinc-600 scale-0 group-hover:scale-100'}`} />
      <span className="truncate">{label}</span>
      {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-600/20 dark:bg-blue-400/20 animate-pulse" />}
    </Link>
  );
};

const SidebarItem = ({ to, icon: Icon, label, active, badge, isCollapsed, subItems, moduleId }: { to: string, icon: any, label: string, active: boolean, badge?: string | number, isCollapsed?: boolean, subItems?: boolean, moduleId?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    if (subItems && active) {
        setIsOpen(true);
    }
  }, [active, subItems]);

  // Check access
  if (moduleId && !hasPermission(moduleId)) {
      return null;
  }

  const handleItemClick = (e: React.MouseEvent) => {
    navigate(to);
    if (subItems) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div>
      <div 
        onClick={handleItemClick}
        title={isCollapsed ? label : ""}
        className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 group relative cursor-pointer ${
          active 
            ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-600/10 dark:text-blue-400' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white'
        }`}
      >
        <Icon size={18} className={`shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-300'}`} />
        {!isCollapsed && (
          <>
            <span className="ml-3 text-sm font-semibold truncate flex-1">{label}</span>
            {badge && (
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 dark:border dark:border-blue-800/30' : 'bg-slate-100 text-slate-500 dark:text-zinc-800 dark:text-zinc-500'}`}>
                {badge}
              </span>
            )}
            {subItems && <ChevronDown size={14} className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
          </>
        )}
        {isCollapsed && active && (
          <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
        )}
      </div>
      {subItems && isOpen && !isCollapsed && (
        <div className="ml-8 mt-1 space-y-0.5 animate-in slide-in-from-top-2 duration-200 border-l border-slate-100 dark:border-zinc-800/50 pl-2">
          {label === 'Services' && (
            <>
              <SubSidebarItem to="/services" label="All Services" />
              <SubSidebarItem to="/catalog" label="Catalog" />
              <SubSidebarItem to="/services/new" label="Add Service" />
              <SubSidebarItem to="/orders" label="Orders" />
              <SubSidebarItem to="/store-users" label="Store Users" />
            </>
          )}
          {label === 'Users' && (
            <>
              <SubSidebarItem to="/clients" label="Clients" />
              <SubSidebarItem to="/team" label="Team" />
            </>
          )}
          {label === 'Marketing' && (
            <>
              <SubSidebarItem to="/marketing/automation" label="Marketing Automation" />
              <SubSidebarItem to="/marketing/segmentation" label="Audience & Lead Scoring" />
              <SubSidebarItem to="/marketing/email" label="Email Marketing" />
              <SubSidebarItem to="/marketing/analytics" label="Analytics & ROI" />
              <SubSidebarItem to="/marketing/optimization" label="AI Optimization" />
            </>
          )}
        </div>
      )}
    </div>
  );
};

const SubscriptionCard = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { subscription, workspace: subWorkspace, loading } = useAgencySubscription();
  const { members } = useTeam();
  
  // Prioritize real-time subscription data, then subWorkspace, then currentWorkspace
  const planId = subscription?.plan_id || subWorkspace?.plan_id || currentWorkspace?.plan_id || 'free';
  const plan = useMemo(() => AVAILABLE_PLANS.find(p => p.id === planId) || AVAILABLE_PLANS[0], [planId]);
  const billingCycle = subscription?.billing_cycle || subWorkspace?.billing_cycle || currentWorkspace?.billing_cycle || 'monthly';
  const price = billingCycle === 'annual' ? plan.price : Math.round(plan.price * 1.2);

  const seatsUsed = useMemo(() => members.filter(m => !m.isAdmin).length, [members]);
  const totalSeats = subscription?.seat_limit || subWorkspace?.seat_limit || currentWorkspace?.seat_limit || plan.seatLimit || 0;

  if (user?.role === 'client') return null;

  if (isCollapsed) {
    return (
      <div className="mx-4 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center group cursor-pointer hover:bg-blue-600 transition-all shadow-sm dark:bg-zinc-900 dark:border-zinc-800" title={`${plan.name} Plan`}>
        <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 p-4 bg-slate-900 dark:bg-black rounded-[1.75rem] border border-white/10 dark:border-zinc-800 shadow-xl relative group overflow-hidden transition-colors">
      <div className="absolute -right-2 -top-2 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
        <ShieldCheck size={60} />
      </div>
      
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-blue-400 fill-blue-400" />
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{plan.name} Plan</p>
          </div>
          <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Active</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Seats</span>
            <span className="text-[9px] font-black text-white">{seatsUsed} / {totalSeats}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${seatsUsed >= totalSeats ? 'bg-rose-500' : 'bg-blue-500'}`}
              style={{ width: `${totalSeats > 0 ? Math.min(100, (seatsUsed / totalSeats) * 100) : 0}%` }}
            />
          </div>
        </div>
        
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
             <p className="text-lg font-black text-white">${price}</p>
             <p className="text-[8px] font-bold text-slate-500 dark:text-zinc-600 uppercase tracking-widest">/mo</p>
             {billingCycle === 'annual' && <span className="ml-1 text-[6px] bg-blue-600/20 text-blue-400 px-1 rounded font-black">YR</span>}
          </div>
          <Link to="/personal-billing" className="text-[8px] font-black text-blue-400 hover:text-white transition-colors flex items-center gap-1 group/btn">
            MANAGE <ArrowRight size={8} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Feature Gating Component
const FeatureRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentWorkspace } = useWorkspace();
  const currentPlan = currentWorkspace?.plan_id || 'free';
  const navigate = useNavigate();

  if (currentPlan === 'free') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-black text-white">
          <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
             <Lock size={48} className="text-zinc-600" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Feature Locked</h2>
          <p className="text-zinc-500 mb-8 max-w-md text-center">This feature is available on Starter plan and above. Upgrade your workspace to unlock this capability.</p>
          <button 
             onClick={() => navigate('/billing/plans')}
             className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
          >
             Upgrade Plan
          </button>
      </div>
    );
  }

  return <>{children}</>;
};

const ProtectedRoute = ({ children, requiredRole, moduleId }: { children?: React.ReactNode, requiredRole?: any, moduleId?: string }) => {
  const { user, loading, isAuthorized, hasPermission } = useAuth();
  const location = useLocation();

  if (loading && !user) return null;
  
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiredRole && !isAuthorized(requiredRole)) return <Navigate to="/" replace />;
  if (moduleId && !hasPermission(moduleId)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const AppContent: React.FC<{ isSidebarOpen: boolean, toggleSidebar: () => void, setIsSidebarOpen: (o: boolean) => void }> = ({ isSidebarOpen, toggleSidebar, setIsSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  // Real-time notifications hook
  const { events: notifications, markAllAsRead, markAsRead, refresh: refreshNotifications, logActivity } = useActivity();
  const { projects, teamMembers, services, clients } = useSystemData();
  const { pages } = usePages();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const [globalConfig, setGlobalConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('agencyos_global_config');
      return saved ? JSON.parse(saved) : { agencyName: 'AgencyOS Global' };
    } catch (e) {
      return { agencyName: 'AgencyOS Global' };
    }
  });

  // Universal Search Logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    
    const results = [];
    
    // Navigation (Static)
    const navItems = [
      { label: 'Dashboard', path: '/' },
      { label: 'Inbox', path: '/inbox' },
      { label: 'Calendar', path: '/calendar' },
      { label: 'Pipeline', path: '/pipeline' },
      { label: 'Activity', path: '/activity' },
      { label: 'Settings', path: '/settings' },
      { label: 'Billing', path: '/billing' },
      { label: 'Help', path: '/help' },
    ];
    navItems.forEach(item => {
      if (item.label.toLowerCase().includes(q)) {
        results.push({ type: 'Navigation', title: item.label, path: item.path, icon: Compass });
      }
    });

    // Projects (Missions)
    if (projects) {
        projects.forEach(p => {
            if (p.title.toLowerCase().includes(q)) {
                results.push({ type: 'Mission', title: p.title, path: `/requests/${p.id}`, icon: Briefcase });
            }
        });
    }

    // Team
    if (teamMembers) {
        teamMembers.forEach(m => {
            if (m.name.toLowerCase().includes(q)) {
                results.push({ type: 'Team', title: m.name, path: `/profile/${m.id}`, icon: UserIcon });
            }
        });
    }

    // Services
    if (services) {
        services.forEach(s => {
            if (s.name.toLowerCase().includes(q)) {
                results.push({ type: 'Service', title: s.name, path: `/services/${s.id}`, icon: Package });
            }
        });
    }

    return results.slice(0, 8); // Limit
  }, [searchQuery, projects, teamMembers, services]);

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('agencyos_global_config');
      if (saved) setGlobalConfig(JSON.parse(saved));
      refreshNotifications();
    };
    window.addEventListener('agencyos_config_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('agencyos_config_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [refreshNotifications]);

  // Real-time message notifications
  useEffect(() => {
    if (!user || !currentWorkspace) return;

    // Catch-up logic for missed messages when app starts or workspace changes
    const catchUp = async () => {
      const { data: missed, error } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .neq('sender_id', user.uid)
        .eq('status', 'sent')
        .order('created_at', { ascending: true });

      if (!error && missed && missed.length > 0) {
        // Play sound once for the batch
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.volume = 0.8;
        audio.play().catch(e => console.log("Audio play failed", e));

        for (const msg of missed) {
          // Mark as delivered so other clients don't process it again
          await supabase.from('messages').update({ status: 'delivered' }).eq('id', msg.id);
          
          // Log to activity if NOT on inbox page
          if (location.pathname !== '/inbox') {
            const sender = teamMembers.find(m => m.id === msg.sender_id) || 
                           clients.find(c => c.id === msg.sender_id);
            
            const senderName = sender ? sender.name : 'Someone';
            const senderAvatar = sender ? sender.avatar : 'https://i.pravatar.cc/150?u=' + msg.sender_id;

            logActivity(
              'comm',
              'sent you a',
              'new message',
              msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
              'medium',
              senderName,
              senderAvatar
            );
          }
        }
      }
    };

    catchUp();

    const channel = supabase.channel('global_message_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `workspace_id=eq.${currentWorkspace.id}`
      }, async (payload) => {
        const newMsg = payload.new;
        
        // Only notify if message is NOT from current user
        if (newMsg.sender_id !== user?.uid) {
          // Mark as delivered immediately
          await supabase.from('messages').update({ status: 'delivered' }).eq('id', newMsg.id);
          
          // Check if conversation is muted
          const mutedChats = JSON.parse(localStorage.getItem('agencyos_muted_chats') || '[]');
          const isMuted = mutedChats.includes(newMsg.conversation_id);

          if (!isMuted) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.volume = 0.8;
            audio.play().catch(e => console.log("Audio play failed", e));
          }

          // Log activity if NOT on inbox page
          if (location.pathname !== '/inbox') {
            const sender = teamMembers.find(m => m.id === newMsg.sender_id) || 
                           clients.find(c => c.id === newMsg.sender_id);
            
            const senderName = sender ? sender.name : 'Someone';
            const senderAvatar = sender ? sender.avatar : 'https://i.pravatar.cc/150?u=' + newMsg.sender_id;

            logActivity(
              'comm',
              'sent you a',
              'new message',
              newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : ''),
              'medium',
              senderName,
              senderAvatar
            );
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentWorkspace, location.pathname, logActivity, teamMembers, clients]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setIsNotificationsOpen(false);
    navigate(`/activity?id=${id}`);
  };

  const handleSearchResultClick = (path: string) => {
      navigate(path);
      setSearchTerm('');
      setIsSearchOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFullScreen = location.pathname.includes('/pages/') && location.pathname !== '/pages' 
    || location.pathname.includes('/onboarding/view') || (location.pathname.includes('/onboarding/builder/') && location.pathname !== '/onboarding/builder')
    || location.pathname.includes('/bookings/new') || location.pathname.includes('/bookings/edit/')
    || location.pathname.includes('/book/') || location.pathname.startsWith('/p/') || location.pathname === '/store' || location.pathname === '/store-editor' || location.pathname === '/store-login';

  const isMarketingApp = ['/marketing/automation', '/marketing/email', '/marketing/direct-emails'].some(path => location.pathname.startsWith(path));

  const handleGlobalSchedule = () => {
    if (location.pathname !== '/calendar') {
      navigate('/calendar');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('agencyos_global_schedule', { detail: { date: new Date().toISOString().split('T')[0] } }));
      }, 300);
    } else {
      window.dispatchEvent(new CustomEvent('agencyos_global_schedule', { detail: { date: new Date().toISOString().split('T')[0] } }));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deploy': return <Zap size={14} className="text-blue-500" />;
      case 'project': return <Layers size={14} className="text-indigo-500" />;
      case 'finance': return <DollarSign size={14} className="text-emerald-500" />;
      case 'crm': return <UserIcon size={14} className="text-amber-500" />;
      case 'comm': return <MessageSquare size={14} className="text-purple-500" />;
      case 'security': return <Shield size={14} className="text-rose-500" />;
      default: return <Info size={14} className="text-slate-500" />;
    }
  };

  if (location.pathname === '/login') return <Login />;
  if (location.pathname.startsWith('/p/')) return <PageView />; // Public Page View

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden dark:bg-black dark:text-white transition-colors duration-300">
      
      {/* Background Automation Engine */}
      <AutomationEngine />

      {!isFullScreen && (
        <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out z-50 shadow-sm dark:bg-black dark:border-zinc-800 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-zinc-800 shrink-0 relative z-50">
            <div className="flex items-center gap-3 w-full text-left transition-all p-2 rounded-2xl group">
              <div className="relative shrink-0">
                <div 
                  className="w-10 h-10 bg-transparent rounded-2xl flex items-center justify-center shrink-0 overflow-hidden transition-all"
                >
                  <img src={AG_LOGO_DARK} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-black" />
              </div>

              {isSidebarOpen && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none truncate tracking-tight">AgencyOS</h1>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 mt-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                     Enterprise OS
                  </p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto pt-4 scrollbar-hide flex flex-col">
            <div className="px-4 mb-4">
              <WorkspaceSwitcher isSidebarOpen={isSidebarOpen} />
            </div>
            <SidebarSection title="Hub" isCollapsed={!isSidebarOpen} action={<button onClick={toggleSidebar} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-500 dark:hover:text-blue-400 dark:hover:bg-zinc-900 rounded-lg transition-all">{isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</button>}>
              <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} isCollapsed={!isSidebarOpen} moduleId="dashboard" />
              <SidebarItem to="/activity" icon={History} label="Activity Log" active={location.pathname === '/activity'} isCollapsed={!isSidebarOpen} moduleId="activity" />
              <SidebarItem to="/requests" icon={Briefcase} label="Requests" active={location.pathname.startsWith('/requests')} isCollapsed={!isSidebarOpen} moduleId="requests" />
              <SidebarItem to="/tickets" icon={LifeBuoy} label="Tickets" active={location.pathname === '/tickets'} isCollapsed={!isSidebarOpen} moduleId="tickets" />
              <SidebarItem to="/ai" icon={Sparkles} label="Zify AI" active={location.pathname === '/ai'} isCollapsed={!isSidebarOpen} moduleId="ai" />
            </SidebarSection>
            <SidebarSection title="Operations" isCollapsed={!isSidebarOpen}>
              <SidebarItem to="/pipeline" icon={TrendingUp} label="Pipeline" active={location.pathname === '/pipeline'} isCollapsed={!isSidebarOpen} moduleId="pipeline" />
              <SidebarItem to="/automation" icon={Workflow} label="Automation" active={location.pathname === '/automation'} isCollapsed={!isSidebarOpen} moduleId="automation" />
              <SidebarItem to="/calendar" icon={CalendarDays} label="Calendar" active={location.pathname === '/calendar'} isCollapsed={!isSidebarOpen} moduleId="calendar" />
              <SidebarItem to="/bookings" icon={CalendarCheck} label="Bookings" active={location.pathname.startsWith('/bookings')} isCollapsed={!isSidebarOpen} moduleId="bookings" />
              <SidebarItem to="/clients" icon={Users} label="Users" active={location.pathname === '/clients' || location.pathname === '/team'} isCollapsed={!isSidebarOpen} subItems moduleId="clients" />
              <SidebarItem to="/services" icon={Package} label="Services" active={location.pathname === '/services' || location.pathname === '/catalog' || location.pathname === '/orders' || location.pathname === '/store-users'} isCollapsed={!isSidebarOpen} subItems moduleId="services" />
              <SidebarItem to="/onboarding" icon={Rocket} label="Onboarding" active={location.pathname.startsWith('/onboarding')} isCollapsed={!isSidebarOpen} moduleId="onboarding" />
              <SidebarItem to="/timesheets" icon={Clock} label="Timesheets" active={location.pathname === '/timesheets'} isCollapsed={!isSidebarOpen} moduleId="timesheets" />
              <SidebarItem to="/tasks" icon={CheckSquare} label="My Tasks" active={location.pathname === '/tasks'} isCollapsed={!isSidebarOpen} moduleId="tasks" />
            </SidebarSection>
            <SidebarSection title="Enterprise" isCollapsed={!isSidebarOpen}>
              <SidebarItem to="/inbox" icon={MessageSquare} label="Messages" active={location.pathname === '/inbox'} isCollapsed={!isSidebarOpen} moduleId="messages" />
              <SidebarItem to="/billing" icon={CreditCard} label="Invoices" active={location.pathname === '/billing' || location.pathname.startsWith('/billing/')} isCollapsed={!isSidebarOpen} moduleId="billing" />
              <SidebarItem to="/estimates" icon={Calculator} label="Estimates" active={location.pathname === '/estimates'} isCollapsed={!isSidebarOpen} moduleId="estimates" />
              <SidebarItem to="/marketing" icon={Target} label="Marketing" active={location.pathname.startsWith('/marketing')} isCollapsed={!isSidebarOpen} subItems moduleId="marketing" />
              <SidebarItem to="/pages" icon={FileText} label="Pages" active={location.pathname.startsWith('/pages')} isCollapsed={!isSidebarOpen} moduleId="pages" />
              <SidebarItem to="/reports" icon={BarChart} label="Reports" active={location.pathname === '/reports'} isCollapsed={!isSidebarOpen} moduleId="reports" />
              <SidebarItem to="/storage" icon={HardDrive} label="Storage" active={location.pathname === '/storage'} isCollapsed={!isSidebarOpen} moduleId="storage" />
            </SidebarSection>

            {user?.role === 'client' && pages.length > 0 && (
              <SidebarSection title="Portal" isCollapsed={!isSidebarOpen}>
                {pages.map(page => (
                  <SidebarItem 
                    key={page.id}
                    to={`/p/${page.slug || page.id}`} 
                    icon={FileText} 
                    label={page.title} 
                    active={location.pathname === `/p/${page.slug || page.id}`} 
                    isCollapsed={!isSidebarOpen} 
                  />
                ))}
              </SidebarSection>
            )}

            <div className="mt-auto">
              <SidebarSection title="System" isCollapsed={!isSidebarOpen}>
                <SidebarItem to="/settings" icon={SettingsIcon} label="Preferences" active={location.pathname === '/settings'} isCollapsed={!isSidebarOpen} />
                <SidebarItem to="/help" icon={HelpCircle} label="Support" active={location.pathname === '/help'} isCollapsed={!isSidebarOpen} />
              </SidebarSection>
            </div>
          </nav>
          <div className="shrink-0 pt-2 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-black">
            <SubscriptionCard isCollapsed={!isSidebarOpen} />
          </div>
        </aside>
      )}
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-slate-50/30 dark:bg-black transition-colors duration-300">
        {!isFullScreen && (
          <header className="h-16 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0 relative z-[100]">
            <div className="flex items-center text-xs space-x-2 min-w-0">
              <span className="text-slate-400 dark:text-zinc-600 font-medium whitespace-nowrap">{user?.role}</span>
              <span className="text-slate-300 dark:text-zinc-800">/</span>
              <span className="text-slate-900 dark:text-white font-bold capitalize truncate">{location.pathname === '/' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).pop()}</span>
            </div>

            <div className="flex items-center space-x-6">
              
              <div className="flex items-center gap-6 ml-auto">
                <div className="flex items-center gap-3">
                  {user?.role !== 'client' && (
                    <>
                      <button onClick={() => navigate('/billing')} className="flex items-center gap-2 px-4 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all active:scale-95 hidden xl:flex">
                        <CreditCard size={12} strokeWidth={3}/> Invoices
                      </button>
                      <button onClick={() => navigate('/marketing')} className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all active:scale-95 hidden xl:flex">
                        <Target size={12} strokeWidth={3}/> Marketing
                      </button>
                      <button onClick={() => navigate('/storage')} className="flex items-center gap-2 px-4 py-1.5 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/50 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-all active:scale-95 hidden xl:flex">
                        <HardDrive size={12} strokeWidth={3}/> Storage
                      </button>
                    </>
                  )}
                  <button onClick={() => navigate('/help')} className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all active:scale-95 hidden xl:flex">
                    <HelpCircle size={12} strokeWidth={3}/> Help
                  </button>
                  {(user?.role !== 'client' || (user?.permissions?.['requests'] !== 'none')) && (
                     <button onClick={() => navigate('/requests')} className="flex items-center gap-2 px-4 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all active:scale-95 hidden 2xl:flex">
                       <Briefcase size={12} strokeWidth={3}/> Missions
                     </button>
                  )}
                </div>

                <button 
                  onClick={handleGlobalSchedule}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                >
                  <Calendar size={12} strokeWidth={3}/> Schedule
                </button>
              </div>

              <div className="relative group hidden lg:block" ref={searchRef}>
                <div className={`flex items-center bg-slate-50 dark:bg-zinc-900 border px-4 py-2 rounded-xl w-64 transition-all ${isSearchOpen ? 'ring-2 ring-blue-100 dark:ring-blue-900/30 border-blue-400 dark:border-blue-600 bg-white dark:bg-black shadow-lg' : 'border-slate-200 dark:border-zinc-800'}`}>
                  <Search size={14} className={`${isSearchOpen ? 'text-blue-500' : 'text-slate-400 dark:text-zinc-600'} mr-2`} />
                  <input 
                    type="text" 
                    placeholder="Universal lookup..." 
                    className="bg-transparent border-none outline-none text-xs w-full text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 font-medium" 
                    value={searchQuery} 
                    onChange={(e) => { setSearchTerm(e.target.value); setIsSearchOpen(true); }} 
                    onFocus={() => setIsSearchOpen(true)} 
                  />
                  <Command size={12} className="text-slate-300 dark:text-zinc-700 ml-2" />
                </div>

                {isSearchOpen && searchResults.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 z-[999] animate-in zoom-in-95">
                      {searchResults.map((result: any, i: number) => (
                        <div 
                          key={i} 
                          onClick={() => { navigate(result.path); setSearchTerm(''); setIsSearchOpen(false); }}
                          className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                        >
                           <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                             <result.icon size={14} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{result.title}</p>
                              <p className="text-[9px] font-bold text-slate-400 text-zinc-500 uppercase tracking-widest">{result.type}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative" ref={notificationRef}>
                  <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`relative transition-colors p-2 rounded-xl ${isNotificationsOpen ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400' : 'text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white'}`}>
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full border-2 border-white dark:border-black flex items-center justify-center shadow-lg">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[500px]">
                      <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Protocol Alerts</h4>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{unreadCount} Unread Missions</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={markAllAsRead} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors" title="Mark all as read">
                            <CheckCircle2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif.id)}
                              className={`px-5 py-4 border-b border-slate-50 dark:border-zinc-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group ${notif.status === 'unread' ? 'bg-blue-50/30 dark:bg-blue-600/5' : ''}`}
                            >
                              <div className="flex gap-4">
                                <div className="relative shrink-0">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm">
                                    <img src={notif.userAvatar || 'https://i.pravatar.cc/150?u=system'} className="w-full h-full object-cover" alt="" />
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-slate-100 dark:border-zinc-800">
                                    {getNotificationIcon(notif.type)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-slate-900 dark:text-zinc-200 leading-snug">
                                    <span className="font-black text-blue-600 dark:text-blue-400">{notif.user}</span> {notif.action} <span className="font-black">{notif.target}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-tighter">{notif.time}</p>
                                </div>
                                {notif.status === 'unread' && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shrink-0 mt-1" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center flex flex-col items-center justify-center opacity-40">
                            <ShieldAlert size={40} className="text-slate-300 dark:text-zinc-700 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Registry Is Clear</p>
                          </div>
                        )}
                      </div>

                      <Link 
                        to="/activity" 
                        onClick={() => setIsNotificationsOpen(false)}
                        className="p-4 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-zinc-800 text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors sticky bottom-0"
                      >
                        View System Audit
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-100 dark:hover:ring-blue-900 transition-all shrink-0 focus:outline-none"
                  >
                    <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover"/>
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-1">
                      <div className="px-4 py-3 border-b border-slate-50 dark:border-zinc-800 mb-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 truncate">{user?.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-2 transition-colors"><UserIcon size={14} /> My Profile</Link>
                      <button onClick={() => logout()} className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl flex items-center gap-2 transition-colors"><LogOut size={14} /> Sign Out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}
        
        <div className={`flex-1 ${isFullScreen ? 'overflow-hidden' : 'overflow-y-auto p-8'} custom-scrollbar`}>
            <Routes>
              <Route path="/" element={<ProtectedRoute moduleId="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="/inbox" element={<ProtectedRoute moduleId="messages"><Inbox /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute moduleId="calendar"><CalendarPage /></ProtectedRoute>} />
              <Route path="/pipeline" element={<ProtectedRoute moduleId="pipeline"><Pipeline /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute moduleId="activity"><Activity /></ProtectedRoute>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/billing" element={<ProtectedRoute moduleId="billing"><Billing /></ProtectedRoute>} />
              <Route path="/billing/new" element={<ProtectedRoute moduleId="billing"><InvoiceEditor /></ProtectedRoute>} />
              <Route path="/billing/:id" element={<ProtectedRoute moduleId="billing"><InvoiceEditor /></ProtectedRoute>} />
              <Route path="/personal-billing" element={<ProtectedRoute moduleId="billing"><PersonalBilling /></ProtectedRoute>} />
              <Route path="/upcoming-invoice" element={<ProtectedRoute moduleId="billing"><UpcomingInvoice /></ProtectedRoute>} />
              <Route path="/billing/plans" element={<ProtectedRoute moduleId="billing"><Plans /></ProtectedRoute>} />
              <Route path="/billing/plans/:planId" element={<ProtectedRoute moduleId="billing"><PlanDetails /></ProtectedRoute>} />
              <Route path="/billing/topup" element={<ProtectedRoute moduleId="billing"><TopUp /></ProtectedRoute>} />
              <Route path="/billing/payment-methods" element={<ProtectedRoute moduleId="billing"><PaymentMethods /></ProtectedRoute>} />
              <Route path="/billing/addons" element={<ProtectedRoute moduleId="billing"><Addons /></ProtectedRoute>} />
              <Route path="/estimates" element={<ProtectedRoute moduleId="estimates"><Estimates /></ProtectedRoute>} />
              <Route path="/help" element={<Help />} />
              <Route path="/services" element={<ProtectedRoute moduleId="services"><Services /></ProtectedRoute>} />
              <Route path="/services/new" element={<ProtectedRoute moduleId="services"><EditService /></ProtectedRoute>} />
              <Route path="/services/:id" element={<ProtectedRoute moduleId="services"><EditService /></ProtectedRoute>} />
              <Route path="/catalog" element={<ProtectedRoute moduleId="services"><ServiceCatalog /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute moduleId="services"><Orders /></ProtectedRoute>} />
              <Route path="/store-users" element={<ProtectedRoute moduleId="services"><StoreUsers /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute moduleId="onboarding"><OnboardingHome /></ProtectedRoute>} />
              <Route path="/onboarding/builder" element={<ProtectedRoute moduleId="onboarding"><OnboardingBuilder /></ProtectedRoute>} />
              <Route path="/onboarding/builder/:id" element={<ProtectedRoute moduleId="onboarding"><OnboardingBuilder /></ProtectedRoute>} />
              <Route path="/onboarding/view/:id" element={<ProtectedRoute moduleId="onboarding"><ClientOnboarding /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute moduleId="clients"><Clients /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute moduleId="clients"><Team /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute moduleId="clients"><Profile /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute moduleId="requests"><Requests /></ProtectedRoute>} />
              <Route path="/requests/:id" element={<ProtectedRoute moduleId="requests"><RequestDetail /></ProtectedRoute>} />
              <Route path="/tickets" element={<ProtectedRoute moduleId="tickets"><Tickets /></ProtectedRoute>} />
              <Route path="/automation" element={<ProtectedRoute moduleId="automation"><Automation /></ProtectedRoute>} />
              <Route path="/marketing" element={<ProtectedRoute moduleId="marketing"><Marketing /></ProtectedRoute>} />
              <Route path="/marketing/automation" element={<ProtectedRoute moduleId="marketing"><MarketingAutomation /></ProtectedRoute>} />
              <Route path="/marketing/segmentation" element={<ProtectedRoute moduleId="marketing"><MarketingSegmentation /></ProtectedRoute>} />
              <Route path="/marketing/email" element={<ProtectedRoute moduleId="marketing"><MarketingEmail /></ProtectedRoute>} />
              <Route path="/marketing/analytics" element={<ProtectedRoute moduleId="marketing"><MarketingAnalytics /></ProtectedRoute>} />
              <Route path="/marketing/optimization" element={<ProtectedRoute moduleId="marketing"><MarketingOptimization /></ProtectedRoute>} />
              <Route path="/marketing/funnels" element={<ProtectedRoute moduleId="marketing"><MarketingFunnels /></ProtectedRoute>} />
              <Route path="/marketing/omnichannel" element={<ProtectedRoute moduleId="marketing"><MarketingOmnichannel /></ProtectedRoute>} />
              <Route path="/data-migration" element={<ProtectedRoute moduleId="dashboard"><DataMigration /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute moduleId="ai"><ZifyAI /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute moduleId="reports"><Reports /></ProtectedRoute>} />
              <Route path="/storage" element={<ProtectedRoute moduleId="storage"><Storage /></ProtectedRoute>} />
              <Route path="/pages" element={<ProtectedRoute moduleId="pages"><Pages /></ProtectedRoute>} />
              <Route path="/pages/new" element={<ProtectedRoute moduleId="pages"><PageEditor /></ProtectedRoute>} />
              <Route path="/pages/edit/:id" element={<ProtectedRoute moduleId="pages"><PageEditor /></ProtectedRoute>} />
              <Route path="/p/:id" element={<PageView />} />
              <Route path="/tasks" element={<ProtectedRoute moduleId="tasks"><Tasks /></ProtectedRoute>} />
              <Route path="/timesheets" element={<ProtectedRoute moduleId="timesheets"><Timesheets /></ProtectedRoute>} />
              <Route path="/store" element={<PublicStore />} />
              <Route path="/store-editor" element={<StoreEditor />} />
              <Route path="/store-login" element={<StoreLogin />} />
              <Route path="/bookings" element={<ProtectedRoute moduleId="bookings"><Bookings /></ProtectedRoute>} />
              <Route path="/bookings/new" element={<ProtectedRoute moduleId="bookings"><EditBookingType /></ProtectedRoute>} />
              <Route path="/bookings/edit/:id" element={<ProtectedRoute moduleId="bookings"><EditBookingType /></ProtectedRoute>} />
              <Route path="/book/:id" element={<PublicBookingPage />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <CurrencyProvider>
      <Router>
        <AppContent isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsSidebarOpen={setIsSidebarOpen} />
      </Router>
    </CurrencyProvider>
  );
};

export default App;