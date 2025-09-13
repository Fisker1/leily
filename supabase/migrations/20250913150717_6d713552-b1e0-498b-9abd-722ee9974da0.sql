-- Add coordinates column to properties table for map functionality
ALTER TABLE public.properties 
ADD COLUMN coordinates NUMERIC[] CHECK (array_length(coordinates, 1) = 2);

-- Add coordinates column to calculation_history table for map functionality  
ALTER TABLE public.calculation_history 
ADD COLUMN coordinates NUMERIC[] CHECK (array_length(coordinates, 1) = 2);

-- Add btree indexes for better performance on coordinates queries (no GIST needed)
CREATE INDEX idx_properties_coordinates ON public.properties (coordinates);
CREATE INDEX idx_calculation_history_coordinates ON public.calculation_history (coordinates);

-- Add some sample coordinates for existing Stavanger property (Lervigbrygga 116)
UPDATE public.properties 
SET coordinates = ARRAY[5.7331, 58.9700] 
WHERE address = 'Lervigbrygga 116' AND city = 'Stavanger';