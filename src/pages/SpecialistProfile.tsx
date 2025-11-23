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
import ReviewSummary from '@/components/specialist/ReviewSummary';
export default function SpecialistProfile() {
  const {
    specialistId
  } = useParams();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [specialist, setSpecialist] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [workZones, setWorkZones] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [cancellationStats, setCancellationStats] = useState({
    totalCancellations: 0,
    cancellationRate: 0
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 0,
    avgCalidadTrabajo: 0,
    avgPuntualidad: 0,
    avgProfesionalismo: 0,
    avgCumplimiento: 0,
    avgRelacionCalidadPrecio: 0,
    porcentajeVolveria: 0
  });
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      loadSpecialistData();
    }
  }, [user, authLoading, specialistId]);
  const loadSpecialistData = async () => {
    try {
      console.log('QuoteId from URL:', quoteId);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();

      // Determine which specialist to load
      let targetSpecialistId = specialistId;

      // If no specialistId in URL, load current user's specialist profile
      if (!specialistId && user) {
        const {
          data: ownSpecialistData
        } = await supabase.from('specialist_profiles').select('id').eq('user_id', user.id).maybeSingle();
        if (ownSpecialistData) {
          targetSpecialistId = ownSpecialistData.id;
        }
      }
      if (!targetSpecialistId) {
        toast({
          title: "Error",
          description: "No se encontró el perfil de especialista",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Load specialist profile
      const {
        data: specialistData,
        error: specialistError
      } = await supabase.from('specialist_profiles').select('id, user_id, materials_policy, warranty_days, status, professional_description, created_at, updated_at').eq('id', targetSpecialistId).maybeSingle();
      if (specialistError) throw specialistError;
      setSpecialist(specialistData);

      // Calculate cancellation stats from accepted orders (only specialist cancellations)
      if (specialistData) {
        // Get all accepted quotes for this specialist
        const { data: quotesData } = await supabase
          .from('quotes')
          .select('request_id')
          .eq('specialist_id', targetSpecialistId)
          .eq('status', 'accepted');

        if (quotesData && quotesData.length > 0) {
          const requestIds = quotesData.map(q => q.request_id);
          
          // Get service requests for these quotes
          const { data: requestsData } = await supabase
            .from('service_requests')
            .select('id, status')
            .in('id', requestIds);

          const cancelledRequests = requestsData?.filter(r => r.status === 'cancelled') || [];
          const cancelledRequestIds = cancelledRequests.map(r => r.id);

          // Get cancellations made by users (they leave feedback)
          const { data: userCancellations } = await supabase
            .from('request_cancellation_feedback')
            .select('request_id')
            .in('request_id', cancelledRequestIds);

          const userCancelledIds = new Set(userCancellations?.map(c => c.request_id) || []);
          
          // Specialist cancellations are those without user feedback
          const specialistCancellations = cancelledRequests.filter(r => !userCancelledIds.has(r.id));

          const totalOrders = requestsData?.length || 0;
          const cancellationRate = totalOrders > 0 ? (specialistCancellations.length / totalOrders) * 100 : 0;

          setCancellationStats({
            totalCancellations: specialistCancellations.length,
            cancellationRate: cancellationRate
          });
        }
      }

      // Load user profile
      const {
        data: profileData
      } = await supabase.from('profiles').select('*').eq('id', specialistData?.user_id).maybeSingle();
      if (profileData) {
        setProfile(profileData);
      }

      // Load categories and tags
      const { data: categoriesData } = await supabase
        .from('specialist_categories')
        .select(`
          id,
          category_id,
          experience_years,
          categories(id, category_name, category_key)
        `)
        .eq('specialist_id', targetSpecialistId);

      const { data: tagsData } = await supabase
        .from('specialist_tags')
        .select(`
          tag_id,
          category_tags(id, tag_name, category_id)
        `)
        .eq('specialist_id', targetSpecialistId);

      const specialtiesData = categoriesData?.map(c => ({
        id: c.id,
        specialty: (c.categories as any)?.category_name || '',
        role_label: (c.categories as any)?.category_name || '',
        experience_years: c.experience_years,
        activities: tagsData
          ?.filter(t => (t.category_tags as any)?.category_id === c.category_id)
          .map(t => ({
            id: t.tag_id.toString(),
            activity: (t.category_tags as any)?.tag_name || ''
          })) || []
      })) || [];
      if (specialtiesData) {
        setSpecialties(specialtiesData);
      }

      // Load work zones
      const {
        data: workZonesData
      } = await supabase.from('specialist_work_zones').select('*').eq('specialist_id', targetSpecialistId);
      if (workZonesData) {
        setWorkZones(workZonesData);
      }

      // Load reviews to calculate rating and stats
      const {
        data: reviewsData
      } = await supabase.from('reviews').select('*').eq('specialist_id', targetSpecialistId);
      if (reviewsData && reviewsData.length > 0) {
        const total = reviewsData.length;
        const avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / total;
        setRating(avgRating);
        setReviewCount(total);
        const calidadSum = reviewsData.reduce((sum, r) => sum + (r.calidad_trabajo || 0), 0);
        const puntualidadSum = reviewsData.reduce((sum, r) => sum + (r.puntualidad || 0), 0);
        const profesionalismoSum = reviewsData.reduce((sum, r) => sum + (r.profesionalismo || 0), 0);
        const cumplimientoSum = reviewsData.reduce((sum, r) => sum + (r.cumplimiento_servicio || 0), 0);
        const relacionSum = reviewsData.reduce((sum, r) => sum + (r.relacion_calidad_precio || 0), 0);
        const volveriaCount = reviewsData.filter(r => r.volveria_trabajar === true).length;
        setReviewStats({
          total,
          average: avgRating,
          avgCalidadTrabajo: calidadSum / total,
          avgPuntualidad: puntualidadSum / total,
          avgProfesionalismo: profesionalismoSum / total,
          avgCumplimiento: cumplimientoSum / total,
          avgRelacionCalidadPrecio: relacionSum / total,
          porcentajeVolveria: volveriaCount / total * 100
        });
      }

      // Load credentials
      const {
        data: credentialsData
      } = await supabase.from('specialist_credentials').select('*').eq('specialist_id', targetSpecialistId).order('created_at', {
        ascending: false
      });
      if (credentialsData) {
        setCredentials(credentialsData);
      }

      // Load portfolio items
      const {
        data: portfolioData
      } = await supabase.from('specialist_portfolio').select('*').eq('specialist_id', targetSpecialistId).order('created_at', {
        ascending: false
      });
      if (portfolioData) {
        // Generate public URLs for portfolio images
        const portfolioWithUrls = portfolioData.map(item => {
          // If URL doesn't start with http, it's a storage path that needs to be converted
          if (item.image_url && !item.image_url.startsWith('http')) {
            const { data: { publicUrl } } = supabase.storage
              .from('specialist-documents')
              .getPublicUrl(item.image_url);
            return { ...item, image_url: publicUrl };
          }
          return item;
        });
        setPortfolioItems(portfolioWithUrls);
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
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'E';
  };
  const handleContratarConfirm = async () => {
    if (!quoteId) return;
    try {
      const {
        error
      } = await supabase.from('quotes').update({
        status: 'accepted'
      }).eq('id', quoteId);
      if (error) throw error;
      setShowConfirmDialog(false);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: {
          y: 0.6
        }
      });
      toast({
        title: "🎉 ¡Felicidades! Encontraste a tu especialista",
        description: "La orden ha sido asignada exitosamente."
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
    return <div className="min-h-screen bg-gray-50">
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
      </div>;
  }
  if (!specialist || !profile) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Especialista no encontrado</div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header Rappi Style */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
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
          {verifiedStatus && <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">
              ✓ Verificado
            </Badge>}
        </div>

        {/* Work Zones */}
        {workZones.length > 0 && <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-sm text-gray-900">Zona de cobertura</h3>
            </div>
            <div className="space-y-2">
              {workZones.map((zone: any) => <div key={zone.id}>
                  <p className="font-semibold text-sm text-gray-900 mb-1.5">{zone.state}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.cities.map((city: string, idx: number) => <Badge key={idx} variant="outline" className="rounded-full text-xs border-gray-300 bg-white">
                        {city}
                      </Badge>)}
                  </div>
                </div>)}
            </div>
          </div>}

        {/* Cancellation Statistics */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Historial de cancelaciones</h3>
              <p className="text-xs text-gray-600">Transparencia en el servicio</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {cancellationStats.totalCancellations}
              </div>
              <div className="text-xs text-gray-600">
                Cancelaciones totales
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {cancellationStats.cancellationRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">
                Tasa de cancelación
              </div>
            </div>
          </div>
          {cancellationStats.cancellationRate === 0 && cancellationStats.totalCancellations === 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-3">
              <span className="font-medium">✓ Sin cancelaciones registradas</span>
            </div>
          )}
        </div>

        {/* Rating and Reviews */}
        

        {/* Review Summary */}
        {reviewStats.total > 0 && <ReviewSummary stats={reviewStats} />}

        {/* Professional Description */}
        {specialist?.professional_description && <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-base text-gray-900 mb-3">
              Sobre su experiencia
            </h3>
            <p className="text-sm leading-relaxed text-gray-700">
              {specialist.professional_description}
            </p>
          </div>}

        {/* Specialties and Services - Rappi Style Table */}
        {specialties.length > 0 && (() => {
        // Group specialties by category
        const groupedSpecialties = specialties.reduce((acc: any, specialty: any) => {
          const category = specialty.specialty;
          if (!acc[category]) {
            acc[category] = {
              category,
              maxExperience: specialty.experience_years || 0,
              specialists: []
            };
          }
          // Keep the max experience years for this category
          if (specialty.experience_years > acc[category].maxExperience) {
            acc[category].maxExperience = specialty.experience_years;
          }
          // Add specialist data with activities
          acc[category].specialists.push({
            role_label: specialty.role_label,
            activities: specialty.activities || []
          });
          return acc;
        }, {});
        return <div className="space-y-3">
              <h3 className="font-bold text-lg text-gray-900 px-1 mb-3">
                Especialidades y servicios
              </h3>
              {Object.values(groupedSpecialties).map((group: any) => (
                <div key={group.category} className="bg-white rounded-2xl shadow-sm">
                  {/* Header - Clean Rappi Style */}
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base text-gray-900">
                          {group.category}
                        </h4>
                        {group.maxExperience > 0 && (
                          <span className="text-sm text-gray-500">
                            {group.maxExperience} {group.maxExperience === 1 ? 'año' : 'años'} de experiencia
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Services List - Compact */}
                  <div className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {group.specialists.flatMap((specialist: any) => 
                        specialist.activities.map((activity: any) => (
                          <Badge
                            key={activity.id}
                            variant="secondary"
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-full"
                          >
                            {activity.activity}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>;
      })()}

        {/* Licenses and Certifications */}
        {credentials.length > 0 && <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 px-1">
              Licencias y certificaciones
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {credentials.map((credential: any) => <a key={credential.id} href={credential.attachment_url} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
                  {/* Image/Icon Area */}
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
                    <FileText className="w-16 h-16 text-blue-600" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    <p className="font-bold text-sm text-gray-900 line-clamp-2 mb-1">
                      {credential.title}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {credential.issuer}
                    </p>
                  </div>
                </a>)}
            </div>
          </div>}

        {/* Portfolio */}
        {portfolioItems.length > 0 && <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 px-1">
              Portafolio
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {portfolioItems.map((item: any) => <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
                  {/* Image Area */}
                  <div className="aspect-square bg-gray-100 overflow-hidden border-b border-gray-100">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Error loading image:', item.image_url);
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    <p className="font-bold text-sm text-gray-900 line-clamp-2">
                      {item.title}
                    </p>
                  </div>
                </div>)}
            </div>
          </div>}
      </div>

      {/* Floating CTA Button - Centered - Only show if not viewing own profile */}
      {user?.id !== specialist?.user_id && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <Button onClick={() => setShowConfirmDialog(true)} className="h-14 px-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-base shadow-2xl hover:shadow-green-500/50 active:scale-95 transition-all pointer-events-auto">
            Contratar especialista
          </Button>
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
            <AlertDialogAction onClick={handleContratarConfirm} className="rounded-full bg-green-600 hover:bg-green-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}