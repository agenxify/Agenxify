
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('purchased_addons').select('*').limit(1);
    if (error) {
        console.error('Error fetching purchased_addons:', error);
    } else {
        console.log('Columns in purchased_addons:', data.length > 0 ? Object.keys(data[0]) : 'No data to infer columns');
    }
}

checkColumns();
