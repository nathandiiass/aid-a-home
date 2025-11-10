-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create locations table for saved user addresses
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  street TEXT NOT NULL,
  neighborhood TEXT,
  ext_number TEXT,
  int_number TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own locations"
ON public.locations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations"
ON public.locations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations"
ON public.locations FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations"
ON public.locations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create specialist_profiles table
CREATE TABLE public.specialist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  rfc TEXT NOT NULL,
  id_document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.specialist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own specialist profile"
ON public.specialist_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own specialist profile"
ON public.specialist_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own specialist profile"
ON public.specialist_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Create specialist_specialties table
CREATE TABLE public.specialist_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialist_profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  role_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.specialist_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own specialties"
ON public.specialist_specialties FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_profiles
  WHERE specialist_profiles.id = specialist_specialties.specialist_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own specialties"
ON public.specialist_specialties FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.specialist_profiles
  WHERE specialist_profiles.id = specialist_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their own specialties"
ON public.specialist_specialties FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_profiles
  WHERE specialist_profiles.id = specialist_specialties.specialist_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own specialties"
ON public.specialist_specialties FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_profiles
  WHERE specialist_profiles.id = specialist_specialties.specialist_id
  AND specialist_profiles.user_id = auth.uid()
));

-- Create specialist_activities table
CREATE TABLE public.specialist_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id UUID NOT NULL REFERENCES public.specialist_specialties(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.specialist_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
ON public.specialist_activities FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_specialties
  JOIN public.specialist_profiles ON specialist_profiles.id = specialist_specialties.specialist_id
  WHERE specialist_specialties.id = specialist_activities.specialty_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own activities"
ON public.specialist_activities FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.specialist_specialties
  JOIN public.specialist_profiles ON specialist_profiles.id = specialist_specialties.specialist_id
  WHERE specialist_specialties.id = specialty_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their own activities"
ON public.specialist_activities FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_specialties
  JOIN public.specialist_profiles ON specialist_profiles.id = specialist_specialties.specialist_id
  WHERE specialist_specialties.id = specialist_activities.specialty_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own activities"
ON public.specialist_activities FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_specialties
  JOIN public.specialist_profiles ON specialist_profiles.id = specialist_specialties.specialist_id
  WHERE specialist_specialties.id = specialist_activities.specialty_id
  AND specialist_profiles.user_id = auth.uid()
));

-- Create specialist_work_zones table
CREATE TABLE public.specialist_work_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialist_profiles(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  cities TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.specialist_work_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work zones"
ON public.specialist_work_zones FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_profiles
  WHERE specialist_profiles.id = specialist_work_zones.specialist_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own work zones"
ON public.specialist_work_zones FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.specialist_profiles
  WHERE specialist_profiles.id = specialist_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their own work zones"
ON public.specialist_work_zones FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_profiles
  WHERE specialist_profiles.id = specialist_work_zones.specialist_id
  AND specialist_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own work zones"
ON public.specialist_work_zones FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.specialist_profiles
  WHERE specialist_profiles.id = specialist_work_zones.specialist_id
  AND specialist_profiles.user_id = auth.uid()
));

-- Storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('specialist-documents', 'specialist-documents', false);

-- Storage policies
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'specialist-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'specialist-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'specialist-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'specialist-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Triggers
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specialist_profiles_updated_at
BEFORE UPDATE ON public.specialist_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();