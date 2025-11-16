-- Create table for request cancellation feedback
CREATE TABLE IF NOT EXISTS public.request_cancellation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_id UUID NOT NULL,
  main_reason TEXT NOT NULL,
  other_reason_text TEXT,
  improvement_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.request_cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.request_cancellation_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.request_cancellation_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_request_cancellation_feedback_user_id ON public.request_cancellation_feedback(user_id);
CREATE INDEX idx_request_cancellation_feedback_request_id ON public.request_cancellation_feedback(request_id);