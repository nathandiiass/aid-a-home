export interface Category {
  id: number;
  category_key: string;
  category_name: string;
}

export interface CategoryKeyword {
  id: number;
  category_id: number;
  keyword: string;
}

export const categories: Category[] = [
  { id: 1, category_key: "jardineria", category_name: "Jardinería" },
  { id: 2, category_key: "plomeria", category_name: "Plomería" },
  { id: 3, category_key: "electricidad", category_name: "Electricidad" },
  { id: 4, category_key: "albanileria_construccion_ligera", category_name: "Albañilería y construcción ligera" },
  { id: 5, category_key: "pintura_impermeabilizacion", category_name: "Pintura e impermeabilización" },
  { id: 6, category_key: "carpinteria_muebles", category_name: "Carpintería y muebles" },
  { id: 7, category_key: "herreria_soldadura", category_name: "Herrería y soldadura" },
  { id: 8, category_key: "vidrieria_aluminio", category_name: "Vidriería y aluminio" },
  { id: 9, category_key: "cerrajeria", category_name: "Cerrajería" },
  { id: 10, category_key: "limpieza_hogar", category_name: "Limpieza del hogar" },
  { id: 11, category_key: "limpieza_comercial", category_name: "Limpieza comercial e industrial" },
  { id: 12, category_key: "fumigacion", category_name: "Fumigación y control de plagas" },
  { id: 13, category_key: "climatizacion", category_name: "Climatización (A/C y refrigeración)" },
  { id: 14, category_key: "albercas", category_name: "Albercas" },
  { id: 15, category_key: "automotriz", category_name: "Servicios automotrices" },
  { id: 16, category_key: "mudanzas_fletes", category_name: "Mudanzas y fletes" },
  { id: 17, category_key: "eventos_banquetes", category_name: "Eventos y banquetes" },
  { id: 18, category_key: "fotografia_video", category_name: "Fotografía y video" },
  { id: 19, category_key: "gastronomia", category_name: "Gastronomía" },
  { id: 20, category_key: "educacion_clases", category_name: "Educación y clases particulares" },
  { id: 21, category_key: "tecnologia_computacion", category_name: "Tecnología y computación" },
  { id: 22, category_key: "seguridad_fisica_electronica", category_name: "Seguridad física y electrónica" },
  { id: 23, category_key: "decoracion_interiores", category_name: "Decoración y diseño de interiores" },
  { id: 24, category_key: "energia_solar", category_name: "Energía solar" },
  { id: 25, category_key: "mantenimiento_general", category_name: "Mantenimiento general" },
  { id: 26, category_key: "servicios_profesionales", category_name: "Servicios profesionales" },
  { id: 27, category_key: "creativo_digital", category_name: "Creativo digital y marketing" }
];

export const categoryKeywords: CategoryKeyword[] = [
  { id: 1, category_id: 1, keyword: "jardin" },
  { id: 2, category_id: 1, keyword: "jardín" },
  { id: 3, category_id: 1, keyword: "jardinero" },
  { id: 4, category_id: 1, keyword: "podar" },
  { id: 5, category_id: 1, keyword: "poda" },
  { id: 6, category_id: 1, keyword: "cortar pasto" },
  { id: 7, category_id: 1, keyword: "césped" },
  { id: 8, category_id: 1, keyword: "zacate" },
  { id: 9, category_id: 1, keyword: "áreas verdes" },
  { id: 10, category_id: 1, keyword: "plantas" },
  { id: 11, category_id: 1, keyword: "flores" },
  { id: 12, category_id: 1, keyword: "árboles" },
  { id: 13, category_id: 1, keyword: "riego" },
  { id: 14, category_id: 1, keyword: "sistema de riego" },
  { id: 15, category_id: 2, keyword: "plomero" },
  { id: 16, category_id: 2, keyword: "fontanero" },
  { id: 17, category_id: 2, keyword: "tubería" },
  { id: 18, category_id: 2, keyword: "tuberias" },
  { id: 19, category_id: 2, keyword: "fugas" },
  { id: 20, category_id: 2, keyword: "fuga de agua" },
  { id: 21, category_id: 2, keyword: "fuga de gas" },
  { id: 22, category_id: 2, keyword: "drenaje" },
  { id: 23, category_id: 2, keyword: "baño tapado" },
  { id: 24, category_id: 2, keyword: "drenaje tapado" },
  { id: 25, category_id: 2, keyword: "calentador" },
  { id: 26, category_id: 2, keyword: "tinaco" },
  { id: 27, category_id: 3, keyword: "electricista" },
  { id: 28, category_id: 3, keyword: "corto" },
  { id: 29, category_id: 3, keyword: "cortos" },
  { id: 30, category_id: 3, keyword: "apagadores" },
  { id: 31, category_id: 3, keyword: "contactos" },
  { id: 32, category_id: 3, keyword: "luz" },
  { id: 33, category_id: 3, keyword: "focos" },
  { id: 34, category_id: 3, keyword: "lámparas" },
  { id: 35, category_id: 3, keyword: "breaker" },
  { id: 36, category_id: 3, keyword: "fusible" },
  { id: 37, category_id: 3, keyword: "instalación eléctrica" },
  { id: 38, category_id: 4, keyword: "albañil" },
  { id: 39, category_id: 4, keyword: "albanil" },
  { id: 40, category_id: 4, keyword: "construcción" },
  { id: 41, category_id: 4, keyword: "resanar" },
  { id: 42, category_id: 4, keyword: "aplanar" },
  { id: 43, category_id: 4, keyword: "barda" },
  { id: 44, category_id: 4, keyword: "muro" },
  { id: 45, category_id: 4, keyword: "piso" },
  { id: 46, category_id: 4, keyword: "azulejo" },
  { id: 47, category_id: 4, keyword: "cemento" },
  { id: 48, category_id: 4, keyword: "concreto" },
  { id: 49, category_id: 5, keyword: "pintor" },
  { id: 50, category_id: 5, keyword: "pintura" },
  { id: 51, category_id: 5, keyword: "impermeabilizar" },
  { id: 52, category_id: 5, keyword: "impermeable" },
  { id: 53, category_id: 5, keyword: "fachada" },
  { id: 54, category_id: 5, keyword: "sellador" },
  { id: 55, category_id: 5, keyword: "esmalte" },
  { id: 56, category_id: 5, keyword: "acabado" },
  { id: 57, category_id: 6, keyword: "carpintero" },
  { id: 58, category_id: 6, keyword: "madera" },
  { id: 59, category_id: 6, keyword: "mueble" },
  { id: 60, category_id: 6, keyword: "clóset" },
  { id: 61, category_id: 6, keyword: "closet" },
  { id: 62, category_id: 6, keyword: "cocina integral" },
  { id: 63, category_id: 6, keyword: "puerta" },
  { id: 64, category_id: 6, keyword: "repisa" },
  { id: 65, category_id: 6, keyword: "barniz" },
  { id: 66, category_id: 7, keyword: "herrero" },
  { id: 67, category_id: 7, keyword: "soldador" },
  { id: 68, category_id: 7, keyword: "rejas" },
  { id: 69, category_id: 7, keyword: "portones" },
  { id: 70, category_id: 7, keyword: "protectores" },
  { id: 71, category_id: 7, keyword: "estructura metálica" },
  { id: 72, category_id: 7, keyword: "soldadura" },
  { id: 73, category_id: 8, keyword: "vidriero" },
  { id: 74, category_id: 8, keyword: "vidrio" },
  { id: 75, category_id: 8, keyword: "cristal" },
  { id: 76, category_id: 8, keyword: "cancel" },
  { id: 77, category_id: 8, keyword: "aluminio" },
  { id: 78, category_id: 8, keyword: "ventanas" },
  { id: 79, category_id: 8, keyword: "puertas corredizas" },
  { id: 80, category_id: 9, keyword: "cerrajero" },
  { id: 81, category_id: 9, keyword: "llaves" },
  { id: 82, category_id: 9, keyword: "chapa" },
  { id: 83, category_id: 9, keyword: "abrir puerta" },
  { id: 84, category_id: 9, keyword: "cerradura" },
  { id: 85, category_id: 9, keyword: "cerradura digital" },
  { id: 86, category_id: 10, keyword: "limpieza" },
  { id: 87, category_id: 10, keyword: "limpiar" },
  { id: 88, category_id: 10, keyword: "servicio de limpieza" },
  { id: 89, category_id: 10, keyword: "aseo" },
  { id: 90, category_id: 10, keyword: "lavado colchones" },
  { id: 91, category_id: 10, keyword: "lavado sillones" },
  { id: 92, category_id: 11, keyword: "limpieza industrial" },
  { id: 93, category_id: 11, keyword: "limpieza oficinas" },
  { id: 94, category_id: 11, keyword: "limpieza negocios" },
  { id: 95, category_id: 11, keyword: "limpieza bodegas" },
  { id: 96, category_id: 11, keyword: "limpieza tiendas" },
  { id: 97, category_id: 12, keyword: "fumigar" },
  { id: 98, category_id: 12, keyword: "fumigación" },
  { id: 99, category_id: 12, keyword: "plagas" },
  { id: 100, category_id: 12, keyword: "cucarachas" },
  { id: 101, category_id: 12, keyword: "hormigas" },
  { id: 102, category_id: 12, keyword: "ratas" },
  { id: 103, category_id: 12, keyword: "alacranes" },
  { id: 104, category_id: 12, keyword: "desinfectar" },
  { id: 105, category_id: 13, keyword: "aire acondicionado" },
  { id: 106, category_id: 13, keyword: "aires acondicionados" },
  { id: 107, category_id: 13, keyword: "aire" },
  { id: 108, category_id: 13, keyword: "clima" },
  { id: 109, category_id: 13, keyword: "climas" },
  { id: 110, category_id: 13, keyword: "minisplit" },
  { id: 111, category_id: 13, keyword: "mini split" },
  { id: 112, category_id: 13, keyword: "mini-split" },
  { id: 113, category_id: 13, keyword: "aire lavado" },
  { id: 114, category_id: 13, keyword: "lavado de minisplit" },
  { id: 115, category_id: 13, keyword: "servicio de clima" },
  { id: 116, category_id: 13, keyword: "técnico en clima" },
  { id: 117, category_id: 14, keyword: "alberca" },
  { id: 118, category_id: 14, keyword: "piscina" },
  { id: 119, category_id: 14, keyword: "pileta" },
  { id: 120, category_id: 14, keyword: "limpieza de alberca" },
  { id: 121, category_id: 14, keyword: "bomba de alberca" },
  { id: 122, category_id: 14, keyword: "filtro de alberca" },
  { id: 123, category_id: 15, keyword: "mecánico" },
  { id: 124, category_id: 15, keyword: "mecanico" },
  { id: 125, category_id: 15, keyword: "auto" },
  { id: 126, category_id: 15, keyword: "carro" },
  { id: 127, category_id: 15, keyword: "coche" },
  { id: 128, category_id: 15, keyword: "afinación" },
  { id: 129, category_id: 15, keyword: "frenos" },
  { id: 130, category_id: 15, keyword: "pulido" },
  { id: 131, category_id: 15, keyword: "lavado de autos" },
  { id: 132, category_id: 16, keyword: "mudanza" },
  { id: 133, category_id: 16, keyword: "flete" },
  { id: 134, category_id: 16, keyword: "transportar" },
  { id: 135, category_id: 16, keyword: "camión de mudanza" },
  { id: 136, category_id: 16, keyword: "cargadores" },
  { id: 137, category_id: 17, keyword: "evento" },
  { id: 138, category_id: 17, keyword: "eventos" },
  { id: 139, category_id: 17, keyword: "meseros" },
  { id: 140, category_id: 17, keyword: "dj" },
  { id: 141, category_id: 17, keyword: "banquetes" },
  { id: 142, category_id: 17, keyword: "fiestas" },
  { id: 143, category_id: 17, keyword: "catering" },
  { id: 144, category_id: 17, keyword: "salón" },
  { id: 145, category_id: 17, keyword: "boda" },
  { id: 146, category_id: 17, keyword: "xv años" },
  { id: 147, category_id: 18, keyword: "fotógrafo" },
  { id: 148, category_id: 18, keyword: "fotografo" },
  { id: 149, category_id: 18, keyword: "video" },
  { id: 150, category_id: 18, keyword: "sesión de fotos" },
  { id: 151, category_id: 18, keyword: "videógrafo" },
  { id: 152, category_id: 18, keyword: "edición de video" },
  { id: 153, category_id: 18, keyword: "drone" },
  { id: 154, category_id: 19, keyword: "chef" },
  { id: 155, category_id: 19, keyword: "cocinero" },
  { id: 156, category_id: 19, keyword: "comida" },
  { id: 157, category_id: 19, keyword: "cocina" },
  { id: 158, category_id: 19, keyword: "repostería" },
  { id: 159, category_id: 19, keyword: "panadería" },
  { id: 160, category_id: 19, keyword: "pastelero" },
  { id: 161, category_id: 20, keyword: "maestro" },
  { id: 162, category_id: 20, keyword: "profesor" },
  { id: 163, category_id: 20, keyword: "clases" },
  { id: 164, category_id: 20, keyword: "asesorías" },
  { id: 165, category_id: 20, keyword: "regularización" },
  { id: 166, category_id: 20, keyword: "tutorías" },
  { id: 167, category_id: 20, keyword: "inglés" },
  { id: 168, category_id: 20, keyword: "matemáticas" },
  { id: 169, category_id: 20, keyword: "música" },
  { id: 170, category_id: 21, keyword: "computadora" },
  { id: 171, category_id: 21, keyword: "computadoras" },
  { id: 172, category_id: 21, keyword: "laptop" },
  { id: 173, category_id: 21, keyword: "reparación de pc" },
  { id: 174, category_id: 21, keyword: "soporte técnico" },
  { id: 175, category_id: 21, keyword: "redes" },
  { id: 176, category_id: 21, keyword: "internet" },
  { id: 177, category_id: 21, keyword: "wifi" },
  { id: 178, category_id: 21, keyword: "formateo" },
  { id: 179, category_id: 22, keyword: "cámaras" },
  { id: 180, category_id: 22, keyword: "videovigilancia" },
  { id: 181, category_id: 22, keyword: "alarmas" },
  { id: 182, category_id: 22, keyword: "seguridad" },
  { id: 183, category_id: 22, keyword: "cctv" },
  { id: 184, category_id: 22, keyword: "guardias" },
  { id: 185, category_id: 22, keyword: "cerca eléctrica" },
  { id: 186, category_id: 23, keyword: "decorador" },
  { id: 187, category_id: 23, keyword: "diseñador de interiores" },
  { id: 188, category_id: 23, keyword: "decoración" },
  { id: 189, category_id: 23, keyword: "diseño" },
  { id: 190, category_id: 23, keyword: "interiorismo" },
  { id: 191, category_id: 23, keyword: "cortinas" },
  { id: 192, category_id: 23, keyword: "tapicería" },
  { id: 193, category_id: 24, keyword: "paneles solares" },
  { id: 194, category_id: 24, keyword: "solar" },
  { id: 195, category_id: 24, keyword: "energía solar" },
  { id: 196, category_id: 24, keyword: "calentador solar" },
  { id: 197, category_id: 24, keyword: "fotovoltaico" },
  { id: 198, category_id: 25, keyword: "mantenimiento" },
  { id: 199, category_id: 25, keyword: "reparaciones" },
  { id: 200, category_id: 25, keyword: "instalaciones" },
  { id: 201, category_id: 25, keyword: "handyman" },
  { id: 202, category_id: 25, keyword: "manitas" },
  { id: 203, category_id: 26, keyword: "abogado" },
  { id: 204, category_id: 26, keyword: "contador" },
  { id: 205, category_id: 26, keyword: "arquitecto" },
  { id: 206, category_id: 26, keyword: "notario" },
  { id: 207, category_id: 26, keyword: "asesoría legal" },
  { id: 208, category_id: 26, keyword: "contabilidad" },
  { id: 209, category_id: 27, keyword: "diseño gráfico" },
  { id: 210, category_id: 27, keyword: "diseñador gráfico" },
  { id: 211, category_id: 27, keyword: "marketing" },
  { id: 212, category_id: 27, keyword: "social media" },
  { id: 213, category_id: 27, keyword: "redes sociales" }
];

// Helper function to search categories by keyword
export interface CategoryWithSynonym extends Category {
  matchedKeyword?: string;
}

export interface SearchResults {
  directMatches: Category[];
  synonymMatches: CategoryWithSynonym[];
}

export const searchCategoriesByKeyword = (searchTerm: string): SearchResults => {
  const lowerSearch = searchTerm.toLowerCase().trim();
  
  if (!lowerSearch) {
    return { directMatches: categories, synonymMatches: [] };
  }
  
  // Find direct matches with category names
  const directMatches = categories.filter(cat => 
    cat.category_name.toLowerCase().includes(lowerSearch)
  );
  
  // Find matching keywords
  const matchingKeywords = categoryKeywords.filter(kw => 
    kw.keyword.toLowerCase().includes(lowerSearch)
  );
  
  // Get categories from keywords that are NOT in direct matches
  const directMatchIds = new Set(directMatches.map(cat => cat.id));
  const synonymMatches: CategoryWithSynonym[] = [];
  
  matchingKeywords.forEach(kw => {
    if (!directMatchIds.has(kw.category_id)) {
      const category = categories.find(cat => cat.id === kw.category_id);
      if (category && !synonymMatches.find(sm => sm.id === category.id)) {
        synonymMatches.push({
          ...category,
          matchedKeyword: kw.keyword
        });
      }
    }
  });
  
  return { directMatches, synonymMatches };
};
