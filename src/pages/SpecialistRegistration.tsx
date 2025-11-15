import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import confetti from 'canvas-confetti';

interface Specialty {
  id: string;
  specialty: string;
  roleLabel: string;
  experienceYears: string;
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

const YUCATAN_MUNICIPALITIES = [
  "Abalá", "Acanceh", "Akil", "Baca", "Bokobá", "Buctzotz", "Cacalchén",
  "Calotmul", "Cansahcab", "Cantamayec", "Celestún", "Cenotillo", "Chankom",
  "Chapab", "Chemax", "Chichimilá", "Chicxulub Pueblo", "Chikindzonot",
  "Chocholá", "Chumayel", "Conkal", "Cuncunul", "Cuzamá", "Dzán",
  "Dzemul", "Dzidzantún", "Dzilam de Bravo", "Dzilam González", "Dzitás",
  "Dzoncauich", "Espita", "Halachó", "Hocabá", "Hoctún", "Homún",
  "Huhí", "Hunucmá", "Ixil", "Izamal", "Kanasín", "Kantunil", "Kaua",
  "Kinchil", "Kopomá", "Mama", "Maní", "Maxcanú", "Mayapán", "Mérida",
  "Mocochá", "Motul", "Muna", "Muxupip", "Opichén", "Oxkutzcab",
  "Panabá", "Peto", "Progreso", "Quintana Roo", "Río Lagartos",
  "Sacalum", "Samahil", "San Felipe", "Sanahcat", "Santa Elena",
  "Seyé", "Sinanché", "Sotuta", "Sucilá", "Sudzal", "Suma",
  "Tahdziú", "Tahmek", "Teabo", "Tecoh", "Tekal de Venegas", "Tekantó",
  "Tekax", "Tekit", "Tekom", "Telchac Pueblo", "Telchac Puerto", "Temax",
  "Temozón", "Tepakán", "Tetiz", "Teya", "Ticul", "Timucuy",
  "Tinum", "Tixcacalcupul", "Tixkokob", "Tixmehuac", "Tixpéhual", "Tizimín",
  "Tunkás", "Tzucacab", "Uayma", "Ucú", "Umán", "Valladolid",
  "Xocchel", "Yaxcabá", "Yaxkukul", "Yobaín"
];

export default function SpecialistRegistration() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  
  // Section 1: Personal Data
  const [personType, setPersonType] = useState<'fisica' | 'moral'>('fisica');
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    razonSocial: '',
    birthOrConstitutionDate: '',
    gender: '',
    phone: '',
    email: user?.email || '',
    rfc: '',
    city: '',
    state: '',
    postalCode: '',
    street: '',
    streetNumber: '',
    neighborhood: '',
    profilePhoto: null as File | null,
    acceptedTerms: false,
  });

  // Section 2: Professional Data
  const [specialties, setSpecialties] = useState<Specialty[]>([{
    id: '1',
    specialty: '',
    roleLabel: '',
    experienceYears: '',
    activities: []
  }]);
  const [professionalDescription, setProfessionalDescription] = useState('');
  const [licensesCertifications, setLicensesCertifications] = useState('');

  // Section 2: Coverage Zone (only Yucatán)
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);

  // Section 3: Documentation
  const [documents, setDocuments] = useState({
    idDocument: null as File | null,
    csfDocument: null as File | null,
    addressProof: null as File | null,
  });

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

  const handleFileUpload = (field: 'profilePhoto' | 'idDocument' | 'csfDocument' | 'addressProof', file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no debe superar los 5MB",
        variant: "destructive"
      });
      return;
    }

    if (field === 'profilePhoto') {
      setPersonalData({ ...personalData, profilePhoto: file });
    } else {
      setDocuments({ ...documents, [field]: file });
    }
  };

  // Specialty management
  const addSpecialty = () => {
    setSpecialties([...specialties, {
      id: Date.now().toString(),
      specialty: '',
      roleLabel: '',
      experienceYears: '',
      activities: []
    }]);
  };

  const removeSpecialty = (id: string) => {
    if (specialties.length > 1) {
      setSpecialties(specialties.filter(s => s.id !== id));
    }
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

  const toggleMunicipality = (municipality: string) => {
    if (selectedMunicipalities.includes(municipality)) {
      setSelectedMunicipalities(selectedMunicipalities.filter(m => m !== municipality));
    } else {
      setSelectedMunicipalities([...selectedMunicipalities, municipality]);
    }
  };

  // Validation functions
  const validateStep1 = () => {
    const baseValidation = 
      personalData.phone &&
      personalData.email &&
      personalData.rfc &&
      personalData.city &&
      personalData.state &&
      personalData.postalCode &&
      personalData.street &&
      personalData.streetNumber &&
      personalData.neighborhood &&
      personalData.profilePhoto &&
      personalData.birthOrConstitutionDate &&
      personalData.acceptedTerms;

    if (personType === 'fisica') {
      return baseValidation &&
        personalData.firstName &&
        personalData.lastName &&
        personalData.gender;
    } else {
      return baseValidation && personalData.razonSocial;
    }
  };

  const validateStep2 = () => {
    const specialtiesValid = specialties.every(s => 
      s.specialty && 
      s.roleLabel && 
      s.experienceYears && 
      parseInt(s.experienceYears) >= 0 &&
      s.activities.length >= 3
    );
    
    return specialtiesValid &&
      professionalDescription &&
      professionalDescription.length <= 200 &&
      selectedMunicipalities.length > 0;
  };

  const validateStep3 = () => {
    return documents.idDocument && 
           documents.csfDocument && 
           documents.addressProof;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      toast({
        title: "Error",
        description: "Debes completar todos los documentos requeridos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload all documents
      const uploadDocument = async (file: File, folder: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${folder}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('specialist-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data, error: urlError } = await supabase.storage
          .from('specialist-documents')
          .createSignedUrl(fileName, 31536000); // 1 year

        if (urlError) throw urlError;
        return data.signedUrl;
      };

      const [profilePhotoUrl, idDocumentUrl, csfDocumentUrl, addressProofUrl] = await Promise.all([
        uploadDocument(personalData.profilePhoto!, 'profile'),
        uploadDocument(documents.idDocument!, 'id'),
        uploadDocument(documents.csfDocument!, 'csf'),
        uploadDocument(documents.addressProof!, 'address')
      ]);

      // Update profile with gender
      if (personType === 'fisica' && personalData.gender) {
        await supabase
          .from('profiles')
          .update({ gender: personalData.gender })
          .eq('id', user!.id);
      }

      // Create specialist profile
      const { data: profile, error: profileError } = await supabase
        .from('specialist_profiles')
        .insert([{
          user_id: user!.id,
          person_type: personType,
          phone: personalData.phone,
          email: personalData.email,
          rfc: personalData.rfc,
          razon_social: personType === 'moral' ? personalData.razonSocial : null,
          birth_or_constitution_date: personalData.birthOrConstitutionDate,
          city: personalData.city,
          state: personalData.state,
          postal_code: personalData.postalCode,
          street: personalData.street,
          street_number: personalData.streetNumber,
          neighborhood: personalData.neighborhood,
          profile_photo_url: profilePhotoUrl,
          professional_description: professionalDescription,
          licenses_certifications: licensesCertifications || null,
          id_document_url: idDocumentUrl,
          csf_document_url: csfDocumentUrl,
          address_proof_url: addressProofUrl,
          accepted_terms_at: new Date().toISOString(),
          status: 'pending'
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
            role_label: specialty.roleLabel,
            experience_years: parseInt(specialty.experienceYears)
          }])
          .select()
          .single();

        if (specialtyError) throw specialtyError;

        // Insert activities
        const activitiesData = specialty.activities.map(activity => ({
          specialty_id: specialtyData.id,
          activity: activity.activity,
          price_min: activity.priceMin ? parseFloat(activity.priceMin) : null,
          price_max: activity.priceMax ? parseFloat(activity.priceMax) : null
        }));

        const { error: activitiesError } = await supabase
          .from('specialist_activities')
          .insert(activitiesData);

        if (activitiesError) throw activitiesError;
      }

      // Create work zone (only Yucatán)
      const { error: workZoneError } = await supabase
        .from('specialist_work_zones')
        .insert([{
          specialist_id: profile.id,
          state: 'Yucatán',
          cities: selectedMunicipalities
        }]);

      if (workZoneError) throw workZoneError;

      // Success!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "¡Registro exitoso!",
        description: "Hemos recibido tu registro, revisaremos tu información."
      });

      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  const uniqueSpecialties = [...new Set(services.map(s => s.especialista))];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-6">
          <Logo className="mb-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-lg mb-6">
          <h1 className="text-2xl font-bold mb-2">Registro de Especialista</h1>
          <p className="text-muted-foreground mb-6">
            Completa la información en {step === 1 ? 'Datos Personales' : step === 2 ? 'Datos Profesionales' : 'Documentación'}
          </p>

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Personal Data */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Sección 1 - Datos Personales</h2>

              {/* Person Type */}
              <div className="space-y-2">
                <Label>Tipo de Persona *</Label>
                <RadioGroup value={personType} onValueChange={(v) => setPersonType(v as 'fisica' | 'moral')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fisica" id="fisica" />
                    <Label htmlFor="fisica" className="font-normal cursor-pointer">
                      Persona Física
                      <span className="block text-xs text-muted-foreground">
                        Persona que trabaja como profesional independiente
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moral" id="moral" />
                    <Label htmlFor="moral" className="font-normal cursor-pointer">
                      Persona Moral
                      <span className="block text-xs text-muted-foreground">
                        Empresa o razón social registrada que ofrece servicios
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Conditional fields based on person type */}
              {personType === 'fisica' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre(s) *</Label>
                      <Input
                        id="firstName"
                        value={personalData.firstName}
                        onChange={(e) => setPersonalData({ ...personalData, firstName: e.target.value })}
                        placeholder="Nombre(s)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos *</Label>
                      <Input
                        id="lastName"
                        value={personalData.lastName}
                        onChange={(e) => setPersonalData({ ...personalData, lastName: e.target.value })}
                        placeholder="Apellidos"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={personalData.birthOrConstitutionDate}
                      onChange={(e) => setPersonalData({ ...personalData, birthOrConstitutionDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Género *</Label>
                    <Select value={personalData.gender} onValueChange={(v) => setPersonalData({ ...personalData, gender: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hombre">Hombre</SelectItem>
                        <SelectItem value="mujer">Mujer</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                        <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="razonSocial">Razón Social *</Label>
                    <Input
                      id="razonSocial"
                      value={personalData.razonSocial}
                      onChange={(e) => setPersonalData({ ...personalData, razonSocial: e.target.value })}
                      placeholder="Razón Social de la empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="constitutionDate">Fecha de Constitución *</Label>
                    <Input
                      id="constitutionDate"
                      type="date"
                      value={personalData.birthOrConstitutionDate}
                      onChange={(e) => setPersonalData({ ...personalData, birthOrConstitutionDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Género (Opcional)</Label>
                    <Select value={personalData.gender} onValueChange={(v) => setPersonalData({ ...personalData, gender: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona género (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hombre">Hombre</SelectItem>
                        <SelectItem value="mujer">Mujer</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                        <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono Móvil *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                    placeholder="10 dígitos"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalData.email}
                    onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc">RFC *</Label>
                <Input
                  id="rfc"
                  value={personalData.rfc}
                  onChange={(e) => setPersonalData({ ...personalData, rfc: e.target.value.toUpperCase() })}
                  placeholder="RFC"
                  maxLength={13}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={personalData.city}
                    onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                    placeholder="Ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select value={personalData.state} onValueChange={(v) => setPersonalData({ ...personalData, state: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEXICAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Código Postal *</Label>
                  <Input
                    id="postalCode"
                    value={personalData.postalCode}
                    onChange={(e) => setPersonalData({ ...personalData, postalCode: e.target.value })}
                    placeholder="CP"
                    maxLength={5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Calle *</Label>
                <Input
                  id="street"
                  value={personalData.street}
                  onChange={(e) => setPersonalData({ ...personalData, street: e.target.value })}
                  placeholder="Calle"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="streetNumber">Número *</Label>
                  <Input
                    id="streetNumber"
                    value={personalData.streetNumber}
                    onChange={(e) => setPersonalData({ ...personalData, streetNumber: e.target.value })}
                    placeholder="Número"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Colonia *</Label>
                  <Input
                    id="neighborhood"
                    value={personalData.neighborhood}
                    onChange={(e) => setPersonalData({ ...personalData, neighborhood: e.target.value })}
                    placeholder="Colonia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profilePhoto">Foto de Perfil Profesional *</Label>
                <Input
                  id="profilePhoto"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('profilePhoto', e.target.files[0])}
                />
                {personalData.profilePhoto && (
                  <p className="text-sm text-muted-foreground">✓ {personalData.profilePhoto.name}</p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={personalData.acceptedTerms}
                  onCheckedChange={(checked) => setPersonalData({ ...personalData, acceptedTerms: checked as boolean })}
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  He leído y acepto los{' '}
                  <a href="#" className="text-primary underline">Términos</a>,{' '}
                  <a href="#" className="text-primary underline">Aviso de Privacidad</a> y{' '}
                  <a href="#" className="text-primary underline">Condiciones para Proveedores</a> *
                </Label>
              </div>
            </div>
          )}

          {/* Step 2: Professional Data */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Sección 2 - Datos Profesionales</h2>

              {/* Specialties */}
              <div className="space-y-4">
                <Label>Especialista en: * (Selecciona al menos una especialidad)</Label>
                {specialties.map((specialty, index) => (
                  <div key={specialty.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Especialidad {index + 1}</h3>
                      {specialties.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecialty(specialty.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Selecciona especialidad *</Label>
                      <Select
                        value={specialty.specialty}
                        onValueChange={(v) => {
                          updateSpecialty(specialty.id, 'specialty', v);
                          updateSpecialty(specialty.id, 'roleLabel', v);
                          updateSpecialty(specialty.id, 'activities', []);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una especialidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueSpecialties.map(spec => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Años de experiencia *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={specialty.experienceYears}
                        onChange={(e) => updateSpecialty(specialty.id, 'experienceYears', e.target.value)}
                        placeholder="Años de experiencia"
                      />
                    </div>

                    {specialty.specialty && (
                      <div className="space-y-2">
                        <Label>Servicios que ofreces * (Mínimo 3)</Label>
                        <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
                          {getActivitiesForSpecialty(specialty.specialty).map(activity => {
                            const isSelected = specialty.activities.find(a => a.activity === activity);
                            return (
                              <div key={activity} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={!!isSelected}
                                    onCheckedChange={() => toggleActivity(specialty.id, activity)}
                                  />
                                  <Label className="font-normal cursor-pointer">{activity}</Label>
                                </div>
                                {isSelected && (
                                  <div className="ml-6 grid grid-cols-2 gap-2">
                                    <Input
                                      type="number"
                                      placeholder="Precio mín (opcional)"
                                      value={isSelected.priceMin || ''}
                                      onChange={(e) => updateActivityPrice(specialty.id, activity, 'priceMin', e.target.value)}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Precio máx (opcional)"
                                      value={isSelected.priceMax || ''}
                                      onChange={(e) => updateActivityPrice(specialty.id, activity, 'priceMax', e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Servicios seleccionados: {specialty.activities.length} 
                          {specialty.activities.length < 3 && ' (Mínimo 3 requeridos)'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSpecialty}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar otra especialidad
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Profesional * (Máximo 200 caracteres)</Label>
                <Textarea
                  id="description"
                  value={professionalDescription}
                  onChange={(e) => setProfessionalDescription(e.target.value)}
                  placeholder="Describe brevemente tu experiencia y tipo de trabajos que realizas"
                  maxLength={200}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground text-right">
                  {professionalDescription.length}/200
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenses">Licencias / Certificaciones (Opcional)</Label>
                <Textarea
                  id="licenses"
                  value={licensesCertifications}
                  onChange={(e) => setLicensesCertifications(e.target.value)}
                  placeholder="Licencias, certificaciones o permisos relevantes (opcional)"
                  rows={3}
                />
              </div>

              {/* Coverage Zone */}
              <div className="space-y-2">
                <Label>Zona de Cobertura *</Label>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value="Yucatán" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Yucatán" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yucatán">Yucatán</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Actualmente solo disponible para Yucatán
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Municipios de Yucatán * (Selecciona al menos uno)</Label>
                    <div className="border rounded p-3 max-h-64 overflow-y-auto space-y-2">
                      {YUCATAN_MUNICIPALITIES.map(municipality => (
                        <div key={municipality} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedMunicipalities.includes(municipality)}
                            onCheckedChange={() => toggleMunicipality(municipality)}
                          />
                          <Label className="font-normal cursor-pointer">{municipality}</Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Municipios seleccionados: {selectedMunicipalities.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documentation */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Sección 3 - Documentación para Validación</h2>
              <p className="text-muted-foreground mb-4">
                Todos los documentos son obligatorios y serán utilizados para validar tu registro.
              </p>

              <div className="space-y-2">
                <Label htmlFor="idDocument">Identificación Oficial * (INE/IFE/Pasaporte)</Label>
                <Input
                  id="idDocument"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                />
                {documents.idDocument && (
                  <p className="text-sm text-muted-foreground">✓ {documents.idDocument.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="csfDocument">Constancia de Situación Fiscal (CSF) *</Label>
                <Input
                  id="csfDocument"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('csfDocument', e.target.files[0])}
                />
                {documents.csfDocument && (
                  <p className="text-sm text-muted-foreground">✓ {documents.csfDocument.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressProof">Comprobante de Domicilio *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Recibo de luz, agua, teléfono o estado de cuenta (no mayor a 3 meses)
                </p>
                <Input
                  id="addressProof"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('addressProof', e.target.files[0])}
                />
                {documents.addressProof && (
                  <p className="text-sm text-muted-foreground">✓ {documents.addressProof.name}</p>
                )}
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Resumen de tu registro</h3>
                <div className="space-y-1 text-sm">
                  <p>• Tipo: {personType === 'fisica' ? 'Persona Física' : 'Persona Moral'}</p>
                  <p>• Especialidades: {specialties.length}</p>
                  <p>• Servicios totales: {specialties.reduce((acc, s) => acc + s.activities.length, 0)}</p>
                  <p>• Municipios de cobertura: {selectedMunicipalities.length}</p>
                  <p>• Documentos adjuntos: {Object.values(documents).filter(d => d !== null).length}/3</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Anterior
              </Button>
            )}
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && !validateStep1()) {
                    toast({
                      title: "Campos incompletos",
                      description: "Por favor completa todos los campos obligatorios",
                      variant: "destructive"
                    });
                    return;
                  }
                  if (step === 2 && !validateStep2()) {
                    toast({
                      title: "Campos incompletos",
                      description: "Asegúrate de completar todas las especialidades con mínimo 3 servicios y seleccionar al menos un municipio",
                      variant: "destructive"
                    });
                    return;
                  }
                  setStep(step + 1);
                }}
                className="ml-auto"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !validateStep3()}
                className="ml-auto"
              >
                {loading ? 'Enviando...' : 'Completar Registro'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
