-- Create client_reviews table
CREATE TABLE public.client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  client_id UUID NOT NULL,
  specialist_id UUID NOT NULL,
  claridad_necesidades INTEGER NOT NULL CHECK (claridad_necesidades BETWEEN 1 AND 5),
  puntualidad_disponibilidad INTEGER NOT NULL CHECK (puntualidad_disponibilidad BETWEEN 1 AND 5),
  respeto_profesionalismo_cliente INTEGER NOT NULL CHECK (respeto_profesionalismo_cliente BETWEEN 1 AND 5),
  facilito_condiciones_trabajo INTEGER NOT NULL CHECK (facilito_condiciones_trabajo BETWEEN 1 AND 5),
  claridad_cumplimiento_pago INTEGER NOT NULL CHECK (claridad_cumplimiento_pago BETWEEN 1 AND 5),
  volveria_trabajar_con_cliente BOOLEAN NOT NULL,
  average_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, specialist_id)
);

-- Enable RLS
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_reviews
CREATE POLICY "Specialists can create reviews for their orders"
ON public.client_reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes q
    JOIN service_requests sr ON sr.id = q.request_id
    WHERE q.specialist_id = client_reviews.specialist_id
    AND sr.id = client_reviews.order_id
    AND q.status = 'accepted'
    AND sr.status = 'completed'
    AND EXISTS (
      SELECT 1 FROM specialist_profiles sp
      WHERE sp.id = q.specialist_id
      AND sp.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Specialists can view their own reviews"
ON public.client_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM specialist_profiles
    WHERE specialist_profiles.id = client_reviews.specialist_id
    AND specialist_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view reviews about them"
ON public.client_reviews
FOR SELECT
USING (auth.uid() = client_id);

-- Add client rating fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rating_promedio_cliente NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews_cliente INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_claridad_necesidades NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_puntualidad_disponibilidad NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_respeto_profesionalismo_cliente NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_facilito_condiciones_trabajo NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_claridad_cumplimiento_pago NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS porcentaje_volveria_trabajar_cliente NUMERIC DEFAULT 0;

-- Add client_review_submitted flag to service_requests
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS client_review_submitted BOOLEAN DEFAULT false;

-- Create trigger to update client rating
CREATE OR REPLACE FUNCTION public.update_client_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_current_total integer;
  v_current_avg numeric;
  v_new_total integer;
  v_new_avg numeric;
  v_total_claridad numeric;
  v_total_puntualidad numeric;
  v_total_respeto numeric;
  v_total_facilito numeric;
  v_total_pago numeric;
  v_count_volveria integer;
BEGIN
  v_client_id := NEW.client_id;
  
  -- Get current values
  SELECT 
    COALESCE(rating_promedio_cliente, 0),
    COALESCE(total_reviews_cliente, 0)
  INTO v_current_avg, v_current_total
  FROM profiles
  WHERE id = v_client_id;
  
  -- Calculate new total
  v_new_total := v_current_total + 1;
  
  -- Calculate new average incrementally
  v_new_avg := ((v_current_avg * v_current_total) + NEW.average_score) / v_new_total;
  
  -- Calculate category averages
  SELECT 
    COALESCE(AVG(claridad_necesidades), 0),
    COALESCE(AVG(puntualidad_disponibilidad), 0),
    COALESCE(AVG(respeto_profesionalismo_cliente), 0),
    COALESCE(AVG(facilito_condiciones_trabajo), 0),
    COALESCE(AVG(claridad_cumplimiento_pago), 0),
    COUNT(*) FILTER (WHERE volveria_trabajar_con_cliente = true)
  INTO 
    v_total_claridad,
    v_total_puntualidad,
    v_total_respeto,
    v_total_facilito,
    v_total_pago,
    v_count_volveria
  FROM client_reviews
  WHERE client_id = v_client_id;
  
  -- Update profiles
  UPDATE profiles
  SET 
    rating_promedio_cliente = v_new_avg,
    total_reviews_cliente = v_new_total,
    avg_claridad_necesidades = v_total_claridad,
    avg_puntualidad_disponibilidad = v_total_puntualidad,
    avg_respeto_profesionalismo_cliente = v_total_respeto,
    avg_facilito_condiciones_trabajo = v_total_facilito,
    avg_claridad_cumplimiento_pago = v_total_pago,
    porcentaje_volveria_trabajar_cliente = CASE 
      WHEN v_new_total > 0 THEN (v_count_volveria::numeric / v_new_total::numeric) * 100
      ELSE 0
    END,
    updated_at = now()
  WHERE id = v_client_id;
  
  -- Mark order as client_review_submitted
  UPDATE service_requests
  SET client_review_submitted = true
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_client_rating_trigger
AFTER INSERT ON public.client_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_client_rating();

-- Create trigger for updated_at
CREATE TRIGGER update_client_reviews_updated_at
BEFORE UPDATE ON public.client_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();