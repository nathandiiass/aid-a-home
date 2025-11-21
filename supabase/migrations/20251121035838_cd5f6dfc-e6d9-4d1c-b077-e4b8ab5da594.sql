-- Create table for specialist request rejections
CREATE TABLE IF NOT EXISTS public.specialist_request_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialist_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  main_reason TEXT NOT NULL,
  other_reason_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specialist_request_rejections ENABLE ROW LEVEL SECURITY;

-- Policy: Specialists can insert their own rejections
CREATE POLICY "Specialists can insert their own rejections"
  ON public.specialist_request_rejections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_request_rejections.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

-- Policy: Specialists can view their own rejections
CREATE POLICY "Specialists can view their own rejections"
  ON public.specialist_request_rejections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_request_rejections.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX idx_specialist_request_rejections_specialist_id 
  ON public.specialist_request_rejections(specialist_id);

CREATE INDEX idx_specialist_request_rejections_request_id 
  ON public.specialist_request_rejections(request_id);