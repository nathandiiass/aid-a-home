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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [filteredActividades, setFilteredActividades] = useState<Service[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>(categoria || "");
  const [searchFilter, setSearchFilter] = useState<"especialista" | "actividad" | "categoria">("especialista");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    const loadServices = async () => {
      const { data } = await supabase
        .from("servicios_domesticos")
        .select("*")
        .order("especialista", { ascending: true });

      if (data) {
        setAllServices(data);
        const unique = Array.from(new Set(data.map((s) => s.especialista)));
        setEspecialistas(unique);
      }
    };
    loadServices();
  }, []);

  useEffect(() => {
    if (categoria && !especialista) {
      const filtered = allServices.filter((s) => s.categoria === categoria);
      setFilteredActividades(filtered);
      const uniqueEsp = Array.from(new Set(filtered.map((s) => s.especialista)));
      setEspecialistas(uniqueEsp);
      setFilterCategory(categoria);
    } else if (especialista) {
      const filtered = allServices.filter((s) => s.especialista === especialista);
      setFilteredActividades(filtered);
      if (filtered.length > 0) {
        setFilterCategory(filtered[0].categoria);
      }
    } else {
      setFilteredActividades(allServices);
      setFilterCategory("");
    }
  }, [especialista, categoria, allServices]);

  const handleActividadChange = (value: string) => {
    onActividadChange(value);
    const service = allServices.find((s) => s.actividad === value);
    if (service && service.especialista !== especialista) {
      onEspecialistaChange(service.especialista);
    }
  };

  const clearFilter = () => {
    onEspecialistaChange("");
    setFilterCategory("");
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

      <div className="space-y-3">
        <Label>Filtrar búsqueda por:</Label>
        <RadioGroup value={searchFilter} onValueChange={(value: any) => setSearchFilter(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="especialista" id="filter-especialista" />
            <Label htmlFor="filter-especialista" className="font-normal cursor-pointer">
              Especialista
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="actividad" id="filter-actividad" />
            <Label htmlFor="filter-actividad" className="font-normal cursor-pointer">
              Actividad
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="categoria" id="filter-categoria" />
            <Label htmlFor="filter-categoria" className="font-normal cursor-pointer">
              Categoría
            </Label>
          </div>
        </RadioGroup>
      </div>

      {filterCategory && (
        <Badge variant="secondary" className="gap-2 py-2 px-3">
          Filtrado por: {filterCategory}
          <button
            onClick={clearFilter}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      <div className="space-y-2">
        <Label htmlFor="especialista">Especialista *</Label>
        <Select value={especialista} onValueChange={onEspecialistaChange}>
          <SelectTrigger id="especialista" className="h-12">
            <SelectValue placeholder="Selecciona un especialista" />
          </SelectTrigger>
          <SelectContent>
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
