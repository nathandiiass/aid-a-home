import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { X, Camera, Upload, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
interface Category {
  id: number;
  category_key: string;
  category_name: string;
}
interface CategoryTag {
  id: number;
  category_id: number;
  tag_key: string;
  tag_name: string;
}
interface CategoryKeyword {
  id: number;
  category_id: number;
  keyword: string;
}
interface CategoryWithKeyword extends Category {
  matchedKeyword?: string;
}
interface SearchResults {
  directMatches: Category[];
  keywordMatches: CategoryWithKeyword[];
}
interface ServiceSelectorProps {
  categoria: string;
  actividad: string;
  serviceTitle: string;
  serviceDescription: string;
  evidence: File[];
  onCategoriaChange: (value: string) => void;
  onActividadChange: (value: string) => void;
  onServiceTitleChange: (value: string) => void;
  onServiceDescriptionChange: (value: string) => void;
  onEvidenceChange: (files: File[]) => void;
}
const ServiceSelector = ({
  categoria,
  actividad,
  serviceTitle,
  serviceDescription,
  evidence,
  onCategoriaChange,
  onActividadChange,
  onServiceTitleChange,
  onServiceDescriptionChange,
  onEvidenceChange
}: ServiceSelectorProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(actividad ? actividad.split(',').filter(Boolean) : []);
  const [availableTags, setAvailableTags] = useState<CategoryTag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryKeywords, setCategoryKeywords] = useState<CategoryKeyword[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>(categoria || "");
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  const [fileError, setFileError] = useState("");
  const [openCategoria, setOpenCategoria] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [hasLoadedInitialTags, setHasLoadedInitialTags] = useState(false);

  // Sync selectedTags with actividad prop changes
  useEffect(() => {
    if (actividad) {
      const tags = actividad.split(',').filter(Boolean);
      setSelectedTags(tags);
    }
  }, [actividad]);

  // Load categories and keywords on mount
  useEffect(() => {
    const loadData = async () => {
      const [categoriesResult, keywordsResult] = await Promise.all([supabase.from('categories').select('*').order('category_name'), supabase.from('category_keywords').select('*')]);
      if (categoriesResult.error) {
        console.error('Error loading categories:', categoriesResult.error);
      } else if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
      if (keywordsResult.error) {
        console.error('Error loading keywords:', keywordsResult.error);
      } else if (keywordsResult.data) {
        setCategoryKeywords(keywordsResult.data);
      }
    };
    loadData();
  }, []);

  // Update available tags when categoria changes
  useEffect(() => {
    const loadTags = async () => {
      if (selectedCategoria && categories.length > 0) {
        // Find category by name
        const category = categories.find(cat => cat.category_name === selectedCategoria);
        if (category) {
          const {
            data,
            error
          } = await supabase.from('category_tags').select('*').eq('category_id', category.id).order('tag_name');
          if (error) {
            console.error('Error loading tags:', error);
            setAvailableTags([]);
            return;
          }
          if (data) {
            setAvailableTags(data);
            setHasLoadedInitialTags(true);
          } else {
            setAvailableTags([]);
          }
        } else {
          setAvailableTags([]);
        }
      } else {
        setAvailableTags([]);
      }

      // Only clear selected tags if we've already loaded tags once before and user is manually changing category
      // Don't clear on initial load when we're editing an order
      if (hasLoadedInitialTags && selectedCategoria !== categoria) {
        setSelectedTags([]);
        onActividadChange("");
      }
    };
    loadTags();
  }, [selectedCategoria, categories]);
  const handleCategoriaFilterChange = (categoryName: string) => {
    setSelectedCategoria(categoryName);
    setCategorySearchTerm("");
    setOpenCategoria(false);
    onCategoriaChange(categoryName);
  };
  const clearFilters = () => {
    setSelectedCategoria("");
    onCategoriaChange("");
  };
  const handleTagToggle = (tagName: string) => {
    const newTags = selectedTags.includes(tagName) ? selectedTags.filter(t => t !== tagName) : [...selectedTags, tagName];
    setSelectedTags(newTags);
    onActividadChange(newTags.join(','));
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

  // Get filtered categories based on search (including keywords)
  const getFilteredCategories = () => {
    if (!categorySearchTerm || categorySearchTerm.length < 2) {
      return {
        directMatches: categories,
        keywordMatches: []
      };
    }
    const searchLower = categorySearchTerm.toLowerCase();

    // Direct matches in category name or key
    const directMatches = categories.filter(cat => cat.category_name.toLowerCase().includes(searchLower) || cat.category_key.toLowerCase().includes(searchLower));

    // Keyword matches
    const keywordMatchIds = new Set<number>();
    const keywordMatches: CategoryWithKeyword[] = [];
    categoryKeywords.forEach(kw => {
      if (kw.keyword.toLowerCase().includes(searchLower)) {
        if (!keywordMatchIds.has(kw.category_id)) {
          const category = categories.find(c => c.id === kw.category_id);
          if (category && !directMatches.find(dm => dm.id === category.id)) {
            keywordMatchIds.add(kw.category_id);
            keywordMatches.push({
              ...category,
              matchedKeyword: kw.keyword
            });
          }
        }
      }
    });
    return {
      directMatches,
      keywordMatches
    };
  };
  const searchResults = getFilteredCategories();
  return <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <h2 className="text-xl font-bold mb-2">¿Qué servicio necesitas?</h2>
        <p className="text-muted-foreground text-sm">
          Selecciona el especialista y describe el servicio que requieres
        </p>
      </div>

      {/* Filter dropdowns */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="filter-categoria" className="text-sm font-semibold">Filtrar por categoría *</Label>
          <Popover open={openCategoria} onOpenChange={setOpenCategoria}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={openCategoria} className="w-full h-12 justify-between bg-white hover:bg-[#009AFF] hover:text-white hover:border-[#009AFF] transition-colors">
                {selectedCategoria || "Todas las categorías"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 bg-white rounded-2xl shadow-2xl border-0" align="start" sideOffset={4}>
              <Command shouldFilter={false} className="rounded-2xl">
                <CommandInput placeholder="Buscar categoría o sinónimo..." value={categorySearchTerm} onValueChange={setCategorySearchTerm} className="border-0 h-10" />
                <CommandList className="max-h-[400px]">
                  {searchResults.directMatches.length === 0 && searchResults.keywordMatches.length === 0 ? <CommandEmpty>No se encontró la categoría.</CommandEmpty> : <div className="divide-y divide-gray-100">
                      {searchResults.directMatches.length > 0 && <div className="p-2">
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 px-1">Categorías</p>
                          <div className="space-y-0.5">
                            {searchResults.directMatches.map(cat => <button key={cat.id} onClick={() => handleCategoriaFilterChange(cat.category_name)} className="w-full p-2 text-left hover:bg-[#009AFF] transition-colors rounded-lg flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#ff9500]/10 group-hover:bg-white/20">
                                  <span className="font-bold text-xs text-[#ff9601] group-hover:text-white">{cat.category_name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate group-hover:text-white">{cat.category_name}</p>
                                </div>
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 text-[#ff9601] bg-[#ff9500]/10 group-hover:bg-white/20 group-hover:text-white">
                                  Categoría
                                </span>
                              </button>)}
                          </div>
                        </div>}
                      
                      {searchResults.keywordMatches.length > 0 && <div className="p-2">
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 px-1">Categorías relacionadas</p>
                          <div className="space-y-0.5">
                            {searchResults.keywordMatches.map(cat => <button key={`keyword-${cat.id}`} onClick={() => handleCategoriaFilterChange(cat.category_name)} className="w-full p-2 text-left hover:bg-[#009AFF] transition-colors rounded-lg flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#ff9500]/10 group-hover:bg-white/20">
                                  <span className="font-bold text-xs text-[#ff9601] group-hover:text-white">{cat.category_name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate group-hover:text-white">{cat.category_name}</p>
                                  {cat.matchedKeyword && <p className="text-xs text-gray-500 truncate group-hover:text-white/80">{cat.matchedKeyword}</p>}
                                </div>
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 text-[#009aff] bg-[#0099ff]/[0.09] group-hover:bg-white/20 group-hover:text-white">
                                  Relacionada
                                </span>
                              </button>)}
                          </div>
                        </div>}
                    </div>}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedCategoria && <Badge variant="secondary" className="gap-2 py-2 px-3 text-[#009aff] bg-[#0099ff]/[0.08]">
            Filtrado por: {selectedCategoria}
            <button onClick={clearFilters} className="ml-1 hover:bg-muted rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </Badge>}
      </div>

      {/* Tags selector */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-3">
        <div>
          <Label className="text-sm font-semibold">Servicios específicos (opcional)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Selecciona uno o más servicios que necesitas
          </p>
        </div>
        
        {!selectedCategoria ? <div className="p-4 text-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            Primero selecciona una categoría para ver los servicios disponibles
          </div> : availableTags.length === 0 ? <div className="p-4 text-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            No hay servicios disponibles para esta categoría
          </div> : <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => <Badge key={tag.id} variant={selectedTags.includes(tag.tag_name) ? "default" : "outline"} className={cn("cursor-pointer transition-all py-2 px-4 text-sm hover:bg-[#009AFF] hover:text-white hover:border-[#009AFF]", selectedTags.includes(tag.tag_name) && "bg-[#0099ff]/[0.09] text-[#009aff] border-[#009aff]/20")} onClick={() => handleTagToggle(tag.tag_name)}>
                {tag.tag_name}
              </Badge>)}
          </div>}
        
        {selectedTags.length > 0}
      </div>

      {/* Service title */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-3">
        <Label htmlFor="service-title" className="text-sm font-semibold">Título de servicio solicitado *</Label>
        <Input id="service-title" placeholder="Ejemplo: Reparar fuga de baño" value={serviceTitle} onChange={e => handleTitleChange(e.target.value)} onBlur={e => validateTitle(e.target.value)} className={`h-12 ${errors.title ? "border-destructive" : ""}`} />
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