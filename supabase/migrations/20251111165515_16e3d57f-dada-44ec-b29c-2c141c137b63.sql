-- Fix existing invalid price data before adding constraints
UPDATE specialist_activities 
SET price_min = 210, price_max = 300
WHERE id = 'f09d26ca-f2b2-4369-aad5-40ec763117b2';

-- Now add all the security fixes

-- Fix 1: Make specialist-documents bucket private to prevent direct URL access
UPDATE storage.buckets 
SET public = false 
WHERE name = 'specialist-documents';

-- Fix 2: Add server-side input validation constraints
-- Name length constraints
ALTER TABLE profiles 
ADD CONSTRAINT check_first_name_length CHECK (char_length(first_name) > 0 AND char_length(first_name) <= 60);

ALTER TABLE profiles 
ADD CONSTRAINT check_last_name_paterno_length CHECK (last_name_paterno IS NULL OR char_length(last_name_paterno) <= 60);

ALTER TABLE profiles 
ADD CONSTRAINT check_last_name_materno_length CHECK (last_name_materno IS NULL OR char_length(last_name_materno) <= 60);

-- RFC format validation (4 letters, 6 digits, 3 alphanumeric)
ALTER TABLE specialist_profiles 
ADD CONSTRAINT check_rfc_format CHECK (rfc ~ '^[A-Z]{4}\d{6}[A-Z0-9]{3}$');

-- Phone format validation (E.164 international format)
ALTER TABLE specialist_profiles 
ADD CONSTRAINT check_phone_format CHECK (phone ~ '^\+?[1-9]\d{1,14}$');

-- Price constraints for quotes
ALTER TABLE quotes 
ADD CONSTRAINT check_prices_positive CHECK (
  (price_fixed IS NULL OR price_fixed > 0) AND
  (price_min IS NULL OR price_min > 0) AND
  (price_max IS NULL OR price_max > 0) AND
  (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)
);

ALTER TABLE quotes
ADD CONSTRAINT check_visit_cost_positive CHECK (visit_cost IS NULL OR visit_cost >= 0);

-- Price constraints for service requests
ALTER TABLE service_requests 
ADD CONSTRAINT check_request_prices_positive CHECK (
  (price_min IS NULL OR price_min > 0) AND
  (price_max IS NULL OR price_max > 0) AND
  (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)
);

-- Price constraints for specialist activities
ALTER TABLE specialist_activities 
ADD CONSTRAINT check_activity_prices_positive CHECK (
  (price_min IS NULL OR price_min > 0) AND
  (price_max IS NULL OR price_max > 0) AND
  (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)
);

-- Rating constraints for reviews
ALTER TABLE reviews 
ADD CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5);

-- Warranty days validation
ALTER TABLE specialist_profiles 
ADD CONSTRAINT check_warranty_days_positive CHECK (warranty_days >= 0 AND warranty_days <= 3650);

ALTER TABLE quotes 
ADD CONSTRAINT check_quote_warranty_days_positive CHECK (warranty_days >= 0 AND warranty_days <= 3650);

-- Text length constraints
ALTER TABLE locations 
ADD CONSTRAINT check_label_length CHECK (char_length(label) > 0 AND char_length(label) <= 100);

ALTER TABLE locations 
ADD CONSTRAINT check_street_length CHECK (char_length(street) > 0 AND char_length(street) <= 200);

ALTER TABLE messages 
ADD CONSTRAINT check_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 5000);

-- Fix 3: Add RLS policy to prevent location data exposure through service_requests
-- Only allow specialists to see location details after quote is accepted
CREATE POLICY "Specialists can view location for accepted quotes"
ON locations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM service_requests sr
    JOIN quotes q ON q.request_id = sr.id
    WHERE sr.location_id = locations.id
      AND q.status = 'accepted'
      AND EXISTS (
        SELECT 1 
        FROM specialist_profiles sp 
        WHERE sp.id = q.specialist_id 
          AND sp.user_id = auth.uid()
      )
  )
);

-- Add storage policies to restrict file types
CREATE POLICY "Restrict file uploads to images and PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'specialist-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM specialist_profiles WHERE user_id = auth.uid()
    )
  ) AND
  (
    lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'pdf') OR
    lower((metadata->>'mimetype')::text) SIMILAR TO '(image/(jpeg|png|webp)|application/pdf)'
  )
);