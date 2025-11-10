import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { BottomNavSpecialist } from '@/components/BottomNavSpecialist';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin, DollarSign } from 'lucide-react';
import { useSpecialistMode } from '@/hooks/use-specialist-mode';

interface ServiceRequest {
  id: string;
  activity: string;
  category: string;
  scheduled_date: string | null;
  time_start: string | null;
  time_end: string | null;
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

    if (!isSpecialistMode) {
      navigate('/profile');
      return;
    }

    if (user) {
      loadSpecialistData();
    }
  }, [user, authLoading, navigate, isSpecialistMode]);

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
        setRequests(requestsData || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
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

  return (
    <div className="min-h-screen bg-background pb-20">
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
                <h3 className="font-semibold text-foreground text-lg">{request.activity}</h3>
                
                <div className="space-y-2 text-sm">
                  {request.scheduled_date && (
                    <div className="flex items-center gap-2 text-secondary">
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

                  {request.time_start && request.time_end && (
                    <div className="flex items-center gap-2 text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>{request.time_start} - {request.time_end}</span>
                    </div>
                  )}

                  {(request.price_min || request.price_max) && (
                    <div className="flex items-center gap-2 text-secondary">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {request.price_min && request.price_max
                          ? `$${request.price_min} - $${request.price_max}`
                          : request.price_min
                          ? `Desde $${request.price_min}`
                          : `Hasta $${request.price_max}`}
                      </span>
                    </div>
                  )}

                  {request.locations && (
                    <div className="flex items-center gap-2 text-secondary">
                      <MapPin className="w-4 h-4" />
                      <span>{request.locations.neighborhood}, {request.locations.city}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate(`/specialist/requests/${request.id}`)}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
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
