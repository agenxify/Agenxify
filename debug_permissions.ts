
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxbfzsbytclbehnqcwsb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YmZ6c2J5dGNsYmVobnFjd3NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTIyNjAzNywiZXhwIjoyMDg0ODAyMDM3fQ.Zvqn2qLIYZcGj-GU87kff5WBCcf3U-ubFNZPM8TvCG0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkspaceMembers() {
    const { data: workspaces, error: wError } = await supabase
        .from('workspaces')
        .select('id, name, owner_id');
    
    if (wError) {
        console.error('Error fetching workspaces:', wError);
        return;
    }
    console.log('Workspaces:', JSON.stringify(workspaces, null, 2));

    const { data: members, error: mError } = await supabase
        .from('workspace_members')
        .select('*');
    
    if (mError) {
        console.error('Error fetching workspace_members:', mError);
        return;
    }
    console.log('Workspace Members:', JSON.stringify(members, null, 2));

    const { data: pagePerms, error: pError } = await supabase
        .from('page_permissions')
        .select('*');
    
    if (pError) {
        console.error('Error fetching page_permissions:', pError);
        return;
    }
    console.log('Page Permissions:', JSON.stringify(pagePerms, null, 2));

    const { data: pages, error: pgError } = await supabase
        .from('pages')
        .select('id, title, workspace_id');
    
    if (pgError) {
        console.error('Error fetching pages:', pgError);
        return;
    }
    console.log('Pages:', JSON.stringify(pages, null, 2));
}

checkWorkspaceMembers();
