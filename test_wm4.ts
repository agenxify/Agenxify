import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data, error } = await supabase.from('workspace_members').select('*').eq('user_id', '6daa7fac-549b-4a0d-a175-e5108e7e907a');
  console.log("Member:", data, error);
}
test();
