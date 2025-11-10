-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (id, first_name, last_name_paterno, last_name_materno, display_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name_paterno', au.raw_user_meta_data->>'last_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name_materno', ''),
  TRIM(CONCAT(
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    ' ',
    COALESCE(au.raw_user_meta_data->>'last_name_paterno', au.raw_user_meta_data->>'last_name', '')
  ))
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;