import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data, error } = await supabase.from('workspace_members').select('*').eq('user_id', '2ab6d2e5-85c7-4d7d-a4d5-04085f968a91');
  console.log("Workspace Members:", data, error);
}
test();
