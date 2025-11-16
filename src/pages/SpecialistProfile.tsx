import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Share2, Star, MapPin, FileText, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SpecialistProfile() {
  const { specialistId } = useParams();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [specialist, setSpecialist] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [workZones, setWorkZones] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      loadSpecialistData();
    }
  }, [user, authLoading, specialistId]);

  const loadSpecialistData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Load specialist profile
      const { data: specialistData, error: specialistError } = await supabase
        .from('specialist_profiles')
        .select('id, user_id, materials_policy, warranty_days, status, professional_description, created_at, updated_at')
        .eq('id', specialistId)
        .maybeSingle();

      if (specialistError) throw specialistError;
      setSpecialist(specialistData);

      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', specialistData.user_id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Load specialties and activities
      const { data: specialtiesData } = await supabase
        .from('specialist_specialties')
        .select(`
          *,
          activities:specialist_activities(*)
        `)
        .eq('specialist_id', specialistId);

      if (specialtiesData) {
        setSpecialties(specialtiesData);
      }

      // Load work zones
      const { data: workZonesData } = await supabase
        .from('specialist_work_zones')
        .select('*')
        .eq('specialist_id', specialistId);

      if (workZonesData) {
        setWorkZones(workZonesData);
      }

      // Load reviews to calculate rating
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('specialist_id', specialistId);

      if (reviewsData && reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setRating(avgRating);
        setReviewCount(reviewsData.length);
      }

      // Load credentials
      const { data: credentialsData } = await supabase
        .from('specialist_credentials')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });

      if (credentialsData) {
        setCredentials(credentialsData);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading specialist data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el perfil del especialista'
      });
      setLoading(false);
    }
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return '';
    const firstName = profile.first_name || '';
    const lastNameP = profile.last_name_paterno || '';
    const lastNameM = profile.last_name_materno || '';
    return `${firstName} ${lastNameP} ${lastNameM}`.trim();
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'E';
  };

  const handleContratarConfirm = async () => {
    if (!quoteId) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (error) throw error;

      setShowConfirmDialog(false);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "🎉 ¡Felicidades! Encontraste a tu especialista",
        description: "La orden ha sido asignada exitosamente.",
      });

      setTimeout(() => {
        navigate(`/chat/${quoteId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Error hiring specialist:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo contratar al especialista'
      });
    }
  };

  const displayName = getDisplayName(profile);
  const verifiedStatus = specialist?.status === 'approved';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-5 w-36 mx-auto" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  if (!specialist || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Especialista no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Rappi Style */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Perfil del Especialista</h1>
          <div className="ml-auto flex items-center gap-2">
            <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {/* Avatar and Name */}
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-3 border-2 border-gray-100">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {displayName}
          </h2>
          {verifiedStatus && (
            <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">
              ✓ Verificado
            </Badge>
          )}
        </div>

        {/* Work Zones */}
        {workZones.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-sm text-gray-900">Zona de cobertura</h3>
            </div>
            <div className="space-y-2">
              {workZones.map((zone: any) => (
                <div key={zone.id}>
                  <p className="font-semibold text-sm text-gray-900 mb-1.5">{zone.state}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.cities.map((city: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="rounded-full text-xs border-gray-300 bg-white">
                        {city}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating and Reviews */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold text-gray-900">
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {rating > 0 ? 'Calificación' : 'Sin calificaciones'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {reviewCount}
            </div>
            <p className="text-xs text-gray-600">Reseñas</p>
          </div>
        </div>

        {/* Professional Description */}
        {specialist?.professional_description && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-base text-gray-900 mb-3">
              Sobre su experiencia
            </h3>
            <p className="text-sm leading-relaxed text-gray-700">
              {specialist.professional_description}
            </p>
          </div>
        )}

        {/* Specialties and Services */}
        {specialties.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-base text-gray-900 px-1">
              Especialidades y servicios
            </h3>
            {specialties.map((specialty: any) => (
              <div key={specialty.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white">
                    {specialty.specialty}
                  </h4>
                  {specialty.experience_years && (
                    <Badge className="bg-white/20 text-white border-0 hover:bg-white/20 backdrop-blur-sm">
                      {specialty.experience_years} {specialty.experience_years === 1 ? 'año' : 'años'}
                    </Badge>
                  )}
                </div>

                {/* Table */}
                {specialty.activities && specialty.activities.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left py-3 px-5 font-semibold text-xs text-gray-700 uppercase tracking-wide">
                            Servicios que ofrece
                          </th>
                          <th className="text-right py-3 px-5 font-semibold text-xs text-gray-700 uppercase tracking-wide">
                            Precio mínimo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {specialty.activities.map((activity: any) => (
                          <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-5 text-sm text-gray-900">
                              {activity.activity}
                            </td>
                            <td className="py-3 px-5 text-right">
                              {activity.price_min ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700">
                                  ${activity.price_min.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Licenses and Certifications */}
        {credentials.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-base text-gray-900 mb-3">
              Licencias y certificaciones
            </h3>
            <div className="space-y-2">
              {credentials.map((credential: any) => (
                <a
                  key={credential.id}
                  href={credential.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {credential.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {credential.issuer}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      {quoteId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 z-40">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              className="w-full rounded-full py-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-base shadow-lg active:scale-[0.98] transition-all"
            >
              Contratar especialista
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              ¿Contratar a {displayName}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Al confirmar, aceptas la cotización y se le asignará este trabajo al especialista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleContratarConfirm}
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
