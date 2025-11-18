-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id INTEGER PRIMARY KEY,
  category_key TEXT NOT NULL UNIQUE,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create category_tags table
CREATE TABLE IF NOT EXISTS public.category_tags (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES public.categories(id),
  tag_key TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create category_keywords table
CREATE TABLE IF NOT EXISTS public.category_keywords (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES public.categories(id),
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_category_tags_category_id ON public.category_tags(category_id);
CREATE INDEX IF NOT EXISTS idx_category_keywords_category_id ON public.category_keywords(category_id);
CREATE INDEX IF NOT EXISTS idx_category_keywords_keyword ON public.category_keywords(keyword);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (catalog data)
CREATE POLICY "Anyone can read categories"
  ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read category_tags"
  ON public.category_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read category_keywords"
  ON public.category_keywords
  FOR SELECT
  USING (true);