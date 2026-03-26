import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cxbfzsbytclbehnqcwsb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6c2J5dGNsYmVobnFjd3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMjYwMzcsImV4cCI6MjA4NDgwMjAzN30.uxDo4bAGiJC5fU0pd9jK5nFIJlAT5aMZjKxdaT1EGyw';

export const supabase = createClient(supabaseUrl, supabaseKey);
