-- Create property_valuations table for tracking price development over time
CREATE TABLE property_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  valuation_amount NUMERIC NOT NULL,
  valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valuation_type TEXT NOT NULL DEFAULT 'manual',
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;

-- Create policies for property valuations
CREATE POLICY "Users can view their property valuations" 
ON property_valuations 
FOR SELECT 
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their property valuations" 
ON property_valuations 
FOR INSERT 
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update their property valuations" 
ON property_valuations 
FOR UPDATE 
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their property valuations" 
ON property_valuations 
FOR DELETE 
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_property_valuations_updated_at
BEFORE UPDATE ON property_valuations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial valuation for the property we just added
INSERT INTO property_valuations (
  property_id,
  valuation_amount,
  valuation_date,
  valuation_type,
  source,
  notes
) VALUES (
  '9f08c896-14bf-47b2-9216-930fa6dba77d',
  3500000,
  CURRENT_DATE,
  'manual',
  'Initial value estimate',
  'Nåværende verdi som oppgitt ved registrering'
);