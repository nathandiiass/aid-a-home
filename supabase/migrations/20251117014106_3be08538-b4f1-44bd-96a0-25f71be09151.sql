-- Asegurar que el trigger para crear perfiles existe y funciona con Google OAuth
-- Este trigger se ejecuta cuando un usuario se registra (incluyendo Google Sign-In)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  full_name_parts TEXT[];
  first_name_value TEXT;
  last_name_value TEXT;
BEGIN
  -- Para usuarios de Google OAuth, extraer nombre del full_name
  IF new.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    full_name_parts := string_to_array(new.raw_user_meta_data->>'full_name', ' ');
    first_name_value := full_name_parts[1];
    last_name_value := array_to_string(full_name_parts[2:array_length(full_name_parts, 1)], ' ');
  ELSE
    first_name_value := new.raw_user_meta_data->>'first_name';
    last_name_value := new.raw_user_meta_data->>'last_name_paterno';
  END IF;

  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name_paterno,
    display_name,
    avatar_url,
    date_of_birth,
    gender,
    phone,
    accepted_terms_at,
    accepted_privacy_at
  )
  VALUES (
    new.id,
    COALESCE(first_name_value, 'Usuario'),
    last_name_value,
    COALESCE(new.raw_user_meta_data->>'full_name', first_name_value || ' ' || COALESCE(last_name_value, '')),
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      THEN (new.raw_user_meta_data->>'date_of_birth')::date 
      ELSE NULL 
    END,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'phone',
    CASE 
      WHEN (new.raw_user_meta_data->>'accepted_terms')::boolean = true 
      THEN now() 
      ELSE NULL 
    END,
    CASE 
      WHEN (new.raw_user_meta_data->>'accepted_privacy')::boolean = true 
      THEN now() 
      ELSE NULL 
    END
  );
  
  RETURN new;
END;
$$;

-- Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();