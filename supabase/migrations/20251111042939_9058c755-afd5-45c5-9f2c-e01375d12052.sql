-- Add missing fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add missing fields to specialist_profiles table
ALTER TABLE public.specialist_profiles
ADD COLUMN IF NOT EXISTS materials_policy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS warranty_days INTEGER DEFAULT 0;

-- Create specialist_credentials table
CREATE TABLE IF NOT EXISTS public.specialist_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('degree', 'cert', 'course')),
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  issued_at DATE,
  expires_at DATE,
  description TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for specialist_credentials
CREATE INDEX IF NOT EXISTS idx_specialist_credentials_specialist_id 
ON public.specialist_credentials(specialist_id);

-- Enable RLS on specialist_credentials
ALTER TABLE public.specialist_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for specialist_credentials
CREATE POLICY "Users can view their own credentials"
ON public.specialist_credentials
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM specialist_profiles
    WHERE specialist_profiles.id = specialist_credentials.specialist_id
    AND specialist_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own credentials"
ON public.specialist_credentials
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM specialist_profiles
    WHERE specialist_profiles.id = specialist_credentials.specialist_id
    AND specialist_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own credentials"
ON public.specialist_credentials
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM specialist_profiles
    WHERE specialist_profiles.id = specialist_credentials.specialist_id
    AND specialist_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own credentials"
ON public.specialist_credentials
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM specialist_profiles
    WHERE specialist_profiles.id = specialist_credentials.specialist_id
    AND specialist_profiles.user_id = auth.uid()
  )
);

-- Create trigger for updated_at on specialist_credentials
CREATE TRIGGER update_specialist_credentials_updated_at
BEFORE UPDATE ON public.specialist_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add validation constraints
ALTER TABLE public.profiles
ADD CONSTRAINT check_bio_length CHECK (char_length(bio) <= 500);

ALTER TABLE public.specialist_credentials
ADD CONSTRAINT check_description_length CHECK (char_length(description) <= 200);