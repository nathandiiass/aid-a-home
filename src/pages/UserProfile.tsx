import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Star, Clock, Package, Shield } from "lucide-react";
import { useState } from "react";
export default function UserProfile() {
  const {
    userId
  } = useParams();
  const navigate = useNavigate();
  const [showFullBio, setShowFullBio] = useState(false);
  const {
    data: profile,
    isLoading
  } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      return data;
    }
  });

  // Get client reviews data
  const {
    data: clientStats
  } = useQuery({
    queryKey: ["client-reviews-stats", userId],
    queryFn: async () => {
      const {
        data: reviews,
        error
      } = await supabase.from("client_reviews").select("*").eq("client_id", userId);
      if (error) throw error;
      return {
        totalReviews: reviews?.length || 0,
        averageRating: profile?.rating_promedio_cliente || 0,
        avgClaridadNecesidades: profile?.avg_claridad_necesidades || 0,
        avgPuntualidad: profile?.avg_puntualidad_disponibilidad || 0,
        avgRespeto: profile?.avg_respeto_profesionalismo_cliente || 0,
        avgFacilito: profile?.avg_facilito_condiciones_trabajo || 0,
        avgPago: profile?.avg_claridad_cumplimiento_pago || 0,
        porcentajeVolveria: profile?.porcentaje_volveria_trabajar_cliente || 0
      };
    },
    enabled: !!profile
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
    cancellation_level: "low"
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  if (!profile) {
    return <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground mb-4">Usuario no encontrado</p>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>;
  }
  const displayName = `${profile.first_name} ${profile.last_name_paterno || profile.last_name_materno || ""}`.trim();
  const initials = profile.first_name?.charAt(0) || "U";
  const bio = mockData.bio_public;
  const shouldTruncate = bio.length > 150;
  const displayBio = showFullBio || !shouldTruncate ? bio : bio.substring(0, 150) + "...";
  return <div className="min-h-screen bg-gray-50 pb-24">
      {/* App Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-900 hover:text-rappi-green transition-colors">
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Volver</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-lg">
              <AvatarImage src={profile.avatar_url || ""} alt={displayName} />
              <AvatarFallback className="text-3xl bg-rappi-green/10 text-rappi-green font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                {mockData.verified && <Badge variant="secondary" className="bg-rappi-green/10 text-rappi-green border-0">
                    <Shield className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>}
              </div>
              {mockData.zones.length > 0 && <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                  
                  
                </div>}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              <span className="text-3xl font-bold text-gray-900">
                {clientStats?.averageRating ? clientStats.averageRating.toFixed(1) : '0.0'}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Promedio</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 text-center space-y-2">
            <div className="text-3xl font-bold text-gray-900">
              {clientStats?.totalReviews || 0}
            </div>
            <p className="text-sm text-gray-600 font-medium">De especialistas</p>
          </div>
        </div>

        {/* Resumen de reseñas de especialistas */}
        {clientStats && clientStats.totalReviews > 0 && <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-900">
              Resumen General
            </h2>

            {/* Rating breakdown */}
            <div className="space-y-4">
              {/* Claridad en necesidades */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Claridad en necesidades</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= Math.round(clientStats.avgClaridadNecesidades) ? 'fill-amber-500 text-amber-500' : 'fill-gray-200 text-gray-200'}`} />)}
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">
                    {clientStats.avgClaridadNecesidades.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Puntualidad y disponibilidad */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Puntualidad y disponibilidad</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= Math.round(clientStats.avgPuntualidad) ? 'fill-amber-500 text-amber-500' : 'fill-gray-200 text-gray-200'}`} />)}
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">
                    {clientStats.avgPuntualidad.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Respeto y profesionalismo */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Respeto y profesionalismo</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= Math.round(clientStats.avgRespeto) ? 'fill-amber-500 text-amber-500' : 'fill-gray-200 text-gray-200'}`} />)}
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">
                    {clientStats.avgRespeto.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Facilitó condiciones de trabajo */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Facilitó condiciones de trabajo</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= Math.round(clientStats.avgFacilito) ? 'fill-amber-500 text-amber-500' : 'fill-gray-200 text-gray-200'}`} />)}
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">
                    {clientStats.avgFacilito.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Claridad en pago */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Claridad en pago</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= Math.round(clientStats.avgPago) ? 'fill-amber-500 text-amber-500' : 'fill-gray-200 text-gray-200'}`} />)}
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">
                    {clientStats.avgPago.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Volverían a trabajar */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium">Volverían a trabajar contigo</span>
                <span className="text-2xl font-bold text-rappi-green">
                  {clientStats.porcentajeVolveria.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>}

        {/* Sobre mí */}
        {bio && <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
            <h2 className="text-base font-bold text-gray-900">
              Sobre mí
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {displayBio}
            </p>
            {shouldTruncate && <button onClick={() => setShowFullBio(!showFullBio)} className="text-sm text-rappi-green font-semibold hover:text-rappi-green/80 transition-colors">
                {showFullBio ? "Ver menos" : "Ver más"}
              </button>}
          </div>}

        {/* Necesidades frecuentes */}
        {mockData.top_services.length > 0 && <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              Necesidades frecuentes
            </h2>
            <div className="flex flex-wrap gap-2">
              {mockData.top_services.map((service, index) => <Badge key={index} variant="outline" className="bg-gray-50 border-gray-200 text-gray-700 font-medium px-3 py-1">
                  {service}
                </Badge>)}
            </div>
          </div>}

        {/* Preferencias de atención */}
        {(mockData.time_preferences.length > 0 || mockData.materials_preference) && <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              Preferencias de atención
            </h2>
            <div className="space-y-4">
              {mockData.time_preferences.length > 0 && <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-rappi-green/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-rappi-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Horarios preferidos</p>
                    <div className="flex flex-wrap gap-2">
                      {mockData.time_preferences.map((time, index) => <Badge key={index} variant="secondary" className="bg-gray-50 text-gray-700 border-0 font-medium">
                          {time}
                        </Badge>)}
                    </div>
                  </div>
                </div>}
              {mockData.materials_preference && <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-rappi-green/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-rappi-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Materiales</p>
                    <p className="text-sm text-gray-600">
                      Prefiere que el {mockData.materials_preference.toLowerCase()} los proporcione
                    </p>
                  </div>
                </div>}
            </div>
          </div>}

        {/* Zonas de servicio */}
        {mockData.zones.length > 0}

        {/* Políticas y seguridad */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">
            Políticas y seguridad
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Cuenta verificada</span>
              <Badge variant="secondary" className="bg-rappi-green/10 text-rappi-green border-0 font-semibold">
                {mockData.verified ? "Sí" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Pago verificado</span>
              <Badge variant="secondary" className="bg-rappi-green/10 text-rappi-green border-0 font-semibold">
                {mockData.payment_verified ? "Sí" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Historial de cancelaciones</span>
              <Badge variant="secondary" className={mockData.cancellation_level === "low" ? "bg-green-100 text-green-800 border-0 font-semibold" : mockData.cancellation_level === "mid" ? "bg-yellow-100 text-yellow-800 border-0 font-semibold" : "bg-red-100 text-red-800 border-0 font-semibold"}>
                {mockData.cancellation_level === "low" ? "Bajo" : mockData.cancellation_level === "mid" ? "Medio" : "Alto"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          
        </div>
      </div>
    </div>;
}