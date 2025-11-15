import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface Service {
  id: number;
  especialista: string;
  categoria: string;
  actividad: string;
}

const ServiceSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchServices = async () => {
      if (searchTerm.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const { data } = await supabase
        .from("servicios_domesticos")
        .select("*")
        .or(`actividad.ilike.%${searchTerm}%,especialista.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`)
        .limit(10);

      setResults(data || []);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchServices, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelectService = (service: Service) => {
    navigate("/create-request", {
      state: {
        especialista: service.especialista,
        actividad: service.actividad,
      },
    });
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="¿A qué especialista necesitas?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-14 text-base bg-card border-border focus-visible:ring-primary"
        />
      </div>

      {/* Results dropdown */}
      {searchTerm.length >= 2 && (
        <Card className="absolute z-20 w-full mt-2 max-h-96 overflow-auto bg-card border-border shadow-card">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-border">
              {results.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-primary font-semibold text-sm">
                      {service.categoria.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{service.actividad}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {service.especialista} • {service.categoria}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-foreground font-medium mb-2">
                No encontramos esa actividad
              </p>
              <p className="text-sm text-muted-foreground">
                Intenta con otra palabra o elige una categoría
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ServiceSearch;
