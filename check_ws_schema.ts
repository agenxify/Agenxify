
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cxbfzsbytclbehnqcwsb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6c2J5dGNsYmVobnFjd3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMjYwMzcsImV4cCI6MjA4NDgwMjAzN30.uxDo4bAGiJC5fU0pd9jK5nFIJlAT5aMZjKxdaT1EGyw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'workspaces' AND table_schema = 'public'" });
  if (error) {
    console.error('RPC Error:', error);
    // Fallback to a query that might fail but show columns in error or something
    const { data: ws, error: wsError } = await supabase.from('workspaces').select('*').limit(1);
    if (wsError) console.error('Query Error:', wsError);
    else console.log('Workspaces columns (query):', ws.length > 0 ? Object.keys(ws[0]) : 'No rows');
  } else {
    console.log('Columns:', data);
  }
}

checkSchema();
