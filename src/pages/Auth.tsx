import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';

// Schema for Step 1 - Identity Data
const step1Schema = z.object({
  firstName: z.string().trim().min(1, 'El nombre completo es obligatorio'),
  lastNamePaterno: z.string().trim().min(1, 'El apellido paterno es obligatorio'),
  lastNameMaterno: z.string().trim().min(1, 'El apellido materno es obligatorio'),
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// Schema for Step 2 - Contact and Legal Data
const step2Schema = z.object({
  phone: z.string().trim().regex(/^\d{10,}$/, 'El teléfono debe tener al menos 10 dígitos'),
  dateOfBirth: z.string().min(1, 'La fecha de nacimiento es obligatoria').refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    return adjustedAge >= 18;
  }, 'Debes ser mayor de 18 años'),
  gender: z.string().optional(),
  acceptedTerms: z.boolean().refine((val) => val === true, 'Debes aceptar los términos y condiciones'),
  acceptedPrivacy: z.boolean().refine((val) => val === true, 'Debes aceptar el aviso de privacidad'),
});

// Combined schema for full registration
const fullRegistrationSchema = step1Schema.merge(step2Schema);

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;
type FullRegistrationData = z.infer<typeof fullRegistrationSchema>;

// Login schema
const loginSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();

  // Form for Step 1
  const form1 = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: '',
      lastNamePaterno: '',
      lastNameMaterno: '',
      email: '',
      password: '',
    },
  });

  // Form for Step 2
  const form2 = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      phone: '',
      dateOfBirth: '',
      gender: '',
      acceptedTerms: false,
      acceptedPrivacy: false,
    },
  });

  // Form for Login
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if user is authenticated and has complete profile
  useEffect(() => {
    const checkUserProfile = async () => {
      if (loading || !user || checkingProfile) return;
      
      setCheckingProfile(true);
      
      try {
        // Check if user has a complete profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking profile:', error);
          setCheckingProfile(false);
          return;
        }

        // If profile exists and has ALL required fields, redirect to home
        if (profile && profile.phone && profile.date_of_birth && profile.accepted_terms_at && profile.accepted_privacy_at) {
          navigate('/', { replace: true });
          return;
        }

        // User exists but profile is incomplete (Google sign-up)
        // Pre-fill form with data from profile or Google metadata
        const userMetadata = user.user_metadata || {};
        
        const firstName = profile?.first_name || userMetadata.first_name || userMetadata.full_name?.split(' ')[0] || '';
        const lastName = profile?.last_name_paterno || userMetadata.last_name || userMetadata.full_name?.split(' ').slice(1).join(' ') || '';
        
        form1.setValue('firstName', firstName);
        form1.setValue('lastNamePaterno', lastName);
        form1.setValue('lastNameMaterno', profile?.last_name_materno || '');
        form1.setValue('email', user.email || '');
        
        setIsSignUp(true);
        setStep1Data({
          firstName,
          lastNamePaterno: lastName,
          lastNameMaterno: profile?.last_name_materno || '',
          email: user.email || '',
          password: '', // No password for OAuth users
        });
        setStep(2);
        
        toast({
          title: 'Completa tu registro',
          description: 'Por favor completa tu información para continuar.',
        });
      } catch (error) {
        console.error('Error in checkUserProfile:', error);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkUserProfile();
  }, [user, loading, navigate, toast, form1, checkingProfile]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    // El redirect y verificación del perfil se maneja automáticamente en el useEffect
  };

  const handleStep1Submit = (data: Step1FormData) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2Submit = async (data: Step2FormData) => {
    if (!step1Data) return;

    const fullData: FullRegistrationData = {
      ...step1Data,
      ...data,
    };

    // If user is already authenticated (Google sign-in), just update profile
    if (user) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            first_name: fullData.firstName,
            last_name_paterno: fullData.lastNamePaterno,
            last_name_materno: fullData.lastNameMaterno,
            phone: fullData.phone,
            date_of_birth: fullData.dateOfBirth,
            gender: fullData.gender,
            accepted_terms_at: fullData.acceptedTerms ? new Date().toISOString() : null,
            accepted_privacy_at: fullData.acceptedPrivacy ? new Date().toISOString() : null,
          });

        if (profileError) throw profileError;

        toast({
          title: 'Registro completado',
          description: 'Tu perfil ha sido actualizado exitosamente.',
        });
        navigate('/', { replace: true });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo completar el registro.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Regular email sign-up
    const metadata = {
      first_name: fullData.firstName,
      last_name_paterno: fullData.lastNamePaterno,
      last_name_materno: fullData.lastNameMaterno,
      phone: fullData.phone,
      date_of_birth: fullData.dateOfBirth,
      gender: fullData.gender,
      accepted_terms: fullData.acceptedTerms,
      accepted_privacy: fullData.acceptedPrivacy,
    };

    const { error } = await signUpWithEmail(
      fullData.email,
      fullData.password,
      metadata
    );

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Usuario existente',
          description: 'Este correo electrónico ya está registrado. Por favor, inicia sesión.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Cuenta creada',
        description: 'Tu cuenta ha sido creada exitosamente.',
      });
      navigate('/');
    }
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    const { error } = await signInWithEmail(data.email, data.password);

    if (error) {
      toast({
        title: 'Error',
        description: 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.',
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="w-full px-4 py-6 border-b border-border/30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={handleBackToHome}
            className="text-foreground hover:text-rappi-green transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo />
          <div className="w-9" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp
                ? 'Completa tu información para comenzar'
                : 'Ingresa con tu cuenta'}
            </p>
          </div>

          {/* Progress bar for signup */}
          {isSignUp && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Paso {step} de 2
                </span>
                <span className="text-xs text-muted-foreground">
                  {step === 1 ? 'Datos personales' : 'Información de contacto'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-rappi-green h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 2) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full h-12 mb-6 border-2 hover:border-rappi-green hover:text-rappi-green transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-muted-foreground">o continúa con email</span>
            </div>
          </div>

          {/* Login Form */}
          {!isSignUp && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          className="h-12 border-2 focus:border-rappi-green"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12 border-2 focus:border-rappi-green"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-rappi-green hover:bg-rappi-green/90 text-white font-semibold text-base rounded-full mt-6"
                >
                  Iniciar sesión
                </Button>
              </form>
            </Form>
          )}

          {/* Sign Up Form - Step 1 */}
          {isSignUp && step === 1 && (
            <Form {...form1}>
              <form onSubmit={form1.handleSubmit(handleStep1Submit)} className="space-y-4">
                <FormField
                  control={form1.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nombre(s)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Juan"
                          className="h-12 border-2 focus:border-rappi-green"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form1.control}
                    name="lastNamePaterno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Apellido paterno</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Pérez"
                            className="h-12 border-2 focus:border-rappi-green"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form1.control}
                    name="lastNameMaterno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Apellido materno</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="García"
                            className="h-12 border-2 focus:border-rappi-green"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form1.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          className="h-12 border-2 focus:border-rappi-green"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          className="h-12 border-2 focus:border-rappi-green"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-rappi-green hover:bg-rappi-green/90 text-white font-semibold text-base rounded-full mt-6"
                >
                  Continuar
                </Button>
              </form>
            </Form>
          )}

          {/* Sign Up Form - Step 2 */}
          {isSignUp && step === 2 && (
            <>
              <button
                onClick={handleBackToStep1}
                className="mb-6 text-foreground hover:text-rappi-green transition-colors flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(handleStep2Submit)} className="space-y-4">
                  <FormField
                    control={form2.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="5512345678"
                            className="h-12 border-2 focus:border-rappi-green"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form2.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Fecha de nacimiento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-12 border-2 focus:border-rappi-green"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form2.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Género (opcional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 focus:border-rappi-green">
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="female">Femenino</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefiero no decir</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3 pt-2">
                    <FormField
                      control={form2.control}
                      name="acceptedTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-2"
                            />
                          </FormControl>
                          <div className="leading-none">
                            <FormLabel className="text-xs font-normal text-muted-foreground">
                              Acepto los{' '}
                              <a href="#" className="text-rappi-green hover:underline">
                                términos y condiciones
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form2.control}
                      name="acceptedPrivacy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-2"
                            />
                          </FormControl>
                          <div className="leading-none">
                            <FormLabel className="text-xs font-normal text-muted-foreground">
                              Acepto el{' '}
                              <a href="#" className="text-rappi-green hover:underline">
                                aviso de privacidad
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-rappi-green hover:bg-rappi-green/90 text-white font-semibold text-base rounded-full mt-6"
                  >
                    Crear cuenta
                  </Button>
                </form>
              </Form>
            </>
          )}

          {/* Toggle between login and signup */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStep(1);
                form1.reset();
                form2.reset();
                loginForm.reset();
              }}
              className="text-sm text-muted-foreground hover:text-rappi-green transition-colors"
            >
              {isSignUp ? (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <span className="font-semibold text-rappi-green">Inicia sesión</span>
                </>
              ) : (
                <>
                  ¿No tienes cuenta?{' '}
                  <span className="font-semibold text-rappi-green">Regístrate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
