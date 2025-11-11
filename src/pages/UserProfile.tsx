import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Star, MapPin, Clock, Package, Shield } from "lucide-react";
import { useState } from "react";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [showFullBio, setShowFullBio] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name_paterno, last_name_materno, display_name, avatar_url, date_of_birth, gender, nationality, bio, created_at, updated_at")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Mock data for fields not yet in DB
  const mockData = {
    verified: true,
    rating_avg: 4.7,
    rating_count: 58,
    orders_completed: 23,
    bio_public: "Cliente confiable y puntual. Me gusta mantener mi casa en buen estado y valoro el trabajo bien hecho.",
    top_services: ["Reparar fugas", "Cortar pasto", "Pintar interior", "Electricidad"],
    time_preferences: ["Mañana", "Tarde"],
    materials_preference: "Especialista",
    zones: ["Polanco", "Roma Norte"],
    payment_verified: true,
    cancellation_level: "low",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground mb-4">Usuario no encontrado</p>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const displayName = `${profile.first_name} ${profile.last_name_paterno || profile.last_name_materno || ""}`.trim();
  const initials = profile.first_name?.charAt(0) || "U";

  const bio = mockData.bio_public;
  const shouldTruncate = bio.length > 150;
  const displayBio = showFullBio || !shouldTruncate ? bio : bio.substring(0, 150) + "...";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* App Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <Avatar className="h-28 w-28 mx-auto border-4 border-background shadow-lg">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
              {mockData.verified && (
                <Badge variant="secondary" className="bg-[#FDF0D5] text-[#003049] border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
            {mockData.zones.length > 0 && (
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{mockData.zones[0]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center space-y-2 border-[#E6EEF4]">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-[#C1121F] text-[#C1121F]" />
              <span className="text-2xl font-bold text-foreground">{mockData.rating_avg}</span>
            </div>
            <p className="text-xs text-muted-foreground">Promedio</p>
          </Card>

          <Card className="p-4 text-center space-y-2 border-[#E6EEF4]">
            <div className="text-2xl font-bold text-foreground">{mockData.rating_count}</div>
            <p className="text-xs text-muted-foreground">De especialistas</p>
          </Card>
        </div>

        {/* Sobre mí */}
        {bio && (
          <Card className="p-6 space-y-3 border-[#E6EEF4]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#003049]">
              Sobre mí
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayBio}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullBio(!showFullBio)}
                className="text-sm text-[#C1121F] hover:underline"
              >
                {showFullBio ? "Ver menos" : "Ver más"}
              </button>
            )}
          </Card>
        )}

        {/* Necesidades frecuentes */}
        {mockData.top_services.length > 0 && (
          <Card className="p-6 space-y-3 border-[#E6EEF4]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#003049]">
              Necesidades frecuentes
            </h2>
            <div className="flex flex-wrap gap-2">
              {mockData.top_services.map((service, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-[#FDF0D5] border-[#669BBC]/30 text-[#003049]"
                >
                  {service}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Preferencias de atención */}
        {(mockData.time_preferences.length > 0 || mockData.materials_preference) && (
          <Card className="p-6 space-y-4 border-[#E6EEF4]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#003049]">
              Preferencias de atención
            </h2>
            <div className="space-y-3">
              {mockData.time_preferences.length > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#669BBC] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Horarios preferidos</p>
                    <div className="flex flex-wrap gap-2">
                      {mockData.time_preferences.map((time, index) => (
                        <Badge key={index} variant="secondary" className="bg-[#669BBC]/10 text-[#003049]">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {mockData.materials_preference && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-[#669BBC] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Materiales</p>
                    <p className="text-sm text-muted-foreground">
                      Prefiere que el {mockData.materials_preference.toLowerCase()} los proporcione
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Zonas de servicio */}
        {mockData.zones.length > 0 && (
          <Card className="p-6 space-y-3 border-[#E6EEF4]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#003049]">
              Zonas de servicio (referencia)
            </h2>
            <div className="flex flex-wrap gap-2">
              {mockData.zones.map((zone, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-[#669BBC] text-[#003049]"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {zone}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Políticas y seguridad */}
        <Card className="p-6 space-y-3 border-[#E6EEF4]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#003049]">
            Políticas y seguridad
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cuenta verificada</span>
              <Badge variant="secondary" className="bg-[#FDF0D5] text-[#003049]">
                {mockData.verified ? "Sí" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pago verificado</span>
              <Badge variant="secondary" className="bg-[#FDF0D5] text-[#003049]">
                {mockData.payment_verified ? "Sí" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Historial de cancelaciones</span>
              <Badge
                variant="secondary"
                className={
                  mockData.cancellation_level === "low"
                    ? "bg-green-100 text-green-800"
                    : mockData.cancellation_level === "mid"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {mockData.cancellation_level === "low" ? "Bajo" : mockData.cancellation_level === "mid" ? "Medio" : "Alto"}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg">
        <div className="container max-w-2xl mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="w-full border-[#669BBC] text-[#003049] hover:bg-[#669BBC]/10"
            onClick={() => navigate(-1)}
          >
            Volver al chat
          </Button>
        </div>
      </div>
    </div>
  );
}
