
-- Actualizar función delete_specialist_role para usar las nuevas tablas
CREATE OR REPLACE FUNCTION delete_specialist_role(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_specialist_id uuid;
  v_active_orders integer;
  v_deleted_records jsonb;
BEGIN
  -- Obtener el specialist_id del usuario
  SELECT id INTO v_specialist_id
  FROM specialist_profiles
  WHERE user_id = p_user_id;
  
  IF v_specialist_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuario no tiene perfil de especialista'
    );
  END IF;
  
  -- Verificar órdenes activas o en progreso
  SELECT COUNT(*) INTO v_active_orders
  FROM service_requests sr
  JOIN quotes q ON q.request_id = sr.id
  WHERE q.specialist_id = v_specialist_id
    AND q.status = 'accepted'
    AND sr.status IN ('active', 'in_progress');
  
  IF v_active_orders > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No se puede eliminar el perfil con órdenes activas',
      'active_orders', v_active_orders
    );
  END IF;
  
  -- Contar registros antes de eliminar (para información)
  SELECT jsonb_build_object(
    'credentials', (SELECT COUNT(*) FROM specialist_credentials WHERE specialist_id = v_specialist_id),
    'categories', (SELECT COUNT(*) FROM specialist_categories WHERE specialist_id = v_specialist_id),
    'tags', (SELECT COUNT(*) FROM specialist_tags WHERE specialist_id = v_specialist_id),
    'work_zones', (SELECT COUNT(*) FROM specialist_work_zones WHERE specialist_id = v_specialist_id),
    'quotes', (SELECT COUNT(*) FROM quotes WHERE specialist_id = v_specialist_id),
    'reviews', (SELECT COUNT(*) FROM reviews WHERE specialist_id = v_specialist_id),
    'client_reviews', (SELECT COUNT(*) FROM client_reviews WHERE specialist_id = v_specialist_id)
  ) INTO v_deleted_records;
  
  -- Eliminar el perfil de especialista (esto disparará CASCADE en todas las tablas relacionadas)
  DELETE FROM specialist_profiles WHERE id = v_specialist_id;
  
  -- Eliminar el rol 'specialist' de user_roles
  DELETE FROM user_roles 
  WHERE user_id = p_user_id 
    AND role = 'specialist';
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Rol de especialista eliminado exitosamente',
    'deleted_records', v_deleted_records,
    'specialist_id', v_specialist_id
  );
END;
$$;
