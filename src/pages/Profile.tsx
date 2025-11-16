import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User, Briefcase, ChevronRight, MapPin, Settings, Bell, HelpCircle, FileText, CreditCard } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { BottomNavSpecialist } from '@/components/BottomNavSpecialist';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { useSpecialistMode } from '@/hooks/use-specialist-mode';
import { cn } from '@/lib/utils';
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

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSpecialist, setIsSpecialist] = useState(false);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [checkingSpecialist, setCheckingSpecialist] = useState(true);
  const { isSpecialistMode, toggleSpecialistMode, isLoading: roleLoading } = useSpecialistMode();

  useEffect(() => {
    if (user) {
      checkSpecialistStatus();
    } else {
      setCheckingSpecialist(false);
    }
  }, [user]);

  const checkSpecialistStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setIsSpecialist(!!data);
      setSpecialistId(data?.id || null);
    } catch (error: any) {
      console.error('Error checking specialist status:', error);
    } finally {
      setCheckingSpecialist(false);
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

  if (loading || checkingSpecialist || roleLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        {!user ? (
          // Not logged in view
          <>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              
              <div>
                <p className="text-gray-600 mb-4">
                  Inicia sesión para guardar tus solicitudes y ver cotizaciones.
                </p>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-12 text-base bg-rappi-green hover:bg-rappi-green/90 rounded-full"
              >
                Iniciar sesión
              </Button>

              <p className="text-sm text-gray-600">
                ¿Aún no tienes cuenta?{' '}
                <button
                  onClick={() => navigate('/auth')}
                  className="text-rappi-green hover:underline font-semibold"
                >
                  Crea una ahora
                </button>
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-rappi-green/10 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-rappi-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base">Trabaja como especialista</h3>
                    <p className="text-sm text-gray-500">Ofrece tus servicios y genera ingresos</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-full"
                >
                  Regístrate como especialista
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Logged in view
          <>
            {/* User Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rappi-green/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-rappi-green" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">
                    {user.user_metadata?.first_name || 'Usuario'} {user.user_metadata?.last_name || ''}
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
                    <AlertDialogAction
                      onClick={handleSignOut}
                      className="bg-rappi-green hover:bg-rappi-green/90"
                    >
                      Sí, cerrar sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* My Account Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900 px-2">My account</h2>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
                <MenuItem
                  icon={User}
                  title="Información personal"
                  subtitle="Editar nombre, apellidos, teléfono y más"
                  onClick={() => navigate('/profile/personal-info')}
                />
                <MenuItem
                  icon={MapPin}
                  title="Direcciones"
                  subtitle="Administra tus ubicaciones guardadas"
                  onClick={() => navigate('/locations')}
                />
                <MenuItem
                  icon={CreditCard}
                  title="Métodos de pago"
                  subtitle="Tarjetas y formas de pago"
                  disabled
                />
                <MenuItem
                  icon={FileText}
                  title="Información de facturación"
                  subtitle="Datos fiscales y facturación"
                  disabled
                />
              </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900 px-2">Configuración</h2>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
                <MenuItem
                  icon={Settings}
                  title="Preferencias"
                  subtitle="Idioma, notificaciones, privacidad"
                  disabled
                />
                <MenuItem
                  icon={Bell}
                  title="Notificaciones"
                  subtitle="Configura tus alertas"
                  disabled
                />
                <MenuItem
                  icon={HelpCircle}
                  title="Ayuda"
                  subtitle="Centro de ayuda y soporte"
                  disabled
                />
              </div>
            </div>

            {/* Specialist Mode Toggle or Registration */}
            {!isSpecialist ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-rappi-green/10 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-rappi-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base">Trabaja como especialista</h3>
                    <p className="text-sm text-gray-500">Ofrece tus servicios y genera ingresos</p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-rappi-green hover:bg-rappi-green/90 rounded-full"
                  onClick={() => navigate('/specialist-registration')}
                >
                  Regístrate como especialista
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-rappi-green/10 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-rappi-green" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base">Modo especialista</h3>
                      <p className="text-sm text-gray-500">Ver solicitudes de servicio</p>
                    </div>
                  </div>
                  <Switch
                    checked={isSpecialistMode}
                    onCheckedChange={async (checked) => {
                      await toggleSpecialistMode(checked);
                      if (checked) {
                        navigate('/specialist');
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Siempre mostrar navegación de usuario en /profile */}
      <BottomNav />
    </div>
  );
}
