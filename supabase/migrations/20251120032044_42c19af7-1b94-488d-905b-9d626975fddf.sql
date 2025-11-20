-- Add specialist_type field to specialist_profiles table
ALTER TABLE specialist_profiles 
ADD COLUMN specialist_type text CHECK (specialist_type IN ('independiente', 'agencia'));

-- Add comment to describe the column
COMMENT ON COLUMN specialist_profiles.specialist_type IS 'Tipo de especialista: independiente o agencia';