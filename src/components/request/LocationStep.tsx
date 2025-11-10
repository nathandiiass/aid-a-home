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

const LocationStep = ({ data, updateData, onNext }: LocationStepProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [street, setStreet] = useState(data.location?.address.split(',')[0] || "");
  const [extNumber, setExtNumber] = useState("");
  const [intNumber, setIntNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [label, setLabel] = useState(data.location?.label || "");
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
        lat: saved.lat || 19.4326,
        lng: saved.lng || -99.1332,
        address: fullAddress,
        label: saved.label,
      },
    });
    onNext();
  };

  const handleContinue = async () => {
    if (!street.trim() || !city.trim() || !state.trim()) {
      setError("Completa los campos obligatorios (calle, ciudad, estado)");
      return;
    }

    setLoading(true);
    setError("");

    const fullAddress = [
      street,
      extNumber && `#${extNumber}`,
      intNumber && `Int. ${intNumber}`,
      neighborhood,
      `${city}, ${state}`
    ].filter(Boolean).join(', ');

    try {
      // Save to database if user is logged in and checkbox is checked
      if (user && saveLocation) {
        const { error } = await supabase
          .from('locations')
          .insert([{
            user_id: user.id,
            label: label.trim() || 'Sin etiqueta',
            street: street.trim(),
            neighborhood: neighborhood.trim() || null,
            ext_number: extNumber.trim() || null,
            int_number: intNumber.trim() || null,
            city: city.trim(),
            state: state.trim(),
            lat: 19.4326, // Mock - in real app, geocode
            lng: -99.1332  // Mock - in real app, geocode
          }]);

        if (error) throw error;
        
        toast({
          title: "Ubicación guardada",
          description: "La dirección se agregó a tus ubicaciones"
        });
      }

      updateData({
        location: {
          lat: 19.4326,
          lng: -99.1332,
          address: fullAddress,
          label: label.trim() || "Sin etiqueta",
        },
      });
      onNext();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconForLabel = (labelText: string) => {
    if (labelText.toLowerCase().includes("casa")) return Home;
    if (labelText.toLowerCase().includes("oficina")) return Briefcase;
    return MapPin;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ubicación</h2>
        <p className="text-muted-foreground">
          ¿Dónde necesitas el servicio?
        </p>
      </div>

      {/* Map placeholder */}
      <Card className="h-48 bg-muted/50 border-border flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">
            Mapa con ubicación GPS
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            (Requiere integración de mapas)
          </p>
        </div>
      </Card>

      <Tabs defaultValue={savedLocations.length > 0 && user ? "saved" : "new"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {user && savedLocations.length > 0 && (
            <TabsTrigger value="saved">Mis ubicaciones</TabsTrigger>
          )}
          <TabsTrigger value="new">Nueva ubicación</TabsTrigger>
        </TabsList>

        {user && savedLocations.length > 0 && (
          <TabsContent value="saved" className="space-y-3 mt-4">
            {savedLocations.map((saved) => {
              const Icon = getIconForLabel(saved.label);
              const fullAddress = [
                saved.street,
                saved.ext_number && `#${saved.ext_number}`,
                saved.int_number && `Int. ${saved.int_number}`,
                saved.neighborhood,
                `${saved.city}, ${saved.state}`
              ].filter(Boolean).join(', ');

              return (
                <Card
                  key={saved.id}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectSaved(saved)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{saved.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {fullAddress}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>
        )}

        <TabsContent value="new" className="space-y-4 mt-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="street">Calle*</Label>
              <Input
                id="street"
                placeholder="Nombre de la calle"
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="extNumber">Número exterior</Label>
                <Input
                  id="extNumber"
                  placeholder="123"
                  value={extNumber}
                  onChange={(e) => setExtNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intNumber">Número interior</Label>
                <Input
                  id="intNumber"
                  placeholder="A"
                  value={intNumber}
                  onChange={(e) => setIntNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Colonia</Label>
              <Input
                id="neighborhood"
                placeholder="Nombre de la colonia"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad*</Label>
              <Input
                id="city"
                placeholder="Ciudad"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado*</Label>
              <Input
                id="state"
                placeholder="Estado"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Etiqueta (opcional)</Label>
              <Input
                id="label"
                placeholder="Ej: Casa, Oficina, Taller"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {user && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveLocation"
                  checked={saveLocation}
                  onChange={(e) => setSaveLocation(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="saveLocation" className="text-sm text-secondary">
                  Guardar esta ubicación para futuras solicitudes
                </label>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleContinue}
        disabled={loading}
        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        size="lg"
      >
        {loading ? 'Guardando...' : 'Continuar'}
      </Button>
    </div>
  );
};

export default LocationStep;
