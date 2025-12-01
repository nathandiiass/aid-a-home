import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RequestData } from "@/pages/CreateRequest";
import { MapPin, Home, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationStepProps {
  data: RequestData;
  updateData: (data: Partial<RequestData>) => void;
  onNext: () => void;
}

interface SavedLocation {
  id: string;
  label: string;
  street: string;
  neighborhood?: string;
  ext_number?: string;
  int_number?: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

const ESTADOS_MEXICO = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

const LocationStep = ({ data, updateData, onNext }: LocationStepProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [street, setStreet] = useState("");
  const [extNumber, setExtNumber] = useState("");
  const [intNumber, setIntNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [saveLocation, setSaveLocation] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedLocations();
    }
  }, [user]);

  const fetchSavedLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedLocations(data || []);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleSelectSaved = (saved: SavedLocation) => {
    const fullAddress = [
      saved.street,
      saved.ext_number && `#${saved.ext_number}`,
      saved.int_number && `Int. ${saved.int_number}`,
      saved.neighborhood,
      `${saved.city}, ${saved.state}`
    ].filter(Boolean).join(', ');

    updateData({
      location: {
        id: saved.id,
        lat: saved.lat || 19.4326,
        lng: saved.lng || -99.1332,
        address: fullAddress,
        label: saved.label,
      },
    });
    onNext();
  };

  const handleContinue = async () => {
    if (!street.trim() || !extNumber.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      setError("Completa los campos obligatorios: Estado, Ciudad/Municipio, Colonia, Calle y Número exterior");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let locationId: string | null = null;

      if (saveLocation && user) {
        if (!label.trim()) {
          setError("Agrega una etiqueta para guardar esta dirección");
          setLoading(false);
          return;
        }

        const { data: newLocation, error } = await supabase
          .from('locations')
          .insert({
            user_id: user.id,
            label: label,
            street: street,
            ext_number: extNumber,
            int_number: intNumber || null,
            neighborhood: neighborhood,
            city: city,
            state: state,
          })
          .select()
          .single();

        if (error) throw error;
        locationId = newLocation.id;

        toast({
          title: "Ubicación guardada",
          description: "La dirección se guardó correctamente",
        });
      }

      const fullAddress = [
        street,
        extNumber && `#${extNumber}`,
        intNumber && `Int. ${intNumber}`,
        neighborhood,
        `${city}, ${state}`
      ].filter(Boolean).join(', ');

      updateData({
        location: {
          id: locationId,
          lat: 19.4326,
          lng: -99.1332,
          address: fullAddress,
          label: label || "Nueva dirección",
        },
      });

      onNext();
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la ubicación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLabelIcon = (label: string) => {
    if (label.toLowerCase().includes("casa")) return <Home className="w-5 h-5" />;
    if (label.toLowerCase().includes("trabajo")) return <Briefcase className="w-5 h-5" />;
    return <MapPin className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-8 bg-white rounded-full p-1.5 shadow-sm">
            <TabsTrigger value="saved" className="rounded-full py-3 data-[state=active]:bg-rappi-green data-[state=active]:text-white">
              Direcciones guardadas
            </TabsTrigger>
            <TabsTrigger value="new" className="rounded-full py-3 data-[state=active]:bg-rappi-green data-[state=active]:text-white">
              Nueva dirección
            </TabsTrigger>
          </TabsList>

        <TabsContent value="saved" className="mt-0">
          {!user ? (
            <Card className="bg-white rounded-2xl shadow-lg border-0 p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                Inicia sesión para ver tus direcciones guardadas
              </p>
            </Card>
          ) : savedLocations.length === 0 ? (
            <Card className="bg-white rounded-2xl shadow-lg border-0 p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                No tienes direcciones guardadas
              </p>
              <p className="text-sm text-gray-500">
                Agrega una nueva dirección y guárdala para usarla después
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {savedLocations.map((saved) => (
                <Card
                  key={saved.id}
                  className="bg-white rounded-2xl shadow-sm border-0 p-5 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleSelectSaved(saved)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getLabelIcon(saved.label)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{saved.label}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {saved.street} #{saved.ext_number}
                        {saved.int_number && ` Int. ${saved.int_number}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {saved.neighborhood}, {saved.city}, {saved.state}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="mt-0">
          <Card className="bg-white rounded-2xl shadow-sm border-0 p-6">
            <div className="space-y-5">
              <div>
                <Label htmlFor="state" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Estado *
                </Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {ESTADOS_MEXICO.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Ciudad/Municipio *
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: Monterrey"
                  className="h-12 bg-white border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="neighborhood" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Colonia *
                </Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ej: Centro"
                  className="h-12 bg-white border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="street" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Calle *
                </Label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ej: Avenida Juárez"
                  className="h-12 bg-white border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="extNumber" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Número exterior *
                </Label>
                <Input
                  id="extNumber"
                  value={extNumber}
                  onChange={(e) => setExtNumber(e.target.value)}
                  placeholder="Ej: 123"
                  className="h-12 bg-white border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="intNumber" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Número interior
                </Label>
                <Input
                  id="intNumber"
                  value={intNumber}
                  onChange={(e) => setIntNumber(e.target.value)}
                  placeholder="Ej: 4B"
                  className="h-12 bg-white border-gray-200 rounded-xl"
                />
              </div>

              {(street && city && state) && (
                <Card className="bg-gray-50 border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4">
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Ubicación en el mapa
                    </Label>
                    <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=-99.2,-19.3,-99.0,19.5&layer=mapnik&marker=19.4326,-99.1332`}
                        style={{ border: 0 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      La ubicación exacta se mostrará una vez completada la dirección
                    </p>
                  </div>
                </Card>
              )}

              {user && (
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <Checkbox
                      id="save"
                      checked={saveLocation}
                      onCheckedChange={(checked) => setSaveLocation(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="save"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        Guardar esta dirección
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Podrás usarla en futuros pedidos
                      </p>
                    </div>
                  </div>

                  {saveLocation && (
                    <div>
                      <Label htmlFor="label" className="text-sm font-semibold text-gray-900 mb-2 block">
                        Etiqueta para esta dirección
                      </Label>
                      <Input
                        id="label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Ej: Casa, Trabajo, Casa de mamá"
                        className="h-12 bg-white border-gray-200 rounded-xl"
                      />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleContinue}
                disabled={loading}
                className="w-full h-12 bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full font-semibold"
              >
                {loading ? "Guardando..." : "Continuar"}
              </Button>
            </div>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LocationStep;
