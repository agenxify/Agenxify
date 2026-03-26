
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cxbfzsbytclbehnqcwsb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6c2J5dGNsYmVobnFjd3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMjYwMzcsImV4cCI6MjA4NDgwMjAzN30.uxDo4bAGiJC5fU0pd9jK5nFIJlAT5aMZjKxdaT1EGyw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
  if (tablesError) {
    console.log("Error getting tables via RPC, trying direct query...");
    const { data: info, error: infoError } = await supabase.from('information_schema.columns').select('table_name, column_name, data_type').eq('table_schema', 'public');
    if (infoError) {
      console.error(infoError);
      return;
    }
    const grouped = info.reduce((acc: any, curr: any) => {
      if (!acc[curr.table_name]) acc[curr.table_name] = [];
      acc[curr.table_name].push(curr.column_name);
      return acc;
    }, {});
    console.log(JSON.stringify(grouped, null, 2));
  } else {
    console.log(JSON.stringify(tables, null, 2));
  }
}

checkSchema();
