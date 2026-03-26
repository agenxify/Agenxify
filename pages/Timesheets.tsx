import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Clock,
  Play,
  Square,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  User,
  Plus,
  Download,
  BarChart3,
  TrendingUp,
  ChevronDown,
  X,
  CheckCircle2,
  Zap,
  Briefcase,
  Trash2,
  Edit3,
  Save,
  FileText,
  History,
  ArrowUpRight,
  MousePointer2,
  Tag,
  LifeBuoy,
  DollarSign,
  PieChart,
  Activity,
  Globe,
  ShieldCheck,
  AlertCircle,
  Hash,
  Layers,
  Check,
  Copy,
  LayoutGrid,
  List,
  Users,
  Command,
  CalendarDays,
  Loader2,
  Settings,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
} from "recharts";
import { Request, Ticket, TimeEntry, Profile } from "../types";
import { MOCK_PROFILES, MOCK_PROJECTS, MOCK_REQUESTS } from "../constants";
import * as ReactRouterDom from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useTimesheets } from "../hooks/useTimesheets.ts";
import { useCurrency } from "../context/CurrencyContext.tsx";
import { useRequests } from "../hooks/useRequests.ts";
import { useTickets } from "../hooks/useTickets.ts";
import { useSystemData } from "../hooks/useSystemData.ts";
import { supabase } from "../supabase.ts";

const { Link } = ReactRouterDom as any;

// Custom Dropdown for Timesheets
const CustomDropdown = ({
  value,
  options,
  onChange,
  placeholder,
  icon: Icon,
  className = "",
}: {
  value: string;
  options: { label: string; value: string; group?: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: any;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-zinc-400 outline-none transition-all min-w-[140px]"
      >
        <div className="flex items-center gap-2 truncate max-w-[150px]">
          {Icon && (
            <Icon size={14} className="text-slate-400 dark:text-zinc-500" />
          )}
          <span>{selected?.label || value || placeholder}</span>
        </div>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar p-1 animate-in zoom-in-95 duration-200 min-w-[200px]">
          {options.map((opt, idx) => (
            <React.Fragment key={idx}>
              {idx === 0 || options[idx - 1].group !== opt.group ? (
                <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest bg-slate-50 dark:bg-zinc-950/50 mt-1 mb-0.5 rounded sticky top-0">
                  {opt.group || "General"}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between mb-0.5 ${
                  value === opt.value
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <Check size={12} strokeWidth={3} />}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const Timesheets: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "owner";

  // Hooks
  const { entries, loading, addEntry, updateEntry, deleteEntry } =
    useTimesheets();
  const { format } = useCurrency();
  const { requests, updateRequest } = useRequests();
  const { tickets, updateTicket } = useTickets();
  const { projects, refresh: refreshSystemData } = useSystemData();

  const TIMER_STORAGE_KEY = "agencyos_active_timer_v2";

  const [globalConfig, setGlobalConfig] = useState(() => {
    const saved = localStorage.getItem("agencyos_global_config");
    return saved
      ? JSON.parse(saved)
      : { timeIncrement: 15, defaultBillable: true, currency: "USD" };
  });

  // --- Timer State ---
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // --- UI State ---
  const [viewMode, setViewMode] = useState<"List" | "Calendar">("List");
  const [groupBy, setGroupBy] = useState<"Date" | "Project">("Date");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set(),
  );
  const [toast, setToast] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    task: "",
    project: "",
    hours: 0,
    minutes: 15,
    date: new Date().toISOString().split("T")[0],
    billable: true,
  });

  // Quick Add Form State
  const [quickTask, setQuickTask] = useState("");
  const [quickProject, setQuickProject] = useState("");
  const [quickBillable, setQuickBillable] = useState(
    globalConfig.defaultBillable,
  );

  // --- Effects ---
  useEffect(() => {
    const handleConfigUpdate = (e: any) => {
      if (e.detail) setGlobalConfig(e.detail);
    };
    window.addEventListener("agencyos_config_updated", handleConfigUpdate);
    return () => {
      window.removeEventListener("agencyos_config_updated", handleConfigUpdate);
    };
  }, []);

  // Load Timer State
  useEffect(() => {
    const savedTimer = localStorage.getItem(TIMER_STORAGE_KEY);
    if (savedTimer) {
      const { start, task, project, billable } = JSON.parse(savedTimer);
      setTimerStart(start);
      setQuickTask(task);
      setQuickProject(project);
      setQuickBillable(billable);
      setIsTimerActive(true);
    }
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: any;
    if (isTimerActive && timerStart) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - timerStart) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerStart]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleTimer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTimerActive, quickTask, quickProject]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to resolve reference IDs from name
  const resolveRef = (name: string) => {
    const req = requests.find((r) => r.title === name);
    if (req) return { type: "Mission", id: req.id };

    const tick = tickets.find((t) => t.subject === name);
    if (tick) return { type: "Ticket", id: tick.id };

    return { type: "Internal", id: "" };
  };

  const getEntryRate = (entry: Partial<TimeEntry>) => {
    if (entry.hourlyRate !== undefined && entry.hourlyRate !== null)
      return entry.hourlyRate;

    if (entry.refType === "Mission") {
      const req = requests.find((r) => r.id === entry.refId);
      if (req?.hourlyRate !== undefined && req.hourlyRate !== null)
        return req.hourlyRate;
      if (req?.project) {
        const proj = projects.find((p) => p.title === req.project);
        if (proj?.hourlyRate !== undefined && proj.hourlyRate !== null)
          return proj.hourlyRate;
      }
    } else if (entry.refType === "Ticket") {
      const tick = tickets.find((t) => t.id === entry.refId);
      if (tick?.hourlyRate !== undefined && tick.hourlyRate !== null)
        return tick.hourlyRate;
    }

    return 150; // Default fallback
  };

  // --- Timer Logic ---
  const toggleTimer = () => {
    if (isTimerActive) {
      // Stop Timer
      if (!timerStart) return;
      const durationSeconds = Math.floor((Date.now() - timerStart) / 1000);

      const h = Math.floor(durationSeconds / 3600);
      const m = Math.floor((durationSeconds % 3600) / 60);
      const durationStr = `${h}h ${m}m`;

      const refInfo = resolveRef(quickProject);

      const newEntry: TimeEntry = {
        id: "", // hook handles ID
        task: quickTask || "Untitled Session",
        project: quickProject || "General",
        duration: durationStr,
        date: new Date().toISOString().split("T")[0],
        user: currentUser?.name || "User",
        refType: refInfo.type as any,
        refId: refInfo.id,
        billable: quickBillable,
      };

      newEntry.hourlyRate = getEntryRate(newEntry);

      addEntry(newEntry);
      setIsTimerActive(false);
      setTimerStart(null);
      localStorage.removeItem(TIMER_STORAGE_KEY);
      setQuickTask("");
      showToast("Time Logged Successfully");
    } else {
      // Start Timer
      const start = Date.now();
      setTimerStart(start);
      setIsTimerActive(true);
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({
          start,
          task: quickTask,
          project: quickProject,
          billable: quickBillable,
        }),
      );
    }
  };

  const handleManualAdd = () => {
    // Calculate default duration based on preferences
    const defaultMins = globalConfig.timeIncrement || 15;
    const h = Math.floor(defaultMins / 60);
    const m = defaultMins % 60;

    setManualForm({
      task: quickTask,
      project: quickProject,
      hours: h,
      minutes: m,
      date: new Date().toISOString().split("T")[0],
      billable: quickBillable,
    });
    setIsManualModalOpen(true);
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.task) return showToast("Description required");

    const refInfo = resolveRef(manualForm.project);

    const newEntry: TimeEntry = {
      id: "",
      task: manualForm.task,
      project: manualForm.project || "General",
      duration: `${manualForm.hours}h ${manualForm.minutes}m`,
      date: manualForm.date,
      user: currentUser?.name || "User",
      refType: refInfo.type as any,
      refId: refInfo.id,
      billable: manualForm.billable,
    };

    newEntry.hourlyRate = getEntryRate(newEntry);

    addEntry(newEntry);
    setQuickTask("");
    setIsManualModalOpen(false);
    showToast("Entry Added");
  };

  const handleDuplicate = (entry: TimeEntry) => {
    const newEntry = { ...entry, id: "" };
    newEntry.hourlyRate = getEntryRate(newEntry);
    addEntry(newEntry);
    showToast("Entry Duplicated");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Remove this entry?")) {
      deleteEntry(id);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedEntries.size} entries?`)) {
      selectedEntries.forEach((id) => deleteEntry(id));
      setSelectedEntries(new Set());
      showToast("Bulk Delete Complete");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Project",
      "Task",
      "Duration",
      "User",
      "Billable",
      "Hourly Rate",
      "Total Wage",
    ];
    const rows = entries.map((e) => {
      let totalWage = 0;
      const rate = getEntryRate(e);
      const match = e.duration.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        const hours = parseInt(match[1]) + parseInt(match[2]) / 60;
        totalWage = hours * rate;
      }
      return [
        e.date,
        e.project,
        e.task,
        e.duration,
        e.user,
        e.billable ? "Yes" : "No",
        rate || "",
        totalWage ? totalWage.toFixed(2) : "",
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `timesheet_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    showToast("Export Downloaded");
  };

  // --- Formatting & Derived State ---
  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(
      (e) =>
        e.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.project.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [entries, searchTerm]);

  const stats = useMemo(() => {
    let totalMins = 0;
    let billableMins = 0;
    let billableValue = 0;

    entries.forEach((e) => {
      const match = e.duration.match(/(\d+)h\s*(\d+)m/);
      if (match) {
        const mins = parseInt(match[1]) * 60 + parseInt(match[2]);
        totalMins += mins;
        if (e.billable) {
          billableMins += mins;
          const rate = getEntryRate(e);
          billableValue += (mins / 60) * rate;
        }
      }
    });

    const utilization =
      totalMins > 0 ? Math.round((billableMins / totalMins) * 100) : 0;
    const totalHours = (totalMins / 60).toFixed(1);

    return { totalHours, utilization, billableValue };
  }, [entries, requests, tickets, projects]);

  // Activity Rhythm Chart Data (Requests + Tickets + Entries)
  const activityData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    // Initialize last 7 days bucket
    const data = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        dateStr: d.toLocaleDateString(),
        items: 0,
      };
    });

    // Helper to check same day
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    // 1. Count Requests
    requests.forEach((r) => {
      const parsedDate = new Date(r.updatedAt);
      const validDate = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

      data.forEach((day) => {
        const bucketDate = new Date(today);
        bucketDate.setDate(today.getDate() - (6 - data.indexOf(day)));
        if (isSameDay(validDate, bucketDate)) {
          day.items += 1;
        }
      });
    });

    // 2. Count Tickets
    tickets.forEach((t) => {
      let validDate = new Date();
      if (t.date.includes("Yesterday"))
        validDate.setDate(validDate.getDate() - 1);
      else if (t.date.match(/\d+\/\d+\/\d+/)) validDate = new Date(t.date);

      data.forEach((day) => {
        const bucketDate = new Date(today);
        bucketDate.setDate(today.getDate() - (6 - data.indexOf(day)));
        if (isSameDay(validDate, bucketDate)) {
          day.items += 1;
        }
      });
    });

    return data;
  }, [requests, tickets, entries]);

  // Grouping Logic
  const groupedEntries = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        const key =
          groupBy === "Project" ? entry.project || "Unassigned" : entry.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      },
      {} as Record<string, TimeEntry[]>,
    );
  }, [filteredEntries, groupBy]);

  const projectOptions = useMemo(() => {
    const list = [
      ...requests.map((r) => ({
        label: r.title,
        value: r.title,
        group: "Missions",
      })),
      ...tickets.map((t) => ({
        label: t.subject,
        value: t.subject,
        group: "Tickets",
      })),
    ];
    return list;
  }, [requests, tickets]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0e]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-40 transition-colors">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10002] bg-slate-900 dark:bg-zinc-800 text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-4 border border-white/10">
          <CheckCircle2 size={18} className="text-emerald-400" /> {toast}
        </div>
      )}

      {/* --- STATS HEADER & CHART --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Stats */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group border border-slate-800 dark:border-zinc-800 flex flex-col justify-between">
            <div className="absolute right-[-20%] top-[-20%] opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Zap size={140} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
              Weekly Output
            </p>
            <h3 className="text-5xl font-black">
              {stats.totalHours} <span className="text-xl opacity-50">Hrs</span>
            </h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-[-12deg] group-hover:scale-110 transition-transform">
              <DollarSign size={120} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Billable Value
            </p>
            <h3 className="text-4xl font-black text-blue-600 dark:text-blue-400">
              {format(stats.billableValue)}
            </h3>
          </div>

          {isAdmin ? (
            <div
              onClick={() => setIsRatesModalOpen(true)}
              className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all relative overflow-hidden cursor-pointer hover:border-blue-500/50"
            >
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-[12deg] group-hover:scale-110 transition-transform">
                <Settings size={120} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Rates & Wages
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-auto">
                Manage Rates
              </h3>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-[12deg] group-hover:scale-110 transition-transform">
                <Activity size={120} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Utilization Rate
              </p>
              <h3 className="text-4xl font-black text-emerald-500 dark:text-emerald-400">
                {stats.utilization}%
              </h3>
            </div>
          )}
        </div>

        {/* Right Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" /> Activity Rhythm
            </h4>
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Reqs + Tickets
            </span>
          </div>
          <div className="flex-1 w-full min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={globalConfig.theme === "dark" ? "#27272a" : "#e2e8f0"}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: globalConfig.theme === "dark" ? "#71717a" : "#94a3b8",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: globalConfig.theme === "dark" ? "#71717a" : "#94a3b8",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar
                  dataKey="items"
                  fill="#6366f1"
                  radius={[4, 4, 4, 4]}
                  barSize={16}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "12px",
                    background: "#09090b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- FLOATING TIMER BAR --- */}
      <div className="sticky top-4 z-30">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-2 rounded-[2.5rem] border border-slate-200/50 dark:border-zinc-700/50 shadow-2xl flex flex-col md:flex-row items-center gap-2 transition-all hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:border-blue-200 dark:hover:border-blue-900/50">
          <div className="flex-1 flex items-center gap-4 w-full px-6 py-2">
            <div
              className={`p-3 rounded-2xl transition-colors ${isTimerActive ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}
            >
              <Clock size={20} />
            </div>
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <input
                type="text"
                placeholder="What are you working on?"
                className="flex-1 bg-transparent text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none min-w-0"
                value={quickTask}
                onChange={(e) => setQuickTask(e.target.value)}
                disabled={isTimerActive}
              />
              <div className="flex items-center gap-2 shrink-0">
                {/* Compact Styled Project Dropdown */}
                <div className="w-[180px]">
                  <CustomDropdown
                    value={quickProject}
                    options={projectOptions}
                    onChange={setQuickProject}
                    placeholder="Select Project"
                    icon={Briefcase}
                    className="z-50"
                  />
                </div>

                {/* Styled Billable Toggle */}
                <button
                  onClick={() => setQuickBillable(!quickBillable)}
                  disabled={isTimerActive}
                  className={`h-[44px] px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border-2 ${
                    quickBillable
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 border-transparent hover:bg-slate-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <DollarSign size={14} />
                  {quickBillable ? "Billable" : "Non-Billable"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto p-1 pr-1.5">
            {isTimerActive && (
              <div className="px-6 font-mono text-2xl font-black text-slate-900 dark:text-white tracking-widest tabular-nums">
                {formatSeconds(elapsed)}
              </div>
            )}

            {!isTimerActive && (
              <button
                onClick={handleManualAdd}
                className="hidden md:flex px-6 py-4 rounded-[2rem] font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Add Manual
              </button>
            )}

            <button
              onClick={toggleTimer}
              className={`h-14 px-8 rounded-[2rem] flex items-center gap-3 font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 ${
                isTimerActive
                  ? "bg-rose-500 text-white shadow-rose-500/30"
                  : "bg-blue-600 text-white shadow-blue-500/30"
              }`}
            >
              {isTimerActive ? (
                <>
                  Stop <Square fill="currentColor" size={14} />
                </>
              ) : (
                <>
                  Start <Play fill="currentColor" size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="space-y-6">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-2">
          {/* View Switcher: Improved Visibility with Primary Color */}
          <div className="flex bg-white dark:bg-zinc-900 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm">
            <button
              onClick={() => setGroupBy("Date")}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                groupBy === "Date"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              }`}
            >
              By Date
            </button>
            <button
              onClick={() => setGroupBy("Project")}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                groupBy === "Project"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              }`}
            >
              By Project
            </button>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="relative group max-w-md w-full">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search logs..."
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[1.5rem] text-sm font-bold text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[1.2rem] text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              title="Export CSV"
            >
              <Download size={20} />
            </button>
            {selectedEntries.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-5 py-3.5 bg-rose-50 text-rose-600 rounded-[1.2rem] text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2 shadow-sm"
              >
                <Trash2 size={16} /> Delete ({selectedEntries.size})
              </button>
            )}
          </div>
        </div>

        {/* Time Entries Feed */}
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(
            ([group, groupEntries]: [string, TimeEntry[]]) => (
              <div
                key={group}
                className="animate-in fade-in slide-in-from-bottom-4"
              >
                <div className="flex items-center gap-4 mb-4 px-4">
                  <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-1" />
                  <span className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest bg-slate-50 dark:bg-black px-4 py-1 rounded-full border border-slate-200 dark:border-zinc-800">
                    {groupBy === "Date" ? (
                      <>
                        <CalendarDays
                          size={12}
                          className="inline mr-2 mb-0.5"
                        />{" "}
                        {new Date(group).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </>
                    ) : (
                      <>
                        <Layers size={12} className="inline mr-2 mb-0.5" />{" "}
                        {group}
                      </>
                    )}
                    <span className="ml-2 text-slate-300 dark:text-zinc-700">
                      • {groupEntries.length} entries
                    </span>
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-1" />
                </div>

                <div className="grid gap-3">
                  {groupEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`group relative bg-white dark:bg-zinc-900 p-5 rounded-[1.75rem] border transition-all flex items-center gap-5 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 ${selectedEntries.has(entry.id) ? "border-blue-500 bg-blue-50/10" : "border-slate-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800"}`}
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-blue-600 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          checked={selectedEntries.has(entry.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedEntries);
                            if (e.target.checked) newSet.add(entry.id);
                            else newSet.delete(entry.id);
                            setSelectedEntries(newSet);
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">
                          {entry.task}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            {entry.project}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 dark:text-zinc-600 flex items-center gap-1">
                            <User size={10} /> {entry.user}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => {
                            updateEntry(entry.id, {
                              billable: !entry.billable,
                            });
                          }}
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors border ${
                            entry.billable
                              ? "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30"
                              : "text-slate-400 bg-slate-50 border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500"
                          }`}
                        >
                          {entry.billable ? "Billable" : "Non-Billable"}
                        </button>

                        <div className="flex flex-col items-end w-24">
                          <div className="font-mono text-lg font-black text-slate-900 dark:text-white text-right">
                            {entry.duration}
                          </div>
                          {isAdmin && entry.billable && (
                            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {(() => {
                                const rate = getEntryRate(entry);
                                const match =
                                  entry.duration.match(/(\d+)h\s*(\d+)m/);
                                if (match) {
                                  const hours =
                                    parseInt(match[1]) +
                                    parseInt(match[2]) / 60;
                                  return `$${(hours * rate).toFixed(2)}`;
                                }
                                return "";
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={() => handleDuplicate(entry)}
                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-xl transition-all"
                            title="Duplicate"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}

          {filteredEntries.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
              <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 dark:text-zinc-700">
                <Clock size={48} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                No Entries Found
              </h3>
              <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-widest">
                Adjust filters or start the timer
              </p>
            </div>
          )}
        </div>
      </div>

      {isManualModalOpen && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsManualModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-slate-100 dark:border-zinc-800 p-8 md:p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Log Manual Entry
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveManual} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Task Description
                </label>
                <input
                  autoFocus
                  type="text"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                  placeholder="What did you work on?"
                  value={manualForm.task}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, task: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Project / Context
                </label>
                <CustomDropdown
                  value={manualForm.project}
                  options={projectOptions}
                  onChange={(val) =>
                    setManualForm({ ...manualForm, project: val })
                  }
                  placeholder="Select Context"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    Duration
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white text-center"
                        value={manualForm.hours}
                        onChange={(e) =>
                          setManualForm({
                            ...manualForm,
                            hours: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                        H
                      </span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white text-center"
                        value={manualForm.minutes}
                        onChange={(e) =>
                          setManualForm({
                            ...manualForm,
                            minutes: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                        M
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                    value={manualForm.date}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setManualForm({
                      ...manualForm,
                      billable: !manualForm.billable,
                    })
                  }
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${manualForm.billable ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500"}`}
                >
                  <DollarSign size={16} />{" "}
                  {manualForm.billable ? "Billable Entry" : "Non-Billable"}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Save Time Log
              </button>
            </form>
          </div>
        </div>
      )}
      {isRatesModalOpen && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsRatesModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-100 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Rates & Wages
                </h3>
                <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-widest">
                  Set custom hourly rates per project or request
                </p>
              </div>
              <button
                onClick={() => setIsRatesModalOpen(false)}
                className="p-3 bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Projects */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Briefcase size={14} /> Projects
                </h4>
                <div className="grid gap-3">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-100 dark:border-zinc-800"
                    >
                      <span className="font-bold text-slate-900 dark:text-white">
                        {p.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">
                          Rate/hr:
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            className="w-24 pl-6 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            defaultValue={p.hourlyRate || ""}
                            onBlur={async (e) => {
                              const val = parseFloat(e.target.value);
                              const rate = isNaN(val) ? null : val;
                              if (rate !== p.hourlyRate) {
                                const { error } = await supabase
                                  .from("projects")
                                  .update({ hourly_rate: rate })
                                  .eq("id", p.id);
                                if (!error) refreshSystemData();
                              }
                            }}
                            placeholder="Default"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requests */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers size={14} /> Requests (Missions)
                </h4>
                <div className="grid gap-3">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-100 dark:border-zinc-800"
                    >
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">
                          Rate/hr:
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            className="w-24 pl-6 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            defaultValue={r.hourlyRate || ""}
                            onBlur={async (e) => {
                              const val = parseFloat(e.target.value);
                              const rate = isNaN(val) ? null : val;
                              if (rate !== r.hourlyRate) {
                                updateRequest(r.id, {
                                  hourlyRate: rate as any,
                                });
                              }
                            }}
                            placeholder="Default"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tickets */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Tag size={14} /> Tickets
                </h4>
                <div className="grid gap-3">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-100 dark:border-zinc-800"
                    >
                      <span className="font-bold text-slate-900 dark:text-white">
                        {t.subject}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">
                          Rate/hr:
                        </span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            className="w-24 pl-6 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            defaultValue={t.hourlyRate || ""}
                            onBlur={async (e) => {
                              const val = parseFloat(e.target.value);
                              const rate = isNaN(val) ? null : val;
                              if (rate !== t.hourlyRate) {
                                updateTicket(t.id, { hourlyRate: rate as any });
                              }
                            }}
                            placeholder="Default"
                          />
                        </div>
                      </div>
                    </div>
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

export default Timesheets;
