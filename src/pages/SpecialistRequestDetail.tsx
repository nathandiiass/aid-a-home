import { useState, useEffect } from 'react';
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
          <h1 className="text-xl font-bold text-foreground">{request.activity}</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Map placeholder */}
          {request.locations?.lat && request.locations?.lng && (
            <Card className="p-4 bg-muted/30 h-48 flex items-center justify-center">
              <div className="text-center text-secondary">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Zona aproximada</p>
                <p className="text-xs">{request.locations.neighborhood}, {request.locations.city}</p>
              </div>
            </Card>
          )}

          {/* Details */}
          <div className="space-y-4">
            <div>
              <Badge variant="secondary" className="mb-2">{request.category}</Badge>
              <h2 className="text-2xl font-bold text-foreground">{request.activity}</h2>
            </div>

            {request.description && (
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-2">Descripción</h3>
                <p className="text-secondary text-sm">{request.description}</p>
              </Card>
            )}

            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Detalles del servicio</h3>
              
              {request.scheduled_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Fecha deseada</p>
                    <p className="text-secondary">
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
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Horario deseado</p>
                    <p className="text-secondary">{request.time_start} - {request.time_end}</p>
                  </div>
                </div>
              )}

              {(request.price_min || request.price_max) && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Presupuesto del cliente</p>
                    <p className="text-secondary">
                      {request.price_min && request.price_max
                        ? `$${request.price_min} - $${request.price_max}`
                        : request.price_min
                        ? `Desde $${request.price_min}`
                        : request.price_max
                        ? `Hasta $${request.price_max}`
                        : 'Sin presupuesto'}
                    </p>
                  </div>
                </div>
              )}

              {request.locations && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Ubicación aproximada</p>
                    <p className="text-secondary">
                      {request.locations.neighborhood}, {request.locations.city}, {request.locations.state}
                    </p>
                  </div>
                </div>
              )}
            </Card>

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

            <Card className="p-4 bg-muted/20">
              <p className="text-sm text-secondary italic">
                Los datos exactos del cliente se mostrarán solo al ser contratado.
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
