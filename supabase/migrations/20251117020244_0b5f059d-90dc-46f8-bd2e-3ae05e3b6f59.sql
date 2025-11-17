-- Primero, eliminar especialidades existentes del usuario de prueba
DELETE FROM specialist_activities 
WHERE specialty_id IN (
  SELECT id FROM specialist_specialties 
  WHERE specialist_id = '6bf5e3b7-4a9e-43ce-9c94-539c59961f2d'
);

DELETE FROM specialist_specialties 
WHERE specialist_id = '6bf5e3b7-4a9e-43ce-9c94-539c59961f2d';

-- Insertar todas las especialidades únicas
WITH unique_specialties AS (
  SELECT DISTINCT categoria, especialista
  FROM servicios_domesticos
  ORDER BY categoria, especialista
)
INSERT INTO specialist_specialties (specialist_id, specialty, role_label, experience_years)
SELECT 
  '6bf5e3b7-4a9e-43ce-9c94-539c59961f2d',
  categoria,
  especialista,
  5
FROM unique_specialties;

-- Insertar todas las actividades con precio_min = 100
WITH specialty_mapping AS (
  SELECT 
    ss.id as specialty_id,
    ss.specialty,
    ss.role_label,
    sd.actividad
  FROM specialist_specialties ss
  JOIN servicios_domesticos sd 
    ON ss.specialty = sd.categoria 
    AND ss.role_label = sd.especialista
  WHERE ss.specialist_id = '6bf5e3b7-4a9e-43ce-9c94-539c59961f2d'
)
INSERT INTO specialist_activities (specialty_id, activity, price_min)
SELECT DISTINCT
  specialty_id,
  actividad,
  100
FROM specialty_mapping
ORDER BY specialty_id, actividad;