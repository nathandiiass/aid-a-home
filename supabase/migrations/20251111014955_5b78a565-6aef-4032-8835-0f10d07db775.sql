-- Allow users to view specialist profiles that have sent quotes to their requests
CREATE POLICY "Users can view specialists who quoted their requests"
ON public.specialist_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.quotes
    JOIN public.service_requests ON service_requests.id = quotes.request_id
    WHERE quotes.specialist_id = specialist_profiles.id
      AND service_requests.user_id = auth.uid()
  )
);