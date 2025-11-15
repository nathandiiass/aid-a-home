import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { BottomNavSpecialist } from '@/components/BottomNavSpecialist';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin, DollarSign } from 'lucide-react';
import { useSpecialistMode } from '@/hooks/use-specialist-mode';
import { Logo } from '@/components/Logo';

interface ServiceRequest {
  id: string;
  activity: string;
  category: string;
  service_title: string | null;
  scheduled_date: string | null;
  time_start: string | null;
  time_end: string | null;
  time_preference: string | null;
  is_urgent: boolean | null;
  price_min: number | null;
  price_max: number | null;
  location_id: string | null;
  locations?: {
    neighborhood: string;
    city: string;
  };
}

export default function SpecialistHome() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialistCategories, setSpecialistCategories] = useState<string[]>([]);
  const { isSpecialistMode } = useSpecialistMode();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?returnTo=/specialist');
      return;
    }

    if (user && !authLoading) {
      loadSpecialistData();
    }
  }, [user, authLoading, navigate]);

  const loadSpecialistData = async () => {
    try {
      // Get specialist profile
      const { data: profile, error: profileError } = await supabase
        .from('specialist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        navigate('/specialist-registration');
        return;
      }

      // Get specialist specialties
      const { data: specialties, error: specialtiesError } = await supabase
        .from('specialist_specialties')
        .select('specialty')
        .eq('specialist_id', profile.id);

      if (specialtiesError) throw specialtiesError;

      const categories = specialties?.map(s => s.specialty) || [];
      setSpecialistCategories(categories);

      // Load active requests matching specialist's categories
      if (categories.length > 0) {
        // First, get all request IDs where this specialist has already sent a quote
        const { data: existingQuotes, error: quotesError } = await supabase
          .from('quotes')
          .select('request_id')
          .eq('specialist_id', profile.id);

        if (quotesError) throw quotesError;

        const quotedRequestIds = existingQuotes?.map(q => q.request_id) || [];

        // Load active requests, excluding those already quoted
        const { data: requestsData, error: requestsError } = await supabase
          .from('service_requests')
          .select(`
            *,
            locations (
              neighborhood,
              city
            )
          `)
          .eq('status', 'active')
          .in('category', categories)
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;

        // Filter out requests that already have quotes from this specialist
        const filteredRequests = requestsData?.filter(
          req => !quotedRequestIds.includes(req.id)
        ) || [];

        setRequests(filteredRequests);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeDisplay = (request: ServiceRequest) => {
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
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Logo className="pt-4 pb-2" />
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Solicitudes</h1>
          <p className="text-secondary">
            {specialistCategories.join(', ')}
          </p>
        </div>

        {requests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-secondary">No hay solicitudes disponibles en este momento</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-foreground text-lg">
                  {request.service_title || request.activity}
                </h3>
                
                <div className="space-y-2 text-sm">
                  {request.scheduled_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(request.scheduled_date).toLocaleDateString('es-MX', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className={request.is_urgent ? "text-destructive font-semibold" : ""}>
                      {formatTimeDisplay(request)}
                    </span>
                  </div>

                  {request.locations && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{request.locations.neighborhood}, {request.locations.city}</span>
                    </div>
                  )}

                  {(request.price_min || request.price_max) && (
                    <div className="flex items-center gap-2 text-primary font-semibold text-base">
                      <DollarSign className="w-5 h-5" />
                      <span>
                        {request.price_min && request.price_max
                          ? `$${request.price_min} - $${request.price_max} MXN`
                          : request.price_min
                          ? `Desde $${request.price_min} MXN`
                          : `Hasta $${request.price_max} MXN`}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate(`/specialist/requests/${request.id}`)}
                  className="w-full"
                >
                  Ver solicitud
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavSpecialist />
    </div>
  );
}
