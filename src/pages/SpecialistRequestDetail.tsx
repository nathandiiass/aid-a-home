import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { BottomNavSpecialist } from '@/components/BottomNavSpecialist';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin, DollarSign, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RequestDetail {
  id: string;
  activity: string;
  category: string;
  service_title: string | null;
  service_description: string | null;
  description: string | null;
  scheduled_date: string | null;
  time_start: string | null;
  time_end: string | null;
  time_preference: string | null;
  is_urgent: boolean | null;
  price_min: number | null;
  price_max: number | null;
  evidence_urls: string[] | null;
  locations?: {
    neighborhood: string;
    city: string;
    state: string;
    lat: number | null;
    lng: number | null;
  };
}

export default function SpecialistRequestDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [specialistActivities, setSpecialistActivities] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?returnTo=/specialist');
      return;
    }

    if (user && id) {
      loadRequestDetail();
    }
  }, [user, authLoading, id, navigate]);

  const loadRequestDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          locations (
            neighborhood,
            city,
            state,
            lat,
            lng
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setRequest(data);

      // Load specialist's activities
      if (user?.id) {
        const { data: specialistProfile } = await supabase
          .from('specialist_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (specialistProfile) {
          const { data: specialistTags } = await supabase
            .from('specialist_tags')
            .select(`
              tag_id,
              category_tags (
                tag_name
              )
            `)
            .eq('specialist_id', specialistProfile.id);

          if (specialistTags) {
            const activities = specialistTags
              .map((tag: any) => tag.category_tags?.tag_name)
              .filter(Boolean);
            setSpecialistActivities(activities);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading request:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeDisplay = () => {
    if (!request) return "";
    
    if (request.is_urgent) {
      return "¡Urgente!";
    }
    
    if (request.time_start && request.time_end) {
      return `${request.time_start} - ${request.time_end}`;
    }

    const timeOptions: Record<string, string> = {
      morning: "Mañana (9:00-12:00)",
      afternoon: "Tarde (12:00-17:00)",
      evening: "Noche (17:00-21:00)",
      anytime: "Cualquier hora",
    };

    return timeOptions[request.time_preference || ''] || "Por definir";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-foreground font-semibold">Cargando...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-2xl mx-auto p-6">
          <p className="text-center text-foreground/60">Solicitud no encontrada</p>
        </div>
        <BottomNavSpecialist />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 p-4 flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/specialist')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {request.service_title || request.activity}
          </h1>
        </div>

        <div className="p-4 space-y-4">
          {/* Details */}
          <div className="space-y-4">
            {/* Especialista necesario */}
            <Card className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all">
              <h3 className="text-sm font-semibold text-foreground/60 mb-2">Especialista necesario</h3>
              <p className="text-lg font-bold text-foreground mb-3">{request.category}</p>
              {request.activity && (
                <div className="flex flex-wrap gap-2">
                  {request.activity.split(',').map((tag, index) => {
                    const trimmedTag = tag.trim();
                    const isMatch = specialistActivities.includes(trimmedTag);
                    return (
                      <Badge
                        key={index}
                        variant={isMatch ? "default" : "secondary"}
                        className={isMatch 
                          ? "bg-green-600 text-white hover:bg-green-700" 
                          : "bg-gray-100 text-foreground hover:bg-gray-200"
                        }
                      >
                        {trimmedTag}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Título del servicio */}
            <Card className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all">
              <h3 className="text-sm font-semibold text-foreground/60 mb-2">Título del servicio</h3>
              <p className="text-lg font-bold text-foreground">
                {request.service_title || request.activity}
              </p>
            </Card>

            {/* Descripción del servicio */}
            {(request.service_description || request.description) && (
              <Card className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all">
                <h3 className="text-sm font-semibold text-foreground/60 mb-3">Descripción del servicio</h3>
                <p className="text-foreground leading-relaxed">{request.service_description || request.description}</p>
              </Card>
            )}

            {/* Presupuesto */}
            <Card className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all">
              <h3 className="text-sm font-semibold text-foreground/60 mb-3">Presupuesto</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/50 uppercase tracking-wide">Rango</span>
                <span className="font-bold text-xl text-foreground">
                  {request.price_min && request.price_max
                    ? `$${request.price_min} - $${request.price_max} MXN`
                    : request.price_min
                    ? `Desde $${request.price_min} MXN`
                    : request.price_max
                    ? `Hasta $${request.price_max} MXN`
                    : 'Sin presupuesto, que proponga'}
                </span>
              </div>
            </Card>

            {/* Fecha y Horario */}
            <Card className="bg-white rounded-2xl shadow-md border-0 p-5 space-y-4 hover:shadow-xl transition-all">
              <h3 className="text-sm font-semibold text-foreground/60 mb-1">Fecha y horario</h3>
              
              {request.scheduled_date && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {new Date(request.scheduled_date).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className={`font-medium ${request.is_urgent ? "text-red-600 font-semibold" : "text-foreground"}`}>
                    {formatTimeDisplay()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Ubicación aproximada */}
            {request.locations && (
              <Card className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all">
                <h3 className="text-sm font-semibold text-foreground/60 mb-3">Ubicación aproximada</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="font-medium text-foreground">
                    {request.locations.neighborhood}, {request.locations.city}
                  </p>
                </div>
              </Card>
            )}

            {request.evidence_urls && request.evidence_urls.length > 0 && (
              <Card className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Evidencias
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {request.evidence_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Evidencia ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  ))}
                </div>
              </Card>
            )}

            <Card className="bg-blue-50 rounded-2xl shadow-md border-0 border-l-4 border-blue-500 p-5">
              <p className="text-sm text-foreground/80">
                Los datos exactos del cliente se mostrarán al enviar la cotización.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate(`/specialist/requests/${id}/quote`)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 h-14 bg-rappi-green text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40 flex items-center justify-center font-semibold text-base"
      >
        Enviar cotización
      </button>

      <BottomNavSpecialist />
    </div>
  );
}
