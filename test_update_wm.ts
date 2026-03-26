import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data, error } = await supabase.from('workspace_members').update({ user_id: 'ffb2752c-e4a7-48f6-b1bb-bffb0e1e3da9' }).eq('id', 'a81fcf24-9d55-4bc4-b106-e8ad6ec9d196').select();
  console.log("Update:", data, error);
}
test();
