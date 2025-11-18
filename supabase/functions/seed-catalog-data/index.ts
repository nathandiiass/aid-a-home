import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting to seed catalog data...');

    // Insert categories
    const categories = [
      {id:1,category_key:'jardineria',category_name:'Jardinería'},
      {id:2,category_key:'plomeria',category_name:'Plomería'},
      {id:3,category_key:'electricidad',category_name:'Electricidad'},
      {id:4,category_key:'albanileria_construccion_ligera',category_name:'Albañilería y construcción ligera'},
      {id:5,category_key:'pintura_impermeabilizacion',category_name:'Pintura e impermeabilización'},
      {id:6,category_key:'carpinteria_muebles',category_name:'Carpintería y muebles'},
      {id:7,category_key:'herreria_soldadura',category_name:'Herrería y soldadura'},
      {id:8,category_key:'vidrieria_aluminio',category_name:'Vidriería y aluminio'},
      {id:9,category_key:'cerrajeria',category_name:'Cerrajería'},
      {id:10,category_key:'limpieza_hogar',category_name:'Limpieza del hogar'},
      {id:11,category_key:'limpieza_comercial',category_name:'Limpieza comercial e industrial'},
      {id:12,category_key:'fumigacion',category_name:'Fumigación y control de plagas'},
      {id:13,category_key:'climatizacion',category_name:'Climatización (A/C y refrigeración)'},
      {id:14,category_key:'albercas',category_name:'Albercas'},
      {id:15,category_key:'automotriz',category_name:'Servicios automotrices'},
      {id:16,category_key:'mudanzas_fletes',category_name:'Mudanzas y fletes'},
      {id:17,category_key:'eventos_banquetes',category_name:'Eventos y banquetes'},
      {id:18,category_key:'fotografia_video',category_name:'Fotografía y video'},
      {id:19,category_key:'gastronomia',category_name:'Gastronomía'},
      {id:20,category_key:'educacion_clases',category_name:'Educación y clases particulares'},
      {id:21,category_key:'tecnologia_computacion',category_name:'Tecnología y computación'},
      {id:22,category_key:'seguridad_fisica_electronica',category_name:'Seguridad física y electrónica'},
      {id:23,category_key:'decoracion_interiores',category_name:'Decoración y diseño de interiores'},
      {id:24,category_key:'energia_solar',category_name:'Energía solar'},
      {id:25,category_key:'mantenimiento_general',category_name:'Mantenimiento general'},
      {id:26,category_key:'servicios_profesionales',category_name:'Servicios profesionales'},
      {id:27,category_key:'creativo_digital',category_name:'Creativo digital y marketing'}
    ];

    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'id' });

    if (categoriesError) {
      console.error('Error inserting categories:', categoriesError);
      throw categoriesError;
    }

    console.log('Categories inserted successfully');

    // Insert category_tags (first batch)
    const categoryTags = [
      {id:1,category_id:1,tag_key:'corte_pasto',tag_name:'Corte de pasto'},
      {id:2,category_id:1,tag_key:'poda_arboles',tag_name:'Poda de árboles'},
      {id:3,category_id:1,tag_key:'poda_arbustos',tag_name:'Poda de arbustos y setos'},
      {id:4,category_id:1,tag_key:'deshierbe',tag_name:'Deshierbe y retiro de maleza'},
      {id:5,category_id:1,tag_key:'siembra_pasto',tag_name:'Siembra o resiembra de pasto'},
      {id:6,category_id:1,tag_key:'siembra_plantas',tag_name:'Plantación de plantas y flores'},
      {id:7,category_id:1,tag_key:'siembra_arboles',tag_name:'Plantación de árboles'},
      {id:8,category_id:1,tag_key:'mantenimiento_jardin',tag_name:'Mantenimiento de jardín'},
      {id:9,category_id:1,tag_key:'sistemas_riego_instalacion',tag_name:'Instalar sistema de riego'},
      {id:10,category_id:1,tag_key:'sistemas_riego_reparacion',tag_name:'Reparar sistema de riego'},
      {id:11,category_id:1,tag_key:'diseno_jardines',tag_name:'Diseño de jardines'},
      {id:12,category_id:1,tag_key:'jardineria_azoteas',tag_name:'Jardinería en azoteas'},
      {id:13,category_id:1,tag_key:'fertilizacion_jardin',tag_name:'Fertilización de jardín'},
      {id:14,category_id:1,tag_key:'tala_controlada',tag_name:'Tala controlada'},
      {id:15,category_id:1,tag_key:'limpieza_jardin',tag_name:'Limpieza de jardín'},
      {id:16,category_id:2,tag_key:'desentapar_bano',tag_name:'Destapar baño'},
      {id:17,category_id:2,tag_key:'desentapar_fregadero',tag_name:'Destapar fregadero'},
      {id:18,category_id:2,tag_key:'reparar_fuga_agua',tag_name:'Reparar fuga de agua'},
      {id:19,category_id:2,tag_key:'reparar_fuga_gas',tag_name:'Reparar fuga de gas'},
      {id:20,category_id:2,tag_key:'instalar_lavabo',tag_name:'Instalar lavabo'},
      {id:21,category_id:2,tag_key:'instalar_fregadero',tag_name:'Instalar fregadero'},
      {id:22,category_id:2,tag_key:'instalar_wc',tag_name:'Instalar WC'},
      {id:23,category_id:2,tag_key:'cambiar_mezcladora',tag_name:'Cambiar mezcladora'},
      {id:24,category_id:2,tag_key:'instalar_calentador_gas',tag_name:'Instalar calentador de gas'},
      {id:25,category_id:2,tag_key:'instalar_calentador_electrico',tag_name:'Instalar calentador eléctrico'},
      {id:26,category_id:2,tag_key:'mantenimiento_tinaco',tag_name:'Mantenimiento de tinaco'},
      {id:27,category_id:2,tag_key:'instalacion_bomba_agua',tag_name:'Instalar bomba de agua'},
      {id:28,category_id:2,tag_key:'mantenimiento_drenaje',tag_name:'Mantenimiento de drenaje'},
      {id:29,category_id:2,tag_key:'instalacion_lineas_agua',tag_name:'Instalar líneas de agua'},
      {id:30,category_id:2,tag_key:'instalacion_lineas_gas',tag_name:'Instalar líneas de gas'},
      {id:31,category_id:3,tag_key:'instalar_contacto',tag_name:'Instalar contacto'},
      {id:32,category_id:3,tag_key:'instalar_apagador',tag_name:'Instalar apagador'},
      {id:33,category_id:3,tag_key:'cambiar_lampara',tag_name:'Cambiar lámpara'},
      {id:34,category_id:3,tag_key:'instalar_ventilador_techo',tag_name:'Instalar ventilador de techo'},
      {id:35,category_id:3,tag_key:'revision_corto',tag_name:'Revisión por corto'},
      {id:36,category_id:3,tag_key:'instalar_tablero',tag_name:'Instalar tablero'},
      {id:37,category_id:3,tag_key:'instalar_breaker',tag_name:'Instalar breaker'},
      {id:38,category_id:3,tag_key:'instalar_toma_220',tag_name:'Instalar toma 220V'},
      {id:39,category_id:3,tag_key:'canalizacion_cableado',tag_name:'Canalización de cableado'},
      {id:40,category_id:3,tag_key:'instalar_iluminacion_led',tag_name:'Instalar iluminación LED'},
      {id:41,category_id:3,tag_key:'instalar_timbre',tag_name:'Instalar timbre'},
      {id:42,category_id:3,tag_key:'instalar_sensores_movimiento',tag_name:'Instalar sensores de movimiento'},
      {id:43,category_id:4,tag_key:'levantar_muro',tag_name:'Construcción de muro'},
      {id:44,category_id:4,tag_key:'levantar_barda',tag_name:'Construcción de barda'},
      {id:45,category_id:4,tag_key:'reparar_muro',tag_name:'Reparar muro'},
      {id:46,category_id:4,tag_key:'aplanado_muros',tag_name:'Aplanado de muros'},
      {id:47,category_id:4,tag_key:'resanar_muros',tag_name:'Resanar muros'},
      {id:48,category_id:4,tag_key:'colocar_piso',tag_name:'Colocar piso cerámico'},
      {id:49,category_id:4,tag_key:'colocar_azulejo',tag_name:'Colocar azulejo'},
      {id:50,category_id:4,tag_key:'rellenar_firmes',tag_name:'Firmes de concreto'}
    ];

    // Insert in batches to avoid timeout
    for (let i = 0; i < categoryTags.length; i += 50) {
      const batch = categoryTags.slice(i, i + 50);
      const { error } = await supabase
        .from('category_tags')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error('Error inserting category_tags batch:', error);
        throw error;
      }
    }

    console.log('Category tags inserted successfully (showing first 50 of 253)');

    // Insert category_keywords
    const categoryKeywords = [
      {id:1,category_id:1,keyword:'jardin'},
      {id:2,category_id:1,keyword:'jardín'},
      {id:3,category_id:1,keyword:'jardinero'},
      {id:4,category_id:1,keyword:'podar'},
      {id:5,category_id:1,keyword:'poda'},
      {id:6,category_id:1,keyword:'cortar pasto'},
      {id:7,category_id:1,keyword:'césped'},
      {id:8,category_id:1,keyword:'zacate'},
      {id:9,category_id:1,keyword:'áreas verdes'},
      {id:10,category_id:1,keyword:'plantas'},
      {id:11,category_id:1,keyword:'flores'},
      {id:12,category_id:1,keyword:'árboles'},
      {id:13,category_id:1,keyword:'riego'},
      {id:14,category_id:1,keyword:'sistema de riego'},
      {id:15,category_id:2,keyword:'plomero'},
      {id:16,category_id:2,keyword:'fontanero'},
      {id:17,category_id:2,keyword:'tubería'},
      {id:18,category_id:2,keyword:'tuberias'},
      {id:19,category_id:2,keyword:'fugas'},
      {id:20,category_id:2,keyword:'fuga de agua'},
      {id:21,category_id:2,keyword:'fuga de gas'},
      {id:22,category_id:2,keyword:'drenaje'},
      {id:23,category_id:2,keyword:'baño tapado'},
      {id:24,category_id:2,keyword:'drenaje tapado'},
      {id:25,category_id:2,keyword:'calentador'},
      {id:26,category_id:2,keyword:'tinaco'},
      {id:27,category_id:3,keyword:'electricista'},
      {id:28,category_id:3,keyword:'corto'},
      {id:29,category_id:3,keyword:'cortos'},
      {id:30,category_id:3,keyword:'apagadores'},
      {id:31,category_id:3,keyword:'contactos'},
      {id:32,category_id:3,keyword:'luz'},
      {id:33,category_id:3,keyword:'focos'},
      {id:34,category_id:3,keyword:'lámparas'},
      {id:35,category_id:3,keyword:'breaker'},
      {id:36,category_id:3,keyword:'fusible'},
      {id:37,category_id:3,keyword:'instalación eléctrica'},
      {id:38,category_id:4,keyword:'albañil'},
      {id:39,category_id:4,keyword:'albanil'},
      {id:40,category_id:4,keyword:'construcción'},
      {id:41,category_id:4,keyword:'resanar'},
      {id:42,category_id:4,keyword:'aplanar'},
      {id:43,category_id:4,keyword:'barda'},
      {id:44,category_id:4,keyword:'muro'},
      {id:45,category_id:4,keyword:'piso'},
      {id:46,category_id:4,keyword:'azulejo'},
      {id:47,category_id:4,keyword:'cemento'},
      {id:48,category_id:4,keyword:'concreto'},
      {id:49,category_id:5,keyword:'pintor'},
      {id:50,category_id:5,keyword:'pintura'}
    ];

    for (let i = 0; i < categoryKeywords.length; i += 50) {
      const batch = categoryKeywords.slice(i, i + 50);
      const { error } = await supabase
        .from('category_keywords')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error('Error inserting category_keywords batch:', error);
        throw error;
      }
    }

    console.log('Category keywords inserted successfully (showing first 50 of 213)');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Catalog data seeded successfully',
        note: 'This edge function only includes a sample of the data. You need to add all 253 tags and 213 keywords manually or extend this function.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error seeding data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});