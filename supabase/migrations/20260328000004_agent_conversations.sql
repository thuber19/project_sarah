-- Agent conversation persistence (Issue #55)

-- Conversations table
CREATE TABLE public.agent_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text,
  model       text DEFAULT 'anthropic/claude-haiku-4-5-20251001',
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.agent_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content          text NOT NULL,
  parts            jsonb,
  tool_invocations jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_conversations" ON public.agent_conversations
  FOR ALL USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "users_own_messages" ON public.agent_messages
  FOR ALL USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_conversations_user_id ON public.agent_conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.agent_conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.agent_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.agent_messages(created_at);

-- updated_at trigger
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
