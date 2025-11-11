import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, User, Briefcase } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { BottomNavSpecialist } from '@/components/BottomNavSpecialist';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { useSpecialistMode } from '@/hooks/use-specialist-mode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab';
import { CredentialsTab } from '@/components/profile/CredentialsTab';
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
import { Logo } from '@/components/Logo';

export default function Profile() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSpecialist, setIsSpecialist] = useState(false);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [checkingSpecialist, setCheckingSpecialist] = useState(true);
  const { isSpecialistMode, toggleSpecialistMode } = useSpecialistMode();

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

  if (loading || checkingSpecialist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Logo className="pt-4 pb-2" />
      <div className="max-w-lg mx-auto p-6">
        {!user ? (
          // Not logged in view
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Tu cuenta</h1>
              <p className="text-secondary">
                Inicia sesión para guardar tus solicitudes, ver cotizaciones y registrar servicios.
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
                <User className="w-10 h-10 text-secondary" />
              </div>
              
              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-12 text-base bg-accent hover:bg-accent/90"
              >
                Iniciar sesión
              </Button>

              <p className="text-sm text-secondary">
                ¿Aún no tienes cuenta?{' '}
                <button
                  onClick={() => navigate('/auth')}
                  className="text-accent hover:underline font-medium"
                >
                  Crea una ahora
                </button>
              </p>
            </div>

            <div className="border border-border rounded-lg p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Trabaja como especialista</h3>
                  <p className="text-sm text-secondary">Ofrece tus servicios y genera ingresos</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                className="w-full"
              >
                Regístrate como especialista
              </Button>
            </div>
          </div>
        ) : (
          // Logged in view
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {user.user_metadata?.first_name || 'Usuario'}
              </h1>
              <p className="text-secondary">{user.email}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                  </p>
                  <p className="text-sm text-secondary">Miembro desde {new Date(user.created_at).toLocaleDateString('es-MX')}</p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="secondary"
                    className="w-full bg-muted hover:bg-muted/80 text-primary"
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
                      className="bg-accent hover:bg-accent/90"
                    >
                      Sí, cerrar sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {isSpecialistMode && isSpecialist && specialistId ? (
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Información personal</TabsTrigger>
                  <TabsTrigger value="credentials">Estudios y certificaciones</TabsTrigger>
                </TabsList>
                <TabsContent value="personal" className="mt-6">
                  <PersonalInfoTab userId={user.id} specialistId={specialistId} />
                </TabsContent>
                <TabsContent value="credentials" className="mt-6">
                  <CredentialsTab specialistId={specialistId} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Mi cuenta</h2>
                <div className="border border-border rounded-lg divide-y divide-border">
                  <button className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors">
                    <p className="font-medium text-foreground">Información personal</p>
                    <p className="text-sm text-secondary">Editar nombre, apellido, fecha de nacimiento</p>
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors">
                    <p className="font-medium text-foreground">Configuración</p>
                    <p className="text-sm text-secondary">Idioma, notificaciones, privacidad</p>
                  </button>
                  <button 
                    onClick={() => navigate('/locations')}
                    className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <p className="font-medium text-foreground">Ubicaciones</p>
                    <p className="text-sm text-secondary">Administra tus direcciones guardadas</p>
                  </button>
                </div>
              </div>
            )}

            {!isSpecialist ? (
              <div className="border border-border rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Trabaja como especialista</h3>
                    <p className="text-sm text-secondary">Ofrece tus servicios y genera ingresos</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/specialist-registration')}
                >
                  Regístrate como especialista
                </Button>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Modo especialista</h3>
                      <p className="text-sm text-secondary">Ver solicitudes de servicio</p>
                    </div>
                  </div>
                  <Switch
                    checked={isSpecialistMode}
                    onCheckedChange={(checked) => {
                      toggleSpecialistMode(checked);
                      if (checked) {
                        navigate('/specialist');
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isSpecialistMode && isSpecialist ? <BottomNavSpecialist /> : <BottomNav />}
    </div>
  );
}
