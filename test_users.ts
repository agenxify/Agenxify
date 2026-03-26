import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data, error } = await supabase.auth.admin.listUsers();
  const user = data.users.find(u => u.email === 'ekanshjaiswal.pkt@gmail.com');
  console.log("User:", user?.id, user?.email);
}
test();
