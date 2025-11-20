-- Make specialist-documents bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'specialist-documents';