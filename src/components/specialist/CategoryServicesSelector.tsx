import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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

export interface SelectedCategory {
  category: Category;
  selectedTags: string[];
  experienceYears?: number;
}

interface CategoryServicesSelectorProps {
  value: SelectedCategory[];
  onChange: (categories: SelectedCategory[]) => void;
}

const CategoryServicesSelector = ({ value, onChange }: CategoryServicesSelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTags, setCategoryTags] = useState<CategoryTag[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [categoriesResult, tagsResult] = await Promise.all([
      supabase.from('categories').select('*').order('category_name'),
      supabase.from('category_tags').select('*')
    ]);

    if (categoriesResult.data) setCategories(categoriesResult.data);
    if (tagsResult.data) setCategoryTags(tagsResult.data);
  };

  const isCategorySelected = (categoryId: number) => {
    return value.some(sc => sc.category.id === categoryId);
  };

  const getSelectedCategory = (categoryId: number) => {
    return value.find(sc => sc.category.id === categoryId);
  };

  const toggleCategory = (category: Category) => {
    if (isCategorySelected(category.id)) {
      onChange(value.filter(sc => sc.category.id !== category.id));
    } else {
      onChange([...value, { category, selectedTags: [], experienceYears: undefined }]);
      setOpenCategories(prev => ({ ...prev, [category.id]: true }));
    }
  };

  const updateExperienceYears = (categoryId: number, years: number | undefined) => {
    onChange(value.map(sc =>
      sc.category.id === categoryId
        ? { ...sc, experienceYears: years }
        : sc
    ));
  };

  const toggleTag = (categoryId: number, tagName: string) => {
    const selectedCat = getSelectedCategory(categoryId);
    if (!selectedCat) return;

    const newSelectedTags = selectedCat.selectedTags.includes(tagName)
      ? selectedCat.selectedTags.filter(t => t !== tagName)
      : [...selectedCat.selectedTags, tagName];

    onChange(value.map(sc =>
      sc.category.id === categoryId
        ? { ...sc, selectedTags: newSelectedTags }
        : sc
    ));
  };

  const getCategoryTags = (categoryId: number) => {
    return categoryTags.filter(tag => tag.category_id === categoryId);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <h2 className="text-xl font-bold mb-2">Categorías y Servicios *</h2>
        <p className="text-muted-foreground text-sm">
          Selecciona las categorías en las que ofreces servicios y especifica cuáles
        </p>
      </div>

      {/* Selected categories summary */}
      {value.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
          <p className="text-sm font-semibold mb-3">Categorías seleccionadas ({value.length})</p>
          <div className="flex flex-wrap gap-2">
            {value.map(sc => (
              <Badge
                key={sc.category.id}
                variant="secondary"
                className="gap-2 py-2 px-3"
              >
                {sc.category.category_name}
                {sc.selectedTags.length > 0 && (
                  <span className="text-xs">({sc.selectedTags.length} servicios)</span>
                )}
                <button
                  onClick={() => toggleCategory(sc.category)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-3">
        <Label className="text-sm font-semibold">Selecciona tus categorías</Label>
        
        <div className="space-y-2">
          {categories.map(category => {
            const isSelected = isCategorySelected(category.id);
            const selectedCat = getSelectedCategory(category.id);
            const tags = getCategoryTags(category.id);
            const isOpen = openCategories[category.id] ?? false;

            return (
              <div key={category.id} className="border-2 border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-white">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1">
                      <p className="font-medium">{category.category_name}</p>
                      {selectedCat && selectedCat.selectedTags.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedCat.selectedTags.length} servicio{selectedCat.selectedTags.length > 1 ? 's' : ''} seleccionado{selectedCat.selectedTags.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpenCategories(prev => ({ ...prev, [category.id]: !isOpen }))}
                    >
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                    </Button>
                  )}
                </div>

                {isSelected && isOpen && (
                  <div className="border-t-2 border-border p-4 bg-gray-50 space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                        Años de experiencia *
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="Ej: 5"
                        value={selectedCat?.experienceYears || ''}
                        onChange={(e) => {
                          const years = e.target.value ? parseInt(e.target.value) : undefined;
                          updateExperienceYears(category.id, years);
                        }}
                        className="max-w-[200px]"
                      />
                    </div>
                    
                    {tags.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                          Servicios específicos (opcional)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map(tag => (
                            <Badge
                              key={tag.id}
                              variant={selectedCat?.selectedTags.includes(tag.tag_name) ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer transition-all hover:scale-105 py-2 px-4 text-sm",
                                selectedCat?.selectedTags.includes(tag.tag_name) && "bg-primary text-primary-foreground"
                              )}
                              onClick={() => toggleTag(category.id, tag.tag_name)}
                            >
                              {tag.tag_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryServicesSelector;
