-- Create storage bucket for reports and user documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for reports storage
CREATE POLICY "Users can view their reports" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their reports" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their reports" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
