-- Create chat messages table for landlord-tenant communication
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('landlord', 'tenant')),
  sender_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages access
CREATE POLICY "Users can view chat messages for their lease agreements" 
ON public.chat_messages 
FOR SELECT 
USING (
  lease_id IN (
    SELECT id FROM public.lease_agreements 
    WHERE property_owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create chat messages for their lease agreements" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  lease_id IN (
    SELECT id FROM public.lease_agreements 
    WHERE property_owner_id = auth.uid()
  ) AND sender_id = auth.uid()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_chat_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_message_updated_at();