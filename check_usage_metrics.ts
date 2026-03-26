import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const userUid = '6daa7fac-549b-4a0d-a175-e5108e7e907a'; // Use a dummy or real user ID
  try {
    const [
      storageRes,
      requestsRes,
      teamRes,
      projectsRes,
      clientsRes,
      pipelinesRes,
      bookingsRes,
      servicesRes,
      onboardingRes,
      pagesRes,
      invoicesRes,
      estimatesRes,
      ticketsRes,
      campaignsRes,
      workspacesRes
    ] = await Promise.all([
      supabase.from('storage_files').select('size').eq('owner_id', userUid),
      supabase.from('requests').select('id, status, credits_consumed').eq('owner_id', userUid),
      supabase.from('team_member').select('id, role').eq('owner_id', userUid),
      supabase.from('projects').select('id').eq('owner_id', userUid),
      supabase.from('clients').select('id').eq('owner_id', userUid),
      supabase.from('pipelines').select('id').eq('owner_id', userUid),
      supabase.from('event_types').select('id').eq('owner_id', userUid),
      supabase.from('services').select('id').eq('owner_id', userUid),
      supabase.from('onboarding_flows').select('id').eq('owner_id', userUid),
      supabase.from('pages').select('id, deleted').eq('owner_id', userUid),
      supabase.from('invoices').select('id').eq('owner_id', userUid),
      supabase.from('estimates').select('id').eq('owner_id', userUid),
      supabase.from('tickets').select('id').eq('owner_id', userUid),
      supabase.from('marketing_campaigns').select('id').eq('owner_id', userUid),
      supabase.from('workspaces').select('id', { count: 'exact', head: true }).eq('owner_id', userUid)
    ]);

    console.log('storageRes error:', storageRes.error);
    console.log('requestsRes error:', requestsRes.error);
    console.log('teamRes error:', teamRes.error);
    console.log('projectsRes error:', projectsRes.error);
    console.log('clientsRes error:', clientsRes.error);
    console.log('pipelinesRes error:', pipelinesRes.error);
    console.log('bookingsRes error:', bookingsRes.error);
    console.log('servicesRes error:', servicesRes.error);
    console.log('onboardingRes error:', onboardingRes.error);
    console.log('pagesRes error:', pagesRes.error);
    console.log('invoicesRes error:', invoicesRes.error);
    console.log('estimatesRes error:', estimatesRes.error);
    console.log('ticketsRes error:', ticketsRes.error);
    console.log('campaignsRes error:', campaignsRes.error);
    console.log('workspacesRes error:', workspacesRes.error);
  } catch (e) {
    console.error(e);
  }
}

check();
