-- Add service_title and service_description to service_requests table
ALTER TABLE service_requests 
ADD COLUMN service_title TEXT,
ADD COLUMN service_description TEXT;

-- Add helpful comment
COMMENT ON COLUMN service_requests.service_title IS 'User-provided title for the service request (e.g., "Cortar pasto de mi patio")';
COMMENT ON COLUMN service_requests.service_description IS 'Detailed description of the service needed including location, dimensions, materials, etc.';