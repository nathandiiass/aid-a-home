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
    <div className="min-h-screen pb-24 bg-background">
      {/* Clean App Bar - Rappi Style */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="flex-1 text-xl font-bold">
          Perfil del Especialista
        </h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Share2 className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Clean Hero Section */}
      <div className="px-4 py-8 text-center space-y-4">
        <Avatar className="h-28 w-28 mx-auto border-4 border-white shadow-md">
          <AvatarImage src={profile.avatar_url} alt={displayName} />
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        {verifiedStatus && (
          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            <span className="text-base">✓</span>
            Verificado
          </div>
        )}

        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {displayName}
          </h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Phone className="h-4 w-4" />
            <span>{profile.phone}</span>
          </div>
        </div>
      </div>

      {/* Work Zones Section */}
      {workZones.length > 0 && (
        <div className="px-4 space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Zonas de cobertura
          </h3>
          <div className="space-y-3">
            {workZones.map((zone, idx) => (
              <Card key={idx} className="p-4 bg-card border">
                <div className="space-y-3">
                  <div className="font-semibold text-base">{zone.state}</div>
                  <div className="flex flex-wrap gap-2">
                    {zone.cities.map((city: string, cityIdx: number) => (
                      <Badge 
                        key={cityIdx} 
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-xs font-normal"
                      >
                        {city}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards - Rating & Reviews */}
      <div className="px-4 grid grid-cols-2 gap-3 mt-6">
        <Card className="p-5 text-center bg-card border">
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold mb-1">
            {rating > 0 ? rating.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">Calificación</div>
        </Card>
        
        <Card className="p-5 text-center bg-card border">
          <div className="text-2xl mb-2">💬</div>
          <div className="text-2xl font-bold mb-1">
            {reviewCount}
          </div>
          <div className="text-xs text-muted-foreground">Reseñas</div>
        </Card>
      </div>

      <div className="px-4 space-y-8">
        {/* Modern Professional Description */}
        {specialist?.professional_description && (
          <Card className="p-6 border-0 shadow-elegant overflow-hidden relative animate-fade-in" style={{ 
            animationDelay: '300ms',
            background: 'linear-gradient(135deg, rgba(253, 240, 213, 0.3), rgba(255, 255, 255, 0.95))'
          }}>
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-2xl" />
            <div className="relative">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2" style={{ color: '#003049' }}>
                <span className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-secondary" />
                Sobre su experiencia
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#669BBC' }}>
                {specialist.professional_description}
              </p>
            </div>
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
          <div className="px-4 space-y-3 mt-6">
            <h3 className="text-lg font-bold">Licencias y certificaciones</h3>
            <div className="space-y-3">
              {credentials.map((credential, idx) => (
                <Card key={idx} className="p-4 bg-card border">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm mb-1">{credential.title}</div>
                        <div className="text-xs text-muted-foreground">{credential.issuer}</div>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-normal shrink-0">
                        {credential.type}
                      </Badge>
                    </div>
                    
                    {credential.description && (
                      <p className="text-xs text-muted-foreground">{credential.description}</p>
                    )}
                    
                    {(credential.start_year || credential.issued_at) && (
                      <div className="text-xs text-muted-foreground">
                        {credential.start_year && credential.end_year 
                          ? `${credential.start_year} - ${credential.end_year}`
                          : credential.start_year 
                          ? `Desde ${credential.start_year}`
                          : credential.issued_at
                          ? `Emitido: ${new Date(credential.issued_at).getFullYear()}`
                          : null}
                      </div>
                    )}
                    
                    {credential.attachment_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-2 rounded-full text-xs h-8"
                        onClick={() => window.open(credential.attachment_url, '_blank')}
                      >
                        Ver documento
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Footer with Green Button - Rappi Style */}
      {quoteId && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="max-w-md mx-auto">
            <Button 
              onClick={() => setShowConfirmDialog(true)}
              className="w-full h-14 text-base font-semibold rounded-full shadow-lg transition-all duration-200 active:scale-95"
              style={{ 
                backgroundColor: '#00D563',
                color: 'white'
              }}
            >
              Contratar Especialista
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
              style={{ backgroundColor: '#00D563', color: 'white' }}
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
