import { supabase } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const workspaceId = req.query.workspaceId;
  if (!workspaceId) return res.status(400).json({ error: "Missing workspaceId" });

  try {
    // 1. Get workspace owner_id
    const { data: workspace } = await supabase.from('workspaces').select('owner_id').eq('id', workspaceId).maybeSingle();
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    // 2. Get owner profile from team_member
    const { data: profile } = await supabase.from('team_member').select('*').eq('workspace_id', workspaceId).eq('id', workspace.owner_id).maybeSingle();
    
    if (profile) {
      res.status(200).json(profile);
    } else {
      // Try to find by email if ID doesn't match (e.g. if owner_id was changed)
      const { data: memberData } = await supabase.from('workspace_members').select('email').eq('workspace_id', workspaceId).eq('role', 'owner').maybeSingle();
      if (memberData?.email) {
          const { data: profileByEmail } = await supabase.from('team_member').select('*').eq('workspace_id', workspaceId).ilike('email', memberData.email).maybeSingle();
          if (profileByEmail) return res.status(200).json(profileByEmail);
      }
      res.status(404).json({ error: "Admin profile not found" });
    }
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
