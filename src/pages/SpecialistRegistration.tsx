import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, ChevronDown } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import confetti from 'canvas-confetti';

interface Specialty {
  id: string;
  specialty: string;
  customSpecialty?: string;
  roleLabel: string;
  experienceYears: string;
  services: Service[];
}

interface Service {
  id: string;
  name: string;
  priceMin: string;
  priceMax: string;
}

interface License {
  id: string;
  name: string;
  file: File | null;
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
  const [availableSpecialties, setAvailableSpecialties] = useState<[string, string[]][]>([]);
  
  const [personType, setPersonType] = useState<'fisica' | 'moral'>('fisica');
  const [personalData, setPersonalData] = useState({
    nombreCompleto: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
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

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [showOtherSpecialty, setShowOtherSpecialty] = useState(false);
  const [otherSpecialtyText, setOtherSpecialtyText] = useState('');
  const [specialtiesData, setSpecialtiesData] = useState<Specialty[]>([]);
  const [openSpecialties, setOpenSpecialties] = useState<Record<string, boolean>>({});
  const [professionalDescription, setProfessionalDescription] = useState('');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);

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
      
      // Group specialties by category
      const categoriesMap = new Map<string, string[]>();
      data?.forEach(s => {
        if (!categoriesMap.has(s.categoria)) {
          categoriesMap.set(s.categoria, []);
        }
        const specialties = categoriesMap.get(s.categoria)!;
        if (!specialties.includes(s.especialista)) {
          specialties.push(s.especialista);
        }
      });
      
      setAvailableSpecialties(Array.from(categoriesMap.entries()));
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

  const toggleSpecialtySelection = (specialty: string) => {
    if (specialty === 'Otro') {
      setShowOtherSpecialty(!showOtherSpecialty);
      if (!showOtherSpecialty) {
        setOtherSpecialtyText('');
      }
      return;
    }

    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
      setSpecialtiesData(specialtiesData.filter(s => s.specialty !== specialty));
    } else {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
      setSpecialtiesData([...specialtiesData, {
        id: Date.now().toString(),
        specialty,
        roleLabel: '',
        experienceYears: '',
        services: []
      }]);
    }
  };

  const handleOtherSpecialtyAdd = () => {
    if (otherSpecialtyText.trim()) {
      setSelectedSpecialties([...selectedSpecialties, otherSpecialtyText]);
      setSpecialtiesData([...specialtiesData, {
        id: Date.now().toString(),
        specialty: 'Otro',
        customSpecialty: otherSpecialtyText,
        roleLabel: '',
        experienceYears: '',
        services: []
      }]);
    }
  };

  const updateSpecialtyData = (specialty: string, field: keyof Specialty, value: any) => {
    setSpecialtiesData(specialtiesData.map(s => 
      s.specialty === specialty || s.customSpecialty === specialty
        ? { ...s, [field]: value }
        : s
    ));
  };

  const addServiceToSpecialty = (specialtyId: string) => {
    setSpecialtiesData(specialtiesData.map(s => 
      s.id === specialtyId
        ? { ...s, services: [...s.services, { id: Date.now().toString(), name: '', priceMin: '', priceMax: '' }] }
        : s
    ));
  };

  const removeServiceFromSpecialty = (specialtyId: string, serviceId: string) => {
    setSpecialtiesData(specialtiesData.map(s => 
      s.id === specialtyId
        ? { ...s, services: s.services.filter(srv => srv.id !== serviceId) }
        : s
    ));
  };

  const updateService = (specialtyId: string, serviceId: string, field: keyof Service, value: string) => {
    setSpecialtiesData(specialtiesData.map(s => 
      s.id === specialtyId
        ? { 
            ...s, 
            services: s.services.map(srv => 
              srv.id === serviceId ? { ...srv, [field]: value } : srv
            ) 
          }
        : s
    ));
  };

  const toggleMunicipality = (municipality: string) => {
    if (selectedMunicipalities.includes(municipality)) {
      setSelectedMunicipalities(selectedMunicipalities.filter(m => m !== municipality));
    } else {
      setSelectedMunicipalities([...selectedMunicipalities, municipality]);
    }
  };

  const addLicense = () => {
    setLicenses([...licenses, { id: Date.now().toString(), name: '', file: null }]);
  };

  const removeLicense = (id: string) => {
    setLicenses(licenses.filter(l => l.id !== id));
  };

  const updateLicense = (id: string, field: 'name' | 'file', value: string | File) => {
    setLicenses(licenses.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const validateStep1 = () => {
    if (!personalData.acceptedTerms) return false;
    if (!personalData.profilePhoto) return false;
    
    const commonFields = [
      'birthOrConstitutionDate', 'phone', 'email', 'rfc', 
      'city', 'state', 'postalCode', 'street', 'streetNumber', 'neighborhood'
    ];
    
    for (const field of commonFields) {
      if (!personalData[field as keyof typeof personalData]) return false;
    }

    if (personType === 'fisica') {
      if (!personalData.nombreCompleto || !personalData.apellidoPaterno || !personalData.apellidoMaterno) return false;
      if (!personalData.gender) return false;
    } else {
      if (!personalData.razonSocial) return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (selectedSpecialties.length === 0) return false;
    if (showOtherSpecialty && !otherSpecialtyText.trim()) return false;
    
    for (const specData of specialtiesData) {
      if (!specData.experienceYears || parseInt(specData.experienceYears) < 0) return false;
      if (specData.services.length === 0) return false;
      
      // Validate that all services have names
      for (const service of specData.services) {
        if (!service.name || service.name.trim().length === 0) return false;
        // If prices are provided, validate min <= max
        if (service.priceMin && service.priceMax) {
          const min = parseFloat(service.priceMin);
          const max = parseFloat(service.priceMax);
          if (min > max) return false;
        }
      }
    }

    return professionalDescription.trim().length > 0 && 
           selectedMunicipalities.length > 0;
  };

  const validateStep3 = () => {
    return documents.idDocument && documents.csfDocument && documents.addressProof;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (step === 2 && !validateStep2()) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos obligatorios de datos profesionales",
        variant: "destructive"
      });
      return;
    }

    setStep(step + 1);
  };

  const uploadDocument = async (file: File, type: string): Promise<string> => {
    const fileName = `${user!.id}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('specialist-documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('specialist-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      toast({
        title: "Documentos incompletos",
        description: "Por favor adjunta todos los documentos requeridos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const [profilePhotoUrl, idDocumentUrl, csfDocumentUrl, addressProofUrl] = await Promise.all([
        uploadDocument(personalData.profilePhoto!, 'profile'),
        uploadDocument(documents.idDocument!, 'id'),
        uploadDocument(documents.csfDocument!, 'csf'),
        uploadDocument(documents.addressProof!, 'address')
      ]);

      const licenseUrls: Array<{name: string, url: string}> = [];
      for (const license of licenses) {
        if (license.file && license.name) {
          const url = await uploadDocument(license.file, 'license');
          licenseUrls.push({ name: license.name, url });
        }
      }

      if (personType === 'fisica') {
        await supabase
          .from('profiles')
          .update({ gender: personalData.gender })
          .eq('id', user!.id);
      }

      const { data: profile, error: profileError } = await supabase
        .from('specialist_profiles')
        .insert([{
          user_id: user!.id,
          person_type: personType,
          razon_social: personType === 'moral' ? personalData.razonSocial : null,
          birth_or_constitution_date: personalData.birthOrConstitutionDate,
          phone: personalData.phone,
          email: personalData.email,
          rfc: personalData.rfc,
          city: personalData.city,
          state: personalData.state,
          postal_code: personalData.postalCode,
          street: personalData.street,
          street_number: personalData.streetNumber,
          neighborhood: personalData.neighborhood,
          profile_photo_url: profilePhotoUrl,
          id_document_url: idDocumentUrl,
          csf_document_url: csfDocumentUrl,
          address_proof_url: addressProofUrl,
          professional_description: professionalDescription,
          status: 'pending',
          accepted_terms_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      for (const specData of specialtiesData) {
        const specialtyName = specData.customSpecialty || specData.specialty;
        const { data: specialtyDataInserted, error: specialtyError } = await supabase
          .from('specialist_specialties')
          .insert([{
            specialist_id: profile.id,
            specialty: specialtyName,
            role_label: specData.roleLabel,
            experience_years: parseInt(specData.experienceYears)
          }])
          .select()
          .single();

        if (specialtyError) throw specialtyError;

        // Insert services/activities for this specialty
        if (specData.services.length > 0) {
          const activitiesData = specData.services.map(service => ({
            specialty_id: specialtyDataInserted.id,
            activity: service.name,
            price_min: service.priceMin ? parseFloat(service.priceMin) : null,
            price_max: service.priceMax ? parseFloat(service.priceMax) : null
          }));

          const { error: activitiesError } = await supabase
            .from('specialist_activities')
            .insert(activitiesData);

          if (activitiesError) throw activitiesError;
        }
      }

      for (const licenseData of licenseUrls) {
        await supabase
          .from('specialist_credentials')
          .insert([{
            specialist_id: profile.id,
            title: licenseData.name,
            type: 'licencia',
            issuer: 'N/A',
            attachment_url: licenseData.url
          }]);
      }

      await supabase
        .from('specialist_work_zones')
        .insert([{
          specialist_id: profile.id,
          state: 'Yucatán',
          cities: selectedMunicipalities
        }]);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "¡Registro exitoso!",
        description: "Tu solicitud está en revisión. Te notificaremos cuando sea aprobada.",
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting registration:', error);
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="w-full px-4 py-6 border-b border-border/30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="text-foreground hover:text-rappi-green transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Logo />
          <div className="w-9" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Paso {step} de 5
              </span>
              <span className="text-xs text-muted-foreground">
                {step === 1 && 'Datos personales'}
                {step === 2 && 'Especialidades'}
                {step === 3 && 'Zonas de trabajo'}
                {step === 4 && 'Documentación'}
                {step === 5 && 'Descripción profesional'}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-rappi-green h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Datos Personales</h2>
                <p className="text-sm text-muted-foreground">Completa tu información básica</p>
              </div>

            <div className="space-y-2">
              <Label>Tipo de Persona *</Label>
              <RadioGroup value={personType} onValueChange={(v) => setPersonType(v as 'fisica' | 'moral')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fisica" id="fisica" />
                  <Label htmlFor="fisica" className="font-normal cursor-pointer">
                    Persona Física
                    <span className="block text-sm text-muted-foreground">
                      Persona que trabaja a título personal, como profesional independiente.
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moral" id="moral" />
                  <Label htmlFor="moral" className="font-normal cursor-pointer">
                    Persona Moral
                    <span className="block text-sm text-muted-foreground">
                      Empresa o razón social registrada que ofrece servicios.
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {personType === 'fisica' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombreCompleto">Nombre Completo *</Label>
                  <Input
                    id="nombreCompleto"
                    value={personalData.nombreCompleto}
                    onChange={(e) => setPersonalData({ ...personalData, nombreCompleto: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apellidoPaterno">Apellido Paterno *</Label>
                    <Input
                      id="apellidoPaterno"
                      value={personalData.apellidoPaterno}
                      onChange={(e) => setPersonalData({ ...personalData, apellidoPaterno: e.target.value })}
                      placeholder="Apellido paterno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidoMaterno">Apellido Materno *</Label>
                    <Input
                      id="apellidoMaterno"
                      value={personalData.apellidoMaterno}
                      onChange={(e) => setPersonalData({ ...personalData, apellidoMaterno: e.target.value })}
                      placeholder="Apellido materno"
                    />
                  </div>
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
              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón Social *</Label>
                <Input
                  id="razonSocial"
                  value={personalData.razonSocial}
                  onChange={(e) => setPersonalData({ ...personalData, razonSocial: e.target.value })}
                  placeholder="Razón social de la empresa"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="birthDate">
                {personType === 'fisica' ? 'Fecha de Nacimiento *' : 'Fecha de Constitución *'}
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={personalData.birthOrConstitutionDate}
                onChange={(e) => setPersonalData({ ...personalData, birthOrConstitutionDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono Móvil *</Label>
                <Input
                  id="phone"
                  value={personalData.phone}
                  onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                  placeholder="10 dígitos"
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
                onChange={(e) => setPersonalData({ ...personalData, rfc: e.target.value })}
                placeholder="RFC con homoclave"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEXICAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Código Postal *</Label>
              <Input
                id="postalCode"
                value={personalData.postalCode}
                onChange={(e) => setPersonalData({ ...personalData, postalCode: e.target.value })}
                placeholder="Código postal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Calle *</Label>
                <Input
                  id="street"
                  value={personalData.street}
                  onChange={(e) => setPersonalData({ ...personalData, street: e.target.value })}
                  placeholder="Calle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="streetNumber">Número *</Label>
                <Input
                  id="streetNumber"
                  value={personalData.streetNumber}
                  onChange={(e) => setPersonalData({ ...personalData, streetNumber: e.target.value })}
                  placeholder="Número"
                />
              </div>
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

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Esta debe ser la dirección de residencia donde vives actualmente.
              </p>
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
                Acepto los Términos y Condiciones, Aviso de Privacidad y Condiciones para Proveedores *
              </Label>
            </div>

            <Button 
              onClick={handleNext} 
              className="w-full h-12 bg-rappi-green hover:bg-rappi-green/90 text-white font-semibold rounded-full mt-4" 
              disabled={!validateStep1()}
            >
              Siguiente
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Especialidades y Servicios</h2>
              <p className="text-muted-foreground">Selecciona tus áreas de especialización y los servicios que ofreces</p>
            </div>

            {/* Selección de especialidades */}
            <div className="bg-white rounded-xl border-2 border-border p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Especialista en: *</Label>
                <p className="text-sm text-muted-foreground">Puedes seleccionar múltiples especialidades</p>
              </div>

              <div className="space-y-6">
                {availableSpecialties.map(([category, specialties]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-bold text-base text-rappi-green uppercase tracking-wide">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {specialties.map((specialty) => (
                        <div 
                          key={specialty} 
                          className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg hover:border-rappi-green hover:bg-rappi-green/5 transition-all cursor-pointer"
                          onClick={() => toggleSpecialtySelection(specialty)}
                        >
                          <Checkbox
                            id={`specialty-${specialty}`}
                            checked={selectedSpecialties.includes(specialty)}
                            onCheckedChange={() => toggleSpecialtySelection(specialty)}
                          />
                          <Label htmlFor={`specialty-${specialty}`} className="flex-1 cursor-pointer font-medium">
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Otra especialidad */}
                <div className="pt-4 border-t-2 border-border">
                  <div 
                    className="flex items-center space-x-3 p-4 border-2 border-border rounded-lg hover:border-rappi-green hover:bg-rappi-green/5 transition-all cursor-pointer"
                    onClick={() => toggleSpecialtySelection('Otro')}
                  >
                    <Checkbox
                      id="specialty-otro"
                      checked={showOtherSpecialty}
                      onCheckedChange={() => toggleSpecialtySelection('Otro')}
                    />
                    <Label htmlFor="specialty-otro" className="flex-1 cursor-pointer font-medium">
                      Otra especialidad
                    </Label>
                  </div>
                  {showOtherSpecialty && (
                    <div className="mt-3 ml-12 flex gap-2">
                      <Input
                        placeholder="Escribe tu especialidad"
                        value={otherSpecialtyText}
                        onChange={(e) => setOtherSpecialtyText(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleOtherSpecialtyAdd} className="bg-rappi-green hover:bg-rappi-green/90 text-white">
                        Agregar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detalles de especialidades seleccionadas */}
            {specialtiesData.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">Detalles de tus especialidades</h3>
                {specialtiesData.map((specData) => {
                  const displayName = specData.customSpecialty || specData.specialty;
                  const isOpen = openSpecialties[specData.id] ?? true;
                  
                  return (
                    <Collapsible
                      key={specData.id}
                      open={isOpen}
                      onOpenChange={(open) => setOpenSpecialties(prev => ({ ...prev, [specData.id]: open }))}
                      className="bg-white rounded-xl border-2 border-border overflow-hidden"
                    >
                      {/* Header colapsable de la especialidad */}
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-6 hover:bg-muted/30 transition-colors text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rappi-green/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-rappi-green font-bold text-lg">✓</span>
                            </div>
                            <h4 className="text-xl font-bold text-foreground flex-1">{displayName}</h4>
                            <ChevronDown 
                              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                        <div className="p-6 pt-0 space-y-6 border-t-2 border-border">
                          {/* Años de experiencia */}
                          <div className="space-y-2">
                            <Label className="text-base font-semibold">Años de experiencia *</Label>
                            <Input
                              type="number"
                              min="0"
                              value={specData.experienceYears}
                              onChange={(e) => updateSpecialtyData(displayName, 'experienceYears', e.target.value)}
                              placeholder="Ejemplo: 5"
                              className="max-w-xs"
                            />
                          </div>

                          {/* Servicios */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <Label className="text-base font-semibold">Servicios que ofreces *</Label>
                                <p className="text-sm text-muted-foreground">Agrega los servicios específicos de esta especialidad</p>
                              </div>
                              <Button 
                                onClick={() => addServiceToSpecialty(specData.id)} 
                                className="bg-rappi-green hover:bg-rappi-green/90 text-white"
                                size="sm"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar
                              </Button>
                            </div>
                            
                            {specData.services.length === 0 && (
                              <div className="p-4 bg-muted/50 border-2 border-dashed border-border rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">
                                  No hay servicios agregados. Agrega al menos un servicio para continuar.
                                </p>
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              {specData.services.map((service, idx) => (
                                <div key={service.id} className="bg-muted/30 rounded-lg border-2 border-border p-5 space-y-4">
                                  {/* Nombre del servicio */}
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <Label className="text-sm font-semibold">Nombre del servicio *</Label>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeServiceFromSpecialty(specData.id, service.id)}
                                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <Input
                                      value={service.name}
                                      onChange={(e) => updateService(specData.id, service.id, 'name', e.target.value)}
                                      placeholder="Ejemplo: Instalación de minisplit"
                                    />
                                  </div>
                                  
                                  {/* Precios */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Rango de precios (opcional)</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Precio Mínimo</Label>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={service.priceMin}
                                            onChange={(e) => updateService(specData.id, service.id, 'priceMin', e.target.value)}
                                            placeholder="0.00"
                                            className="pl-7"
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Precio Máximo</Label>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={service.priceMax}
                                            onChange={(e) => updateService(specData.id, service.id, 'priceMax', e.target.value)}
                                            placeholder="0.00"
                                            className="pl-7"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {service.priceMin && service.priceMax && parseFloat(service.priceMin) > parseFloat(service.priceMax) && (
                                      <p className="text-sm text-destructive">
                                        El precio mínimo no puede ser mayor al precio máximo
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {specData.services.length} servicio(s) agregado(s)
                            </p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}

            {/* Descripción profesional */}
            <div className="bg-white rounded-xl border-2 border-border p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="professionalDescription" className="text-base font-semibold">Descripción Profesional *</Label>
                <p className="text-sm text-muted-foreground">Describe brevemente tu experiencia (máx 200 caracteres)</p>
              </div>
              <Textarea
                id="professionalDescription"
                value={professionalDescription}
                onChange={(e) => setProfessionalDescription(e.target.value)}
                placeholder="Describe brevemente tu experiencia profesional..."
                maxLength={200}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground text-right">{professionalDescription.length}/200</p>
            </div>

            {/* Licencias y certificaciones */}
            <div className="bg-white rounded-xl border-2 border-border p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Licencias / Certificaciones</Label>
                <p className="text-sm text-muted-foreground">Agrega tus licencias o certificaciones (opcional)</p>
              </div>

              {licenses.length > 0 && (
                <div className="space-y-3">
                  {licenses.map((license) => (
                    <div key={license.id} className="p-4 border-2 border-border rounded-lg space-y-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Licencia/Certificación</Label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeLicense(license.id)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Nombre de la licencia o certificación"
                        value={license.name}
                        onChange={(e) => updateLicense(license.id, 'name', e.target.value)}
                      />
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files?.[0] && updateLicense(license.id, 'file', e.target.files[0])}
                      />
                      {license.file && (
                        <p className="text-sm text-rappi-green flex items-center gap-2">
                          <span>✓</span> {license.file.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={addLicense} 
                variant="outline" 
                className="w-full border-2 hover:border-rappi-green hover:text-rappi-green"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Licencia/Certificación
              </Button>
            </div>

            {/* Zona de cobertura */}
            <div className="bg-white rounded-xl border-2 border-border p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Zona de Cobertura *</Label>
                <p className="text-sm text-muted-foreground">Selecciona los municipios donde ofreces tus servicios</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Estado:</span>
                  <span className="text-rappi-green">Yucatán</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Municipios:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-3 bg-muted/20 border-2 border-border rounded-lg">
                    {YUCATAN_MUNICIPALITIES.map((municipality) => (
                      <div key={municipality} className="flex items-center space-x-2">
                        <Checkbox
                          id={`muni-${municipality}`}
                          checked={selectedMunicipalities.includes(municipality)}
                          onCheckedChange={() => toggleMunicipality(municipality)}
                        />
                        <Label htmlFor={`muni-${municipality}`} className="text-sm cursor-pointer font-normal">
                          {municipality}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedMunicipalities.length} municipio(s) seleccionado(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => setStep(step - 1)} 
                variant="outline" 
                className="w-full h-12 border-2 hover:border-rappi-green hover:text-rappi-green rounded-full font-semibold"
              >
                Atrás
              </Button>
              <Button 
                onClick={handleNext} 
                className="w-full h-12 bg-rappi-green hover:bg-rappi-green/90 text-white font-semibold rounded-full" 
                disabled={!validateStep2()}
              >
                Siguiente
              </Button>
            </div>
          </div>
         )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Documentación y Validación</h2>
              <p className="text-sm text-muted-foreground">Adjunta los documentos necesarios</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idDocument">Identificación Oficial (INE/IFE/Pasaporte) *</Label>
              <Input
                id="idDocument"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
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
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('csfDocument', e.target.files[0])}
              />
              {documents.csfDocument && (
                <p className="text-sm text-muted-foreground">✓ {documents.csfDocument.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressProof">Comprobante de Domicilio *</Label>
              <Input
                id="addressProof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('addressProof', e.target.files[0])}
              />
              {documents.addressProof && (
                <p className="text-sm text-muted-foreground">✓ {documents.addressProof.name}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => setStep(step - 1)} 
                variant="outline" 
                className="w-full h-12 border-2 hover:border-rappi-green hover:text-rappi-green rounded-full"
              >
                Atrás
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="w-full h-12 bg-rappi-green hover:bg-rappi-green/90 text-white font-semibold rounded-full" 
                disabled={!validateStep3() || loading}
              >
                {loading ? 'Enviando...' : 'Completar Registro'}
              </Button>
            </div>
           </div>
         )}
        </div>
      </div>
    </div>
  );
}
