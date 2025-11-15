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

    const fullAddress = [
      street,
      `#${extNumber}`,
      intNumber && `Int. ${intNumber}`,
      neighborhood,
      `${city}, ${state}`
    ].filter(Boolean).join(', ');

    try {
      let locationId: string | undefined = undefined;

      if (user && saveLocation) {
        const { data: insertedLocation, error } = await supabase
          .from('locations')
          .insert([{
            user_id: user.id,
            label: label.trim() || 'Sin etiqueta',
            street: street.trim(),
            neighborhood: neighborhood.trim(),
            ext_number: extNumber.trim(),
            int_number: intNumber.trim() || null,
            city: city.trim(),
            state: state.trim(),
            lat: 19.4326,
            lng: -99.1332,
          }])
          .select()
          .single();

        if (error) throw error;
        locationId = insertedLocation.id;

        toast({
          title: "Ubicación guardada",
          description: "La ubicación se guardó para futuras solicitudes",
        });
      }

      updateData({
        location: {
          id: locationId,
          lat: 19.4326,
          lng: -99.1332,
          address: fullAddress,
          label: label.trim() || 'Sin etiqueta',
        },
      });

      onNext();
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la ubicación",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ubicación</h2>
        <p className="text-muted-foreground">
          Selecciona dónde necesitas el servicio
        </p>
      </div>

      <Tabs defaultValue={savedLocations.length > 0 ? "saved" : "new"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="saved" disabled={savedLocations.length === 0}>
            Ubicaciones guardadas
          </TabsTrigger>
          <TabsTrigger value="new">Nueva ubicación</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-4 mt-4">
          {savedLocations.length === 0 ? (
            <Card className="p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No tienes ubicaciones guardadas
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {savedLocations.map((location) => (
                <Card
                  key={location.id}
                  className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectSaved(location)}
                >
                  <div className="flex items-start gap-3">
                    {location.label.toLowerCase().includes('casa') ? (
                      <Home className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    ) : location.label.toLowerCase().includes('trabajo') ? (
                      <Briefcase className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{location.label}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {location.street}
                        {location.ext_number && ` #${location.ext_number}`}
                        {location.int_number && ` Int. ${location.int_number}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {location.neighborhood && `${location.neighborhood}, `}
                        {location.city}, {location.state}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="label">Etiqueta (opcional)</Label>
            <Input
              id="label"
              placeholder="Ej: Casa, Trabajo, Casa de mamá"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado *</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="state">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_MEXICO.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad / Municipio *</Label>
            <Input
              id="city"
              placeholder="Ej: Guadalajara"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Colonia *</Label>
            <Input
              id="neighborhood"
              placeholder="Ej: Centro"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Calle *</Label>
            <Input
              id="street"
              placeholder="Ej: Av. Juárez"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ext-number">Número exterior *</Label>
              <Input
                id="ext-number"
                placeholder="123"
                value={extNumber}
                onChange={(e) => setExtNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-number">Número interior</Label>
              <Input
                id="int-number"
                placeholder="A"
                value={intNumber}
                onChange={(e) => setIntNumber(e.target.value)}
              />
            </div>
          </div>

          {user && (
            <Card className="p-4 bg-accent/10 border-accent">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="save-location"
                  checked={saveLocation}
                  onCheckedChange={(checked) => setSaveLocation(checked as boolean)}
                />
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor="save-location"
                    className="text-base font-semibold cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Guardar esta ubicación para futuras solicitudes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Podrás usarla rápidamente en tus próximas solicitudes de servicio
                  </p>
                </div>
              </div>
            </Card>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleContinue}
            disabled={loading}
            className="w-full h-12 text-base"
            size="lg"
          >
            {loading ? "Guardando..." : "Continuar"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LocationStep;
