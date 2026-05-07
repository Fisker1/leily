-- Leily: Post-init storage bucket setup
-- This runs AFTER the Supabase Postgres image bootstraps auth/storage schemas.
--
-- The app schema (tables, RLS, functions) is applied separately via
-- volumes/db/init/01-baseline.sql — which you must export from your
-- Supabase cloud project first. See the setup guide below.

-- ── Storage Buckets ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',            'avatars',            true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('property-images',    'property-images',    true,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('property-documents', 'property-documents', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies (idempotent — use DO blocks to avoid errors on re-run)
DO $$ BEGIN
  CREATE POLICY "Public avatar read"    ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth avatar upload"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth avatar update"    ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth avatar delete"    ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public property image read" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth property image upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth property image delete" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth property doc read"   ON storage.objects FOR SELECT USING (bucket_id = 'property-documents' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth property doc upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-documents' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth property doc delete" ON storage.objects FOR DELETE USING (bucket_id = 'property-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
