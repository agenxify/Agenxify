
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listRpcs() {
    const { data, error } = await supabase.from('pg_proc').select('proname').limit(100);
    if (error) {
        console.error("Error listing RPCs:", error);
        // Try information_schema
        const { data: data2, error: error2 } = await supabase.rpc('get_rpcs'); // Long shot
        console.log("get_rpcs error:", error2);
    } else {
        console.log("RPCs:", data.map(r => r.proname));
    }
}

listRpcs();
