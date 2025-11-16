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

      // Load specialist profile - RLS will handle access control
      const { data: specialistData, error: specialistError } = await supabase
        .from('specialist_profiles')
        .select('id, user_id, materials_policy, warranty_days, status, professional_description, created_at, updated_at')
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

      // Load credentials (licencias y certificaciones)
      const { data: credentialsData } = await supabase
        .from('specialist_credentials')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });

      if (credentialsData) {
        setCredentials(credentialsData);
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
      <div className="px-4 pt-8 pb-6 text-center">
        <Avatar className="w-32 h-32 mx-auto mb-4 border-4" style={{ borderColor: '#669BBC' }}>
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback style={{ backgroundColor: '#669BBC', color: '#FFFFFF' }} className="text-4xl font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#003049' }}>
          {displayName}
        </h2>
        {verifiedStatus && (
          <Badge style={{ backgroundColor: '#FDF0D5', color: '#003049' }} className="mb-2">
            ✓ Verificado
          </Badge>
        )}
      </div>

      {/* Work Zones - moved before rating */}
      {workZones.length > 0 && (
        <div className="px-4 mb-6">
          <Card className="p-4" style={{ borderColor: '#669BBC' }}>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5" style={{ color: '#669BBC' }} />
              <div className="flex-1">
                <h3 className="font-bold text-base mb-2" style={{ color: '#003049' }}>
                  Zona de cobertura
                </h3>
                {workZones.map((zone: any, idx: number) => (
                  <div key={idx} className="mb-2">
                    <p className="font-semibold text-sm mb-1" style={{ color: '#003049' }}>
                      {zone.state}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {zone.cities?.map((city: string, cityIdx: number) => (
                        <Badge
                          key={cityIdx}
                          variant="outline"
                          style={{ borderColor: '#669BBC', color: '#669BBC' }}
                        >
                          {city}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Summary Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center" style={{ borderColor: '#669BBC' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-5 h-5 fill-current" style={{ color: '#C1121F' }} />
              <span className="text-2xl font-bold" style={{ color: '#003049' }}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#669BBC' }}>
              {rating > 0 ? 'Puntuación' : 'Sin calificaciones'}
            </p>
          </Card>
          <Card className="p-4 text-center" style={{ borderColor: '#669BBC' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: '#003049' }}>
              {reviewCount}
            </div>
            <p className="text-xs" style={{ color: '#669BBC' }}>Reseñas</p>
          </Card>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Professional Description */}
        {specialist?.professional_description && (
          <Card className="p-4" style={{ borderColor: '#669BBC' }}>
            <h3 className="font-bold text-lg mb-3" style={{ color: '#003049' }}>
              Sobre su experiencia
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#669BBC' }}>
              {specialist.professional_description}
            </p>
          </Card>
        )}

        {/* Services with Experience Years - Modern Table Format */}
        {specialties.length > 0 && (
          <div className="space-y-6">
            {specialties.map((specialty: any, idx: number) => (
              <Card 
                key={specialty.id} 
                className="p-0 overflow-hidden border-0 shadow-elegant animate-fade-in" 
                style={{ 
                  animationDelay: `${idx * 100}ms`,
                  background: 'linear-gradient(to bottom, rgba(253, 240, 213, 0.3), rgba(255, 255, 255, 1))'
                }}
              >
                {/* Modern Header with Specialty and Experience */}
                <div 
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ 
                    background: 'linear-gradient(135deg, #003049 0%, #669BBC 100%)',
                  }}
                >
                  <h3 className="font-bold text-xl text-white">
                    {specialty.specialty}
                  </h3>
                  {specialty.experience_years && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-white font-semibold text-sm">
                        {specialty.experience_years} {specialty.experience_years === 1 ? 'año' : 'años'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Modern Table */}
                {specialty.activities && specialty.activities.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(253, 240, 213, 0.5)' }}>
                          <th className="text-left py-4 px-6 font-bold text-sm tracking-wide" style={{ color: '#003049' }}>
                            SERVICIOS QUE OFRECE
                          </th>
                          <th className="text-right py-4 px-6 font-bold text-sm tracking-wide" style={{ color: '#003049' }}>
                            PRECIO MÍNIMO
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {specialty.activities.map((activity: any, index: number) => (
                          <tr 
                            key={activity.id} 
                            className="transition-all duration-200 hover:bg-gradient-to-r hover:from-transparent hover:to-secondary/10 cursor-pointer group"
                            style={{
                              borderBottom: index !== specialty.activities.length - 1 ? '1px solid rgba(102, 155, 188, 0.1)' : 'none'
                            }}
                          >
                            <td className="py-4 px-6 text-sm font-medium group-hover:translate-x-1 transition-transform duration-200" style={{ color: '#669BBC' }}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                {activity.activity}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="inline-flex items-center justify-center font-bold text-base px-4 py-1.5 rounded-full" style={{ 
                                color: '#003049',
                                backgroundColor: 'rgba(253, 240, 213, 0.6)'
                              }}>
                                {activity.price_min ? `$${activity.price_min}` : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="px-6 py-4" style={{ backgroundColor: 'rgba(102, 155, 188, 0.05)' }}>
                  <p className="text-xs italic flex items-center gap-2" style={{ color: '#669BBC' }}>
                    <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: '#669BBC' }} />
                    Los precios pueden variar según alcance y materiales.
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Licenses and Certifications */}
        {credentials.length > 0 && (
          <Card className="p-4" style={{ borderColor: '#669BBC' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: '#003049' }}>
              Licencias y certificaciones
            </h3>
            <div className="space-y-3">
              {credentials.map((credential: any) => (
                <div key={credential.id} className="flex items-start justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1" style={{ color: '#003049' }}>
                      {credential.title}
                    </p>
                    <p className="text-xs" style={{ color: '#669BBC' }}>
                      {credential.issuer}
                    </p>
                    {credential.description && (
                      <p className="text-xs mt-1" style={{ color: '#669BBC' }}>
                        {credential.description}
                      </p>
                    )}
                  </div>
                  {credential.attachment_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(credential.attachment_url, '_blank')}
                      style={{ borderColor: '#669BBC', color: '#669BBC' }}
                    >
                      Ver documento
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Footer Actions */}
      {quoteId && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            style={{ borderColor: '#669BBC', color: '#003049' }}
            onClick={() => navigate(`/chat/${quoteId}`)}
          >
            Volver al chat
          </Button>
          <Button
            className="flex-1"
            style={{ backgroundColor: '#C1121F', color: '#FFFFFF' }}
            onClick={() => setShowConfirmDialog(true)}
          >
            Contratar
          </Button>
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
