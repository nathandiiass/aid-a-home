import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RequestData } from "@/pages/CreateRequest";
import { MapPin, Home, Briefcase } from "lucide-react";

interface LocationStepProps {
  data: RequestData;
  updateData: (data: Partial<RequestData>) => void;
  onNext: () => void;
}

const LocationStep = ({ data, updateData, onNext }: LocationStepProps) => {
  const [address, setAddress] = useState(data.location?.address || "");
  const [label, setLabel] = useState(data.location?.label || "");
  const [error, setError] = useState("");

  // Mock saved addresses - in real app, fetch from database
  const savedAddresses = [
    {
      label: "Casa",
      address: "Calle Reforma 123, Col. Centro",
      lat: 19.4326,
      lng: -99.1332,
    },
    {
      label: "Oficina",
      address: "Av. Insurgentes 456, Col. Roma",
      lat: 19.4123,
      lng: -99.1543,
    },
  ];

  const handleSelectSaved = (saved: typeof savedAddresses[0]) => {
    updateData({
      location: {
        lat: saved.lat,
        lng: saved.lng,
        address: saved.address,
        label: saved.label,
      },
    });
    onNext();
  };

  const handleContinue = () => {
    if (!address.trim()) {
      setError("Ingresa una dirección");
      return;
    }

    // In real app, geocode the address
    updateData({
      location: {
        lat: 19.4326,
        lng: -99.1332,
        address: address.trim(),
        label: label.trim() || "Sin etiqueta",
      },
    });
    onNext();
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

      {/* Saved addresses */}
      {savedAddresses.length > 0 && (
        <div className="space-y-2">
          <Label>Direcciones guardadas</Label>
          <div className="space-y-2">
            {savedAddresses.map((saved, index) => {
              const Icon = getIconForLabel(saved.label);
              return (
                <Card
                  key={index}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectSaved(saved)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{saved.label}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {saved.address}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual address input */}
      <div className="space-y-4">
        <Label>O ingresa una nueva dirección</Label>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección completa</Label>
            <Input
              id="address"
              placeholder="Calle, número, colonia, ciudad"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
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
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button
        onClick={handleContinue}
        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        size="lg"
      >
        Continuar
      </Button>
    </div>
  );
};

export default LocationStep;
