

export type UserRole = 'admin' | 'team' | 'client';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  organization?: string;
  lastLogin?: string;
  modulePermissions?: Record<string, 'view' | 'edit' | 'none' | string[]>; // Renamed from permissions
  allowedPageIds?: string[];
  onboarding_complete?: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
}

export interface Client {
  id: string;
  userId?: string | null; // Added userId
  owner_id?: string;
  name: string;
  email: string;
  company: string;
  status: 'Active' | 'Lead' | 'Past' | 'Draft';
  revenue: number;
  avatar: string;
  organization?: string;
  position?: string;
  dateAdded?: string;
  industry?: string;
  website?: string;
  taxId?: string;
  phone?: string;
  address?: string;
  size?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  budgetRange?: string;
  currency?: string;
  mainObjective?: string;
  assignedManager?: string;
  onboardingFlowId?: string;
  modulePermissions?: Record<string, 'view' | 'edit' | 'none' | string[]>; // Synced with DB JSONB
  allowedPageIds?: string[];
  lastContacted?: string;
  created_at?: string;
}

export interface StoreUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  zip?: string;
  dob?: string;
  company?: string;
  registeredAt: string;
  lastLogin: string;
  ordersCount: number;
  totalSpent: number;
}

export interface StoreMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

export interface CartItem extends Service {
  cartId: string; // Unique ID for cart instance
}

export interface Profile {
  id: string;
  userId?: string | null; // Added userId
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  bio: string;
  department: string;
  location: string;
  joinDate: string;
  stats: {
    projects: number;
    tasks: number;
    activity: number;
  };
  modulePermissions?: Record<string, 'view' | 'edit' | 'none' | string[]>;
  allowedPageIds?: string[];
  isAdmin?: boolean;
  isOwner?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  type: 'One-off' | 'Recurring';
  pricingType: 'Standard' | 'Time based' | 'Credit based';
  price: number;
  image: string;
  creditsIncluded?: number;
  hoursIncluded?: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  uploadedAt: string;
  owner: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface RequestTimeEntry {
  id: string;
  date: string;
  duration: string; 
  description: string;
  user: string;
}

export interface Request {
  id: string;
  title: string;
  client: string;
  service: string;
  project?: string;
  assignedTo: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  dueTime?: string;
  updatedAt: string;
  description?: string;
  creditsConsumed?: number;
  creditsTotal?: number;
  files?: FileAttachment[];
  checklist?: ChecklistItem[];
  timesheets?: RequestTimeEntry[];
  orgNotes?: string;
  hourlyRate?: number;
}

export interface Ticket {
  id: string;
  subject: string;
  client: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Pending' | 'Solved' | 'Closed';
  date: string;
  assignee: string;
  description: string;
  department?: string;
  category?: string;
  source?: 'Email' | 'Portal' | 'Chat' | 'Internal';
  attachments?: string[];
  history?: { user: string; action: string; time: string; avatar?: string }[];
  hourlyRate?: number;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  dueDate: string;
  dueTime?: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  type: 'Strategic' | 'Technical' | 'Operational';
  estimatedTime: string;
  spentTime: string;
  description?: string;
  refType?: 'Mission' | 'Ticket' | 'Internal';
  refId?: string;
  checklist?: ChecklistItem[];
  tags?: string[];
}

export interface Invoice {
  id: string;
  client: string;
  clientEmail?: string;
  amount: number;
  date: string;
  dueDate?: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Sent' | 'Rejected';
  items?: any; 
  number?: string;
  fromName?: string;
  fromAddress?: string;
  logo?: string;
  notes?: string;
  settings?: any;
}

export interface Estimate extends Omit<Invoice, 'status'> {
  expiryDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Invoiced' | 'Rejected';
}

export interface Message {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  avatar: string;
}

export interface TimeEntry {
  id: string;
  project: string;
  task: string;
  duration: string;
  date: string;
  user: string;
  refType?: 'Mission' | 'Ticket' | 'Internal';
  refId?: string;
  billable?: boolean;
  category?: string;
  hourlyRate?: number;
}

export interface Project {
  id: string;
  title: string;
  client: string;
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed';
  progress: number;
  dueDate: string;
  team: string[];
  priority?: 'Low' | 'Medium' | 'High';
  budget?: number;
  description?: string;
  tags?: string[];
  hourlyRate?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Lead {
  id: string;
  workspace_id?: string;
  title?: string;
  company: string;
  contact: string;
  value: number;
  stage: string;
  probability: number;
  createdAt: string;
  expectedCloseDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  phone?: string;
  email?: string;
  owner?: string;
  label?: string;
  sourceChannel?: string;
  sourceChannelId?: string;
  visibility?: string;
  currency?: string;
}

export interface Pipeline {
  id: string;
  workspace_id?: string;
  name: string;
  stages: string[];
  leads: Lead[];
}

export interface ActivityEvent {
  id: string;
  type: 'deploy' | 'project' | 'finance' | 'crm' | 'comm' | 'security' | 'system';
  user: string;
  userAvatar?: string;
  action: string;
  target: string;
  time: string;
  timestamp: Date;
  description: string;
  importance: 'low' | 'medium' | 'high';
  status: 'unread' | 'read' | 'archived';
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Sent' | 'Rejected';
  invoiceId: string;
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface StoreConfig {
  storeName: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroLayout: 'Center' | 'Split Left' | 'Split Right' | 'Minimal';
  heroImage?: string; // URL for bg or split image
  
  primaryColor: string; // Hex
  secondaryColor: string; // Hex
  backgroundColor: string; // Hex
  cardBackgroundColor: string; // Hex
  textColor: string; // Hex
  
  fontFamily: 'Inter' | 'Playfair Display' | 'Roboto' | 'Space Grotesk' | 'DM Sans';
  radius: number; // px for border radius
  
  cardStyle: 'Minimal' | 'Bordered' | 'Glass';
  gridColumns: number;
  showRatings: boolean;
  showPrice: boolean;

  logoUrl?: string;
  paymentGatewayUrl?: string; // NEW
  
  // Content Sections
  aboutTitle?: string;
  aboutHeadline?: string;
  aboutText?: string;
  
  contactTitle?: string;
  contactHeadline?: string;
  contactSubheadline?: string;
  contactEmail?: string;
  
  // Footer
  footerLinks?: FooterLink[];
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

// --- Automation Orchestrator Types (Full Spec) ---

export type WorkflowNodeStatus = 'Idle' | 'Running' | 'Success' | 'Error' | 'Waiting';

export interface NodeRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  params: Record<string, any>;
  status: WorkflowNodeStatus;
  retryPolicy?: NodeRetryPolicy;
  inputs: string[]; // Node IDs
  outputs: string[]; // Node IDs
  metadata?: {
    icon?: string;
    category?: string;
    executionCount?: number;
    avgDurationMs?: number;
  };
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  status: 'Draft' | 'Active' | 'Paused' | 'Error' | 'Disabled';
  env: 'Test' | 'Staging' | 'Prod';
  ownerId: string;
  version: number;
  nodes: WorkflowNode[];
  lastRunAt?: string;
  avgRuntimeMs?: number;
  lastErrorSummary?: string;
  tags?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionRun {
  id: string;
  workflowId: string;
  version: number;
  status: 'Success' | 'Failed' | 'Running' | 'Paused';
  env: 'Test' | 'Staging' | 'Prod';
  startedAt: string;
  finishedAt?: string;
  initiatedBy: string;
  trace: {
    nodeId: string;
    status: 'Success' | 'Failed';
    inputSnapshot: any;
    outputSnapshot: any;
    durationMs: number;
    error?: string;
    timestamp: string;
  }[];
}

export interface AutomationAgent {
  id: string;
  name: string;
  role: string;
  allowedDomains: ('Requests' | 'Clients' | 'Finance' | 'Production')[];
  actionsAllowed: ('Draft' | 'Recommend' | 'Execute')[];
  confidenceThreshold: number;
  dailyCostLimit: number;
  status: 'Active' | 'Paused' | 'Draft';
  modelId: string;
  promptTemplate: string;
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  category: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  requiredConnectors: string[];
  description: string;
  workflow: Partial<AutomationWorkflow>;
  samplePayloads: any[];
}

export interface PageBlock {
  id: string;
  type: 'text' | 'heading' | 'image' | 'video' | 'button' | 'carousel' | 'signature' | 'upload' | 'banner' | 'colorbox' | 'embed' | 'table' | 'dynamic_table' | 'column' | 'emoji' | 'newline' | 'divider' | 'spacer' | 'social' | 'product' | 'features' | 'quote';
  content: any;
  properties?: Record<string, any>;
}

export interface PageSettings {
  textColor: string;
  backgroundColor: string;
  backgroundUrl?: string;
  padding: number;
  lineSpacing: number;
  maxWidth: number;
  customize: boolean;
  fontFamily?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'Draft' | 'Published' | 'Private';
  owner: string;
  updatedAt: string;
  views: number;
  pinned?: boolean;
  blocks: PageBlock[];
  folderId?: string | null;
  deleted?: boolean;
  settings?: PageSettings;
}

export interface PageTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  status: 'Live' | 'Draft' | 'Archived';
  type: string;
  steps: any[]; // Stores array of phases/steps (JSONB)
  branding: any; // Stores visual settings (JSONB)
  views: number;
  responses: number;
  completion: number;
  updated_at: string;
  updatedAt?: string;
  owner_id?: string;
}