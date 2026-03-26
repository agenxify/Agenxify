import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);
async function test() {
  const { data, error } = await supabase.from('conversation_participants').select('*').eq('conversation_id', '0f9bdf9c-c414-4fd3-97a1-02f891604773');
  console.log("Participants:", data, error);
}
test();
