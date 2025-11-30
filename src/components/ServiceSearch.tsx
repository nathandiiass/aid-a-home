import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { searchCategoriesByKeyword, type Category, type CategoryWithSynonym, type SearchResults } from "@/data/categories";
interface GroupedResults {
  categoriasDirectas: Category[];
  categoriasSinonimos: CategoryWithSynonym[];
}
const ServiceSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<GroupedResults>({
    categoriasDirectas: [],
    categoriasSinonimos: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  useEffect(() => {
    const searchCategories = () => {
      if (searchTerm.trim().length < 2) {
        setResults({
          categoriasDirectas: [],
          categoriasSinonimos: []
        });
        return;
      }
      setIsSearching(true);

      // Search ONLY in static categories
      const categoryResults: SearchResults = searchCategoriesByKeyword(searchTerm);
      setResults({
        categoriasDirectas: categoryResults.directMatches.slice(0, 8),
        categoriasSinonimos: categoryResults.synonymMatches.slice(0, 8)
      });
      setIsSearching(false);
    };
    const debounce = setTimeout(searchCategories, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);
  const handleSelectCategoria = (categoryName: string) => {
    if (!user) {
      toast.info("Inicia sesión para crear una solicitud");
      navigate("/auth");
      return;
    }
    navigate("/create-request", {
      state: {
        selectedType: "categoria",
        categoria: categoryName,
        especialista: "",
        actividad: ""
      }
    });
  };
  const hasResults = results.categoriasDirectas.length > 0 || results.categoriasSinonimos.length > 0;
  return <div className="relative w-full">
      <div className="relative border-muted-foreground">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input type="text" placeholder="¿Qué especialista necesitas?" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 text-base bg-white border-gray-200 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm" />
      </div>

      {/* Results dropdown */}
      {searchTerm.length >= 2 && <Card className="absolute z-20 w-full mt-2 max-h-[500px] overflow-auto bg-white border-0 shadow-2xl rounded-2xl">
          {isSearching ? <div className="p-4 text-center text-gray-500">Buscando...</div> : hasResults ? <div className="divide-y divide-gray-100">
              {/* Categorías - Coincidencias directas */}
              {results.categoriasDirectas.length > 0 && <div className="p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2 px-1">Categorías</p>
                  <div className="space-y-1">
                    {results.categoriasDirectas.map(category => <button key={`direct-${category.id}`} onClick={() => handleSelectCategoria(category.category_name)} className="w-full p-3 text-left hover:bg-gray-50 transition-colors rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="text-purple-700 font-bold text-sm">{category.category_name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{category.category_name}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-0">
                          Categoría
                        </Badge>
                      </button>)}
                  </div>
                </div>}

              {/* Categorías - Coincidencias por sinónimo */}
              {results.categoriasSinonimos.length > 0 && <div className="p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2 px-1">Categorías relacionadas</p>
                  <div className="space-y-1">
                    {results.categoriasSinonimos.map(category => <button key={`synonym-${category.id}`} onClick={() => handleSelectCategoria(category.category_name)} className="w-full p-3 text-left hover:bg-gray-50 transition-colors rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="text-purple-700 font-bold text-sm">{category.category_name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{category.category_name}</p>
                          {category.matchedKeyword && <p className="text-xs text-gray-500 mt-0.5">{category.matchedKeyword}</p>}
                        </div>
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                          Relacionada
                        </Badge>
                      </button>)}
                  </div>
                </div>}
            </div> : <div className="p-6 text-center">
              <p className="text-gray-500 text-sm mb-1">No se encontraron resultados</p>
              <p className="text-gray-400 text-xs">Intenta buscar con otras palabras</p>
            </div>}
        </Card>}
    </div>;
};
export default ServiceSearch;