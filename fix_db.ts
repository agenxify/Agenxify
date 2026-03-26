import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT event_object_table, trigger_name, action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('pages', 'storage_objects');
    `
  });
  console.log(data, error);
}

checkTriggers();
