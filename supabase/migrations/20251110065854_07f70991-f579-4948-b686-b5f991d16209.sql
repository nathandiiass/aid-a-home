-- Create enum for order status
CREATE TYPE public.service_request_status AS ENUM ('draft', 'active', 'in_progress', 'completed', 'cancelled');

-- Create enum for quote status
CREATE TYPE public.quote_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create service_requests table (órdenes)
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  category TEXT NOT NULL,
  status public.service_request_status NOT NULL DEFAULT 'draft',
  price_min NUMERIC,
  price_max NUMERIC,
  scheduled_date DATE,
  time_start TIME,
  time_end TIME,
  location_id UUID REFERENCES public.locations(id),
  description TEXT,
  evidence_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes table (cotizaciones)
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialist_profiles(id) ON DELETE CASCADE,
  price_min NUMERIC,
  price_max NUMERIC,
  price_fixed NUMERIC,
  proposed_date DATE,
  proposed_time_start TIME,
  proposed_time_end TIME,
  estimated_duration_hours NUMERIC,
  includes_materials BOOLEAN DEFAULT false,
  materials_list TEXT,
  description TEXT,
  has_warranty BOOLEAN DEFAULT false,
  warranty_description TEXT,
  status public.quote_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table (reseñas)
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialist_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Create messages table (chat)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_requests
CREATE POLICY "Users can view their own requests"
  ON public.service_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON public.service_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests"
  ON public.service_requests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Specialists can view active requests"
  ON public.service_requests FOR SELECT
  USING (status = 'active');

-- RLS Policies for quotes
CREATE POLICY "Users can view quotes for their requests"
  ON public.quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE service_requests.id = quotes.request_id
      AND service_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Specialists can view their own quotes"
  ON public.quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.specialist_profiles
      WHERE specialist_profiles.id = quotes.specialist_id
      AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Specialists can create quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.specialist_profiles
      WHERE specialist_profiles.id = quotes.specialist_id
      AND specialist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Specialists can update their own quotes"
  ON public.quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.specialist_profiles
      WHERE specialist_profiles.id = quotes.specialist_id
      AND specialist_profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their requests"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their quotes"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      JOIN public.service_requests ON service_requests.id = quotes.request_id
      WHERE quotes.id = messages.quote_id
      AND (service_requests.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.specialist_profiles
        WHERE specialist_profiles.id = quotes.specialist_id
        AND specialist_profiles.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can send messages in their quotes"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.quotes
      JOIN public.service_requests ON service_requests.id = quotes.request_id
      WHERE quotes.id = messages.quote_id
      AND (service_requests.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.specialist_profiles
        WHERE specialist_profiles.id = quotes.specialist_id
        AND specialist_profiles.user_id = auth.uid()
      ))
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_quotes_request_id ON public.quotes(request_id);
CREATE INDEX idx_quotes_specialist_id ON public.quotes(specialist_id);
CREATE INDEX idx_reviews_specialist_id ON public.reviews(specialist_id);
CREATE INDEX idx_messages_quote_id ON public.messages(quote_id);