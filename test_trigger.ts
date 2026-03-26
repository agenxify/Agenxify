
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrigger() {
    const userId = '6daa7fac-549b-4a0d-a175-e5108e7e907a';
    const workspaceId = 'a8876692-cd44-4eef-8b7c-77800be786a8';
    
    console.log("Adding 100 credits...");
    const { error } = await supabase.from('topup_credits').insert({
        workspace_id: workspaceId,
        owner_id: userId,
        amount: 100,
        cost: 1,
        status: 'active'
    });
    
    if (error) {
        console.error("Insert error:", error);
        return;
    }
    
    console.log("Checking balance...");
    const { data: sub, error: subError } = await supabase.from('subscriptions').select('credits_balance').eq('owner_id', userId).single();
    if (subError) {
        console.error("Fetch error:", subError);
    } else {
        console.log("New balance:", sub.credits_balance);
    }
}

testTrigger();
