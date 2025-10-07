-- Create calculator chat sessions table
CREATE TABLE IF NOT EXISTS public.calculator_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  calculator_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create calculator chat messages table
CREATE TABLE IF NOT EXISTS public.calculator_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.calculator_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  credits_used NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calculator_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat sessions
CREATE POLICY "Users can manage own chat sessions"
ON public.calculator_chat_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat messages
CREATE POLICY "Users can view own chat messages"
ON public.calculator_chat_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.calculator_chat_sessions 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own chat messages"
ON public.calculator_chat_messages
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.calculator_chat_sessions 
    WHERE user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_calculator_chat_sessions_updated_at
BEFORE UPDATE ON public.calculator_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_calculator_chat_sessions_user_id ON public.calculator_chat_sessions(user_id);
CREATE INDEX idx_calculator_chat_messages_session_id ON public.calculator_chat_messages(session_id);
CREATE INDEX idx_calculator_chat_messages_created_at ON public.calculator_chat_messages(created_at);