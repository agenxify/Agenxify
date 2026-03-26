import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data, error } = await supabase.from('team_member').select('*').limit(1);
  console.log("Team Member:", data, error);
}
test();
