import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: number;
  especialista: string;
  categoria: string;
  actividad: string;
}

interface ServiceSelectorProps {
  especialista: string;
  actividad: string;
  serviceTitle: string;
  serviceDescription: string;
  categoria?: string;
  onEspecialistaChange: (value: string) => void;
  onActividadChange: (value: string) => void;
  onServiceTitleChange: (value: string) => void;
  onServiceDescriptionChange: (value: string) => void;
}

const ServiceSelector = ({
  especialista,
  actividad,
  serviceTitle,
  serviceDescription,
  categoria,
  onEspecialistaChange,
  onActividadChange,
  onServiceTitleChange,
  onServiceDescriptionChange,
}: ServiceSelectorProps) => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [especialistas, setEspecialistas] = useState<string[]>([]);
  const [allEspecialistas, setAllEspecialistas] = useState<string[]>([]);
  const [actividades, setActividades] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedActividad, setSelectedActividad] = useState<string>(actividad || "");
  const [selectedCategoria, setSelectedCategoria] = useState<string>(categoria || "");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    const loadServices = async () => {
      const { data } = await supabase
        .from("servicios_domesticos")
        .select("*")
        .order("especialista", { ascending: true });

      if (data) {
        setAllServices(data);
        const uniqueEsp = Array.from(new Set(data.map((s) => s.especialista)));
        const uniqueAct = Array.from(new Set(data.map((s) => s.actividad)));
        const uniqueCat = Array.from(new Set(data.map((s) => s.categoria)));
        
        setAllEspecialistas(uniqueEsp);
        setEspecialistas(uniqueEsp);
        setActividades(uniqueAct);
        setCategorias(uniqueCat);
      }
    };
    loadServices();
  }, []);

  // Filter especialistas based on selected actividad or categoria
  useEffect(() => {
    let filteredEspecialistas = [...allEspecialistas];

    if (selectedActividad) {
      const filtered = allServices.filter((s) => s.actividad === selectedActividad);
      filteredEspecialistas = Array.from(new Set(filtered.map((s) => s.especialista)));
    } else if (selectedCategoria) {
      const filtered = allServices.filter((s) => s.categoria === selectedCategoria);
      filteredEspecialistas = Array.from(new Set(filtered.map((s) => s.especialista)));
    }

    setEspecialistas(filteredEspecialistas);
    
    // Clear especialista if it's not in the filtered list
    if (especialista && !filteredEspecialistas.includes(especialista)) {
      onEspecialistaChange("");
    }
  }, [selectedActividad, selectedCategoria, allServices, allEspecialistas]);

  const handleActividadFilterChange = (value: string) => {
    setSelectedActividad(value);
    setSelectedCategoria(""); // Clear categoria filter
  };

  const handleCategoriaFilterChange = (value: string) => {
    setSelectedCategoria(value);
    setSelectedActividad(""); // Clear actividad filter
  };

  const clearFilters = () => {
    setSelectedActividad("");
    setSelectedCategoria("");
    setEspecialistas(allEspecialistas);
  };

  const validateTitle = (value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, title: "El título es obligatorio" }));
      return false;
    }
    if (value.trim().length < 10) {
      setErrors(prev => ({ ...prev, title: "El título debe tener al menos 10 caracteres" }));
      return false;
    }
    setErrors(prev => ({ ...prev, title: undefined }));
    return true;
  };

  const validateDescription = (value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, description: "La descripción es obligatoria" }));
      return false;
    }
    if (value.trim().length < 20) {
      setErrors(prev => ({ ...prev, description: "La descripción debe tener al menos 20 caracteres" }));
      return false;
    }
    setErrors(prev => ({ ...prev, description: undefined }));
    return true;
  };

  const handleTitleChange = (value: string) => {
    onServiceTitleChange(value);
    if (value.trim()) {
      validateTitle(value);
    }
  };

  const handleDescriptionChange = (value: string) => {
    onServiceDescriptionChange(value);
    if (value.trim()) {
      validateDescription(value);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">¿Qué servicio necesitas?</h2>
        <p className="text-muted-foreground">
          Selecciona el especialista y describe el servicio que requieres
        </p>
      </div>

      {/* Filter dropdowns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-actividad">Filtrar por actividad</Label>
          <Select value={selectedActividad} onValueChange={handleActividadFilterChange}>
            <SelectTrigger id="filter-actividad" className="h-12 bg-background">
              <SelectValue placeholder="Todas las actividades" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {actividades.map((act) => (
                <SelectItem key={act} value={act}>
                  {act}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-categoria">Filtrar por categoría</Label>
          <Select value={selectedCategoria} onValueChange={handleCategoriaFilterChange}>
            <SelectTrigger id="filter-categoria" className="h-12 bg-background">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(selectedActividad || selectedCategoria) && (
        <Badge variant="secondary" className="gap-2 py-2 px-3">
          Filtrado por: {selectedActividad || selectedCategoria}
          <button
            onClick={clearFilters}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      <div className="space-y-2">
        <Label htmlFor="especialista">Especialista *</Label>
        <Select value={especialista} onValueChange={onEspecialistaChange}>
          <SelectTrigger id="especialista" className="h-12 bg-background">
            <SelectValue placeholder="Selecciona un especialista" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {especialistas.map((esp) => (
              <SelectItem key={esp} value={esp}>
                {esp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-title">Título de servicio solicitado *</Label>
        <Input
          id="service-title"
          placeholder="Ej: Cortar pasto de mi patio"
          value={serviceTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={(e) => validateTitle(e.target.value)}
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Describe brevemente el servicio (ej: "Reparar fuga de baño", "Pintar fachada de casa")
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-description">Descripción del servicio *</Label>
        <Textarea
          id="service-description"
          placeholder="Describe con detalle qué necesitas, lugar, dimensiones, materiales, etc."
          value={serviceDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          onBlur={(e) => validateDescription(e.target.value)}
          className={`min-h-[120px] ${errors.description ? "border-destructive" : ""}`}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Ejemplos: "Pasto crecido en un patio de 6x4 m, acceso por cochera" o "Fuga debajo del lavabo del baño principal, tubería de PVC"
        </p>
      </div>
    </div>
  );
};

export default ServiceSelector;
