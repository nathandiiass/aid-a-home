import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User, ChevronRight, Settings, Bell, HelpCircle, FileText, Shield, Star, Briefcase } from 'lucide-react';
import { BottomNavSpecialist } from '@/components/BottomNavSpecialist';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useSpecialistMode } from '@/hooks/use-specialist-mode';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function SpecialistAccount() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { toggleSpecialistMode } = useSpecialistMode();
  const [reviewsCount, setReviewsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (user) {
      fetchReviewsData();
    }
  }, [user]);

  const fetchReviewsData = async () => {
    try {
      const { data: specialistProfile } = await supabase
        .from('specialist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (specialistProfile) {
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('specialist_id', specialistProfile.id);

        if (error) throw error;

        setReviewsCount(reviews?.length || 0);
        if (reviews && reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          setAverageRating(avg);
        }
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      navigate('/');
    }
  };

  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const handleSpecialistModeToggle = async (checked: boolean) => {
    if (!checked) {
      setShowDeactivateDialog(true);
    }
  };

  const confirmDeactivateSpecialistMode = async () => {
    await toggleSpecialistMode(false);
    setShowDeactivateDialog(false);
    toast({
      title: "Modo especialista desactivado",
      description: "Has vuelto al modo usuario"
    });
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  const MenuItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onClick, 
    showChevron = true,
    disabled = false 
  }: { 
    icon: any; 
    title: string; 
    subtitle?: string; 
    onClick?: () => void; 
    showChevron?: boolean;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-4 p-4 bg-white transition-colors",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
      )}
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-700" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {showChevron && <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Cuenta</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {!user ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            
            <div>
              <p className="text-gray-600 mb-4">
                Inicia sesión para acceder a tu cuenta de especialista.
              </p>
            </div>

            <Button
              onClick={() => navigate('/auth')}
              className="w-full h-12 text-base bg-rappi-green hover:bg-rappi-green/90 rounded-full"
            >
              Iniciar sesión
            </Button>
          </div>
        ) : (
          <>
            {/* User Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rappi-green/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-rappi-green" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">
                    {user.user_metadata?.first_name || 'Especialista'} {user.user_metadata?.last_name || ''}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Miembro desde {new Date(user.created_at).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-gray-200 hover:bg-gray-50 text-gray-900 rounded-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Deseas cerrar tu sesión?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Podrás volver a iniciar sesión en cualquier momento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSignOut}>
                      Cerrar sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Reviews</h2>
              </div>
              <MenuItem
                icon={Star}
                title="Mis reseñas"
                subtitle={`${reviewsCount} reseñas · ${averageRating.toFixed(1)} promedio`}
                onClick={() => navigate('/specialist/reviews')}
              />
            </div>

            {/* Personal Info Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Mi información</h2>
              </div>
              <MenuItem
                icon={User}
                title="Información personal"
                subtitle="Edita tu perfil y datos de contacto"
                onClick={() => navigate('/specialist/personal-info')}
              />
            </div>

            {/* Configuration Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Configuración</h2>
              </div>
              <MenuItem
                icon={Settings}
                title="Idioma"
                subtitle="Español"
                onClick={() => toast({
                  title: "Próximamente",
                  description: "Esta función estará disponible pronto"
                })}
              />
              <div className="border-t border-gray-100" />
              <MenuItem
                icon={Bell}
                title="Notificaciones"
                subtitle="Gestiona tus preferencias de notificación"
                onClick={() => toast({
                  title: "Próximamente",
                  description: "Esta función estará disponible pronto"
                })}
              />
            </div>

            {/* More Info Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Más información</h2>
              </div>
              <MenuItem
                icon={FileText}
                title="Términos y condiciones"
                onClick={() => toast({
                  title: "Próximamente",
                  description: "Esta función estará disponible pronto"
                })}
              />
              <div className="border-t border-gray-100" />
              <MenuItem
                icon={HelpCircle}
                title="Ayuda"
                subtitle="Centro de ayuda y soporte"
                onClick={() => toast({
                  title: "Próximamente",
                  description: "Esta función estará disponible pronto"
                })}
              />
              <div className="border-t border-gray-100" />
              <MenuItem
                icon={Shield}
                title="Política de privacidad"
                onClick={() => toast({
                  title: "Próximamente",
                  description: "Esta función estará disponible pronto"
                })}
              />
            </div>

            {/* Specialist Mode Section - At the bottom */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="w-full flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-base">Modo especialista</p>
                  <p className="text-sm text-gray-500 mt-0.5">Ver solicitudes de servicio</p>
                </div>
                <Switch 
                  checked={true}
                  onCheckedChange={handleSpecialistModeToggle}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </div>

            <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Desactivar modo especialista?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Volverás al modo usuario. Podrás activar el modo especialista nuevamente desde tu perfil cuando lo necesites.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmDeactivateSpecialistMode}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Desactivar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      <BottomNavSpecialist />
    </div>
  );
}
