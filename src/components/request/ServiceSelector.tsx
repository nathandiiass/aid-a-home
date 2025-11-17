import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { X, Camera, Upload, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
  evidence: File[];
  onEspecialistaChange: (value: string) => void;
  onActividadChange: (value: string) => void;
  onServiceTitleChange: (value: string) => void;
  onServiceDescriptionChange: (value: string) => void;
  onEvidenceChange: (files: File[]) => void;
}
const ServiceSelector = ({
  especialista,
  actividad,
  serviceTitle,
  serviceDescription,
  categoria,
  evidence,
  onEspecialistaChange,
  onActividadChange,
  onServiceTitleChange,
  onServiceDescriptionChange,
  onEvidenceChange
}: ServiceSelectorProps) => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [especialistas, setEspecialistas] = useState<string[]>([]);
  const [allEspecialistas, setAllEspecialistas] = useState<string[]>([]);
  const [actividades, setActividades] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedActividad, setSelectedActividad] = useState<string>(actividad || "");
  const [selectedCategoria, setSelectedCategoria] = useState<string>(categoria || "");
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  const [fileError, setFileError] = useState("");
  const [openEspecialista, setOpenEspecialista] = useState(false);
  useEffect(() => {
    const loadServices = async () => {
      const {
        data
      } = await supabase.from("servicios_domesticos").select("*").order("especialista", {
        ascending: true
      });
      if (data) {
        setAllServices(data);
        const uniqueEsp = Array.from(new Set(data.map(s => s.especialista)));
        const uniqueAct = Array.from(new Set(data.map(s => s.actividad)));
        const uniqueCat = Array.from(new Set(data.map(s => s.categoria)));
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
      const filtered = allServices.filter(s => s.actividad === selectedActividad);
      filteredEspecialistas = Array.from(new Set(filtered.map(s => s.especialista)));
    } else if (selectedCategoria) {
      const filtered = allServices.filter(s => s.categoria === selectedCategoria);
      filteredEspecialistas = Array.from(new Set(filtered.map(s => s.especialista)));
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
      setErrors(prev => ({
        ...prev,
        title: "El título es obligatorio"
      }));
      return false;
    }
    if (value.trim().length < 10) {
      setErrors(prev => ({
        ...prev,
        title: "El título debe tener al menos 10 caracteres"
      }));
      return false;
    }
    setErrors(prev => ({
      ...prev,
      title: undefined
    }));
    return true;
  };
  const validateDescription = (value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({
        ...prev,
        description: "La descripción es obligatoria"
      }));
      return false;
    }
    if (value.trim().length < 20) {
      setErrors(prev => ({
        ...prev,
        description: "La descripción debe tener al menos 20 caracteres"
      }));
      return false;
    }
    setErrors(prev => ({
      ...prev,
      description: undefined
    }));
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const totalFiles = evidence.length + selectedFiles.length;
    if (totalFiles > 5) {
      setFileError("Máximo 5 archivos permitidos");
      return;
    }

    // Validate file types and sizes
    for (const file of selectedFiles) {
      const validTypes = ["image/jpeg", "image/png", "video/mp4"];
      if (!validTypes.includes(file.type)) {
        setFileError("Solo se permiten archivos JPG, PNG o MP4");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError("Cada archivo debe ser menor a 10MB");
        return;
      }
    }
    onEvidenceChange([...evidence, ...selectedFiles]);
    setFileError("");
  };
  const removeFile = (index: number) => {
    onEvidenceChange(evidence.filter((_, i) => i !== index));
  };
  return <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <h2 className="text-xl font-bold mb-2">¿Qué servicio necesitas?</h2>
        <p className="text-muted-foreground text-sm">
          Selecciona el especialista y describe el servicio que requieres
        </p>
      </div>

      {/* Filter dropdowns */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="filter-actividad" className="text-sm font-semibold">Filtrar por actividad</Label>
            <Select value={selectedActividad} onValueChange={handleActividadFilterChange}>
              <SelectTrigger id="filter-actividad" className="h-12 bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {actividades.map(act => <SelectItem key={act} value={act}>
                    {act}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-categoria" className="text-sm font-semibold">Filtrar por categoría</Label>
            <Select value={selectedCategoria} onValueChange={handleCategoriaFilterChange}>
              <SelectTrigger id="filter-categoria" className="h-12 bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {categorias.map(cat => <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(selectedActividad || selectedCategoria) && <Badge variant="secondary" className="gap-2 py-2 px-3">
            Filtrado por: {selectedActividad || selectedCategoria}
            <button onClick={clearFilters} className="ml-1 hover:bg-muted rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </Badge>}
      </div>

      {/* Especialista selector */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-3">
        <Label htmlFor="especialista" className="text-sm font-semibold">Especialista *</Label>
        <Popover open={openEspecialista} onOpenChange={setOpenEspecialista}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openEspecialista} className="w-full h-12 justify-between bg-white">
              {especialista || "Selecciona un especialista"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-white" align="start">
            <Command>
              <CommandInput placeholder="Buscar especialista..." />
              <CommandList>
                <CommandEmpty>No se encontró el especialista.</CommandEmpty>
                <CommandGroup>
                  {especialistas.map(esp => <CommandItem key={esp} value={esp} onSelect={currentValue => {
                  onEspecialistaChange(currentValue === especialista ? "" : currentValue);
                  setOpenEspecialista(false);
                }}>
                      <Check className={cn("mr-2 h-4 w-4", especialista === esp ? "opacity-100" : "opacity-0")} />
                      {esp}
                    </CommandItem>)}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Service title */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-3">
        <Label htmlFor="service-title" className="text-sm font-semibold">Título de servicio solicitado *</Label>
        <Input id="service-title" placeholder="Ej: Cortar pasto de mi patio" value={serviceTitle} onChange={e => handleTitleChange(e.target.value)} onBlur={e => validateTitle(e.target.value)} className={`h-12 ${errors.title ? "border-destructive" : ""}`} />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        
      </div>

      {/* Service description */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-3">
        <Label htmlFor="service-description" className="text-sm font-semibold">Descripción del servicio *</Label>
        <Textarea id="service-description" placeholder="Describe con detalle qué necesitas, lugar, dimensiones, materiales, etc." value={serviceDescription} onChange={e => handleDescriptionChange(e.target.value)} onBlur={e => validateDescription(e.target.value)} className={`min-h-[120px] ${errors.description ? "border-destructive" : ""}`} />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        <p className="text-xs text-muted-foreground">
          Ejemplos: "Pasto crecido en un patio de 6x4 m, acceso por cochera" o "Fuga debajo del lavabo del baño principal, tubería de PVC"
        </p>
      </div>

      {/* Evidencias section */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-4">
        <div>
          <Label className="text-sm font-semibold">Evidencias (opcional)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Adjunta fotos o videos relacionados con el trabajo que necesitas
          </p>
          <p className="text-xs text-muted-foreground">
            Ejemplo: Foto de la fuga, del jardín, del área a reparar, etc.
          </p>
        </div>

        {/* Upload area */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl hover:border-rappi-green/50 transition-colors">
          <label htmlFor="file-upload-evidence" className="flex flex-col items-center justify-center p-6 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-gray-600" />
            </div>
            <p className="font-medium text-foreground mb-1 text-sm">
              Toca para subir archivos
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Máximo 5 fotos (JPG, PNG) o videos (MP4)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Límite: 10MB por archivo
            </p>
            <input id="file-upload-evidence" type="file" accept="image/jpeg,image/png,video/mp4" multiple onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {fileError && <p className="text-sm text-destructive">{fileError}</p>}

        {/* File previews */}
        {evidence.length > 0 && <div className="space-y-3">
            <p className="text-sm font-semibold">
              Archivos seleccionados ({evidence.length}/5)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {evidence.map((file, index) => <div key={index} className="relative overflow-hidden rounded-xl">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Video</p>
                      </div>}
                  </div>
                  <button type="button" onClick={() => removeFile(index)} className="absolute top-2 right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/90 shadow-md">
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="p-2 bg-white">
                    <p className="text-xs truncate">{file.name}</p>
                  </div>
                </div>)}
            </div>
          </div>}
      </div>
    </div>;
};
export default ServiceSelector;