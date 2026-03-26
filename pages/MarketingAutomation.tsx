
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Zap, Plus, Play, Pause, MoreHorizontal, GitBranch, 
  Clock, CheckCircle2, AlertCircle, ArrowRight, Workflow,
  Activity as ActivityIcon, Settings as SettingsIcon, Trash2, Copy, Search as SearchIcon, Filter as FilterIcon,
  MousePointer2, Layers as LayersIcon, Cpu, Code, Database as DatabaseIcon, Globe as GlobeIcon,
  MessageSquare, Mail, Bell, Shield, ChevronRight, X,
  MoveHorizontal, ZoomIn, ZoomOut, Check, Save, RotateCcw,
  Smartphone, ShoppingCart, User as UserIcon, Calendar, Tag, Radio,
  Split, Megaphone, Flag, Lock, Link as LinkIcon, Eye, CreditCard,
  Edit3, Users, DollarSign, Briefcase, Target, Heart, Sparkles,
  History as HistoryIcon, Hash, Terminal, HardDrive, Filter,
  Share2, Key, Layers, Cloud, AlertTriangle, Fingerprint, Search, ChevronDown,
  UserPlus, FileText, CheckSquare, StopCircle, UserCheck, Shuffle,
  ShieldAlert, List, UploadCloud, HelpCircle, Hammer, Construction, Rocket
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import * as ReactRouterDom from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { AVAILABLE_PLANS } from '../constants';

const { useNavigate } = ReactRouterDom as any;

// --- Types ---
interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'control';
  label: string;
  // icon: any; // Removed from state to prevent serialization issues
  x: number;
  y: number;
  status: 'idle' | 'active' | 'completed' | 'error' | 'waiting';
  config: Record<string, any>;
  description?: string;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface WorkflowData {
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Draft';
  lastRun: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  stats: {
    active: number;
    executed: number;
  };
}

// --- Unique Configuration Schema (Internal AgencyOS Only) ---
const NODE_CONFIG_SCHEMA: Record<string, { label: string; type: 'text' | 'number' | 'select' | 'toggle' | 'textarea' | 'tags'; options?: string[]; placeholder?: string }[]> = {
  // --- TRIGGERS ---
  'New Lead': [
    { label: 'Source Channel', type: 'select', options: ['Web Form', 'Referral Portal', 'Manual Entry', 'API Import'] },
    { label: 'Minimum Lead Score', type: 'number', placeholder: '20' },
    { label: 'Auto-Assign Owner', type: 'toggle' }
  ],
  'Form Submission': [
    { label: 'Target Form', type: 'select', options: ['Contact Us', 'Enterprise Quote', 'Newsletter Signup', 'Support Request'] },
    { label: 'Field Validation', type: 'select', options: ['Strict', 'Lax'] },
    { label: 'Capture IP', type: 'toggle' }
  ],
  'Email Interaction': [
    { label: 'Campaign Context', type: 'select', options: ['Any Campaign', 'Welcome Series', 'Q4 Promo', 'Re-engagement'] },
    { label: 'Interaction Type', type: 'select', options: ['Opened', 'Clicked Link', 'Replied'] },
    { label: 'Specific Link URL', type: 'text', placeholder: 'Optional specific URL...' }
  ],
  'Page Visit': [
    { label: 'URL Pattern', type: 'text', placeholder: '/pricing/*' },
    { label: 'Minimum Duration (sec)', type: 'number', placeholder: '30' },
    { label: 'Device Filter', type: 'select', options: ['Any', 'Desktop Only', 'Mobile Only'] }
  ],
  'Deal Stage Change': [
    { label: 'Target Pipeline', type: 'select', options: ['Sales', 'Partnership', 'Renewal'] },
    { label: 'Moved To Stage', type: 'select', options: ['Discovery', 'Proposal', 'Negotiation', 'Closed Won'] },
    { label: 'Include Stagnant Deals', type: 'toggle' }
  ],
  'Ticket Created': [
    { label: 'Department', type: 'select', options: ['Support', 'Billing', 'Technical', 'Sales'] },
    { label: 'Priority Level', type: 'select', options: ['High', 'Medium', 'Low', 'Critical'] },
    { label: 'Source', type: 'select', options: ['Portal', 'Email', 'Widget'] }
  ],
  'Invoice Paid': [
    { label: 'Minimum Amount', type: 'number', placeholder: '100.00' },
    { label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] },
    { label: 'Client Tier', type: 'select', options: ['All', 'Enterprise', 'Standard'] }
  ],
  'Task Updated': [
    { label: 'Task Type', type: 'select', options: ['Follow-up', 'Meeting', 'To-Do'] },
    { label: 'New Status', type: 'select', options: ['Completed', 'In Progress', 'Deferred'] },
    { label: 'Assignee', type: 'select', options: ['Any', 'Current User', 'Bot'] }
  ],
  'Date Arrived': [
    { label: 'Date Reference', type: 'select', options: ['Specific Date', 'Contact Birthday', 'Contract Renewal', 'Project Deadline'] },
    { label: 'Time of Execution', type: 'text', placeholder: '09:00 AM' },
    { label: 'Repeat Annually', type: 'toggle' }
  ],

  // --- ACTIONS ---
  'Send Email': [
    { label: 'Template', type: 'select', options: ['Welcome A', 'Nurture Sequence 1', 'Meeting Invite', 'Plain Text'] },
    { label: 'Subject Line', type: 'text', placeholder: 'Leave blank to use template default' },
    { label: 'Sender Identity', type: 'select', options: ['Account Owner', 'Support Team', 'Agency Founder'] },
    { label: 'Track Opens', type: 'toggle' }
  ],
  'Create Task': [
    { label: 'Task Title', type: 'text', placeholder: 'e.g. Call Client' },
    { label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] },
    { label: 'Due In (Days)', type: 'number', placeholder: '3' },
    { label: 'Assign To', type: 'select', options: ['Lead Owner', 'Sales Manager', 'Support Lead'] }
  ],
  'Update Deal': [
    { label: 'Target Pipeline', type: 'select', options: ['Sales', 'Partnership'] },
    { label: 'New Stage', type: 'select', options: ['Qualified', 'Proposal Sent', 'Negotiation'] },
    { label: 'Update Probability', type: 'number', placeholder: '50' }
  ],
  'Notify Team': [
    { label: 'Notification Type', type: 'select', options: ['In-App Badge', 'Email Digest', 'Urgent Alert'] },
    { label: 'Recipient Group', type: 'select', options: ['Admins', 'Sales Team', 'Account Managers'] },
    { label: 'Message Body', type: 'textarea' }
  ],
  'Add to List': [
    { label: 'Target List', type: 'select', options: ['Newsletter', 'VIP Clients', 'Churn Risk', 'New Signups'] },
    { label: 'Double Opt-in', type: 'toggle' }
  ],
  'Tag Contact': [
    { label: 'Tag Name', type: 'text', placeholder: 'e.g. "Warm Lead"' },
    { label: 'Action', type: 'select', options: ['Add Tag', 'Remove Tag'] },
    { label: 'Create if missing', type: 'toggle' }
  ],
  'Generate Invoice': [
    { label: 'Service Item', type: 'select', options: ['Retainer Fee', 'Consultation Hour', 'Setup Fee'] },
    { label: 'Due Date', type: 'select', options: ['Immediate', 'Net 15', 'Net 30'] },
    { label: 'Auto-Send', type: 'toggle' }
  ],
  'Create Project': [
    { label: 'Project Template', type: 'select', options: ['Web Dev Standard', 'Audit', 'Marketing Campaign'] },
    { label: 'Project Manager', type: 'select', options: ['Account Lead', 'Operations Manager'] },
    { label: 'Start Date', type: 'select', options: ['Today', 'Next Monday'] }
  ],

  // --- CONDITIONS ---
  'Check Field': [
    { label: 'Target Object', type: 'select', options: ['Contact', 'Company', 'Deal'] },
    { label: 'Field Name', type: 'select', options: ['Industry', 'Revenue', 'Job Title', 'City'] },
    { label: 'Operator', type: 'select', options: ['Equals', 'Contains', 'Greater Than', 'Is Empty'] },
    { label: 'Comparison Value', type: 'text' }
  ],
  'Has Tag': [
    { label: 'Tag Name', type: 'text', placeholder: 'e.g. "Enterprise"' },
    { label: 'Match Logic', type: 'select', options: ['Has Tag', 'Does Not Have Tag'] }
  ],
  'Deal Value': [
    { label: 'Operator', type: 'select', options: ['Greater Than', 'Less Than', 'Equals'] },
    { label: 'Amount', type: 'number', placeholder: '1000' },
    { label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] }
  ],
  'Ticket Priority': [
    { label: 'Is Priority', type: 'select', options: ['High', 'Critical'] },
    { label: 'Include Status', type: 'select', options: ['Open', 'Pending'] }
  ],
  'Previous Email': [
    { label: 'Campaign', type: 'select', options: ['Welcome Series', 'Q4 Promo'] },
    { label: 'Behavior', type: 'select', options: ['Opened', 'Clicked', 'Did Not Open'] }
  ],
  'A/B Split': [
    { label: 'Split Type', type: 'select', options: ['Random', 'Round Robin'] },
    { label: 'Path A Weight (%)', type: 'number', placeholder: '50' }
  ],

  // --- CONTROLS ---
  'Wait Delay': [
    { label: 'Duration', type: 'number', placeholder: '1' },
    { label: 'Unit', type: 'select', options: ['Minutes', 'Hours', 'Days'] },
    { label: 'Business Hours Only', type: 'toggle' }
  ],
  'Wait Until': [
    { label: 'Wait For', type: 'select', options: ['Specific Date', 'Day of Week', 'Time of Day'] },
    { label: 'Target Value', type: 'text', placeholder: 'e.g. Monday or 09:00' }
  ],
  'Manual Approval': [
    { label: 'Approver', type: 'select', options: ['Manager', 'Admin', 'Any Team Member'] },
    { label: 'Timeout Action', type: 'select', options: ['Proceed', 'Stop Flow', 'Skip Step'] },
    { label: 'Timeout Duration (Hours)', type: 'number', placeholder: '24' }
  ],
  'End Flow': [
    { label: 'Outcome Tag', type: 'select', options: ['Success', 'Failure', 'Neutral'] },
    { label: 'Log Completion', type: 'toggle' }
  ]
};

// --- Local Icons ---
function FileTextIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>; }

// --- Library (Internal AgencyOS Nodes) ---
const NODE_LIBRARY: Record<string, { label: string, icon: any, desc: string }[]> = {
  trigger: [
    { label: 'New Lead', icon: UserPlus, desc: 'Fires when a new contact is added to CRM.' },
    { label: 'Form Submission', icon: FileTextIcon, desc: 'Contact submits an internal AgencyOS form.' },
    { label: 'Email Interaction', icon: Mail, desc: 'Contact opens or clicks a marketing email.' },
    { label: 'Page Visit', icon: GlobeIcon, desc: 'Contact visits a tracked AgencyOS page.' },
    { label: 'Deal Stage Change', icon: LayersIcon, desc: 'Opportunity moves in the pipeline.' },
    { label: 'Ticket Created', icon: ShieldAlert, desc: 'New support ticket opened by client.' },
    { label: 'Invoice Paid', icon: DollarSign, desc: 'Client settles an invoice successfully.' },
    { label: 'Task Updated', icon: CheckSquare, desc: 'An internal task status changes.' },
    { label: 'Date Arrived', icon: Calendar, desc: 'Specific calendar milestone reached.' },
  ],
  action: [
    { label: 'Send Email', icon: Mail, desc: 'Dispatch a template or plain text.' },
    { label: 'Create Task', icon: CheckSquare, desc: 'Assign a task to an internal user.' },
    { label: 'Update Deal', icon: Briefcase, desc: 'Move or modify a CRM deal.' },
    { label: 'Notify Team', icon: Bell, desc: 'Send in-app alert to staff.' },
    { label: 'Add to List', icon: List, desc: 'Add contact to a marketing segment.' },
    { label: 'Tag Contact', icon: Tag, desc: 'Apply a segmentation tag.' },
    { label: 'Generate Invoice', icon: CreditCard, desc: 'Create and email a new invoice.' },
    { label: 'Create Project', icon: LayersIcon, desc: 'Initialize a new project board.' },
  ],
  condition: [
    { label: 'Check Field', icon: SearchIcon, desc: 'Check specific CRM property value.' },
    { label: 'Has Tag', icon: Tag, desc: 'Verify if contact has a specific tag.' },
    { label: 'Deal Value', icon: DollarSign, desc: 'Check opportunity monetary value.' },
    { label: 'Ticket Priority', icon: AlertTriangle, desc: 'Check support ticket urgency.' },
    { label: 'Previous Email', icon: Mail, desc: 'Check interaction with past campaign.' },
    { label: 'A/B Split', icon: Split, desc: 'Randomly split traffic flow.' },
  ],
  control: [
    { label: 'Wait Delay', icon: Clock, desc: 'Pause flow for set duration.' },
    { label: 'Wait Until', icon: Calendar, desc: 'Pause until specific time.' },
    { label: 'Manual Approval', icon: UserCheck, desc: 'Wait for staff confirmation.' },
    { label: 'End Flow', icon: StopCircle, desc: 'Terminate the automation path.' },
  ]
};

// Helper to resolve icon component from label/type
const getNodeIcon = (type: string, label: string) => {
    const group = NODE_LIBRARY[type];
    if (group) {
        const item = group.find(i => i.label === label);
        if (item) return item.icon;
    }
    return HelpCircle; // Fallback icon
};

// --- Mock Workflows (Updated to match new schema) ---
const WORKFLOWS_DATA: Record<string, WorkflowData> = {
  '1': {
    id: '1', name: 'Lead Qualification Protocol', status: 'Active', lastRun: '2m ago', stats: { active: 1240, executed: 45000 },
    nodes: [
      { id: 'n1', type: 'trigger', label: 'New Lead', x: 100, y: 300, status: 'active', config: { 'Source Channel': 'Web Form' } } as any,
      { id: 'n2', type: 'action', label: 'Create Task', x: 400, y: 300, status: 'active', config: { 'Task Title': 'Qualify Lead', 'Priority': 'High' } } as any,
      { id: 'n3', type: 'condition', label: 'Check Field', x: 700, y: 300, status: 'active', config: { 'Field Name': 'Industry', 'Comparison Value': 'Tech' } } as any,
      { id: 'n4', type: 'action', label: 'Send Email', x: 1000, y: 150, status: 'active', config: { 'Template': 'Tech Welcome' } } as any,
      { id: 'n5', type: 'action', label: 'Send Email', x: 1000, y: 450, status: 'waiting', config: { 'Template': 'General Welcome' } } as any,
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'Yes' },
      { id: 'e4', source: 'n3', target: 'n5', label: 'No' },
    ]
  },
  '2': {
    id: '2', name: 'Invoice Recovery System', status: 'Active', lastRun: '1h ago', stats: { active: 45, executed: 890 },
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Invoice Paid', x: 100, y: 300, status: 'active', config: { 'Minimum Amount': '1000' } } as any,
      { id: 'n2', type: 'action', label: 'Notify Team', x: 400, y: 300, status: 'active', config: { 'Message Body': 'High value payment received.' } } as any,
      { id: 'n3', type: 'action', label: 'Create Task', x: 700, y: 300, status: 'waiting', config: { 'Task Title': 'Send Thank You Gift' } } as any,
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ]
  },
};

const AutomationInterface: React.FC = () => {
  const navigate = useNavigate();
  
  // --- State ---
  const [activeFlowId, setActiveFlowId] = useState<string>('1');
  const [flows, setFlows] = useState<Record<string, WorkflowData>>(() => {
    const saved = localStorage.getItem('agencyos_automation_flows');
    return saved ? JSON.parse(saved) : WORKFLOWS_DATA;
  });
  
  // Editor State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // Connection State
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Selection & Inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [workflowSettingsOpen, setWorkflowSettingsOpen] = useState(false);
  
  // Simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimulationNodeId, setActiveSimulationNodeId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Library Modal
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] = useState<'trigger' | 'action' | 'condition' | 'control'>('trigger');
  const [librarySearch, setLibrarySearch] = useState('');

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeFlow = flows[activeFlowId] || { id: activeFlowId, name: 'Untitled Workflow', status: 'Draft', lastRun: 'Never', nodes: [], edges: [], stats: { active: 0, executed: 0 } };

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('agencyos_automation_flows', JSON.stringify(flows));
  }, [flows]);

  // --- Handlers ---

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePublish = () => {
    setFlows(prev => ({
        ...prev,
        [activeFlowId]: { ...prev[activeFlowId], status: 'Active' }
    }));
    showToast('Workflow Published & Live');
  };

  // Connection Handlers
  const handleConnectStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConnectingSourceId(nodeId);
    
    // Set initial mouse pos
    if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / scale;
        const y = (e.clientY - rect.top - pan.y) / scale;
        setMousePos({ x, y });
    }
  };

  const handleConnectEnd = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (connectingSourceId && connectingSourceId !== targetNodeId) {
        // Prevent duplicate edges
        const exists = activeFlow.edges.some(edge => edge.source === connectingSourceId && edge.target === targetNodeId);
        
        if (!exists) {
            const newEdge: FlowEdge = {
                id: `e-${Date.now()}`,
                source: connectingSourceId,
                target: targetNodeId
            };
            setFlows(prev => ({
                ...prev,
                [activeFlowId]: {
                    ...prev[activeFlowId],
                    edges: [...prev[activeFlowId].edges, newEdge]
                }
            }));
            showToast('Nodes Connected');
        }
    }
    setConnectingSourceId(null);
  };

  // Canvas Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only drag canvas if clicking directly on background
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setInspectorOpen(false);
    }
  };

  // Global Event Listeners for smooth dragging without glitches
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (connectingSourceId && canvasRef.current) {
         const rect = canvasRef.current.getBoundingClientRect();
         // Just use client coordinates relative to canvas for the line drawing logic inside svg
         // We need to calculate the end point in node-space to draw the line correctly
         const x = (e.clientX - rect.left - pan.x) / scale;
         const y = (e.clientY - rect.top - pan.y) / scale;
         setMousePos({ x, y });
      } else if (isDraggingCanvas) {
         setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      } else if (draggedNodeId) {
         const zoom = scale;
         setFlows(prev => ({
           ...prev,
           [activeFlowId]: {
             ...prev[activeFlowId],
             nodes: prev[activeFlowId].nodes.map(n => {
               if (n.id === draggedNodeId) {
                 return { ...n, x: n.x + e.movementX / zoom, y: n.y + e.movementY / zoom };
               }
               return n;
             })
           }
         }));
      }
    };

    const handleGlobalUp = () => {
       if (isDraggingCanvas) setIsDraggingCanvas(false);
       if (draggedNodeId) setDraggedNodeId(null);
       if (connectingSourceId) setConnectingSourceId(null); // Cancel connection if dropped on nothing
    };

    if (isDraggingCanvas || draggedNodeId || connectingSourceId) {
       window.addEventListener('mousemove', handleGlobalMove);
       window.addEventListener('mouseup', handleGlobalUp);
    }

    return () => {
       window.removeEventListener('mousemove', handleGlobalMove);
       window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isDraggingCanvas, draggedNodeId, connectingSourceId, dragStart, pan, scale, activeFlowId]);

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(2, Math.max(0.2, prev + delta)));
  };

  // Node Handlers
  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    setInspectorOpen(true);
  };

  const handleNodeDragStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggedNodeId(id);
  };

  const handleEdgeClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSelectedEdgeId(id);
      setSelectedNodeId(null);
  };

  // Config Update Handlers
  const updateNodeConfig = (key: string, value: any) => {
    setFlows(prev => ({
      ...prev,
      [activeFlowId]: {
        ...prev[activeFlowId],
        nodes: prev[activeFlowId].nodes.map(n => n.id === selectedNodeId ? { ...n, config: { ...n.config, [key]: value } } : n)
      }
    }));
  };
  
  const updateNodeLabel = (value: string) => {
    setFlows(prev => ({
      ...prev,
      [activeFlowId]: {
        ...prev[activeFlowId],
        nodes: prev[activeFlowId].nodes.map(n => n.id === selectedNodeId ? { ...n, label: value } : n)
      }
    }));
  };

  const deleteSelectedNode = () => {
    if (selectedNodeId) {
        setFlows(prev => ({
          ...prev,
          [activeFlowId]: {
            ...prev[activeFlowId],
            nodes: prev[activeFlowId].nodes.filter(n => n.id !== selectedNodeId),
            edges: prev[activeFlowId].edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId)
          }
        }));
        setSelectedNodeId(null);
        setInspectorOpen(false);
        showToast('Node Deleted');
    }
  };

  const deleteSelectedEdge = () => {
      if (selectedEdgeId) {
          setFlows(prev => ({
              ...prev,
              [activeFlowId]: {
                  ...prev[activeFlowId],
                  edges: prev[activeFlowId].edges.filter(e => e.id !== selectedEdgeId)
              }
          }));
          setSelectedEdgeId(null);
          showToast('Connection Removed');
      }
  };

  // Keyboard Listeners
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
              if (selectedNodeId) deleteSelectedNode();
              if (selectedEdgeId) deleteSelectedEdge();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId]);

  const openLibrary = (tab: 'trigger' | 'action' | 'condition' | 'control') => {
    setActiveLibraryTab(tab);
    setLibraryOpen(true);
    setLibrarySearch('');
  };

  const addNodeFromLibrary = (item: any) => {
    // Center the new node on screen based on current pan/zoom
    const canvasCenter = {
        x: (-pan.x + (canvasRef.current?.offsetWidth || 800) / 2) / scale,
        y: (-pan.y + (canvasRef.current?.offsetHeight || 600) / 2) / scale
    };

    const newNode: FlowNode = {
      id: `n-${Date.now()}`,
      type: activeLibraryTab,
      label: item.label,
      description: item.desc,
      x: canvasCenter.x - 100, // Offset to center the node box (approx)
      y: canvasCenter.y - 50,
      status: 'idle',
      config: {}
    };

    setFlows(prev => ({
      ...prev,
      [activeFlowId]: {
        ...prev[activeFlowId],
        nodes: [...prev[activeFlowId].nodes, newNode]
      }
    }));
    setLibraryOpen(false);
    setSelectedNodeId(newNode.id);
    setInspectorOpen(true);
    showToast('Node Added');
  };

  const createNewWorkflow = () => {
    const newId = Date.now().toString();
    const newFlow: WorkflowData = {
      id: newId,
      name: 'Untitled Workflow',
      status: 'Draft',
      lastRun: 'Never',
      nodes: [],
      edges: [],
      stats: { active: 0, executed: 0 }
    };
    setFlows(prev => ({ ...prev, [newId]: newFlow }));
    setActiveFlowId(newId);
    showToast('New Workflow Created');
  };

  const deleteActiveWorkflow = () => {
     if (!confirm("Are you sure you want to delete this workflow?")) return;
     const newFlows = { ...flows };
     delete newFlows[activeFlowId];
     const keys = Object.keys(newFlows);
     if (keys.length > 0) {
         setFlows(newFlows);
         setActiveFlowId(keys[0]);
     } else {
         createNewWorkflow();
     }
     setWorkflowSettingsOpen(false);
     showToast('Workflow Deleted');
  };

  // Simulation Logic (Traverse Graph)
  useEffect(() => {
    let timer: any;
    if (isSimulating) {
      // Find start nodes (triggers)
      const startNodes = activeFlow.nodes.filter(n => n.type === 'trigger');
      
      // Simple DFS Simulation for visual effect
      const queue = [...startNodes.map(n => n.id)];
      const visited = new Set<string>();
      const currentIndex = 0;

      // Reset any active states if restarting
      if (activeSimulationNodeId === null && startNodes.length > 0) {
          setActiveSimulationNodeId(startNodes[0].id);
      }

      timer = setInterval(() => {
         // Logic to move to next node
         if (activeSimulationNodeId) {
             const outboundEdges = activeFlow.edges.filter(e => e.source === activeSimulationNodeId);
             if (outboundEdges.length > 0) {
                 // Pick first edge for simple sim
                 setActiveSimulationNodeId(outboundEdges[0].target);
             } else {
                 // End of path, loop back to start or stop
                 if (startNodes.length > 0) setActiveSimulationNodeId(startNodes[0].id);
                 else setIsSimulating(false);
             }
         } else {
             if (startNodes.length > 0) setActiveSimulationNodeId(startNodes[0].id);
         }
      }, 1500);

    } else {
      setActiveSimulationNodeId(null);
    }
    return () => clearInterval(timer);
  }, [isSimulating, activeSimulationNodeId, activeFlow.nodes, activeFlow.edges]);

  const filteredLibraryNodes = useMemo(() => {
    const list = NODE_LIBRARY[activeLibraryTab] || [];
    if (!librarySearch) return list;
    return list.filter(n => n.label.toLowerCase().includes(librarySearch.toLowerCase()) || n.desc.toLowerCase().includes(librarySearch.toLowerCase()));
  }, [activeLibraryTab, librarySearch]);

  const selectedNode = useMemo(() => 
    activeFlow.nodes.find(n => n.id === selectedNodeId), 
    [activeFlow.nodes, selectedNodeId]
  );

  return (
    <div className="h-full bg-[#000000] text-white flex flex-col overflow-hidden font-sans relative">
      
      {/* Toast Notification */}
      {toast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900 border border-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-xs font-bold">{toast}</span>
          </div>
      )}

      {/* Top Bar */}
      <div className="h-16 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between px-6 shrink-0 z-20 relative">
         <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-600/10 rounded-lg border border-blue-600/20 text-blue-500">
               <Workflow size={20} />
            </div>
            <h1 className="font-black text-lg tracking-tight hidden md:block">Automation Studio</h1>
            <div className="h-4 w-px bg-zinc-800 hidden md:block" />
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
               <span className="hover:text-white cursor-pointer transition-colors">Workflows</span>
               <ChevronRight size={12} />
               <span className="text-white truncate max-w-[150px] md:max-w-none">{activeFlow.name}</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                    isSimulating ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border border-emerald-500/50'
                }`}
            >
               {isSimulating ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
               {isSimulating ? 'Running...' : 'Test Run'}
            </button>
            <div className="h-6 w-px bg-zinc-800 mx-1" />
            <button onClick={() => setWorkflowSettingsOpen(true)} className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-lg border border-zinc-800 transition-all"><SettingsIcon size={16}/></button>
            <button 
                onClick={handlePublish}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
            >
               Publish
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
         
         {/* Left Sidebar: Flows List */}
         <div className="w-72 border-r border-zinc-800 bg-[#050505] flex flex-col z-10 shrink-0 hidden lg:flex">
            <div className="p-4 border-b border-zinc-800 shrink-0">
               <div className="relative group">
                  <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500" />
                  <input className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600" placeholder="Search flows..." />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
               {(Object.values(flows) as WorkflowData[]).map(flow => (
                  <button 
                     key={flow.id}
                     onClick={() => { setActiveFlowId(flow.id); setPan({x:0,y:0}); setScale(1); }}
                     className={`w-full p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${activeFlowId === flow.id ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-transparent hover:bg-zinc-900/50 hover:border-zinc-800'}`}
                  >
                     <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                           flow.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                           flow.status === 'Paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                           'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}>{flow.status}</span>
                        <span className="text-[9px] font-mono text-zinc-600">{flow.lastRun}</span>
                     </div>
                     <h4 className={`text-sm font-bold mb-1 relative z-10 ${activeFlowId === flow.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{flow.name}</h4>
                     {activeFlowId === flow.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                  </button>
               ))}
               <button onClick={createNewWorkflow} className="w-full py-3 mt-2 border-2 border-dashed border-zinc-800 text-zinc-500 font-bold text-xs rounded-xl hover:text-white hover:border-zinc-700 transition-all">
                  + New Workflow
               </button>
            </div>
         </div>

         {/* Main Canvas Area */}
         <div 
            className="flex-1 relative bg-[#000000] overflow-hidden flex flex-col min-w-0"
         >
            {/* Floating Toolbar - Left (Library) */}
            <div className="absolute top-6 left-6 z-30 flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 rounded-2xl shadow-2xl">
               {[
                  { id: 'trigger', icon: GlobeIcon, label: 'Trigger', color: 'text-blue-500' },
                  { id: 'action', icon: Zap, label: 'Action', color: 'text-emerald-500' },
                  { id: 'condition', icon: GitBranch, label: 'Condition', color: 'text-amber-500' },
                  { id: 'control', icon: Clock, label: 'Control', color: 'text-zinc-400' },
               ].map(tool => (
                  <button 
                  key={tool.id}
                  onClick={() => openLibrary(tool.id as any)}
                  className="p-3 hover:bg-white/10 rounded-xl transition-all group relative flex items-center justify-center"
                  >
                     <tool.icon size={20} className={tool.color} />
                     <span className="absolute left-full ml-3 px-2 py-1 bg-black border border-zinc-800 rounded-md text-[10px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        Add {tool.label}
                     </span>
                  </button>
               ))}
            </div>

            {/* Floating Toolbar - Right (Zoom) */}
            <div className="absolute top-6 right-6 z-30 flex gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-1.5 rounded-xl shadow-2xl h-fit">
               <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"><ZoomIn size={16}/></button>
               <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"><ZoomOut size={16}/></button>
               <button onClick={() => { setScale(1); setPan({x:0,y:0}); }} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"><RotateCcw size={16}/></button>
            </div>

            {/* Canvas Container */}
            <div 
               ref={canvasRef}
               className="absolute inset-0 z-0 overflow-hidden cursor-grab active:cursor-grabbing canvas-bg"
               onMouseDown={handleCanvasMouseDown}
            >
               <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                     backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
                     backgroundSize: `${24 * scale}px ${24 * scale}px`,
                     backgroundPosition: `${pan.x}px ${pan.y}px`
                  }}
               />
               <div 
                  className="absolute left-0 top-0 w-full h-full origin-top-left pointer-events-none"
                  style={{
                     transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`
                  }}
               >
                  {/* Connection Edges */}
                  <svg className="absolute overflow-visible w-full h-full z-0 pointer-events-none">
                     {activeFlow.edges.map(edge => {
                        const source = activeFlow.nodes.find(n => n.id === edge.source);
                        const target = activeFlow.nodes.find(n => n.id === edge.target);
                        if (!source || !target) return null;
                        
                        const startX = source.x + 200; 
                        const startY = source.y + 40; // Approx handle height
                        const endX = target.x;
                        const endY = target.y + 40;

                        const cp1x = startX + (endX - startX) * 0.5;
                        const cp2x = endX - (endX - startX) * 0.5;
                        
                        const isSimulated = isSimulating && activeFlow.edges.find(e => e.source === activeSimulationNodeId && e.target === edge.target) === edge;

                        return (
                           <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={(e) => handleEdgeClick(e, edge.id)}>
                              <path 
                                 d={`M ${startX} ${startY} C ${cp1x} ${startY} ${cp2x} ${endY} ${endX} ${endY}`}
                                 fill="none"
                                 stroke={selectedEdgeId === edge.id ? '#3b82f6' : isSimulated ? '#10b981' : '#27272a'}
                                 strokeWidth={selectedEdgeId === edge.id || isSimulated ? "3" : "2"}
                                 className="transition-colors duration-300"
                              />
                              {isSimulated && (
                                <circle r="4" fill="#10b981">
                                   <animateMotion 
                                      dur="1s" 
                                      repeatCount="indefinite"
                                      path={`M ${startX} ${startY} C ${cp1x} ${startY} ${cp2x} ${endY} ${endX} ${endY}`}
                                   />
                                </circle>
                              )}
                              {edge.label && (
                                 <foreignObject x={(startX + endX) / 2 - 20} y={(startY + endY) / 2 - 10} width="40" height="20">
                                    <div className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-center font-bold text-zinc-400">
                                       {edge.label}
                                    </div>
                                 </foreignObject>
                              )}
                           </g>
                        );
                     })}
                     
                     {/* Temporary Connection Line */}
                     {connectingSourceId && (() => {
                        const source = activeFlow.nodes.find(n => n.id === connectingSourceId);
                        if (!source) return null;

                        const startX = source.x + 200;
                        const startY = source.y + 40;
                        // Transform mouse pos back to canvas coordinates is done in state, just use mousePos
                        const endX = mousePos.x;
                        const endY = mousePos.y;

                        const cp1x = startX + (endX - startX) * 0.5;
                        const cp2x = endX - (endX - startX) * 0.5;

                        return (
                           <path
                                d={`M ${startX} ${startY} C ${cp1x} ${startY} ${cp2x} ${endY} ${endX} ${endY}`}
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                fill="none"
                                className="animate-pulse pointer-events-none"
                           />
                        );
                     })()}
                  </svg>

                  {/* Automation Nodes */}
                  {activeFlow.nodes.map(node => {
                     const Icon = getNodeIcon(node.type, node.label);
                     return (
                     <div
                        key={node.id}
                        onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                        onClick={(e) => handleNodeClick(e, node.id)}
                        onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                        className={`absolute w-[200px] bg-[#0c0c0e] rounded-2xl border transition-all pointer-events-auto group hover:scale-105 shadow-2xl ${
                           selectedNodeId === node.id 
                           ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] z-50' 
                           : 'border-zinc-800 hover:border-zinc-600 z-10'
                        } ${activeSimulationNodeId === node.id ? 'ring-2 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}`}
                        style={{
                           transform: `translate(${node.x}px, ${node.y}px)`
                        }}
                     >
                        {/* Input Handle (Left) */}
                        <div
                            className="absolute left-[-6px] top-[40px] -translate-y-1/2 w-3 h-3 bg-zinc-900 border-2 border-zinc-500 rounded-full cursor-crosshair z-50 hover:scale-125 transition-transform hover:border-blue-500 hover:bg-blue-600"
                            onMouseUp={(e) => handleConnectEnd(e, node.id)}
                        />
                        {/* Output Handle (Right) */}
                        <div
                            className="absolute right-[-6px] top-[40px] -translate-y-1/2 w-3 h-3 bg-zinc-900 border-2 border-blue-500 rounded-full cursor-crosshair z-50 hover:scale-125 transition-transform hover:bg-blue-600"
                            onMouseDown={(e) => handleConnectStart(e, node.id)}
                        />
                        
                        <div className={`h-1.5 w-full rounded-t-2xl ${
                           node.type === 'trigger' ? 'bg-blue-600' :
                           node.type === 'condition' ? 'bg-amber-500' :
                           node.type === 'action' ? 'bg-emerald-500' : 'bg-zinc-500'
                        }`} />
                        <div className="p-4">
                           <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${
                                 node.type === 'trigger' ? 'bg-blue-900/20 text-blue-500' :
                                 node.type === 'condition' ? 'bg-amber-900/20 text-amber-500' :
                                 node.type === 'action' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                 <Icon size={16} />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{node.type}</p>
                                 <p className="text-sm font-bold text-white truncate">{node.label}</p>
                              </div>
                           </div>
                           <div className="space-y-1">
                              {Object.entries(node.config).slice(0, 2).map(([k, v]) => (
                                 <div key={k} className="flex justify-between text-[9px] text-zinc-400">
                                    <span className="capitalize">{k}:</span>
                                    <span className="font-mono text-zinc-300 max-w-[80px] truncate">{String(v)}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  )})}
               </div>
            </div>
            
            {/* Velocity Stats Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none flex items-end justify-center pb-8 z-20">
               <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-6 flex gap-12 pointer-events-auto shadow-2xl">
                  <div>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Execution Velocity</p>
                     <div className="h-12 w-48">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={Array.from({length: 20}, () => ({ v: Math.random() }))}>
                              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fill="rgba(59, 130, 246, 0.1)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  <div className="w-px bg-zinc-800" />
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Enrollments</p>
                     <p className="text-2xl font-black text-white">{activeFlow.stats.active}</p>
                     <p className="text-[9px] font-bold text-emerald-500">+12% vs last week</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Executed</p>
                     <p className="text-2xl font-black text-white">{activeFlow.stats.executed}</p>
                     <p className="text-[9px] font-bold text-zinc-500">Total Runs</p>
                  </div>
               </div>
            </div>
         </div>

         {/* --- Workflow Settings Modal --- */}
         {workflowSettingsOpen && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setWorkflowSettingsOpen(false)}>
                <div className="bg-[#0c0c0e] border border-zinc-800 p-8 rounded-3xl w-96 space-y-6" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-white">Workflow Settings</h3>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500">Name</label>
                        <input 
                            className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white outline-none"
                            value={activeFlow.name}
                            onChange={e => {
                                setFlows(prev => ({
                                    ...prev,
                                    [activeFlowId]: { ...prev[activeFlowId], name: e.target.value }
                                }));
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500">Status</label>
                        <select 
                            className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white outline-none"
                            value={activeFlow.status}
                            onChange={e => {
                                 setFlows(prev => ({
                                    ...prev,
                                    [activeFlowId]: { ...prev[activeFlowId], status: e.target.value as any }
                                }));
                            }}
                        >
                            <option>Active</option>
                            <option>Paused</option>
                            <option>Draft</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button 
                            onClick={deleteActiveWorkflow}
                            className="flex-1 py-3 bg-red-900/20 text-red-500 rounded-xl font-bold text-xs hover:bg-red-900/30 transition-colors"
                        >
                            Delete
                        </button>
                        <button onClick={() => setWorkflowSettingsOpen(false)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-500 transition-colors">Done</button>
                    </div>
                </div>
            </div>
         )}

         {/* --- Unique Research-Based Node Inspector --- */}
         {inspectorOpen && (
            <div className="w-96 border-l border-zinc-800 bg-[#0c0c0e] flex flex-col z-30 animate-in slide-in-from-right duration-300 shrink-0 shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0 bg-black/20">
                  <div className="flex items-center gap-3">
                     {selectedNode && (
                        <div className="text-blue-500">
                           {React.createElement(getNodeIcon(selectedNode.type, selectedNode.label), { size: 18 })}
                        </div>
                     )}
                     <h3 className="font-black text-sm uppercase tracking-widest text-white">Config Inspector</h3>
                  </div>
                  <button onClick={() => setInspectorOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all"><X size={16}/></button>
               </div>
               
               {selectedNode && (
                   <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Directive Label</label>
                            <div className="relative group">
                               <Edit3 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-blue-500 transition-colors" />
                               <input 
                                  value={selectedNode.label} 
                                  onChange={(e) => updateNodeLabel(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-sm font-black text-white outline-none focus:border-blue-600 transition-all" 
                               />
                            </div>
                         </div>
                         <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed italic">{selectedNode.description || 'Configure this node to establish protocol logic.'}</p>
                         </div>
                      </div>

                      {/* --- UNIQUE FIELDS SECTION --- */}
                      <div className="space-y-8">
                         <div className="flex items-center gap-3">
                            <div className="h-px bg-zinc-800 flex-1" />
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Protocol Parameters</span>
                            <div className="h-px bg-zinc-800 flex-1" />
                         </div>

                         <div className="space-y-6 animate-in fade-in duration-500">
                            {(() => {
                               const schema = NODE_CONFIG_SCHEMA[selectedNode.label] || [
                                 { label: 'Identifier', type: 'text', placeholder: 'Unique reference...' },
                                 { label: 'Priority', type: 'select', options: ['Low', 'Normal', 'Urgent'] },
                                 { label: 'Retry on Failure', type: 'toggle' }
                               ];

                               return schema.map((field, fIdx) => (
                                 <div key={fIdx} className="space-y-2.5">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{field.label}</label>
                                    
                                    {field.type === 'text' && (
                                       <input 
                                          className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600 focus:bg-black transition-all"
                                          value={selectedNode.config[field.label] || ''}
                                          onChange={(e) => updateNodeConfig(field.label, e.target.value)}
                                          placeholder={field.placeholder}
                                       />
                                    )}

                                    {field.type === 'number' && (
                                       <div className="relative">
                                          <input 
                                             type="number"
                                             className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-600 focus:bg-black transition-all"
                                             value={selectedNode.config[field.label] || ''}
                                             onChange={(e) => updateNodeConfig(field.label, e.target.value)}
                                             placeholder={field.placeholder}
                                          />
                                       </div>
                                    )}

                                    {field.type === 'select' && (
                                       <div className="relative group">
                                          <select 
                                             className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none appearance-none cursor-pointer focus:border-blue-600 focus:bg-black transition-all"
                                             value={selectedNode.config[field.label] || ''}
                                             onChange={(e) => updateNodeConfig(field.label, e.target.value)}
                                          >
                                             <option value="" disabled>Select option...</option>
                                             {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                          </select>
                                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-blue-500 pointer-events-none transition-transform" />
                                       </div>
                                    )}

                                    {field.type === 'textarea' && (
                                       <textarea 
                                          className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-600 focus:bg-black transition-all min-h-[100px] resize-none"
                                          value={selectedNode.config[field.label] || ''}
                                          onChange={(e) => updateNodeConfig(field.label, e.target.value)}
                                          placeholder={field.placeholder}
                                       />
                                    )}

                                    {field.type === 'toggle' && (
                                       <div 
                                          onClick={() => updateNodeConfig(field.label, !selectedNode.config[field.label])}
                                          className="flex items-center justify-between p-3.5 bg-black/20 border border-zinc-800 rounded-xl cursor-pointer hover:bg-black/40 transition-all group/toggle"
                                       >
                                          <span className="text-xs font-bold text-zinc-400 group-hover/toggle:text-zinc-200">Enabled</span>
                                          <div className={`w-10 h-5 rounded-full relative transition-colors ${selectedNode.config[field.label] ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                                             <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${selectedNode.config[field.label] ? 'left-6' : 'left-1'}`} />
                                          </div>
                                       </div>
                                    )}
                                 </div>
                               ));
                            })()}
                         </div>
                      </div>

                      {/* --- STATS SECTION --- */}
                      <div className="space-y-6 pt-10 border-t border-zinc-800">
                         <div className="flex items-center gap-3">
                            <div className="h-px bg-zinc-800 flex-1" />
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Operational Metrics</span>
                            <div className="h-px bg-zinc-800 flex-1" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] group hover:border-blue-500/20 transition-all">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Hits</p>
                               <p className="text-xl font-black text-white tabular-nums">4,291</p>
                            </div>
                            <div className={`p-4 bg-zinc-900 border border-zinc-800 rounded-[1.5rem] group hover:border-emerald-500/20 transition-all`}>
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Success Rate</p>
                               <p className="text-xl font-black text-emerald-500 tabular-nums">99.8%</p>
                            </div>
                         </div>
                      </div>
                   </div>
               )}

               {/* Inspector Footer Actions */}
               <div className="p-8 border-t border-zinc-800 bg-zinc-900/30 shrink-0 flex gap-4">
                  <button 
                     onClick={deleteSelectedNode} 
                     className="p-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl border border-rose-500/20 transition-all active:scale-95 group"
                     title="Terminate Node"
                  >
                     <Trash2 size={20} className="group-hover:rotate-6 transition-transform"/>
                  </button>
                  <button 
                     onClick={() => setInspectorOpen(false)}
                     className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                     <Save size={16} /> Commit Config
                  </button>
               </div>
            </div>
         )}
      </div>

      {/* --- Node Library Modal --- */}
      {libraryOpen && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setLibraryOpen(false)}>
             <div className="w-full max-w-4xl bg-[#0c0c0e] border border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                 <div className="p-8 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-black/20">
                    <h3 className="text-2xl font-black text-white tracking-tight">Logic Catalog</h3>
                    <button onClick={() => setLibraryOpen(false)} className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-all"><X size={24} /></button>
                 </div>
                 
                 <div className="flex h-full overflow-hidden">
                    {/* Category Tabs */}
                    <div className="w-64 border-r border-zinc-800 bg-[#050505] p-5 space-y-2 shrink-0">
                       {[
                          { id: 'trigger', label: 'Triggers', icon: GlobeIcon, color: 'text-blue-500' },
                          { id: 'action', label: 'Actions', icon: Zap, color: 'text-emerald-500' },
                          { id: 'condition', label: 'Logic', icon: GitBranch, color: 'text-amber-500' },
                          { id: 'control', label: 'Controls', icon: Clock, color: 'text-zinc-400' }
                       ].map(cat => (
                          <button 
                            key={cat.id} 
                            onClick={() => setActiveLibraryTab(cat.id as any)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeLibraryTab === cat.id ? 'bg-zinc-900 text-white shadow-lg shadow-blue-500/5' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}
                          >
                             <cat.icon size={16} className={cat.color} /> {cat.label}
                          </button>
                       ))}
                    </div>
                    
                    {/* Items Grid */}
                    <div className="flex-1 flex flex-col bg-[#0c0c0e]">
                       <div className="p-8 border-b border-zinc-800 bg-black/10">
                          <div className="relative group">
                             <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500" size={18} />
                             <input 
                                autoFocus
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-white outline-none focus:border-blue-600 transition-all placeholder:text-zinc-600"
                                placeholder={`Filter ${activeLibraryTab} protocols...`}
                                value={librarySearch}
                                onChange={e => setLibrarySearch(e.target.value)}
                             />
                          </div>
                       </div>
                       <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 lg:grid-cols-3 gap-5 content-start custom-scrollbar">
                          {filteredLibraryNodes.map((item, idx) => (
                             <button 
                                key={idx}
                                onClick={() => addNodeFromLibrary(item)}
                                className="flex flex-col items-start gap-4 p-6 bg-zinc-900/30 border border-zinc-800 rounded-[2rem] hover:bg-zinc-800 hover:border-blue-500/50 transition-all group text-left h-full shadow-lg hover:shadow-blue-500/5"
                             >
                                <div className={`p-3 rounded-2xl bg-black border border-zinc-800 group-hover:scale-110 group-hover:rotate-6 transition-all ${
                                   activeLibraryTab === 'trigger' ? 'text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' :
                                   activeLibraryTab === 'action' ? 'text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' :
                                   activeLibraryTab === 'condition' ? 'text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' :
                                   'text-zinc-400'
                                }`}>
                                   <item.icon size={22} />
                                </div>
                                <div>
                                   <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors mb-1 uppercase tracking-tight">{item.label}</h4>
                                   <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-tighter">{item.desc}</p>
                                </div>
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};

// --- Top Level Component with Lock Screen ---
const MarketingAutomation: React.FC = () => {
    const [hasAccess, setHasAccess] = useState(() => {
        return localStorage.getItem('agencyos_marketing_beta_access') === 'true';
    });
    const [accessCode, setAccessCode] = useState('');
    const [unlockError, setUnlockError] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setUnlockError(false);

        // Simulate network check for realism
        setTimeout(() => {
            if (accessCode === "AGENCIFYGLOBAL3468297FTEUHDH37") {
                setHasAccess(true);
                localStorage.setItem('agencyos_marketing_beta_access', 'true');
            } else {
                setUnlockError(true);
                setAccessCode('');
            }
            setIsVerifying(false);
        }, 1200);
    };

    if (!hasAccess) {
        return (
            <div className="h-full bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans selection:bg-purple-500/30">
                {/* Background Ambience */}
                <div className="absolute inset-0 pointer-events-none">
                     <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-900/10 rounded-full blur-[150px] animate-pulse" />
                     <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
                </div>

                <div className="relative z-10 max-w-lg w-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
                    
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-32 h-32 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center border border-zinc-800 shadow-2xl relative z-10">
                                <Hammer size={48} className="text-zinc-500" />
                            </div>
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce z-20 border-4 border-black">
                                <Construction size={20} className="text-white" />
                            </div>
                            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg z-20 border-4 border-black">
                                <Rocket size={20} className="text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full shadow-lg">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Beta Channel Locked</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                            Neural Architecture <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">In Progress.</span>
                        </h1>
                        <p className="text-zinc-500 font-medium text-sm md:text-base leading-relaxed max-w-md mx-auto">
                            This advanced automation suite is currently being trained on enterprise datasets. Access is restricted to verified beta partners.
                        </p>
                    </div>

                    <div className="bg-[#0c0c0e] border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl">
                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Early Access Code</label>
                                <div className="relative group">
                                    <input 
                                        type="password" 
                                        autoFocus
                                        placeholder="ENTER-SECURE-KEY"
                                        className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-center font-mono text-sm tracking-[0.2em] text-white outline-none focus:border-purple-600 transition-all placeholder:text-zinc-700"
                                        value={accessCode}
                                        onChange={(e) => { setAccessCode(e.target.value); setUnlockError(false); }}
                                    />
                                    {unlockError && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500 animate-in fade-in">
                                            <AlertCircle size={18} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={!accessCode || isVerifying}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isVerifying ? (
                                    <>Verifying <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /></>
                                ) : (
                                    <>Verify Access <ArrowRight size={14} strokeWidth={3} /></>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                        AgencyOS &bull; Restricted Protocol v4.2
                    </p>

                </div>
            </div>
        );
    }

    return <AutomationInterface />;
};

export default MarketingAutomation;
