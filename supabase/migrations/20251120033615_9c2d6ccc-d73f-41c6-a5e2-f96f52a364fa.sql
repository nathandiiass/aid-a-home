-- Allow anyone to view specialist portfolio (public information)
CREATE POLICY "Anyone can view specialist portfolio"
  ON specialist_portfolio FOR SELECT
  USING (true);