import { supabase } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = req.query.userId;
  console.log("Fetching usage for userId:", userId);
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const { count: projects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: seats } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: pipelines } = await supabase.from('pipelines').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: bookings } = await supabase.from('event_types').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: services } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: onboarding } = await supabase.from('onboarding_flows').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: pages } = await supabase.from('pages').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: invoices } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: estimates } = await supabase.from('estimates').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: requests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    // Fetch storage usage
    const { data: storageData } = await supabase.from('storage_files').select('size').eq('owner_id', userId);
    const storageKB = storageData?.reduce((acc, f) => acc + Number(f.size), 0) || 0;
    const storageUsedGB = storageKB / 1024 / 1024;

    // Fetch credits from workspace
    const { data: workspaceData } = await supabase.from('workspaces').select('credits_balance').eq('owner_id', userId).limit(1).single();
    const creditsBalance = workspaceData?.credits_balance || 0;

    res.status(200).json({
      projects: projects || 0,
      seats: seats || 0,
      pipelines: pipelines || 0,
      bookings: bookings || 0,
      services: services || 0,
      onboarding: onboarding || 0,
      pages: pages || 0,
      invoices: invoices || 0,
      estimates: estimates || 0,
      requests: requests || 0,
      storage: parseFloat(storageUsedGB.toFixed(2)),
      credits: creditsBalance
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
}
