
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function tryRpcs() {
    const rpcs = ['execute_sql', 'exec_sql', 'run_sql', 'sql', 'query', 'execute'];
    for (const rpc of rpcs) {
        const { error } = await supabase.rpc(rpc, { sql: "SELECT 1", query: "SELECT 1" });
        if (error && error.code !== 'PGRST202') {
            console.log(`RPC ${rpc} found but error:`, error);
        } else if (!error) {
            console.log(`RPC ${rpc} found!`);
        } else {
            console.log(`RPC ${rpc} not found.`);
        }
    }
}

tryRpcs();
