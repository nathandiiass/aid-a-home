-- Add new columns to specialist_profiles table
ALTER TABLE specialist_profiles
ADD COLUMN IF NOT EXISTS person_type text CHECK (person_type IN ('fisica', 'moral')),
ADD COLUMN IF NOT EXISTS razon_social text,
ADD COLUMN IF NOT EXISTS birth_or_constitution_date date,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS street_number text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS professional_description text,
ADD COLUMN IF NOT EXISTS licenses_certifications text,
ADD COLUMN IF NOT EXISTS csf_document_url text,
ADD COLUMN IF NOT EXISTS address_proof_url text,
ADD COLUMN IF NOT EXISTS accepted_terms_at timestamp with time zone;

-- Add gender column to profiles table if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gender text;

-- Add experience_years to specialist_specialties
ALTER TABLE specialist_specialties
ADD COLUMN IF NOT EXISTS experience_years integer;

-- Add coverage_state and coverage_municipalities to specialist_work_zones
ALTER TABLE specialist_work_zones
ADD COLUMN IF NOT EXISTS coverage_municipalities text[];

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_specialist_profiles_person_type ON specialist_profiles(person_type);
CREATE INDEX IF NOT EXISTS idx_specialist_profiles_state ON specialist_profiles(state);