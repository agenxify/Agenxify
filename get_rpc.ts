import { createClient } from '@supabase/supabase-js';

// I don't have the service_role key, but I can use the anon key and see if I can query pg_class to check RLS.
const supabase = createClient('https://cxbfzsbytclbehnqcwsb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6c2J5dGNsYmVobnFjd3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMjYwMzcsImV4cCI6MjA4NDgwMjAzN30.uxDo4bAGiJC5fU0pd9jK5nFIJlAT5aMZjKxdaT1EGyw');
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: "SELECT relrowsecurity FROM pg_class WHERE relname = 'conversations'" });
  console.log(data, error);
}
run();
