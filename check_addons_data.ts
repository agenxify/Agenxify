
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data, error } = await supabase.from('purchased_addons').select('*');
    if (error) {
        console.error('Error fetching purchased_addons:', error);
    } else {
        console.log('Data in purchased_addons:', data);
    }
}

checkData();
