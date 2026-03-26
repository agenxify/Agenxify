
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateConv() {
    const { data, error } = await supabase.rpc('create_new_conversation', {
        p_workspace_id: '00000000-0000-0000-0000-000000000000', // Dummy
        p_participant_ids: ['00000000-0000-0000-0000-000000000000'],
        p_is_group: false,
        p_name: 'Test'
    });
    if (error) {
        console.error("create_new_conversation error:", error);
    } else {
        console.log("create_new_conversation result:", data);
    }
}

testCreateConv();
