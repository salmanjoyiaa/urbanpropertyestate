-- UrbanEstate Storage Bucket Configuration
-- Run this in Supabase SQL Editor AFTER migration.sql

-- Create the property-photos bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files
CREATE POLICY "Public read access for property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

-- Allow authenticated users to upload files under their own path
CREATE POLICY "Authenticated users can upload property photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'properties'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own property photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'properties'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own property photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'properties'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
