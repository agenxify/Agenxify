
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncCredits() {
    console.log("Starting manual credit synchronization...");

    // 1. Fetch all subscriptions
    const { data: subscriptions, error: subError } = await supabase.from('subscriptions').select('*');
    if (subError) {
        console.error("Error fetching subscriptions:", subError);
        return;
    }

    for (const sub of subscriptions) {
        console.log(`Processing subscription for owner_id: ${sub.owner_id}`);

        // 2. Fetch all active top-ups for this owner
        const { data: topups, error: topupError } = await supabase
            .from('topup_credits')
            .select('amount')
            .eq('owner_id', sub.owner_id)
            .eq('status', 'active');

        if (topupError) {
            console.error(`Error fetching top-ups for ${sub.owner_id}:`, topupError);
            continue;
        }

        const totalTopupCredits = topups.reduce((acc, t) => acc + t.amount, 0);
        console.log(`Total top-up credits found: ${totalTopupCredits}`);

        // 3. Fetch all purchased addons for this owner
        const { data: addons, error: addonError } = await supabase
            .from('purchased_addons')
            .select('addon_id')
            .eq('owner_id', sub.owner_id);

        if (addonError) {
            console.error(`Error fetching addons for ${sub.owner_id}:`, addonError);
            continue;
        }

        const addonCredits = addons.reduce((acc, a) => {
            if (a.addon_id === 'ai_pro') return acc + 50000;
            return acc;
        }, 0);
        console.log(`Total addon credits found: ${addonCredits}`);

        const expectedBalance = totalTopupCredits + addonCredits;
        console.log(`Expected balance: ${expectedBalance}, Current balance: ${sub.credits_balance}`);

        if (sub.credits_balance !== expectedBalance) {
            console.log(`Updating balance for ${sub.owner_id} to ${expectedBalance}`);
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update({ credits_balance: expectedBalance })
                .eq('id', sub.id);

            if (updateError) {
                console.error(`Error updating balance for ${sub.owner_id}:`, updateError);
            } else {
                console.log(`Successfully updated balance for ${sub.owner_id}`);
            }
        } else {
            console.log(`Balance for ${sub.owner_id} is already correct.`);
        }
    }
}

syncCredits();
