import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data, error } = await supabase.from('workspaces').select('*').eq('id', 'a8876692-cd44-4eef-8b7c-77800be786a8');
  console.log("Workspace:", data, error);
}
test();
