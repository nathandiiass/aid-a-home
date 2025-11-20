-- Create specialist_portfolio table
CREATE TABLE specialist_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL REFERENCES specialist_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add comment
COMMENT ON TABLE specialist_portfolio IS 'Portfolio items for specialists with images and titles';

-- Enable RLS
ALTER TABLE specialist_portfolio ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own portfolio"
  ON specialist_portfolio FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_portfolio.specialist_id
      AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own portfolio"
  ON specialist_portfolio FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_portfolio.specialist_id
      AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own portfolio"
  ON specialist_portfolio FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_portfolio.specialist_id
      AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own portfolio"
  ON specialist_portfolio FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_portfolio.specialist_id
      AND specialist_profiles.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_specialist_portfolio_updated_at
  BEFORE UPDATE ON specialist_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();