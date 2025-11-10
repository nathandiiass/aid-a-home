import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  onEspecialistaChange: (value: string) => void;
  onActividadChange: (value: string) => void;
}

const ServiceSelector = ({
  especialista,
  actividad,
  onEspecialistaChange,
  onActividadChange,
}: ServiceSelectorProps) => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [especialistas, setEspecialistas] = useState<string[]>([]);
  const [filteredActividades, setFilteredActividades] = useState<Service[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");

  // Load all services on mount
  useEffect(() => {
    const loadServices = async () => {
      const { data } = await supabase
        .from("servicios_domesticos")
        .select("*")
        .order("especialista", { ascending: true });

      if (data) {
        setAllServices(data);
        // Get unique especialistas
        const unique = Array.from(new Set(data.map((s) => s.especialista)));
        setEspecialistas(unique);
      }
    };
    loadServices();
  }, []);

  // Update filtered activities when especialista changes
  useEffect(() => {
    if (especialista) {
      const filtered = allServices.filter((s) => s.especialista === especialista);
      setFilteredActividades(filtered);
      
      // Set filter category
      if (filtered.length > 0) {
        setFilterCategory(filtered[0].categoria);
      }
    } else {
      setFilteredActividades(allServices);
      setFilterCategory("");
    }
  }, [especialista, allServices]);

  // Auto-update especialista when actividad changes
  const handleActividadChange = (value: string) => {
    onActividadChange(value);
    
    // Find the service and auto-update especialista
    const service = allServices.find((s) => s.actividad === value);
    if (service && service.especialista !== especialista) {
      onEspecialistaChange(service.especialista);
    }
  };

  const clearFilter = () => {
    onEspecialistaChange("");
    setFilterCategory("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">¿Qué servicio necesitas?</h2>
        <p className="text-muted-foreground">
          Selecciona el especialista y la actividad que requieres
        </p>
      </div>

      {/* Filter chip */}
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

      {/* Especialista selector */}
      <div className="space-y-2">
        <Label htmlFor="especialista">Especialista</Label>
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

      {/* Actividad selector */}
      <div className="space-y-2">
        <Label htmlFor="actividad">Actividad</Label>
        <Select value={actividad} onValueChange={handleActividadChange}>
          <SelectTrigger id="actividad" className="h-12">
            <SelectValue placeholder="Selecciona una actividad" />
          </SelectTrigger>
          <SelectContent>
            {filteredActividades.map((service) => (
              <SelectItem key={service.id} value={service.actividad}>
                {service.actividad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!actividad && especialista && (
          <p className="text-sm text-muted-foreground">
            Selecciona una actividad para continuar
          </p>
        )}
      </div>
    </div>
  );
};

export default ServiceSelector;
