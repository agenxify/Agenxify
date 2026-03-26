import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE OR REPLACE FUNCTION public.get_user_usage_counts(p_owner_id UUID)
      RETURNS JSONB AS $$
      DECLARE
        v_workspaces UUID[];
        v_result JSONB;
      BEGIN
        -- Get all workspaces owned by the user
        SELECT array_agg(id) INTO v_workspaces FROM public.workspaces WHERE owner_id = p_owner_id;

        IF v_workspaces IS NULL THEN
          RETURN '{}'::jsonb;
        END IF;

        SELECT jsonb_build_object(
          'workspaces', array_length(v_workspaces, 1),
          'pages', (SELECT count(*) FROM public.pages WHERE workspace_id = ANY(v_workspaces)),
          'tickets', (SELECT count(*) FROM public.tickets WHERE workspace_id = ANY(v_workspaces)),
          'clients', (SELECT count(*) FROM public.clients WHERE workspace_id = ANY(v_workspaces)),
          'projects', (SELECT count(*) FROM public.projects WHERE workspace_id = ANY(v_workspaces)),
          'invoices', (SELECT count(*) FROM public.invoices WHERE workspace_id = ANY(v_workspaces)),
          'estimates', (SELECT count(*) FROM public.estimates WHERE workspace_id = ANY(v_workspaces)),
          'services', (SELECT count(*) FROM public.services WHERE workspace_id = ANY(v_workspaces)),
          'bookings', (SELECT count(*) FROM public.bookings WHERE workspace_id = ANY(v_workspaces)),
          'onboarding', (SELECT count(*) FROM public.onboarding_forms WHERE workspace_id = ANY(v_workspaces)),
          'marketing_emails', (SELECT count(*) FROM public.marketing_emails WHERE workspace_id = ANY(v_workspaces)),
          'team_members', (SELECT count(*) FROM public.team_members WHERE workspace_id = ANY(v_workspaces))
        ) INTO v_result;

        RETURN v_result;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });
  console.log(data, error);
}

run();
