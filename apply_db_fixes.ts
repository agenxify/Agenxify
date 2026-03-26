
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runFixes() {
    const sql = `
-- 1. Create execute_sql helper if it doesn't exist
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE sql INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- 2. Fix pages RLS to respect page_permissions
DROP POLICY IF EXISTS "View pages" ON public.pages;
CREATE POLICY "View pages" ON public.pages
FOR SELECT
USING (
  status = 'Published'
  OR
  workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  OR
  public.is_workspace_admin(workspace_id)
  OR
  id IN (
    SELECT page_id FROM public.page_permissions
    WHERE member_id IN (
      SELECT id FROM public.workspace_members
      WHERE user_id = auth.uid() OR email = auth.jwt() ->> 'email'
    )
  )
);

-- 3. Ensure Messaging Tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    is_group BOOLEAN DEFAULT FALSE,
    name TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- This should ideally reference auth.users(id) but we'll keep it flexible
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on Messaging Tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Messaging RLS Policies
DROP POLICY IF EXISTS "View conversations" ON public.conversations;
CREATE POLICY "View conversations" ON public.conversations
FOR SELECT
USING (
  id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "View participants" ON public.conversation_participants;
CREATE POLICY "View participants" ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "View messages" ON public.messages;
CREATE POLICY "View messages" ON public.messages
FOR SELECT
USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Insert messages" ON public.messages;
CREATE POLICY "Insert messages" ON public.messages
FOR INSERT
WITH CHECK (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
  AND sender_id = auth.uid()
);

-- 6. Create create_new_conversation RPC
CREATE OR REPLACE FUNCTION public.create_new_conversation(
    p_workspace_id UUID,
    p_participant_ids UUID[],
    p_is_group BOOLEAN DEFAULT FALSE,
    p_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_participant_id UUID;
BEGIN
    -- 1. Create the conversation
    INSERT INTO public.conversations (workspace_id, is_group, name)
    VALUES (p_workspace_id, p_is_group, p_name)
    RETURNING id INTO v_conversation_id;

    -- 2. Add participants
    FOREACH v_participant_id IN ARRAY p_participant_ids
    LOOP
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (v_conversation_id, v_participant_id);
    END LOOP;

    RETURN v_conversation_id;
END;
$$;

-- 7. Fix team_member visibility
DROP POLICY IF EXISTS "View team members" ON public.team_member;
CREATE POLICY "View team members" ON public.team_member
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid() OR email = auth.jwt() ->> 'email'
  )
);
    `;

    // We'll use a trick to run this SQL since we don't have execute_sql yet.
    // We'll try to use 'exec_sql' if it exists, or just create it.
    // Actually, I'll just use the REST API to run the SQL if I had a way, 
    // but I'll try to call an RPC that might exist or just create one.
    
    // Let's try to create the RPC first using a direct call if possible, 
    // but wait, I can't run raw SQL without an RPC.
    
    // I'll check if I can use the 'exec_sql' from create_rpc.ts
    const { error: rpcError } = await supabase.rpc('exec_sql', { query: sql });
    if (rpcError) {
        console.error("Error running fixes via exec_sql:", rpcError);
        // If exec_sql doesn't exist, I'll try to create it using a different method or just inform the user.
    } else {
        console.log("Successfully applied database fixes.");
    }
}

runFixes();
