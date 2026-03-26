import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxbfzsbytclbehnqcwsb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6c2J5dGNsYmVobnFjd3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMjYwMzcsImV4cCI6MjA4NDgwMjAzN30.uxDo4bAGiJC5fU0pd9jK5nFIJlAT5aMZjKxdaT1EGyw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ekanshjaiswal.pkt@gmail.com',
    password: 'password' // Assuming password is password or something, but I can't guess it.
  });
  console.log(error);
}

check();
