
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runFixes() {
    console.log("Applying billing schema fixes...");
    
    const sql = `
-- 1. Add metadata column to unbilled_charges
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unbilled_charges' AND column_name='metadata') THEN
        ALTER TABLE public.unbilled_charges ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Add missing columns to purchased_addons
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchased_addons' AND column_name='status') THEN
        ALTER TABLE public.purchased_addons ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchased_addons' AND column_name='billing_cycle') THEN
        ALTER TABLE public.purchased_addons ADD COLUMN billing_cycle TEXT DEFAULT 'annual';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchased_addons' AND column_name='expires_at') THEN
        ALTER TABLE public.purchased_addons ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Add has_used_trial to workspaces
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='has_used_trial') THEN
        ALTER TABLE public.workspaces ADD COLUMN has_used_trial BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Ensure execute_sql helper exists
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
DECLARE
  result jsonb;
BEGIN
  EXECUTE sql INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$body$;
    `;

    // Try to run via exec_sql or execute_sql
    const { error: rpcError } = await supabase.rpc('execute_sql', { sql });
    
    if (rpcError) {
        console.error("Error running fixes via execute_sql:", rpcError);
        // Try fallback exec_sql
        const { error: rpcError2 } = await supabase.rpc('exec_sql', { query: sql });
        if (rpcError2) {
            console.error("Error running fixes via exec_sql:", rpcError2);
            console.log("Please run the SQL manually in the Supabase SQL Editor.");
            console.log(sql);
        } else {
            console.log("Successfully applied database fixes via exec_sql.");
        }
    } else {
        console.log("Successfully applied database fixes via execute_sql.");
    }
}

runFixes();
