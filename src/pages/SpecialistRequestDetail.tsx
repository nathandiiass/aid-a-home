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
    } catch (error: any) {
      console.error('Error loading request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto p-6">
          <p className="text-center text-secondary">Solicitud no encontrada</p>
        </div>
        <BottomNavSpecialist />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/specialist')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {request.service_title || request.activity}
          </h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Details */}
          <div className="space-y-4">
            {/* Especialista necesario */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Especialista necesario</h3>
              <p className="text-lg font-semibold text-foreground">{request.category}</p>
            </Card>

            {/* Título del servicio */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Título del servicio</h3>
              <p className="text-lg font-semibold text-foreground">
                {request.service_title || request.activity}
              </p>
            </Card>

            {/* Descripción del servicio */}
            {(request.service_description || request.description) && (
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Descripción del servicio</h3>
                <p className="text-foreground">{request.service_description || request.description}</p>
              </Card>
            )}

            {/* Presupuesto */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Presupuesto</h3>
              <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                <DollarSign className="w-5 h-5" />
                <span>
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
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Fecha y horario</h3>
              
              {request.scheduled_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
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

              {request.time_start && request.time_end && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{request.time_start} - {request.time_end}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Ubicación aproximada */}
            {request.locations && (
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Ubicación aproximada</h3>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <p className="font-medium text-foreground">
                    {request.locations.neighborhood}, {request.locations.city}
                  </p>
                </div>
              </Card>
            )}

            {request.evidence_urls && request.evidence_urls.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Evidencias
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {request.evidence_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Evidencia ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4 bg-muted/20 border-l-4 border-primary">
              <p className="text-sm text-foreground">
                Los datos exactos del cliente se mostrarán al enviar la cotización.
              </p>
            </Card>
          </div>

          <Button
            onClick={() => navigate(`/specialist/requests/${id}/quote`)}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white text-base"
          >
            Enviar cotización
          </Button>
        </div>
      </div>

      <BottomNavSpecialist />
    </div>
  );
}
