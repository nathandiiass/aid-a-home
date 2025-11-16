-- Agregar campos detallados a la tabla reviews para la encuesta completa
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS puntualidad integer,
ADD COLUMN IF NOT EXISTS calidad_trabajo integer,
ADD COLUMN IF NOT EXISTS profesionalismo integer,
ADD COLUMN IF NOT EXISTS cumplimiento_servicio integer,
ADD COLUMN IF NOT EXISTS relacion_calidad_precio integer,
ADD COLUMN IF NOT EXISTS volveria_trabajar boolean,
ADD COLUMN IF NOT EXISTS average_score numeric;

-- Agregar restricciones para validar rangos de las calificaciones
ALTER TABLE public.reviews
ADD CONSTRAINT check_puntualidad_range CHECK (puntualidad >= 1 AND puntualidad <= 5),
ADD CONSTRAINT check_calidad_trabajo_range CHECK (calidad_trabajo >= 1 AND calidad_trabajo <= 5),
ADD CONSTRAINT check_profesionalismo_range CHECK (profesionalismo >= 1 AND profesionalismo <= 5),
ADD CONSTRAINT check_cumplimiento_servicio_range CHECK (cumplimiento_servicio >= 1 AND cumplimiento_servicio <= 5),
ADD CONSTRAINT check_relacion_calidad_precio_range CHECK (relacion_calidad_precio >= 1 AND relacion_calidad_precio <= 5);

-- Agregar índice único para asegurar una sola reseña por orden y usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_request_user_unique 
ON public.reviews(request_id, user_id);

-- Agregar campos de rating global a specialist_profiles
ALTER TABLE public.specialist_profiles
ADD COLUMN IF NOT EXISTS rating_promedio numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_puntualidad numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_calidad_trabajo numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_profesionalismo numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_cumplimiento_servicio numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_relacion_calidad_precio numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS porcentaje_volveria numeric DEFAULT 0;

-- Agregar campo para marcar órdenes pendientes de review
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS review_submitted boolean DEFAULT false;

-- Función para actualizar el rating del especialista cuando se crea una nueva reseña
CREATE OR REPLACE FUNCTION public.update_specialist_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_specialist_id uuid;
  v_current_total integer;
  v_current_avg numeric;
  v_new_total integer;
  v_new_avg numeric;
  v_total_puntualidad numeric;
  v_total_calidad numeric;
  v_total_profesionalismo numeric;
  v_total_cumplimiento numeric;
  v_total_relacion numeric;
  v_count_volveria integer;
BEGIN
  -- Obtener el specialist_id desde la reseña
  v_specialist_id := NEW.specialist_id;
  
  -- Obtener valores actuales del especialista
  SELECT 
    COALESCE(rating_promedio, 0),
    COALESCE(total_reviews, 0)
  INTO v_current_avg, v_current_total
  FROM specialist_profiles
  WHERE id = v_specialist_id;
  
  -- Calcular nuevo total
  v_new_total := v_current_total + 1;
  
  -- Calcular nuevo promedio general de manera incremental
  v_new_avg := ((v_current_avg * v_current_total) + NEW.average_score) / v_new_total;
  
  -- Calcular promedios por categoría (recalcular desde todas las reseñas)
  SELECT 
    COALESCE(AVG(puntualidad), 0),
    COALESCE(AVG(calidad_trabajo), 0),
    COALESCE(AVG(profesionalismo), 0),
    COALESCE(AVG(cumplimiento_servicio), 0),
    COALESCE(AVG(relacion_calidad_precio), 0),
    COUNT(*) FILTER (WHERE volveria_trabajar = true)
  INTO 
    v_total_puntualidad,
    v_total_calidad,
    v_total_profesionalismo,
    v_total_cumplimiento,
    v_total_relacion,
    v_count_volveria
  FROM reviews
  WHERE specialist_id = v_specialist_id;
  
  -- Actualizar specialist_profiles
  UPDATE specialist_profiles
  SET 
    rating_promedio = v_new_avg,
    total_reviews = v_new_total,
    avg_puntualidad = v_total_puntualidad,
    avg_calidad_trabajo = v_total_calidad,
    avg_profesionalismo = v_total_profesionalismo,
    avg_cumplimiento_servicio = v_total_cumplimiento,
    avg_relacion_calidad_precio = v_total_relacion,
    porcentaje_volveria = CASE 
      WHEN v_new_total > 0 THEN (v_count_volveria::numeric / v_new_total::numeric) * 100
      ELSE 0
    END,
    updated_at = now()
  WHERE id = v_specialist_id;
  
  -- Marcar la orden como review_submitted
  UPDATE service_requests
  SET review_submitted = true
  WHERE id = NEW.request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear trigger para actualizar rating cuando se inserta una nueva reseña
DROP TRIGGER IF EXISTS trigger_update_specialist_rating ON public.reviews;
CREATE TRIGGER trigger_update_specialist_rating
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_specialist_rating();

-- Función para validar si un usuario puede dejar una reseña
CREATE OR REPLACE FUNCTION public.can_submit_review(
  p_request_id uuid,
  p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_request record;
  v_review_exists boolean;
BEGIN
  -- Verificar que la orden existe y pertenece al usuario
  SELECT 
    sr.id,
    sr.user_id,
    sr.status,
    q.specialist_id
  INTO v_request
  FROM service_requests sr
  LEFT JOIN quotes q ON q.request_id = sr.id AND q.status = 'accepted'
  WHERE sr.id = p_request_id;
  
  -- Si no existe la orden
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'order_not_found'
    );
  END IF;
  
  -- Verificar que la orden pertenece al usuario
  IF v_request.user_id != p_user_id THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'not_order_owner'
    );
  END IF;
  
  -- Verificar que la orden está completada
  IF v_request.status != 'completed' THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'order_not_completed'
    );
  END IF;
  
  -- Verificar que tiene un especialista asignado
  IF v_request.specialist_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'no_specialist_assigned'
    );
  END IF;
  
  -- Verificar que no existe ya una reseña
  SELECT EXISTS(
    SELECT 1 FROM reviews
    WHERE request_id = p_request_id AND user_id = p_user_id
  ) INTO v_review_exists;
  
  IF v_review_exists THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'review_already_exists'
    );
  END IF;
  
  -- Todo está bien, puede enviar la reseña
  RETURN jsonb_build_object(
    'can_submit', true,
    'specialist_id', v_request.specialist_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;