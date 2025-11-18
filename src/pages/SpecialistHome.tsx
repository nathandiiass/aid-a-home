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
  created_at: string;
  locations?: {
    neighborhood: string;
    city: string;
  };
  relevance_score?: number;
}

interface SpecialistData {
  categories: string[];
  activities: string[];
}

export default function SpecialistHome() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialistData, setSpecialistData] = useState<SpecialistData>({ categories: [], activities: [] });
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

      // Get specialist categories
      const { data: specialistCategories, error: categoriesError } = await supabase
        .from('specialist_categories')
        .select('category_id, categories(category_name)')
        .eq('specialist_id', profile.id);

      if (categoriesError) throw categoriesError;

      // Get specialist tags (activities)
      const { data: specialistTags, error: tagsError } = await supabase
        .from('specialist_tags')
        .select('tag_id, category_tags(tag_name)')
        .eq('specialist_id', profile.id);

      if (tagsError) throw tagsError;

      // Extract categories and activities
      const categories = specialistCategories?.map(sc => (sc.categories as any)?.category_name).filter(Boolean) || [];
      const activities = specialistTags?.map(st => (st.category_tags as any)?.tag_name).filter(Boolean) || [];

      setSpecialistData({ categories, activities });

      // Load active requests matching specialist's categories
      if (categories.length > 0) {
        // First, get all request IDs where this specialist has already sent a quote
        const { data: existingQuotes, error: quotesError } = await supabase
          .from('quotes')
          .select('request_id')
          .eq('specialist_id', profile.id);

        if (quotesError) throw quotesError;

        const quotedRequestIds = existingQuotes?.map(q => q.request_id) || [];

        // Load active requests matching categories
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
        let filteredRequests: ServiceRequest[] = (requestsData?.filter(
          req => !quotedRequestIds.includes(req.id)
        ) || []).map(request => {
          let score = 0;
          
          // Base score: category match
          if (categories.includes(request.category)) {
            score += 1;
          }
          
          // Bonus score: activity (tag) match
          if (activities.includes(request.activity)) {
            score += 1;
          }
          
          return {
            ...request,
            relevance_score: score
          } as ServiceRequest;
        });

        // Sort by relevance score (descending), then by created_at (newest first)
        filteredRequests.sort((a, b) => {
          const scoreA = a.relevance_score ?? 0;
          const scoreB = b.relevance_score ?? 0;
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-foreground font-semibold">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <Logo className="pt-4 pb-2" />
      </div>
      
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Solicitudes disponibles</h1>
          <p className="text-foreground/60 text-sm">
            {specialistData.categories.join(', ')}
          </p>
        </div>

        {requests.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-sm border-0 p-8 text-center">
            <p className="text-foreground/60">No hay solicitudes disponibles en este momento</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all">
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">
                      {request.service_title || request.activity}
                    </h3>
                    {request.is_urgent && (
                      <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
                        ¡Urgente!
                      </span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-3">
                    {request.scheduled_date && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm text-foreground/70">
                          {new Date(request.scheduled_date).toLocaleDateString('es-MX', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className={`text-sm ${request.is_urgent ? "text-red-600 font-semibold" : "text-foreground/70"}`}>
                        {formatTimeDisplay(request)}
                      </span>
                    </div>

                    {request.locations && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm text-foreground/70">
                          {request.locations.neighborhood}, {request.locations.city}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    {(request.price_min || request.price_max) && (
                      <div className="pt-3 mt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground/50 uppercase tracking-wide">Presupuesto</span>
                          <span className="font-bold text-base text-foreground">
                            {request.price_min && request.price_max
                              ? `$${request.price_min.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - $${request.price_max.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
                              : request.price_min
                              ? `Desde $${request.price_min.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
                              : `Hasta $${request.price_max.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => navigate(`/specialist/requests/${request.id}`)}
                    className="w-full bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-11 font-semibold"
                  >
                    Ver solicitud
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavSpecialist />
    </div>
  );
}
