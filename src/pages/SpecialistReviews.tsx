import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Star, TrendingUp, Award, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  calidad_trabajo: number | null;
  puntualidad: number | null;
  profesionalismo: number | null;
  cumplimiento_servicio: number | null;
  relacion_calidad_precio: number | null;
  volveria_trabajar: boolean | null;
  average_score: number | null;
  request_id: string;
  service_requests: {
    activity: string;
  };
  profiles: {
    first_name: string;
    last_name_paterno: string | null;
  };
}

export default function SpecialistReviews() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    avgCalidadTrabajo: 0,
    avgPuntualidad: 0,
    avgProfesionalismo: 0,
    avgCumplimiento: 0,
    avgRelacionCalidadPrecio: 0,
    porcentajeVolveria: 0,
  });

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Get specialist profile
      const { data: specialistProfile } = await supabase
        .from('specialist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!specialistProfile) return;

      // Get reviews with related data
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          service_requests!inner(activity)
        `)
        .eq('specialist_id', specialistProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles for each review
      if (reviewsData && reviewsData.length > 0) {
        const userIds = reviewsData.map(r => r.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name_paterno')
          .in('id', userIds);

        // Map profiles to reviews
        const reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          profiles: profilesData?.find(p => p.id === review.user_id) || {
            first_name: 'Usuario',
            last_name_paterno: null
          }
        }));

        setReviews(reviewsWithProfiles);

        // Calculate stats
        const total = reviewsData.length;
        const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / total;
        
        const calidadSum = reviewsData.reduce((sum, r) => sum + (r.calidad_trabajo || 0), 0);
        const puntualidadSum = reviewsData.reduce((sum, r) => sum + (r.puntualidad || 0), 0);
        const profesionalismoSum = reviewsData.reduce((sum, r) => sum + (r.profesionalismo || 0), 0);
        const cumplimientoSum = reviewsData.reduce((sum, r) => sum + (r.cumplimiento_servicio || 0), 0);
        const relacionSum = reviewsData.reduce((sum, r) => sum + (r.relacion_calidad_precio || 0), 0);
        
        const volveriaCount = reviewsData.filter(r => r.volveria_trabajar === true).length;

        setStats({
          total,
          average: avgRating,
          avgCalidadTrabajo: calidadSum / total,
          avgPuntualidad: puntualidadSum / total,
          avgProfesionalismo: profesionalismoSum / total,
          avgCumplimiento: cumplimientoSum / total,
          avgRelacionCalidadPrecio: relacionSum / total,
          porcentajeVolveria: (volveriaCount / total) * 100,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Mis Reseñas</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <>
            <Card className="p-6">
              <Skeleton className="h-32 w-full" />
            </Card>
            <Card className="p-6">
              <Skeleton className="h-48 w-full" />
            </Card>
          </>
        ) : (
          <>
            {/* Stats Summary */}
            <Card className="p-6 bg-white rounded-2xl shadow-md border-0">
              <h2 className="text-lg font-bold text-foreground mb-4">Resumen General</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stats.average.toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-2">
                    {renderStars(Math.round(stats.average))}
                  </div>
                  <div className="text-xs text-foreground/60">Calificación Promedio</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stats.total}
                  </div>
                  <div className="text-xs text-foreground/60 mt-3">Total de Reseñas</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Calidad del trabajo</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {renderStars(Math.round(stats.avgCalidadTrabajo))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {stats.avgCalidadTrabajo.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Puntualidad</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {renderStars(Math.round(stats.avgPuntualidad))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {stats.avgPuntualidad.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Profesionalismo</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {renderStars(Math.round(stats.avgProfesionalismo))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {stats.avgProfesionalismo.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Cumplimiento del servicio</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {renderStars(Math.round(stats.avgCumplimiento))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {stats.avgCumplimiento.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Relación calidad-precio</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {renderStars(Math.round(stats.avgRelacionCalidadPrecio))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {stats.avgRelacionCalidadPrecio.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-foreground/70">Volverían a trabajar contigo</span>
                  <span className="text-lg font-bold text-rappi-green">
                    {stats.porcentajeVolveria.toFixed(0)}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground px-2">Todas las Reseñas</h2>
              
              {reviews.length === 0 ? (
                <Card className="p-8 text-center bg-white rounded-2xl shadow-md border-0">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-foreground/60">Aún no tienes reseñas</p>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="p-5 bg-white rounded-2xl shadow-md border-0 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {review.profiles.first_name} {review.profiles.last_name_paterno || ''}
                          </h3>
                          {review.volveria_trabajar && (
                            <ThumbsUp className="w-4 h-4 text-rappi-green" />
                          )}
                        </div>
                        <p className="text-sm text-foreground/60">
                          {review.service_requests.activity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-foreground">
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/50">
                          {format(new Date(review.created_at), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-sm text-foreground/80 mb-3 p-3 bg-gray-50 rounded-lg">
                        "{review.comment}"
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {review.calidad_trabajo && (
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">Calidad</span>
                          <div className="flex items-center gap-1">
                            {renderStars(review.calidad_trabajo)}
                          </div>
                        </div>
                      )}
                      {review.puntualidad && (
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">Puntualidad</span>
                          <div className="flex items-center gap-1">
                            {renderStars(review.puntualidad)}
                          </div>
                        </div>
                      )}
                      {review.profesionalismo && (
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">Profesionalismo</span>
                          <div className="flex items-center gap-1">
                            {renderStars(review.profesionalismo)}
                          </div>
                        </div>
                      )}
                      {review.relacion_calidad_precio && (
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">Precio</span>
                          <div className="flex items-center gap-1">
                            {renderStars(review.relacion_calidad_precio)}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
