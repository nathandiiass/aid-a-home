-- Create new tables for specialist categories and tags
CREATE TABLE public.specialist_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialist_profiles(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  experience_years INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(specialist_id, category_id)
);

CREATE TABLE public.specialist_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialist_profiles(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES public.category_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(specialist_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.specialist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for specialist_categories
CREATE POLICY "Users can view their own categories"
  ON public.specialist_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_categories.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own categories"
  ON public.specialist_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_categories.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own categories"
  ON public.specialist_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_categories.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own categories"
  ON public.specialist_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_categories.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Specialists can view active request categories"
  ON public.specialist_categories FOR SELECT
  USING (true);

-- RLS Policies for specialist_tags
CREATE POLICY "Users can view their own tags"
  ON public.specialist_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_tags.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own tags"
  ON public.specialist_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_tags.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tags"
  ON public.specialist_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_tags.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own tags"
  ON public.specialist_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM specialist_profiles
      WHERE specialist_profiles.id = specialist_tags.specialist_id
        AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Specialists can view active request tags"
  ON public.specialist_tags FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_specialist_categories_specialist ON public.specialist_categories(specialist_id);
CREATE INDEX idx_specialist_categories_category ON public.specialist_categories(category_id);
CREATE INDEX idx_specialist_tags_specialist ON public.specialist_tags(specialist_id);
CREATE INDEX idx_specialist_tags_tag ON public.specialist_tags(tag_id);

-- Drop old tables (CASCADE will remove all dependent objects)
DROP TABLE IF EXISTS public.specialist_activities CASCADE;
DROP TABLE IF EXISTS public.specialist_specialties CASCADE;
DROP TABLE IF EXISTS public.servicios_domesticos CASCADE;