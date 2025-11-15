import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
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
  customSpecialty?: string;
  roleLabel: string;
  experienceYears: string;
  servicesOffered: string;
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
        servicesOffered: ''
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
        servicesOffered: ''
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
      if (!specData.servicesOffered || specData.servicesOffered.trim().length === 0) return false;
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo />
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className={step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>
              Datos Personales
            </span>
            <span className={step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>
              Datos Profesionales
            </span>
            <span className={step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>
              Documentación
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Datos Personales</h2>

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

            <Button onClick={handleNext} className="w-full" disabled={!validateStep1()}>
              Siguiente
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Datos Profesionales</h2>

            <div className="space-y-4">
              <Label>Especialista en: * (Selección múltiple)</Label>
              <div className="grid grid-cols-1 gap-4">
                {availableSpecialties.map(([category, specialties]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="font-semibold text-sm text-primary">{category}</h3>
                    <div className="grid grid-cols-1 gap-2 ml-4">
                      {specialties.map((specialty) => (
                        <div key={specialty} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent">
                          <Checkbox
                            id={`specialty-${specialty}`}
                            checked={selectedSpecialties.includes(specialty)}
                            onCheckedChange={() => toggleSpecialtySelection(specialty)}
                          />
                          <Label htmlFor={`specialty-${specialty}`} className="flex-1 cursor-pointer font-normal">
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center space-x-2 p-2 border rounded hover:bg-accent">
                  <Checkbox
                    id="specialty-otro"
                    checked={showOtherSpecialty}
                    onCheckedChange={() => toggleSpecialtySelection('Otro')}
                  />
                  <Label htmlFor="specialty-otro" className="flex-1 cursor-pointer font-normal">
                    Otro / Otra especialidad
                  </Label>
                </div>
                {showOtherSpecialty && (
                  <div className="ml-6 flex gap-2">
                    <Input
                      placeholder="Escribe tu especialidad"
                      value={otherSpecialtyText}
                      onChange={(e) => setOtherSpecialtyText(e.target.value)}
                    />
                    <Button onClick={handleOtherSpecialtyAdd} variant="outline" size="sm">
                      Agregar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {specialtiesData.map((specData) => {
              const displayName = specData.customSpecialty || specData.specialty;
              
              return (
                <div key={specData.id} className="p-4 border rounded-lg space-y-4 bg-card">
                  <h3 className="font-semibold text-lg">{displayName}</h3>

                  <div className="space-y-2">
                    <Label>Años de experiencia *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={specData.experienceYears}
                      onChange={(e) => updateSpecialtyData(displayName, 'experienceYears', e.target.value)}
                      placeholder="Ej: 5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Servicios que ofrece *</Label>
                    <Textarea
                      value={specData.servicesOffered}
                      onChange={(e) => updateSpecialtyData(displayName, 'servicesOffered', e.target.value)}
                      placeholder="Describe los servicios que ofreces para esta especialidad..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-sm text-muted-foreground">
                      Describe los servicios que ofreces para esta especialidad
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="space-y-2">
              <Label htmlFor="professionalDescription">Descripción Profesional * (máx 200 caracteres)</Label>
              <Textarea
                id="professionalDescription"
                value={professionalDescription}
                onChange={(e) => setProfessionalDescription(e.target.value)}
                placeholder="Describe brevemente tu experiencia profesional..."
                maxLength={200}
                rows={3}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">{professionalDescription.length}/200</p>
            </div>

            <div className="space-y-4">
              <Label>Licencias / Certificaciones (Opcional)</Label>
              {licenses.map((license) => (
                <div key={license.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Licencia/Certificación</Label>
                    <Button variant="ghost" size="sm" onClick={() => removeLicense(license.id)}>
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
                    <p className="text-sm text-muted-foreground">✓ {license.file.name}</p>
                  )}
                </div>
              ))}
              <Button onClick={addLicense} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Licencia/Certificación
              </Button>
            </div>

            <div className="space-y-4">
              <Label>Zona de Cobertura *</Label>
              <div className="space-y-2">
                <Label>Estado: Yucatán</Label>
                <Label className="text-sm text-muted-foreground">Municipios:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
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

            <div className="flex gap-4">
              <Button onClick={() => setStep(step - 1)} variant="outline" className="w-full">
                Atrás
              </Button>
              <Button onClick={handleNext} className="w-full" disabled={!validateStep2()}>
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Documentación para Validación</h2>

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
              <Button onClick={() => setStep(step - 1)} variant="outline" className="w-full">
                Atrás
              </Button>
              <Button onClick={handleSubmit} className="w-full" disabled={!validateStep3() || loading}>
                {loading ? 'Enviando...' : 'Completar Registro'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
