-- Create table for building projects to connect with calculations
CREATE TABLE public.building_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  project_name text NOT NULL,
  calculation_id uuid REFERENCES public.calculation_history(id) ON DELETE CASCADE,
  floor_plans jsonb NOT NULL DEFAULT '[]'::jsonb,
  placed_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cost numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.building_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own building projects" 
ON public.building_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own building projects" 
ON public.building_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own building projects" 
ON public.building_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own building projects" 
ON public.building_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_building_projects_updated_at
BEFORE UPDATE ON public.building_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();