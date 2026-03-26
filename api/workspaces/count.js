import { supabase } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = req.query.userId;
  console.log("Fetching workspace count for userId:", userId);
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const { count, error } = await supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    console.log("Workspace count result:", count);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching workspace count:", error);
    res.status(500).json({ error: "Failed to fetch workspace count" });
  }
}
