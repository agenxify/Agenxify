
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

interface ReportData {
  revenueData: any[];
  expenseData: any[];
  cashFlowData: any[];
  teamLoadData: any[];
  projectHealth: any[];
  financials: {
    totalRevenue: number;
    outstanding: number;
    mrr: number;
    expenses: number;
    profitMargin: number;
  };
  ops: {
    activeProjects: number;
    utilization: number;
    satisfaction: number;
    clientConcentration: number;
  };
  aiInsights: { type: 'positive' | 'negative' | 'neutral', text: string }[];
}

export const useReports = (timeRange: string) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<ReportData>({
    revenueData: [],
    expenseData: [],
    cashFlowData: [],
    teamLoadData: [],
    projectHealth: [],
    financials: { totalRevenue: 0, outstanding: 0, mrr: 0, expenses: 0, profitMargin: 0 },
    ops: { activeProjects: 0, utilization: 0, satisfaction: 10, clientConcentration: 0 },
    aiInsights: []
  });
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    setLoading(true);
    
    try {
      // 1. Calculate Date Range
      const now = new Date();
      let startDate = new Date();
      if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
      if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
      if (timeRange === '90d') startDate.setDate(now.getDate() - 90);
      if (timeRange === 'YTD') startDate = new Date(now.getFullYear(), 0, 1);

      const isoStart = startDate.toISOString();

      // 2. Fetch Data in Parallel
      const [invoicesRes, timeRes, projectsRes, clientsRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('workspace_id', currentWorkspace.id).gte('date', isoStart),
        supabase.from('time_entries').select('*').eq('workspace_id', currentWorkspace.id).gte('date', isoStart),
        supabase.from('projects').select('*').eq('workspace_id', currentWorkspace.id), // Fetch active projects regardless of date
        supabase.from('clients').select('*').eq('workspace_id', currentWorkspace.id)
      ]);

      const invoices = invoicesRes.data || [];
      const timeEntries = timeRes.data || [];
      const projects = projectsRes.data || [];
      const clients = clientsRes.data || [];

      // --- FINANCIALS CALCULATION ---
      const totalRevenue = invoices
        .filter((i: any) => i.status === 'Paid')
        .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
      
      const outstanding = invoices
        .filter((i: any) => i.status === 'Pending' || i.status === 'Overdue')
        .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

      // Estimate Expenses: (Time Entries Duration * $50/hr Internal Cost)
      // This connects the Timesheets database to Financials
      let laborCost = 0;
      let totalHours = 0;
      let billableHours = 0;

      timeEntries.forEach((t: any) => {
          const match = t.duration.match(/(\d+)h\s*(\d+)m/);
          const hours = match ? parseInt(match[1]) + parseInt(match[2]) / 60 : 0;
          totalHours += hours;
          if (t.billable) billableHours += hours;
          laborCost += (hours * 50); // Internal rate assumption
      });

      // Simple MRR (approx 30% of revenue for demo logic)
      const mrr = totalRevenue * 0.3; 
      const profitMargin = totalRevenue > 0 ? Math.round(((totalRevenue - laborCost) / totalRevenue) * 100) : 0;

      // --- CHART DATA GENERATION ---
      // Bucket data by day or month based on range
      const bucketFormat = timeRange === 'YTD' || timeRange === '90d' ? 'month' : 'day';
      const chartMap = new Map<string, { revenue: number, expenses: number }>();

      // Populate Map with Dates
      const steps = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 12;
      for (let i = 0; i < steps; i++) {
          const d = new Date();
          if (bucketFormat === 'day') d.setDate(now.getDate() - (steps - 1 - i));
          else d.setMonth(now.getMonth() - (steps - 1 - i));
          
          const key = bucketFormat === 'day' 
             ? d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
             : d.toLocaleDateString('en-US', { month: 'short' });
          
          chartMap.set(key, { revenue: 0, expenses: 0 });
      }

      // Fill Revenue
      invoices.forEach((inv: any) => {
          if (inv.status !== 'Paid') return;
          const d = new Date(inv.date);
          const key = bucketFormat === 'day' 
             ? d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
             : d.toLocaleDateString('en-US', { month: 'short' });
          
          if (chartMap.has(key)) {
              const curr = chartMap.get(key)!;
              chartMap.set(key, { ...curr, revenue: curr.revenue + Number(inv.amount) });
          }
      });

      // Fill Expenses (Labor)
      timeEntries.forEach((t: any) => {
          const d = new Date(t.date);
          const key = bucketFormat === 'day' 
             ? d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
             : d.toLocaleDateString('en-US', { month: 'short' });

          const match = t.duration.match(/(\d+)h\s*(\d+)m/);
          const hours = match ? parseInt(match[1]) + parseInt(match[2]) / 60 : 0;
          const cost = hours * 50;

          if (chartMap.has(key)) {
              const curr = chartMap.get(key)!;
              chartMap.set(key, { ...curr, expenses: curr.expenses + cost });
          }
      });

      const revenueChartData = Array.from(chartMap.entries()).map(([name, val]) => ({
          name,
          revenue: val.revenue,
          expenses: val.expenses,
          profit: val.revenue - val.expenses,
          projected: val.revenue * 1.1 // Simple projection logic
      }));

      // Cash Flow (Cumulative)
      let cumulative = 0;
      const cashFlowData = revenueChartData.map(d => {
          cumulative += d.profit;
          return { ...d, net: d.profit, cumulative };
      });

      // --- OPS METRICS ---
      const activeProjects = projects.filter((p: any) => p.status === 'In Progress').length;
      
      // Calculate Team Load (group time entries by user)
      const userLoadMap = new Map<string, { billable: number, total: number }>();
      timeEntries.forEach((t: any) => {
          const user = t.user_name || 'Unknown';
          const match = t.duration.match(/(\d+)h\s*(\d+)m/);
          const hours = match ? parseInt(match[1]) + parseInt(match[2]) / 60 : 0;
          
          const curr = userLoadMap.get(user) || { billable: 0, total: 0 };
          userLoadMap.set(user, {
              billable: curr.billable + (t.billable ? hours : 0),
              total: curr.total + hours
          });
      });

      const teamLoadData = Array.from(userLoadMap.entries()).map(([name, val]) => ({
          name: name.split(' ')[0],
          load: Math.min(100, Math.round((val.total / 40) * 100)), // Assuming 40hr work week for range
          billable: Math.min(100, Math.round((val.billable / 40) * 100)),
          capacity: 100
      }));

      // Project Health (Mock logic using real project data)
      const projectHealth = projects.slice(0, 5).map((p: any) => ({
          name: p.title,
          health: p.progress,
          status: p.status === 'Completed' ? 'On Track' : p.progress > 80 ? 'Critical' : 'On Track',
          budget: p.budget > 0 ? Math.round((Math.random() * 100)) : 0 // Mock budget consumption if not tracked
      }));

      // Client Concentration
      const topClientRev = Object.values(
          invoices.filter((i: any) => i.status === 'Paid')
          .reduce((acc: any, curr: any) => {
              acc[curr.client] = (acc[curr.client] || 0) + Number(curr.amount);
              return acc;
          }, {})
      ).sort((a: any, b: any) => b - a)[0] as number || 0;
      
      const clientConcentration = totalRevenue > 0 ? Math.round((topClientRev / totalRevenue) * 100) : 0;

      // Expense Categories (Simulated breakdown of the calculated Labor Cost)
      const expenseData = [
          { name: 'Labor (Billable)', value: Math.round(laborCost * 0.7) },
          { name: 'Labor (Internal)', value: Math.round(laborCost * 0.3) },
          { name: 'Software', value: Math.round(laborCost * 0.1) }, // Mock overhead
          { name: 'Ops', value: Math.round(laborCost * 0.05) }
      ];

      // AI Insights Logic
      const insights: any[] = [];
      if (totalRevenue > laborCost) {
          insights.push({ type: 'positive', text: `Net Profit is healthy at ${profitMargin}%. Labor costs are well covered.` });
      } else {
          insights.push({ type: 'negative', text: `Expenses exceed revenue by $${Math.abs(totalRevenue - laborCost)}. Review billable hours.` });
      }
      
      if (outstanding > totalRevenue * 0.5) {
           insights.push({ type: 'negative', text: `High outstanding debt ($${outstanding}). Follow up with clients immediately.` });
      } else {
           insights.push({ type: 'neutral', text: `Collections are stable. Outstanding invoices are within safe limits.` });
      }

      if (teamLoadData.some(t => t.load > 90)) {
           insights.push({ type: 'neutral', text: 'Some team members are approaching max capacity. Consider redistributing tasks.' });
      }

      setData({
        revenueData: revenueChartData,
        expenseData,
        cashFlowData,
        teamLoadData,
        projectHealth,
        financials: {
            totalRevenue,
            outstanding,
            mrr,
            expenses: laborCost,
            profitMargin
        },
        ops: {
            activeProjects,
            utilization: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
            satisfaction: 9.4, // Static for now
            clientConcentration
        },
        aiInsights: insights
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
      fetchReports();
      
      // Subscribe to changes in relevant tables
      const channels = [
          supabase.channel('rep_inv').on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchReports).subscribe(),
          supabase.channel('rep_time').on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, fetchReports).subscribe(),
      ];
      
      return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [fetchReports]);

  return { ...data, loading, refresh: fetchReports };
};
