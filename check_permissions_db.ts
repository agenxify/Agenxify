import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPermissions() {
  console.log('--- Workspace Members ---');
  const { data: members, error: membersError } = await supabase
    .from('workspace_members')
    .select('*');
  
  if (membersError) console.error('Error fetching members:', membersError);
  else console.log(JSON.stringify(members, null, 2));

  console.log('\n--- Page Permissions ---');
  const { data: perms, error: permsError } = await supabase
    .from('page_permissions')
    .select('*');
  
  if (permsError) console.error('Error fetching permissions:', permsError);
  else console.log(JSON.stringify(perms, null, 2));

  console.log('\n--- Clients ---');
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, email, workspace_id, module_permissions');
  
  if (clientsError) console.error('Error fetching clients:', clientsError);
  else console.log(JSON.stringify(clients, null, 2));
}

checkPermissions();
