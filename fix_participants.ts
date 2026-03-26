import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
async function fix() {
  // Get all conversation participants
  const { data: participants } = await supabase.from('conversation_participants').select('*');
  if (!participants) return;

  for (const p of participants) {
    // Check if user_id is a team_member.id
    const { data: tm } = await supabase.from('team_member').select('email').eq('id', p.user_id).maybeSingle();
    if (tm) {
      // Find the auth.users.id from workspace_members
      const { data: wm } = await supabase.from('workspace_members').select('user_id').ilike('email', tm.email).not('user_id', 'is', null).limit(1).maybeSingle();
      if (wm && wm.user_id) {
        console.log(`Updating participant ${p.user_id} to ${wm.user_id} in conversation ${p.conversation_id}`);
        await supabase.from('conversation_participants').update({ user_id: wm.user_id }).eq('conversation_id', p.conversation_id).eq('user_id', p.user_id);
      }
    }
  }
}
fix();
