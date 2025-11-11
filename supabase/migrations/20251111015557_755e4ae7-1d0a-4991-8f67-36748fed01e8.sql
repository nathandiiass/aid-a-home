-- Remove the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view specialists who quoted their requests" ON public.specialist_profiles;

-- Create a simpler policy: allow authenticated users to view specialist profiles
-- This is safe because specialist_profiles only contains business info, not sensitive personal data
CREATE POLICY "Authenticated users can view specialist profiles"
ON public.specialist_profiles
FOR SELECT
TO authenticated
USING (true);