import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import confetti from 'canvas-confetti';

interface Specialty {
  id: string;
  specialty: string;
  roleLabel: string;
  activities: Activity[];
}

interface Activity {
  activity: string;
  priceMin?: string;
  priceMax?: string;
}

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México",
  "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
  "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

export default function SpecialistRegistration() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  
  // Personal data
  const [personalData, setPersonalData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    birthDate: '',
    gender: user?.user_metadata?.gender || '',
    nationality: user?.user_metadata?.nationality || 'Mexicana',
    phone: '',
    rfc: '',
    idDocument: null as File | null,
  });

  // Specialties
  const [specialties, setSpecialties] = useState<Specialty[]>([{
    id: '1',
    specialty: '',
    roleLabel: '',
    activities: []
  }]);

  // Work zones
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [citiesByState, setCitiesByState] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else {
        fetchServices();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('servicios_domesticos')
        .select('*');
      
      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo no debe superar los 5MB",
          variant: "destructive"
        });
        return;
      }
      setPersonalData({ ...personalData, idDocument: file });
    }
  };

  const addSpecialty = () => {
    setSpecialties([...specialties, {
      id: Date.now().toString(),
      specialty: '',
      roleLabel: '',
      activities: []
    }]);
  };

  const removeSpecialty = (id: string) => {
    setSpecialties(specialties.filter(s => s.id !== id));
  };

  const updateSpecialty = (id: string, field: string, value: any) => {
    setSpecialties(specialties.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const getActivitiesForSpecialty = (specialty: string) => {
    return services
      .filter(s => s.especialista === specialty)
      .map(s => s.actividad);
  };

  const toggleActivity = (specialtyId: string, activity: string) => {
    setSpecialties(specialties.map(s => {
      if (s.id !== specialtyId) return s;
      
      const hasActivity = s.activities.find(a => a.activity === activity);
      if (hasActivity) {
        return { ...s, activities: s.activities.filter(a => a.activity !== activity) };
      } else {
        return { ...s, activities: [...s.activities, { activity, priceMin: '', priceMax: '' }] };
      }
    }));
  };

  const updateActivityPrice = (specialtyId: string, activity: string, field: 'priceMin' | 'priceMax', value: string) => {
    setSpecialties(specialties.map(s => {
      if (s.id !== specialtyId) return s;
      
      return {
        ...s,
        activities: s.activities.map(a =>
          a.activity === activity ? { ...a, [field]: value } : a
        )
      };
    }));
  };

  const toggleState = (state: string) => {
    if (selectedStates.includes(state)) {
      setSelectedStates(selectedStates.filter(s => s !== state));
      const newCities = { ...citiesByState };
      delete newCities[state];
      setCitiesByState(newCities);
    } else {
      setSelectedStates([...selectedStates, state]);
    }
  };

  const addCity = (state: string, city: string) => {
    if (!city.trim()) return;
    
    setCitiesByState({
      ...citiesByState,
      [state]: [...(citiesByState[state] || []), city.trim()]
    });
  };

  const removeCity = (state: string, city: string) => {
    setCitiesByState({
      ...citiesByState,
      [state]: citiesByState[state].filter(c => c !== city)
    });
  };

  const validateStep1 = () => {
    return personalData.firstName && personalData.lastName && 
           personalData.phone && personalData.rfc && personalData.idDocument;
  };

  const validateStep2 = () => {
    return specialties.every(s => s.specialty && s.roleLabel && s.activities.length > 0);
  };

  const validateStep3 = () => {
    return selectedStates.length > 0 && selectedStates.every(state => 
      citiesByState[state] && citiesByState[state].length > 0
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload ID document
      const fileExt = personalData.idDocument!.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('specialist-documents')
        .upload(fileName, personalData.idDocument!);

      if (uploadError) throw uploadError;

      const { data, error: urlError } = await supabase.storage
        .from('specialist-documents')
        .createSignedUrl(fileName, 31536000); // 1 year expiry

      if (urlError) throw urlError;

      // Create specialist profile
      const { data: profile, error: profileError } = await supabase
        .from('specialist_profiles')
        .insert([{
          user_id: user!.id,
          phone: personalData.phone,
          rfc: personalData.rfc,
          id_document_url: data.signedUrl
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Create specialties and activities
      for (const specialty of specialties) {
        const { data: specialtyData, error: specialtyError } = await supabase
          .from('specialist_specialties')
          .insert([{
            specialist_id: profile.id,
            specialty: specialty.specialty,
            role_label: specialty.roleLabel
          }])
          .select()
          .single();

        if (specialtyError) throw specialtyError;

        if (specialty.activities.length > 0) {
          const activities = specialty.activities.map(a => ({
            specialty_id: specialtyData.id,
            activity: a.activity,
            price_min: a.priceMin ? parseFloat(a.priceMin) : null,
            price_max: a.priceMax ? parseFloat(a.priceMax) : null
          }));

          const { error: activitiesError } = await supabase
            .from('specialist_activities')
            .insert(activities);

          if (activitiesError) throw activitiesError;
        }
      }

      // Create work zones
      const workZones = selectedStates.map(state => ({
        specialist_id: profile.id,
        state,
        cities: citiesByState[state] || []
      }));

      const { error: zonesError } = await supabase
        .from('specialist_work_zones')
        .insert(workZones);

      if (zonesError) throw zonesError;

      // Success!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "¡Felicidades!",
        description: "Bienvenido(a) al equipo"
      });

      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uniqueSpecialists = [...new Set(services.map(s => s.especialista))];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Logo className="pt-4 pb-2" />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => step === 1 ? navigate('/profile') : setStep(step - 1)}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Registro de especialista</h1>
              <p className="text-sm text-muted-foreground">Paso {step} de 4</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Personal Data */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Datos personales</h2>
              <p className="text-secondary text-sm">Completa tu información básica</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre(s)*</Label>
                  <Input
                    id="firstName"
                    value={personalData.firstName}
                    onChange={(e) => setPersonalData({...personalData, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido(s)*</Label>
                  <Input
                    id="lastName"
                    value={personalData.lastName}
                    onChange={(e) => setPersonalData({...personalData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Teléfono*</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="10 dígitos"
                  value={personalData.phone}
                  onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="rfc">RFC*</Label>
                <Input
                  id="rfc"
                  placeholder="13 caracteres"
                  value={personalData.rfc}
                  onChange={(e) => setPersonalData({...personalData, rfc: e.target.value.toUpperCase()})}
                  maxLength={13}
                />
              </div>

              <div>
                <Label htmlFor="idDocument">Identificación oficial* (INE o Pasaporte)</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      id="idDocument"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    {personalData.idDocument ? (
                      <div className="text-center">
                        <Check className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm text-foreground font-medium">
                          {personalData.idDocument.name}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
                        <p className="text-sm text-secondary">
                          Sube tu identificación (máx. 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!validateStep1()}
              className="w-full h-12 text-base"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Specialties */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Especialidades y actividades</h2>
              <p className="text-secondary text-sm">Define tus servicios y precios</p>
            </div>

            <div className="space-y-6">
              {specialties.map((specialty, index) => (
                <div key={specialty.id} className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Especialidad {index + 1}</h3>
                    {specialties.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpecialty(specialty.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>Especialidad*</Label>
                    <Select
                      value={specialty.specialty}
                      onValueChange={(value) => updateSpecialty(specialty.id, 'specialty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueSpecialists.map((spec) => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`role-${specialty.id}`}>Rol/Etiqueta*</Label>
                    <Input
                      id={`role-${specialty.id}`}
                      placeholder="Ej: Jardinero profesional"
                      value={specialty.roleLabel}
                      onChange={(e) => updateSpecialty(specialty.id, 'roleLabel', e.target.value)}
                    />
                  </div>

                  {specialty.specialty && (
                    <div>
                      <Label>Actividades*</Label>
                      <div className="mt-2 space-y-3">
                        {getActivitiesForSpecialty(specialty.specialty).map((activity) => {
                          const activityData = specialty.activities.find(a => a.activity === activity);
                          const isSelected = !!activityData;

                          return (
                            <div key={activity} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${specialty.id}-${activity}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleActivity(specialty.id, activity)}
                                />
                                <label
                                  htmlFor={`${specialty.id}-${activity}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {activity}
                                </label>
                              </div>
                              
                              {isSelected && (
                                <div className="ml-6 grid grid-cols-2 gap-2">
                                  <div>
                                    <Input
                                      type="number"
                                      placeholder="Precio mín."
                                      value={activityData?.priceMin || ''}
                                      onChange={(e) => updateActivityPrice(specialty.id, activity, 'priceMin', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Input
                                      type="number"
                                      placeholder="Precio máx."
                                      value={activityData?.priceMax || ''}
                                      onChange={(e) => updateActivityPrice(specialty.id, activity, 'priceMax', e.target.value)}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addSpecialty}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar otra especialidad
              </Button>
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={!validateStep2()}
              className="w-full h-12 text-base"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 3: Work Zones */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Zonas de trabajo</h2>
              <p className="text-secondary text-sm">Selecciona dónde ofreces tus servicios</p>
            </div>

            <div>
              <Label>Estados*</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-border rounded-lg p-4">
                {MEXICAN_STATES.map((state) => (
                  <div key={state} className="flex items-center space-x-2">
                    <Checkbox
                      id={state}
                      checked={selectedStates.includes(state)}
                      onCheckedChange={() => toggleState(state)}
                    />
                    <label
                      htmlFor={state}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {state}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {selectedStates.length > 0 && (
              <div className="space-y-4">
                <Label>Ciudades por estado*</Label>
                {selectedStates.map((state) => (
                  <div key={state} className="border border-border rounded-lg p-4 space-y-3">
                    <p className="font-medium text-foreground">{state}</p>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Agregar ciudad"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addCity(state, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addCity(state, input.value);
                          input.value = '';
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {citiesByState[state]?.map((city) => (
                        <Badge key={city} variant="secondary" className="gap-1">
                          {city}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeCity(state, city)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => setStep(4)}
              disabled={!validateStep3()}
              className="w-full h-12 text-base"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Resumen</h2>
              <p className="text-secondary text-sm">Revisa tu información antes de enviar</p>
            </div>

            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Datos personales</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    Editar
                  </Button>
                </div>
                <div className="space-y-1 text-sm text-secondary">
                  <p><strong>Nombre:</strong> {personalData.firstName} {personalData.lastName}</p>
                  <p><strong>Teléfono:</strong> {personalData.phone}</p>
                  <p><strong>RFC:</strong> {personalData.rfc}</p>
                  <p><strong>ID:</strong> {personalData.idDocument?.name}</p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Especialidades</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                    Editar
                  </Button>
                </div>
                <div className="space-y-3">
                  {specialties.map((specialty, index) => (
                    <div key={specialty.id} className="text-sm">
                      <p className="font-medium text-foreground">
                        {index + 1}. {specialty.specialty} - {specialty.roleLabel}
                      </p>
                      <p className="text-secondary">
                        {specialty.activities.length} actividades
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Zonas de trabajo</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                    Editar
                  </Button>
                </div>
                <div className="space-y-1 text-sm text-secondary">
                  <p><strong>Estados:</strong> {selectedStates.length}</p>
                  <p><strong>Ciudades totales:</strong> {
                    Object.values(citiesByState).reduce((acc, cities) => acc + cities.length, 0)
                  }</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-secondary">
              Al completar el registro, aceptas nuestros{' '}
              <a href="#" className="text-primary underline">Términos y Condiciones</a>
              {' '}y{' '}
              <a href="#" className="text-primary underline">Política de Privacidad</a>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 text-base"
            >
              {loading ? 'Procesando...' : 'Completar registro'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
