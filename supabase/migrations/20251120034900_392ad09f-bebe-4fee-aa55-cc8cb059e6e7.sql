-- Remove conflicting RLS policies from storage.objects for specialist-documents
-- Since the bucket is now public, we don't need SELECT policies
DROP POLICY IF EXISTS "Portfolio images are publicly accessible" ON storage.objects;

-- Keep only the policies for INSERT and DELETE which are still needed for authenticated actions
