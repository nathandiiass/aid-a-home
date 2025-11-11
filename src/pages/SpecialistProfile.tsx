import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Share2, MoreVertical, Star, MapPin, Phone } from 'lucide-react';
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
      // Load specialist profile
      const { data: specialistData, error: specialistError } = await supabase
        .from('specialist_profiles')
        .select('*')
        .eq('id', specialistId)
        .single();

      if (specialistError) throw specialistError;
      setSpecialist(specialistData);

      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', specialistData.user_id)
        .single();

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
    } catch (error) {
      console.error('Error loading specialist:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el perfil del especialista'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Especialista';
    
    const firstName = profile.first_name || '';
    const lastNamePaterno = profile.last_name_paterno || '';
    const lastNameMaterno = profile.last_name_materno || '';
    
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    
    if (firstName && lastNamePaterno) {
      return `${capitalize(firstName)} ${capitalize(lastNamePaterno)}`;
    }
    
    if (firstName && lastNameMaterno) {
      return `${capitalize(firstName)} ${capitalize(lastNameMaterno)}`;
    }
    
    if (profile.display_name) {
      return profile.display_name;
    }
    
    if (firstName) {
      return capitalize(firstName);
    }
    
    return 'Especialista';
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
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!specialist || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Especialista no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* App Bar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="flex-1 font-bold text-lg" style={{ color: '#003049' }}>
          Perfil del Especialista
        </h1>
        <Button variant="ghost" size="icon">
          <Share2 className="w-5 h-5" style={{ color: '#669BBC' }} />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" style={{ color: '#669BBC' }} />
        </Button>
      </div>

      {/* Hero Section */}
      <div className="px-4 pt-6 pb-4 text-center bg-gradient-to-b from-background to-card/30">
        <Avatar className="w-40 h-40 mx-auto mb-4 border-4 shadow-lg" style={{ borderColor: '#669BBC' }}>
          <AvatarImage src={profile.avatar_url} className="object-cover" />
          <AvatarFallback style={{ backgroundColor: '#669BBC', color: '#FFFFFF' }} className="text-5xl font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-2xl font-bold" style={{ color: '#003049' }}>
            {displayName}
          </h2>
          {verifiedStatus && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#669BBC' }}>
              <span className="text-white text-sm">✓</span>
            </div>
          )}
        </div>
        {workZones.length > 0 && workZones[0]?.cities?.length > 0 && (
          <p className="text-sm" style={{ color: '#669BBC' }}>
            {workZones[0].cities[0]}, {workZones[0].state}
          </p>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="px-4 py-6 bg-card/50">
        <div className="grid grid-cols-4 gap-3">
          {/* Verified Badge */}
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background shadow-sm border" style={{ borderColor: verifiedStatus ? '#669BBC' : '#E0E0E0' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: verifiedStatus ? '#669BBC' : '#E0E0E0' }}>
              <span className="text-white text-lg">✓</span>
            </div>
            <p className="text-[10px] text-center leading-tight" style={{ color: verifiedStatus ? '#003049' : '#999' }}>
              {verifiedStatus ? 'Verificado' : 'Pendiente'}
            </p>
          </div>

          {/* Rating */}
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background shadow-sm border" style={{ borderColor: '#669BBC' }}>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-current" style={{ color: '#C1121F' }} />
              <span className="text-lg font-bold" style={{ color: '#003049' }}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
            </div>
            <p className="text-[10px] text-center leading-tight" style={{ color: '#669BBC' }}>
              Rating
            </p>
          </div>

          {/* Reviews */}
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background shadow-sm border" style={{ borderColor: '#669BBC' }}>
            <div className="text-lg font-bold" style={{ color: '#003049' }}>
              {reviewCount}
            </div>
            <p className="text-[10px] text-center leading-tight" style={{ color: '#669BBC' }}>
              Reseñas
            </p>
          </div>

          {/* Phone/Contact */}
          {specialist.phone && (
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background shadow-sm border" style={{ borderColor: '#669BBC' }}>
              <Phone className="w-5 h-5" style={{ color: '#669BBC' }} />
              <p className="text-[10px] text-center leading-tight" style={{ color: '#669BBC' }}>
                Contacto
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-5 pb-6">

        {/* About / Bio Section */}
        {(profile.bio || specialist.bio) && (
          <Card className="p-5 shadow-sm" style={{ borderColor: '#669BBC' }}>
            <h3 className="font-bold text-base mb-3 uppercase tracking-wide" style={{ color: '#003049' }}>
              Sobre mí
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#669BBC' }}>
              {profile.bio || specialist.bio}
            </p>
          </Card>
        )}

        {/* Services */}
        {specialties.length > 0 && (
          <Card className="p-5 shadow-sm" style={{ borderColor: '#669BBC' }}>
            <h3 className="font-bold text-base mb-4 uppercase tracking-wide" style={{ color: '#003049' }}>
              Servicios
            </h3>
            <div className="space-y-5">
              {specialties.map((specialty: any, idx: number) => (
                <div key={specialty.id} className={idx !== 0 ? 'pt-4 border-t border-border/30' : ''}>
                  <h4 className="font-semibold mb-3 text-sm" style={{ color: '#003049' }}>
                    {specialty.specialty} · {specialty.role_label}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {specialty.activities?.slice(0, 6).map((activity: any) => (
                      <div
                        key={activity.id}
                        className="px-3 py-1.5 rounded-full text-xs border"
                        style={{ borderColor: '#669BBC', color: '#003049', backgroundColor: '#FDF0D5' }}
                      >
                        {activity.activity}
                        {activity.price_min && activity.price_max && (
                          <span className="ml-1 font-semibold" style={{ color: '#C1121F' }}>
                            ${activity.price_min}-${activity.price_max}
                          </span>
                        )}
                      </div>
                    ))}
                    {specialty.activities?.length > 6 && (
                      <div className="px-3 py-1.5 text-xs" style={{ color: '#669BBC' }}>
                        +{specialty.activities.length - 6} más
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-xs italic" style={{ color: '#669BBC' }}>
                * Los precios pueden variar según alcance y materiales
              </p>
            </div>
          </Card>
        )}

        {/* Work Zones */}
        {workZones.length > 0 && (
          <Card className="p-5 shadow-sm" style={{ borderColor: '#669BBC' }}>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#669BBC' }} />
              <div className="flex-1">
                <h3 className="font-bold text-base mb-4 uppercase tracking-wide" style={{ color: '#003049' }}>
                  Zonas de trabajo
                </h3>
                <div className="space-y-4">
                  {workZones.map((zone: any) => (
                    <div key={zone.id}>
                      <h4 className="font-semibold mb-2 text-sm" style={{ color: '#003049' }}>
                        {zone.state}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {zone.cities?.map((city: string, idx: number) => (
                          <div
                            key={idx}
                            className="px-3 py-1 rounded-full text-xs border"
                            style={{ borderColor: '#669BBC', color: '#003049', backgroundColor: '#FFFFFF' }}
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Contact Info */}
        {specialist.phone && (
          <Card className="p-5 shadow-sm" style={{ borderColor: '#669BBC' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FDF0D5' }}>
                <Phone className="w-6 h-6" style={{ color: '#669BBC' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1" style={{ color: '#003049' }}>
                  Teléfono de contacto
                </h3>
                <a 
                  href={`tel:${specialist.phone}`}
                  className="text-base font-semibold"
                  style={{ color: '#C1121F' }}
                >
                  {specialist.phone}
                </a>
              </div>
            </div>
          </Card>
        )}

      </div>

      {/* Footer Actions */}
      {quoteId && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-50">
          <div className="flex gap-3 max-w-screen-lg mx-auto">
            <Button
              variant="outline"
              className="flex-1 h-12 font-semibold"
              style={{ borderColor: '#669BBC', color: '#003049' }}
              onClick={() => navigate(`/chat/${quoteId}`)}
            >
              Volver al chat
            </Button>
            <Button
              className="flex-1 h-12 font-semibold shadow-md"
              style={{ backgroundColor: '#C1121F', color: '#FFFFFF' }}
              onClick={() => setShowConfirmDialog(true)}
            >
              Contratar
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar contratación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas contratar a {displayName}? Esta acción confirmará la orden y el especialista comenzará a trabajar en tu solicitud.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              style={{ backgroundColor: '#C1121F', color: '#FFFFFF' }}
              onClick={handleContratarConfirm}
            >
              Sí, contratar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
