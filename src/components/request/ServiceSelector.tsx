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
  const [selectedTags, setSelectedTags] = useState<string[]>(especialista ? especialista.split(',').filter(Boolean) : []);
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

  // Load categories and keywords on mount
  useEffect(() => {
    const loadData = async () => {
      const [categoriesResult, keywordsResult] = await Promise.all([
        supabase.from('categories').select('*').order('category_name'),
        supabase.from('category_keywords').select('*')
      ]);
      
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
          const { data, error } = await supabase
            .from('category_tags')
            .select('*')
            .eq('category_id', category.id)
            .order('tag_name');
          
          if (error) {
            console.error('Error loading tags:', error);
            setAvailableTags([]);
            return;
          }
          
          if (data) {
            setAvailableTags(data);
          } else {
            setAvailableTags([]);
          }
        } else {
          setAvailableTags([]);
        }
      } else {
        setAvailableTags([]);
      }
      
      // Clear selected tags when category changes
      setSelectedTags([]);
      onEspecialistaChange("");
    };
    
    loadTags();
  }, [selectedCategoria, categories]);
  
  const handleCategoriaFilterChange = (categoryName: string) => {
    setSelectedCategoria(categoryName);
    setCategorySearchTerm("");
    setOpenCategoria(false);
  };
  
  const clearFilters = () => {
    setSelectedCategoria("");
  };
  
  const handleTagToggle = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(t => t !== tagName)
      : [...selectedTags, tagName];
    
    setSelectedTags(newTags);
    onEspecialistaChange(newTags.join(','));
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
      return { directMatches: categories, keywordMatches: [] };
    }

    const searchLower = categorySearchTerm.toLowerCase();
    console.log('Searching for:', searchLower, 'Total keywords loaded:', categoryKeywords.length);
    
    // Direct matches in category name or key
    const directMatches = categories.filter(cat => 
      cat.category_name.toLowerCase().includes(searchLower) ||
      cat.category_key.toLowerCase().includes(searchLower)
    );

    // Keyword matches
    const keywordMatchIds = new Set<number>();
    const keywordMatches: CategoryWithKeyword[] = [];
    
    categoryKeywords.forEach(kw => {
      if (kw.keyword.toLowerCase().includes(searchLower)) {
        console.log('Keyword match found:', kw.keyword, 'for category_id:', kw.category_id);
        if (!keywordMatchIds.has(kw.category_id)) {
          const category = categories.find(c => c.id === kw.category_id);
          if (category && !directMatches.find(dm => dm.id === category.id)) {
            keywordMatchIds.add(kw.category_id);
            keywordMatches.push({
              ...category,
              matchedKeyword: kw.keyword
            });
            console.log('Added keyword match:', category.category_name);
          }
        }
      }
    });

    console.log('Search results - Direct:', directMatches.length, 'Keywords:', keywordMatches.length);
    return { directMatches, keywordMatches };
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
              <Button variant="outline" role="combobox" aria-expanded={openCategoria} className="w-full h-12 justify-between bg-white">
                {selectedCategoria || "Todas las categorías"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Buscar categoría o sinónimo..." 
                  value={categorySearchTerm}
                  onValueChange={setCategorySearchTerm}
                />
                <CommandList>
                  {searchResults.directMatches.length === 0 && searchResults.keywordMatches.length === 0 ? (
                    <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                  ) : (
                    <>
                      {searchResults.directMatches.length > 0 && (
                        <CommandGroup heading="Categorías">
                          {searchResults.directMatches.map(cat => (
                            <CommandItem 
                              key={cat.id} 
                              value={cat.category_name}
                              onSelect={() => handleCategoriaFilterChange(cat.category_name)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedCategoria === cat.category_name ? "opacity-100" : "opacity-0")} />
                              {cat.category_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      
                      {searchResults.keywordMatches.length > 0 && (
                        <CommandGroup heading="Categorías relacionadas">
                          {searchResults.keywordMatches.map(cat => (
                            <CommandItem 
                              key={`keyword-${cat.id}`} 
                              value={cat.category_name}
                              onSelect={() => handleCategoriaFilterChange(cat.category_name)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedCategoria === cat.category_name ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span>{cat.category_name}</span>
                                {cat.matchedKeyword && (
                                  <span className="text-xs text-muted-foreground">{cat.matchedKeyword}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedCategoria && <Badge variant="secondary" className="gap-2 py-2 px-3">
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
        
        {!selectedCategoria ? (
          <div className="p-4 text-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            Primero selecciona una categoría para ver los servicios disponibles
          </div>
        ) : availableTags.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            No hay servicios disponibles para esta categoría
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.tag_name) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105 py-2 px-4 text-sm",
                  selectedTags.includes(tag.tag_name) && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleTagToggle(tag.tag_name)}
              >
                {tag.tag_name}
              </Badge>
            ))}
          </div>
        )}
        
        {selectedTags.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Seleccionados ({selectedTags.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tagName => (
                <Badge key={tagName} variant="secondary" className="gap-2 py-1.5 px-3">
                  {tagName}
                  <button 
                    onClick={() => handleTagToggle(tagName)} 
                    className="hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
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