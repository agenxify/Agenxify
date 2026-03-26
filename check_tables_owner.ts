
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cxbfzsbytclbehnqcwsb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6c2J5dGNsYmVobnFjd3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMjYwMzcsImV4cCI6MjA4NDgwMjAzN30.uxDo4bAGiJC5fU0pd9jK5nFIJlAT5aMZjKxdaT1EGyw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['team_member', 'requests', 'projects', 'clients', 'storage_files'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) console.error(`Error in ${table}:`, error);
    else console.log(`${table} columns:`, Object.keys(data[0] || {}));
  }
}

checkTables();
