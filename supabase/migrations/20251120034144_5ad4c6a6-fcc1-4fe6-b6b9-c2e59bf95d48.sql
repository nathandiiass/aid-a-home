-- Allow public access to portfolio images in storage
CREATE POLICY "Portfolio images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'specialist-documents' AND (storage.foldername(name))[2] = 'portfolio');

-- Allow specialists to upload their portfolio images
CREATE POLICY "Specialists can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'specialist-documents' 
  AND (storage.foldername(name))[2] = 'portfolio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow specialists to delete their own portfolio images
CREATE POLICY "Specialists can delete their portfolio images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'specialist-documents' 
  AND (storage.foldername(name))[2] = 'portfolio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);