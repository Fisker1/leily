-- Create finn_property_cache table for caching Finn.no property data
CREATE TABLE IF NOT EXISTS finn_property_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finn_code TEXT NOT NULL,
    property_data JSONB NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_finn_property_cache_finn_code ON finn_property_cache(finn_code);
CREATE INDEX IF NOT EXISTS idx_finn_property_cache_created_at ON finn_property_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_finn_property_cache_user_id ON finn_property_cache(user_id);

-- Add RLS policies
ALTER TABLE finn_property_cache ENABLE ROW LEVEL SECURITY;

-- Users can read their own cached data and data cached by others (for sharing)
CREATE POLICY "Users can read finn property cache" ON finn_property_cache
    FOR SELECT USING (true);

-- Users can insert their own cache entries
CREATE POLICY "Users can insert finn property cache" ON finn_property_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own cache entries
CREATE POLICY "Users can update finn property cache" ON finn_property_cache
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own cache entries
CREATE POLICY "Users can delete finn property cache" ON finn_property_cache
    FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_finn_property_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_finn_property_cache_updated_at
    BEFORE UPDATE ON finn_property_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_finn_property_cache_updated_at();