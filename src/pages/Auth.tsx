import { useState } from 'react';
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
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';

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
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
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

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
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

    const { error } = await signUpWithEmail(fullData.email, fullData.password, {
      first_name: fullData.firstName,
      last_name_paterno: fullData.lastNamePaterno,
      last_name_materno: fullData.lastNameMaterno,
      phone: fullData.phone,
      date_of_birth: fullData.dateOfBirth,
      gender: fullData.gender || '',
      accepted_terms: fullData.acceptedTerms,
      accepted_privacy: fullData.acceptedPrivacy,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '¡Cuenta creada!',
        description: 'Revisa tu correo para confirmar tu cuenta.',
      });

      const pendingRequest = localStorage.getItem('pendingRequest');
      if (pendingRequest) {
        navigate('/create-request');
      } else {
        navigate('/');
      }
    }
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    const { error } = await signInWithEmail(data.email, data.password);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const pendingRequest = localStorage.getItem('pendingRequest');
      if (pendingRequest) {
        navigate('/create-request');
      } else {
        navigate('/');
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setStep(1);
    setStep1Data(null);
    form1.reset();
    form2.reset();
    loginForm.reset();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Logo className="pt-4 pb-2" />
      <div className="max-w-md mx-auto p-6">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-foreground hover:text-accent transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp
              ? 'Registra tu cuenta para publicar solicitudes y administrar tu perfil.'
              : 'Continúa con tu cuenta para publicar solicitudes y administrar tu perfil.'}
          </p>
        </div>

        {/* Progress bar for signup */}
        {isSignUp && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Paso {step} de 2
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full h-12 text-base"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">o</span>
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
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-base">
                Iniciar sesión
              </Button>
            </form>
          </Form>
        )}

        {/* Signup Step 1 - Identity Data */}
        {isSignUp && step === 1 && (
          <Form {...form1}>
            <form onSubmit={form1.handleSubmit(handleStep1Submit)} className="space-y-4">
              <FormField
                control={form1.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form1.control}
                name="lastNamePaterno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido paterno</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Apellido materno</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form1.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-base">
                Siguiente
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </Form>
        )}

        {/* Signup Step 2 - Contact and Legal Data */}
        {isSignUp && step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="mb-4 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al paso anterior</span>
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Datos de contacto
              </h2>
              <p className="text-sm text-muted-foreground">
                Completa tu información para finalizar el registro
              </p>
            </div>

            <Form {...form2}>
              <form onSubmit={form2.handleSubmit(handleStep2Submit)} className="space-y-4">
                <FormField
                  control={form2.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="10 dígitos mínimo" {...field} />
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
                      <FormLabel>Fecha de nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Género (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hombre">Hombre</SelectItem>
                          <SelectItem value="mujer">Mujer</SelectItem>
                          <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form2.control}
                  name="acceptedTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          He leído y acepto los{' '}
                          <a href="#" className="text-primary hover:underline">
                            Términos y Condiciones
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
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          He leído y acepto el{' '}
                          <a href="#" className="text-primary hover:underline">
                            Aviso de Privacidad
                          </a>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-12 text-base">
                  Crear cuenta
                </Button>
              </form>
            </Form>
          </div>
        )}

        {/* Toggle between login and signup */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-primary hover:underline text-sm"
          >
            {isSignUp
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}
