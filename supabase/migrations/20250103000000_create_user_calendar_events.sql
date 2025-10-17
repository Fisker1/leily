-- Create user calendar events table for rental management
CREATE TABLE IF NOT EXISTS public.user_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'lease_start', 
    'lease_end', 
    'rent_increase', 
    'index_regulation',
    'move_in', 
    'move_out', 
    'inspection', 
    'deposit_release', 
    'insurance_renewal', 
    'tax_deadline',
    'maintenance',
    'custom'
  )),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE CASCADE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT, -- 'yearly', 'monthly', 'quarterly'
  reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Days before event to send reminders
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON public.user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_event_date ON public.user_calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_property_id ON public.user_calendar_events(property_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_lease_id ON public.user_calendar_events(lease_id);

-- Enable RLS
ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own calendar events" ON public.user_calendar_events
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON public.user_calendar_events
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON public.user_calendar_events
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON public.user_calendar_events
FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_calendar_events_updated_at
  BEFORE UPDATE ON public.user_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


