-- Create property_documents table for storing documents related to properties
CREATE TABLE property_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  file_path TEXT NOT NULL,
  document_category TEXT DEFAULT 'other',
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for property documents
CREATE POLICY "Users can view their property documents" 
ON property_documents 
FOR SELECT 
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can upload their property documents" 
ON property_documents 
FOR INSERT 
WITH CHECK (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ) AND uploaded_by = auth.uid()
);

CREATE POLICY "Users can update their property documents" 
ON property_documents 
FOR UPDATE 
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their property documents" 
ON property_documents 
FOR DELETE 
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Create storage bucket for property documents
INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', false);

-- Create policies for property document storage
CREATE POLICY "Users can view their property documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their property documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their property documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their property documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);