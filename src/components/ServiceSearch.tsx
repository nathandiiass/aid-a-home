import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Service {
  id: number;
  especialista: string;
  categoria: string;
  actividad: string;
}

interface GroupedResults {
  especialistas: Service[];
  actividades: Service[];
  categorias: { categoria: string; services: Service[] }[];
}

const ServiceSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<GroupedResults>({
    especialistas: [],
    actividades: [],
    categorias: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const searchServices = async () => {
      if (searchTerm.trim().length < 2) {
        setResults({ especialistas: [], actividades: [], categorias: [] });
        return;
      }

      setIsSearching(true);
      const { data } = await supabase
        .from("servicios_domesticos")
        .select("*")
        .or(`actividad.ilike.%${searchTerm}%,especialista.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`)
        .limit(30);

      if (data) {
        const especialistasMap = new Map<string, Service>();
        const actividadesMap = new Map<string, Service>();
        const categoriasMap = new Map<string, Service[]>();

        data.forEach((service) => {
          const lowerSearch = searchTerm.toLowerCase();

          if (service.especialista.toLowerCase().includes(lowerSearch)) {
            especialistasMap.set(service.especialista, service);
          }

          if (service.actividad.toLowerCase().includes(lowerSearch)) {
            actividadesMap.set(service.actividad, service);
          }

          if (service.categoria.toLowerCase().includes(lowerSearch)) {
            if (!categoriasMap.has(service.categoria)) {
              categoriasMap.set(service.categoria, []);
            }
            categoriasMap.get(service.categoria)?.push(service);
          }
        });

        setResults({
          especialistas: Array.from(especialistasMap.values()).slice(0, 5),
          actividades: Array.from(actividadesMap.values()).slice(0, 8),
          categorias: Array.from(categoriasMap.entries())
            .map(([categoria, services]) => ({ categoria, services }))
            .slice(0, 3),
        });
      }
      setIsSearching(false);
    };

    const debounce = setTimeout(searchServices, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelectEspecialista = (service: Service) => {
    if (!user) {
      toast.info("Inicia sesión para crear una solicitud");
      navigate("/auth");
      return;
    }
    navigate("/create-request", {
      state: {
        selectedType: "especialista",
        especialista: service.especialista,
        categoria: service.categoria,
        actividad: "",
      },
    });
  };

  const handleSelectActividad = (service: Service) => {
    if (!user) {
      toast.info("Inicia sesión para crear una solicitud");
      navigate("/auth");
      return;
    }
    navigate("/create-request", {
      state: {
        selectedType: "actividad",
        especialista: service.especialista,
        actividad: service.actividad,
        categoria: service.categoria,
        serviceTitle: service.actividad,
      },
    });
  };

  const handleSelectCategoria = (categoria: string) => {
    if (!user) {
      toast.info("Inicia sesión para crear una solicitud");
      navigate("/auth");
      return;
    }
    navigate("/create-request", {
      state: {
        selectedType: "categoria",
        categoria,
        especialista: "",
        actividad: "",
      },
    });
  };

  const hasResults =
    results.especialistas.length > 0 || results.actividades.length > 0 || results.categorias.length > 0;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="¿Qué especialista necesitas?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 text-base bg-white border-gray-200 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Results dropdown */}
      {searchTerm.length >= 2 && (
        <Card className="absolute z-20 w-full mt-2 max-h-[500px] overflow-auto bg-white border-0 shadow-2xl rounded-2xl">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">Buscando...</div>
          ) : hasResults ? (
            <div className="divide-y divide-gray-100">
              {/* Especialistas */}
              {results.especialistas.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2 px-1">Especialistas</p>
                  <div className="space-y-1">
                    {results.especialistas.map((service) => (
                      <button
                        key={`esp-${service.id}`}
                        onClick={() => handleSelectEspecialista(service)}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors rounded-xl flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-blue-600 font-bold text-sm">{service.especialista.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{service.especialista}</p>
                          <p className="text-xs text-gray-500">{service.categoria}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-0">
                          Especialista
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actividades */}
              {results.actividades.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2 px-1">Actividades</p>
                  <div className="space-y-1">
                    {results.actividades.map((service) => (
                      <button
                        key={`act-${service.id}`}
                        onClick={() => handleSelectActividad(service)}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors rounded-xl flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <span className="text-green-700 font-bold text-sm">{service.actividad.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{service.actividad}</p>
                          <p className="text-xs text-gray-500">{service.especialista}</p>
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-300">
                          Actividad
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorías */}
              {results.categorias.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2 px-1">Categorías</p>
                  <div className="space-y-1">
                    {results.categorias.map(({ categoria, services }) => (
                      <button
                        key={categoria}
                        onClick={() => handleSelectCategoria(categoria)}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors rounded-xl flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="text-purple-700 font-bold text-sm">{categoria.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{categoria}</p>
                          <p className="text-xs text-gray-500">{services.length} especialista(s)</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-0">
                          Categoría
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm mb-1">No se encontraron resultados</p>
              <p className="text-gray-400 text-xs">Intenta buscar con otras palabras</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ServiceSearch;
