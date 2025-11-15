-- Add time_preference field to service_requests to store the selected time option
ALTER TABLE service_requests 
ADD COLUMN time_preference text DEFAULT NULL;

-- Add is_urgent field to service_requests to mark urgent requests
ALTER TABLE service_requests 
ADD COLUMN is_urgent boolean DEFAULT false;