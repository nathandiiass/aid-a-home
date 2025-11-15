import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        // Group results by type
        const especialistasMap = new Map<string, Service>();
        const actividadesMap = new Map<string, Service>();
        const categoriasMap = new Map<string, Service[]>();

        data.forEach((service) => {
          const lowerSearch = searchTerm.toLowerCase();

          // Check if matches especialista
          if (service.especialista.toLowerCase().includes(lowerSearch)) {
            especialistasMap.set(service.especialista, service);
          }

          // Check if matches actividad
          if (service.actividad.toLowerCase().includes(lowerSearch)) {
            actividadesMap.set(service.actividad, service);
          }

          // Check if matches categoria
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
    navigate("/create-request", {
      state: {
        especialista: service.especialista,
        actividad: "",
      },
    });
  };

  const handleSelectActividad = (service: Service) => {
    navigate("/create-request", {
      state: {
        especialista: service.especialista,
        actividad: service.actividad,
      },
    });
  };

  const handleSelectCategoria = (categoria: string) => {
    navigate("/create-request", {
      state: {
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="¿Qué especialista necesitas?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-14 text-base bg-card border-border focus-visible:ring-primary"
        />
      </div>

      {/* Results dropdown */}
      {searchTerm.length >= 2 && (
        <Card className="absolute z-20 w-full mt-2 max-h-[500px] overflow-auto bg-card border-border shadow-card">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">Buscando...</div>
          ) : hasResults ? (
            <div className="divide-y divide-border">
              {/* Especialistas */}
              {results.especialistas.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-1">Especialistas</p>
                  <div className="space-y-1">
                    {results.especialistas.map((service) => (
                      <button
                        key={`esp-${service.id}`}
                        onClick={() => handleSelectEspecialista(service)}
                        className="w-full p-2 text-left hover:bg-muted/50 transition-colors rounded-md flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-xs">{service.especialista.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{service.especialista}</p>
                          <p className="text-xs text-muted-foreground">{service.categoria}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-1">Actividades</p>
                  <div className="space-y-1">
                    {results.actividades.map((service) => (
                      <button
                        key={`act-${service.id}`}
                        onClick={() => handleSelectActividad(service)}
                        className="w-full p-2 text-left hover:bg-muted/50 transition-colors rounded-md flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
                          <span className="text-secondary-foreground font-semibold text-xs">
                            {service.actividad.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{service.actividad}</p>
                          <p className="text-xs text-muted-foreground">{service.especialista}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-1">Categorías</p>
                  <div className="space-y-1">
                    {results.categorias.map(({ categoria, services }) => (
                      <button
                        key={`cat-${categoria}`}
                        onClick={() => handleSelectCategoria(categoria)}
                        className="w-full p-2 text-left hover:bg-muted/50 transition-colors rounded-md flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center shrink-0">
                          <span className="text-accent-foreground font-semibold text-xs">{categoria.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{categoria}</p>
                          <p className="text-xs text-muted-foreground">
                            {services.length} especialista{services.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-accent/10">
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
              <p className="text-foreground font-medium mb-2">No encontramos esa búsqueda</p>
              <p className="text-sm text-muted-foreground">Intenta con otra palabra o elige una categoría</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ServiceSearch;
