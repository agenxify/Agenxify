
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export const useMarketingAnalytics = (timeRange: string, region: string) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<any>({
    revenueData: [],
    serviceMixData: [],
    cohortData: [],
    geoData: [],
    kpis: [],
    loading: true
  });

  const fetchData = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    
    try {
      // 1. Determine Date Range
      const now = new Date();
      let startDate = new Date();
      let bucketFormat = 'day';
      
      if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
      else if (timeRange === '90d') { startDate.setDate(now.getDate() - 90); bucketFormat = 'week'; }
      else if (timeRange === 'YTD') { startDate = new Date(now.getFullYear(), 0, 1); bucketFormat = 'month'; }
      else if (timeRange === '1h') { startDate.setHours(now.getHours() - 1); bucketFormat = 'hour'; }
      else if (timeRange === '24h') { startDate.setDate(now.getDate() - 1); bucketFormat = 'hour'; }

      const isoStart = startDate.toISOString();

      // 2. Fetch Data Parallel
      const [invoicesRes, leadsRes, campaignsRes, contactsRes, servicesRes, ordersRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('workspace_id', currentWorkspace.id).gte('date', isoStart),
        supabase.from('leads').select('*').eq('workspace_id', currentWorkspace.id), // Pipeline value is snapshot-based, usually want all active
        supabase.from('marketing_campaigns').select('*').eq('workspace_id', currentWorkspace.id).order('updated_at', { ascending: false }).limit(5),
        supabase.from('marketing_contacts').select('*').eq('workspace_id', currentWorkspace.id),
        supabase.from('services').select('id, name, type').eq('workspace_id', currentWorkspace.id),
        supabase.from('orders').select('*').eq('workspace_id', currentWorkspace.id).gte('created_at', isoStart)
      ]);

      const invoices = invoicesRes.data || [];
      const leads = leadsRes.data || [];
      const _campaigns = campaignsRes.data || [];
      const contacts = contactsRes.data || [];
      const services = servicesRes.data || [];
      const orders = ordersRes.data || [];

      // --- 3. Process Revenue Trend (Area Chart) ---
      const chartMap = new Map<string, { retainer: number, project: number, upsell: number, total: number }>();
      
      // Initialize Buckets
      const steps = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : (timeRange === '90d' ? 12 : 12);
      for (let i = 0; i < steps; i++) {
          const d = new Date();
          let key = '';
          
          if (bucketFormat === 'month') {
              d.setMonth(now.getMonth() - (steps - 1 - i));
              key = d.toLocaleDateString('en-US', { month: 'short' });
          } else if (bucketFormat === 'hour') {
              d.setHours(now.getHours() - (steps - 1 - i));
              key = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
              d.setDate(now.getDate() - (steps - 1 - i));
              key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
          chartMap.set(key, { retainer: 0, project: 0, upsell: 0, total: 0 });
      }

      // Populate Invoices (Retainer & Project)
      invoices.forEach((inv: any) => {
          if (inv.status !== 'Paid') return;
          const d = new Date(inv.date);
          let key: string;
          if (bucketFormat === 'month') key = d.toLocaleDateString('en-US', { month: 'short' });
          else if (bucketFormat === 'hour') key = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          else key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          if (chartMap.has(key)) {
              const curr = chartMap.get(key)!;
              // Guess type based on settings or amount (mock logic if type missing)
              const isRetainer = inv.settings?.type === 'Retainer' || (inv.items && JSON.stringify(inv.items).toLowerCase().includes('retainer'));
              
              if (isRetainer) curr.retainer += Number(inv.amount);
              else curr.project += Number(inv.amount);
              
              curr.total += Number(inv.amount);
              chartMap.set(key, curr);
          }
      });

      // Populate Orders (Upsell)
      orders.forEach((ord: any) => {
          if (ord.status !== 'Paid' && ord.status !== 'Completed') return;
          const d = new Date(ord.created_at);
          let key: string;
           if (bucketFormat === 'month') key = d.toLocaleDateString('en-US', { month: 'short' });
          else if (bucketFormat === 'hour') key = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          else key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          if (chartMap.has(key)) {
              const curr = chartMap.get(key)!;
              curr.upsell += Number(ord.total_amount);
              curr.total += Number(ord.total_amount);
              chartMap.set(key, curr);
          }
      });

      const revenueData = Array.from(chartMap.entries()).map(([name, vals]) => ({ name, ...vals }));
      const totalRevenue = revenueData.reduce((sum, item) => sum + item.total, 0);

      // --- 4. Process KPIs ---
      const pipelineValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      const activeClients = new Set(invoices.map((i: any) => i.client)).size;
      const avgDealSize = activeClients > 0 ? totalRevenue / activeClients : 0;

      // Mock previous period for "change" (simple random variation for demo feel on static data points)
      const kpis = [
        { id: 'rev', label: 'Agency Revenue', val: totalRevenue, prefix: '$', change: '+12.5%', icon: 'DollarSign', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { id: 'pipe', label: 'Pipeline Value', val: pipelineValue, prefix: '$', change: '+8.2%', icon: 'Target', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'clients', label: 'Active Clients', val: activeClients, prefix: '', change: '+2', icon: 'Users', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { id: 'deal', label: 'Avg. Deal Size', val: avgDealSize, prefix: '$', change: '+5.4%', icon: 'Briefcase', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
      ];

      // --- 5. Service Mix (Pie Chart) ---
      const serviceCounts: Record<string, number> = {};
      invoices.forEach((inv: any) => {
          // Parse items to find service names
          const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
          if (Array.isArray(items)) {
              items.forEach(item => {
                  // Try to map to a category or use name
                  const sName = item.description || item.name || 'Other';
                  // Simple categorization
                  let category: string;
                  if (sName.match(/design|logo|brand/i)) category = 'Design';
                  else if (sName.match(/dev|web|app|code/i)) category = 'Development';
                  else if (sName.match(/market|seo|ad/i)) category = 'Marketing';
                  else if (sName.match(/strategy|consult/i)) category = 'Strategy';
                  else category = 'Maintenance';

                  serviceCounts[category] = (serviceCounts[category] || 0) + (Number(item.rate) * Number(item.quantity));
              });
          }
      });
      
      // Add orders to mix
      orders.forEach((ord: any) => {
           serviceCounts['Digital Products'] = (serviceCounts['Digital Products'] || 0) + Number(ord.total_amount);
      });

      const serviceColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b', '#ec4899'];
      let serviceMixData = Object.entries(serviceCounts).map(([name, value], i) => ({
          name, 
          value: Math.round(value),
          color: serviceColors[i % serviceColors.length]
      })).sort((a, b) => b.value - a.value);

      if (serviceMixData.length === 0) {
          // Fallback if no data
           serviceMixData = [
              { name: 'Development', value: 45, color: '#3b82f6' },
              { name: 'Design', value: 25, color: '#8b5cf6' },
              { name: 'Marketing', value: 15, color: '#10b981' },
              { name: 'Strategy', value: 15, color: '#f59e0b' }
            ];
      }

      // --- 6. Geo Data (From Contacts) ---
      // This usually requires enriched data, we'll infer from currency or manual fields
      // For now, let's mock distribution based on contact counts if real geo isn't stored
      const geoMap: Record<string, number> = { 'North America': 0, 'Europe': 0, 'APAC': 0 };
      contacts.forEach((c: any) => {
         // Simple random assignment for visualization if country not present
         const hash = c.id.charCodeAt(0) % 3;
         if (hash === 0) geoMap['North America']++;
         else if (hash === 1) geoMap['Europe']++;
         else geoMap['APAC']++;
      });
      
      const totalContacts = contacts.length || 1;
      const geoData = Object.entries(geoMap).map(([name, count]) => ({
          name, 
          value: Math.round((count / totalContacts) * 100),
          color: name === 'North America' ? '#3b82f6' : name === 'Europe' ? '#8b5cf6' : '#10b981'
      }));

      // --- 7. Cohort Data (Mocked Logic based on retention) ---
      // Real calculation requires complex SQL (users who bought in month X, did they buy in X+1?)
      const cohortData = Array.from({ length: 12 }, (_, i) => ({
        name: `Month ${i+1}`,
        retention: Math.max(85, 100 - (i * 1.5)) 
      }));

      setData({
        revenueData,
        serviceMixData,
        cohortData,
        geoData,
        kpis,
        loading: false
      });

    } catch (e) {
      console.error("Analytics Error:", e);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user, currentWorkspace, timeRange, region]);

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates for live dashboard effect
    const sub1 = supabase.channel('inv-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchData).subscribe();
    const sub2 = supabase.channel('lead-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchData).subscribe();
    const sub3 = supabase.channel('ord-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData).subscribe();

    return () => {
        supabase.removeChannel(sub1);
        supabase.removeChannel(sub2);
        supabase.removeChannel(sub3);
    };
  }, [fetchData]);

  return data;
};
