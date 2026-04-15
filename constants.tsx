
import { Client, Project, TeamMember, Invoice, Task, Message, TimeEntry, Estimate, Request, Service, Lead, ActivityEvent, Profile, Page, PageTemplate } from './types';
import { 
  Sparkles, Database, Globe, UserPlus, Shield, Zap,
  LayoutGrid, History, Briefcase, LifeBuoy, Activity, CalendarDays, ListChecks, Rocket, Clock, CheckSquare, MessageSquare, CreditCard, Calculator, FileText, BarChart, HardDrive, Users,
  CalendarCheck, Target, Workflow
} from 'lucide-react';

export const SIDEBAR_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'activity', label: 'Activity Log', icon: History },
  { id: 'requests', label: 'Requests', icon: Briefcase },
  { id: 'tickets', label: 'Tickets', icon: LifeBuoy },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'team', label: 'Team', icon: Shield },
  { id: 'ai', label: 'Zify AI', icon: Sparkles },
  { id: 'pipeline', label: 'Pipeline', icon: Activity },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'onboarding', label: 'Onboarding', icon: Rocket },
  { id: 'marketing', label: 'Marketing', icon: Target },
  { id: 'automation', label: 'Automation', icon: Workflow },
  { id: 'schedules', label: 'Schedules', icon: ListChecks },
  { id: 'services', label: 'Services', icon: Rocket },
  { id: 'timesheets', label: 'Timesheets', icon: Clock },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'billing', label: 'Invoices', icon: CreditCard },
  { id: 'estimates', label: 'Estimates', icon: Calculator },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'reports', label: 'Reports', icon: BarChart },
  { id: 'storage', label: 'Storage', icon: HardDrive },
];

export const GLOBAL_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'Pound Sterling', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'NZ Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krone', symbol: 'kr' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'ZAR', name: 'SA Rand', symbol: 'R' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'ILS', name: 'Israeli New Sheqel', symbol: '₪' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'COP', name: 'Chilean Peso', symbol: '$' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' }
];

export const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Ona Gottlieb', company: 'CloudFirst Tech', email: 'ona.gottlieb@cloudfirst.com', status: 'Active', revenue: 27191.52, avatar: 'https://i.pravatar.cc/150?u=ona', organization: 'CloudFirst Technologies', position: 'VP of Marketing', dateAdded: '17/09/2025' },
  { id: '2', name: 'Jared Bernhard', company: 'CloudFirst Tech', email: 'jared.bernhard@cloudfirst.com', status: 'Active', revenue: 8400, avatar: 'https://i.pravatar.cc/150?u=jared', organization: 'CloudFirst Technologies', position: 'VP of Engineering', dateAdded: '17/09/2025' },
];

export const MOCK_PROFILES: Profile[] = [
  { 
    id: 'sarah', name: 'Sarah Johnson', role: 'DevOps Lead', avatar: 'https://i.pravatar.cc/150?u=sarah', 
    email: 'sarah.j@zify.ai', phone: '+1 555-0101', bio: 'Infrastructure wizard with a passion for zero-downtime deployments.',
    department: 'Engineering', location: 'San Francisco, CA', joinDate: 'Jan 2024',
    stats: { projects: 12, tasks: 145, activity: 890 }
  },
  { 
    id: 'alex', name: 'Alex River', role: 'Senior Designer', avatar: 'https://i.pravatar.cc/150?u=alex', 
    email: 'alex.r@zify.ai', phone: '+1 555-0202', bio: 'Creating pixel-perfect experiences for the modern web.',
    department: 'Creative', location: 'London, UK', joinDate: 'Mar 2024',
    stats: { projects: 8, tasks: 92, activity: 420 }
  },
  { 
    id: 'elena', name: 'Elena Rodriguez', role: 'Account Director', avatar: 'https://i.pravatar.cc/150?u=elena', 
    email: 'elena.r@zify.ai', phone: '+1 555-0303', bio: 'Strategic partner for our enterprise clients.',
    department: 'Client Services', location: 'Madrid, ES', joinDate: 'May 2024',
    stats: { projects: 15, tasks: 210, activity: 1100 }
  },
  { 
    id: 'current', name: 'Agency Admin', role: 'Owner', avatar: 'https://i.pravatar.cc/150?u=current', 
    email: 'admin@zify.ai', phone: '+1 555-0000', bio: 'Founder and managing director of Zify AI.',
    department: 'Executive', location: 'New York, NY', joinDate: 'Jan 2020',
    stats: { projects: 45, tasks: 1200, activity: 5000 }
  }
];

export const MOCK_EVENTS: ActivityEvent[] = [
  { 
    id: '1', type: 'deploy', user: 'Sarah Johnson', userAvatar: 'https://i.pravatar.cc/150?u=sarah',
    action: 'deployed v2.4.1 to', target: 'Lumina Staging', time: '10 mins ago',
    timestamp: new Date(), importance: 'high', status: 'unread',
    description: 'Automated CI/CD pipeline triggered by merge request. All tests passed.' 
  },
  { 
    id: '2', type: 'project', user: 'Alex River', userAvatar: 'https://i.pravatar.cc/150?u=alex',
    action: 'completed milestone', target: 'Mobile App V1', time: '2 hours ago',
    timestamp: new Date(Date.now() - 7200000), importance: 'medium', status: 'unread',
    description: 'Finalized the authentication module and integrated with the new backend API.' 
  },
  { 
    id: '3', type: 'finance', user: 'System', action: 'auto-generated invoice', 
    target: '#INV-992', time: '4 hours ago', timestamp: new Date(Date.now() - 14400000),
    importance: 'medium', status: 'read',
    description: 'Monthly retainer invoice sent to CloudFirst Tech for October 2025.' 
  },
  { 
    id: '4', type: 'crm', user: 'Elena Rodriguez', userAvatar: 'https://i.pravatar.cc/150?u=elena',
    action: 'added new lead', target: 'Nova Core', time: 'Yesterday',
    timestamp: new Date(Date.now() - 86400000), importance: 'high', status: 'unread',
    description: 'Initial contact via LinkedIn. Potential high-value enterprise branding contract.' 
  },
];

export const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Brand Identity & Logo Design', type: 'One-off', pricingType: 'Standard', price: 1299.00, description: 'Professional brand identity package including logo design, brand guidelines, color palette, and more.', image: 'https://images.unsplash.com/photo-1572044162444-ad60f128bde7?auto=format&fit=crop&q=80&w=400' },
  { id: 's2', name: 'Content Writing & Copywriting', type: 'Recurring', pricingType: 'Credit based', price: 999.97, description: 'Monthly content strategy and copywriting service to fuel your growth.', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=400', creditsIncluded: 1 },
  { id: 's3', name: 'Digital Marketing Campaign Management', type: 'Recurring', pricingType: 'Time based', price: 3500.00, description: 'End-to-end management of your digital marketing channels.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400', hoursIncluded: 1 },
];

export const MOCK_REQUESTS: Request[] = [
  { id: 'r1', title: 'IT infrastructure assessment and planning', client: 'Esmeralda Hermiston', service: 'IT Consulting & Strategy', assignedTo: 'Mike Chen', status: 'Completed', priority: 'Low', dueDate: 'Sep 17, 2025', updatedAt: 'Sep 17, 2025', description: 'Seeking expert advice on our technology infrastructure to improve efficiency, security, and scalability.', creditsConsumed: 0 },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Watch a short demo video', project: 'Onboarding', assignee: 'Me', dueDate: '-', status: 'Done', priority: 'Low', type: 'Strategic', estimatedTime: '0:15h', spentTime: '-' },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2025090002', client: 'Ona Gottlieb', amount: 45.00, date: '17/09/2025', status: 'Paid', clientEmail: 'ona.g@cloudfirst.com' },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', sender: 'Sarah Johnson', subject: 'Budget approval for Phase 2', preview: 'Hi team, we have reviewed the proposal and...', time: '10:45 AM', unread: true, avatar: 'https://i.pravatar.cc/150?u=sarah' },
];

export const MOCK_TIME_ENTRIES: TimeEntry[] = [
  { id: 'te1', project: 'Lumina Tech', task: 'Design UI', duration: '4h 30m', date: '2024-05-22', user: 'Alex River' },
];

export const MOCK_ESTIMATES: Estimate[] = [
  { id: 'EST-902', client: 'Nova Core', amount: 12500, date: '2024-05-10', status: 'Pending', expiryDate: '2024-06-10' },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', title: 'Q4 Marketing Strategy', client: 'CloudFirst Tech', status: 'In Progress', progress: 65, dueDate: 'Dec 20, 2025', team: ['1', '2'] },
];

export const MOCK_LEADS: Lead[] = [
  { 
    id: 'l1', 
    company: 'Global Logistics', 
    contact: 'Mark Spencer', 
    value: 45000, 
    stage: 'Qualified',
    probability: 20,
    createdAt: '2025-09-17T00:00:00.000Z',
    priority: 'High'
  },
];

export const MOCK_PAGES: Page[] = [
  { 
    id: 'pg-1', 
    title: 'Website Blueprint', 
    slug: 'website-blueprint',
    status: 'Published', 
    owner: 'Agency Admin', 
    updatedAt: '07 Jan, 2026', 
    views: 0,
    pinned: true,
    blocks: [] 
  },
  { 
    id: 'pg-2', 
    title: 'Internal Questionnaire', 
    slug: 'client-onboarding',
    status: 'Private', 
    owner: 'Agency Admin', 
    updatedAt: '07 Jan, 2026', 
    views: 0,
    blocks: [] 
  },
  { 
    id: 'pg-3', 
    title: 'CRM Setup Guide', 
    slug: 'crm-setup',
    status: 'Published', 
    owner: 'Alex River', 
    updatedAt: '10 Jan, 2025', 
    views: 0,
    blocks: [] 
  },
  { 
    id: 'pg-4', 
    title: 'Asset Directory', 
    slug: 'content-folder',
    status: 'Private', 
    owner: 'Sarah Johnson', 
    updatedAt: '10 Jan, 2025', 
    views: 0,
    blocks: [] 
  },
  { 
    id: 'pg-5', 
    title: 'Final Deliverable', 
    slug: 'final-deliverable',
    status: 'Published', 
    owner: 'Agency Admin', 
    updatedAt: '10 Jan, 2025', 
    views: 0,
    blocks: [] 
  },
];

export const MOCK_TEMPLATES: PageTemplate[] = [];

export const AVAILABLE_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    desc: 'Get Started Today!',
    features: ['2 Requests', '30 Tickets', '100 Zify AI Credits', '1 Pipeline Domain', '1 Booking Form', '1 Client', '1 Onboarding Form', '10 Invoices', '10 Estimates', '1 Page', '500 MB Storage', '1 Workspace'],
    color: 'from-slate-400 to-slate-500',
    accent: 'slate',
    popular: false,
    seatLimit: 0,
    storageLimitGB: 0.5,
    baseCredits: 100,
    projectLimit: 2,
    clientLimit: 1,
    pipelineLimit: 1,
    bookingsLimit: 1,
    servicesLimit: 0,
    onboardingLimit: 1,
    pagesLimit: 1,
    invoicesLimit: 10,
    estimatesLimit: 10,
    ticketsLimit: 30,
    marketingEmailsLimit: 0,
    workspacesLimit: 1,
    dodo_product_id_monthly: '',
    dodo_product_id_annual: ''
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    desc: 'For Small Agencies',
    features: ['15 Requests', '150 Tickets', '1,000 Zify AI Credits', 'Unlimited Pipelines', '20 Booking Forms', '10 Clients', '2 Team Members', '20 Services', 'Unlimited Onboarding Forms', 'Unlimited Invoices & Estimates', '20 Marketing Emails', '30 Pages', '10 GB Storage', '3 Workspaces'],
    color: 'from-blue-400 to-blue-600',
    accent: 'blue',
    popular: false,
    seatLimit: 2,
    storageLimitGB: 10,
    baseCredits: 1000,
    projectLimit: 15,
    clientLimit: 10,
    pipelineLimit: -1,
    bookingsLimit: 20,
    servicesLimit: 20,
    onboardingLimit: -1,
    pagesLimit: 30,
    invoicesLimit: -1,
    estimatesLimit: -1,
    ticketsLimit: 150,
    marketingEmailsLimit: 20,
    workspacesLimit: 3,
    dodo_product_id_monthly: 'pdt_0NcjlDGv0howghtyebR0V',
    dodo_product_id_annual: 'pdt_0NcjlScp8xeibMJeb43mp',
    hasTrial: true
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    desc: 'For Professional Mid-Sized Agencies',
    features: ['50 Requests', '150 Tickets', '3,000 Zify AI Credits', 'Unlimited Pipelines', '80 Booking Forms', '35 Clients', '5 Team Members', '70 Services', 'Unlimited Onboarding Forms', 'Unlimited Invoices & Estimates', '50 Marketing Emails', '70 Pages', '35 GB Storage', '5 Workspaces'],
    color: 'from-indigo-500 to-purple-600',
    accent: 'indigo',
    popular: true,
    seatLimit: 5,
    storageLimitGB: 35,
    baseCredits: 3000,
    projectLimit: 50,
    clientLimit: 35,
    pipelineLimit: -1,
    bookingsLimit: 80,
    servicesLimit: 70,
    onboardingLimit: -1,
    pagesLimit: 70,
    invoicesLimit: -1,
    estimatesLimit: -1,
    ticketsLimit: 150,
    marketingEmailsLimit: 50,
    workspacesLimit: 5,
    dodo_product_id_monthly: 'pdt_0Ncjlvdr7KlHMqQJl41DA',
    dodo_product_id_annual: 'pdt_0NcjmCWLCA97zfwYn6Qgb',
    hasTrial: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249,
    desc: 'For large big agenncies',
    features: ['300 Requests', '1,000 Tickets', '30,000 Zify AI Credits', 'Unlimited Pipelines', 'Unlimited Booking Forms', '100 Clients', '20 Team Members', '200 Services', 'Unlimited Onboarding Forms', 'Unlimited Invoices & Estimates', '150 Marketing Emails', '150 Pages', '250 GB Storage', '15 Workspaces'],
    color: 'from-rose-600 to-orange-600',
    accent: 'rose',
    popular: false,
    seatLimit: 20,
    storageLimitGB: 250,
    baseCredits: 30000,
    projectLimit: 300,
    clientLimit: 100,
    pipelineLimit: -1,
    bookingsLimit: -1,
    servicesLimit: 200,
    onboardingLimit: -1,
    pagesLimit: 150,
    invoicesLimit: -1,
    estimatesLimit: -1,
    ticketsLimit: 1000,
    marketingEmailsLimit: 150,
    workspacesLimit: 15,
    dodo_product_id_monthly: 'pdt_0NcjmJjLenmHHJG7H0YkK',
    dodo_product_id_annual: 'pdt_0NcjmR4CeG864aMeV418J',
    hasTrial: true
  }
];

export const ALL_ADDONS = [
  { 
    id: 'ai_pro', 
    name: 'AI Generator Pro', 
    desc: '50,000 annual credits for text & image generation.', 
    price: 2400, 
    icon: Sparkles, 
    theme: 'purple',
    gradient: 'from-purple-600 to-pink-600',
    dodo_product_id_monthly: 'pdt_0Ncjrbw45Aoqr1ysqBPLv',
    dodo_product_id_annual: 'pdt_0NcjrmMc7r8WGJSGhJ7Q7'
  },
  { 
    id: 'storage_1tb', 
    name: 'Cloud Storage 1TB', 
    desc: 'Secure, redundant annual storage for all your agency assets.', 
    price: 2040, 
    icon: Database, 
    theme: 'blue',
    gradient: 'from-blue-600 to-cyan-600',
    dodo_product_id_monthly: 'pdt_0NcjrxmgXAs6BhPY1XuIO',
    dodo_product_id_annual: 'pdt_0Ncjs3K3iE2nE2eEHqw40'
  },
  { 
    id: 'extra_workspaces', 
    name: 'Extra Workspaces', 
    desc: '10 extra annual workspaces for your agency.', 
    price: 360, 
    icon: Globe, 
    theme: 'indigo',
    gradient: 'from-indigo-500 to-violet-500',
    dodo_product_id_monthly: 'pdt_0NcjsE2U1toy8aj7kDwqq',
    dodo_product_id_annual: 'pdt_0NcjsHMR0J8536Qm75NpZ'
  },
  { 
    id: 'extra_seats', 
    name: '5 Extra Seats', 
    desc: 'Add more team members to your workspace annually.', 
    price: 300, 
    icon: UserPlus, 
    theme: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    dodo_product_id_monthly: 'pdt_0NcjsMeKiIM6noJNlcvVP',
    dodo_product_id_annual: 'pdt_0NcjsPEAzaXvYTsVc4F2m'
  },
  { 
    id: 'email_broadcasting', 
    name: 'Email Broadcasting', 
    desc: '100 times access to broadcast and send bulk emails annually.', 
    price: 480, 
    icon: Target, 
    theme: 'rose',
    gradient: 'from-rose-500 to-orange-500',
    dodo_product_id_monthly: 'pdt_0NcjsWvnunOMVMCgP8XbQ',
    dodo_product_id_annual: 'pdt_0Ncjsby57kdhTrzr5Gu8T'
  },
  { 
    id: 'ai_automation_access', 
    name: 'AI Automation Access', 
    desc: 'Grant annual access codes to AI automation pages.', 
    price: 600, 
    icon: Workflow, 
    theme: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
    dodo_product_id_monthly: 'pdt_0NcjsmoXJMvUTZyibKZFx',
    dodo_product_id_annual: 'pdt_0Ncjsq1Q6qkicW7JjwsLp'
  },
];
