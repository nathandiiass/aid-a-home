-- Add new fields to quotes table for complete quote functionality
ALTER TABLE public.quotes
ADD COLUMN scope TEXT,
ADD COLUMN exclusions TEXT,
ADD COLUMN warranty_days INTEGER DEFAULT 0,
ADD COLUMN requires_visit BOOLEAN DEFAULT false,
ADD COLUMN visit_cost NUMERIC,
ADD COLUMN attachments TEXT[],
ADD COLUMN additional_notes TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.quotes.scope IS 'What is included in the service';
COMMENT ON COLUMN public.quotes.exclusions IS 'What is NOT included in the service';
COMMENT ON COLUMN public.quotes.warranty_days IS 'Number of warranty days (0 if no warranty)';
COMMENT ON COLUMN public.quotes.requires_visit IS 'Whether a previous visit is required';
COMMENT ON COLUMN public.quotes.visit_cost IS 'Cost of the previous visit if required';
COMMENT ON COLUMN public.quotes.attachments IS 'URLs of attached photos/documents';
COMMENT ON COLUMN public.quotes.additional_notes IS 'Additional observations or conditions';