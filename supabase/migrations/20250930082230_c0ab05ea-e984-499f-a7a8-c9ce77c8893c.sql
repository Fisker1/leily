-- Add missing columns to existing tables

-- Add coordinates to calculation_history
ALTER TABLE public.calculation_history 
ADD COLUMN IF NOT EXISTS coordinates double precision[] 
CHECK (array_length(coordinates, 1) = 2);

-- Add coordinates to properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS coordinates double precision[] 
CHECK (array_length(coordinates, 1) = 2);

-- Add credits to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits integer DEFAULT 0;

-- Create finn_property_cache table
CREATE TABLE IF NOT EXISTS public.finn_property_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finn_code text NOT NULL UNIQUE,
  property_data jsonb NOT NULL,
  extracted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create building_projects table
CREATE TABLE IF NOT EXISTS public.building_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_name text NOT NULL,
  calculation_id uuid,
  floor_plans jsonb NOT NULL DEFAULT '[]'::jsonb,
  placed_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cost numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT building_projects_calculation_id_fkey FOREIGN KEY (calculation_id) REFERENCES public.calculation_history(id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type = ANY (ARRAY['landlord'::text, 'tenant'::text])),
  sender_id uuid NOT NULL,
  message_content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease_agreements(id)
);

-- Enable RLS on new tables
ALTER TABLE public.finn_property_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finn_property_cache
CREATE POLICY "Anyone can read cached property data"
ON public.finn_property_cache FOR SELECT
USING (true);

CREATE POLICY "System can manage cache"
ON public.finn_property_cache FOR ALL
USING (true);

-- RLS Policies for building_projects
CREATE POLICY "Users can manage own building projects"
ON public.building_projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages for their leases"
ON public.chat_messages FOR SELECT
USING (
  lease_id IN (
    SELECT id FROM public.lease_agreements 
    WHERE property_owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages for their leases"
ON public.chat_messages FOR INSERT
WITH CHECK (
  lease_id IN (
    SELECT id FROM public.lease_agreements 
    WHERE property_owner_id = auth.uid()
  ) AND sender_id = auth.uid()
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_finn_property_cache_updated_at
  BEFORE UPDATE ON public.finn_property_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_building_projects_updated_at
  BEFORE UPDATE ON public.building_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();