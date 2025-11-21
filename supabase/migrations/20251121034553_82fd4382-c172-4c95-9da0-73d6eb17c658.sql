-- Create table for specialist problem reports
CREATE TABLE public.specialist_problem_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL,
  main_reason TEXT NOT NULL,
  other_reason_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.specialist_problem_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for specialist problem reports
CREATE POLICY "Users can create their own problem reports" 
ON public.specialist_problem_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own problem reports" 
ON public.specialist_problem_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Specialists can view problem reports about them" 
ON public.specialist_problem_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.specialist_profiles 
    WHERE specialist_profiles.id = specialist_problem_reports.specialist_id 
    AND specialist_profiles.user_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX idx_specialist_problem_reports_request_id ON public.specialist_problem_reports(request_id);
CREATE INDEX idx_specialist_problem_reports_specialist_id ON public.specialist_problem_reports(specialist_id);