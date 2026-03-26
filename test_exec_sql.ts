
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testExecSql() {
    const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT 1" });
    if (error) {
        console.error("exec_sql error:", error);
    } else {
        console.log("exec_sql result:", data);
    }
}

testExecSql();
