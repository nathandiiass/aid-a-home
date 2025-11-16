import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, FileText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  // Personal data
  person_type: string | null;
  first_name: string;
  last_name_paterno: string | null;
  last_name_materno: string | null;
  razon_social: string | null;
  date_of_birth: string | null;
  gender: string | null;
  rfc: string | null;
  phone: string | null;
  email: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  street: string | null;
  street_number: string | null;
  neighborhood: string | null;
  avatar_url: string | null;
  
  // Professional data
  professional_description: string | null;
  materials_policy: boolean | null;
  warranty_days: number | null;
  
  // Documents
  id_document_url: string | null;
  csf_document_url: string | null;
  address_proof_url: string | null;
}

interface Specialty {
  id: string;
  specialty: string;
  role_label: string;
  experience_years: number | null;
  activities: Array<{
    id: string;
    activity: string;
    price_min: number | null;
    price_max: number | null;
  }>;
}

interface WorkZone {
  id: string;
  state: string;
  cities: string[];
}

export default function SpecialistPersonalInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [workZones, setWorkZones] = useState<WorkZone[]>([]);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Get specialist profile
      const { data: specialist, error: specialistError } = await supabase
        .from('specialist_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (specialistError) throw specialistError;
      if (!specialist) {
        toast({
          title: "Error",
          description: "No se encontró el perfil de especialista",
          variant: "destructive"
        });
        navigate('/profile');
        return;
      }

      setSpecialistId(specialist.id);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Combine data
      setProfileData({
        person_type: specialist.person_type,
        first_name: profile.first_name,
        last_name_paterno: profile.last_name_paterno,
        last_name_materno: profile.last_name_materno,
        razon_social: specialist.razon_social,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        rfc: specialist.rfc,
        phone: specialist.phone,
        email: specialist.email,
        state: specialist.state,
        city: specialist.city,
        postal_code: specialist.postal_code,
        street: specialist.street,
        street_number: specialist.street_number,
        neighborhood: specialist.neighborhood,
        avatar_url: profile.avatar_url,
        professional_description: specialist.professional_description,
        materials_policy: specialist.materials_policy,
        warranty_days: specialist.warranty_days,
        id_document_url: specialist.id_document_url,
        csf_document_url: specialist.csf_document_url,
        address_proof_url: specialist.address_proof_url
      });

      // Get specialties with activities
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from('specialist_specialties')
        .select(`
          *,
          specialist_activities (*)
        `)
        .eq('specialist_id', specialist.id);

      if (specialtiesError) throw specialtiesError;

      const formattedSpecialties = specialtiesData?.map(s => ({
        id: s.id,
        specialty: s.specialty,
        role_label: s.role_label,
        experience_years: s.experience_years,
        activities: s.specialist_activities || []
      })) || [];

      setSpecialties(formattedSpecialties);

      // Get work zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('specialist_work_zones')
        .select('*')
        .eq('specialist_id', specialist.id);

      if (zonesError) throw zonesError;
      setWorkZones(zonesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe pesar menos de 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('specialist-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('specialist-documents')
        .getPublicUrl(filePath);

      setProfileData(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setHasChanges(true);

      toast({
        title: "Éxito",
        description: "Foto actualizada correctamente"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user || !profileData || !specialistId) return;

    try {
      setSaving(true);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: profileData.avatar_url
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update specialist profile
      const { error: specialistError } = await supabase
        .from('specialist_profiles')
        .update({
          phone: profileData.phone,
          email: profileData.email,
          state: profileData.state,
          city: profileData.city,
          postal_code: profileData.postal_code,
          street: profileData.street,
          street_number: profileData.street_number,
          neighborhood: profileData.neighborhood,
          professional_description: profileData.professional_description,
          materials_policy: profileData.materials_policy,
          warranty_days: profileData.warranty_days
        })
        .eq('id', specialistId);

      if (specialistError) throw specialistError;

      setHasChanges(false);
      toast({
        title: "Éxito",
        description: "Tus datos se actualizaron correctamente"
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Header with blur */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Información personal</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* BLOQUE 1: DATOS PERSONALES */}
        <div className="bg-background rounded-2xl border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Datos personales</h2>
          
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileData.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profileData.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-sm text-muted-foreground">Cambiar foto</span>
          </div>

          {/* Read-only fields */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Tipo de persona</Label>
              <p className="text-base font-medium">
                {profileData.person_type === 'fisica' ? 'Persona Física' : 'Persona Moral'}
              </p>
            </div>

            {profileData.person_type === 'fisica' ? (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre completo</Label>
                  <p className="text-base font-medium">{profileData.first_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Apellido paterno</Label>
                    <p className="text-base font-medium">{profileData.last_name_paterno || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Apellido materno</Label>
                    <p className="text-base font-medium">{profileData.last_name_materno || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha de nacimiento</Label>
                    <p className="text-base font-medium">{profileData.date_of_birth || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Género</Label>
                    <p className="text-base font-medium">{profileData.gender || '—'}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Razón social</Label>
                  <p className="text-base font-medium">{profileData.razon_social || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fecha de constitución</Label>
                  <p className="text-base font-medium">{profileData.date_of_birth || '—'}</p>
                </div>
              </>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">RFC</Label>
              <p className="text-base font-medium">{profileData.rfc}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <Label htmlFor="phone" className="text-xs text-muted-foreground">Teléfono móvil *</Label>
              <Input
                id="phone"
                value={profileData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1 rounded-xl"
                placeholder="Ingresa tu teléfono"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1 rounded-xl"
                placeholder="tu@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state" className="text-xs text-muted-foreground">Estado *</Label>
                <Input
                  id="state"
                  value={profileData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-xs text-muted-foreground">Ciudad *</Label>
                <Input
                  id="city"
                  value={profileData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="postal_code" className="text-xs text-muted-foreground">Código postal</Label>
              <Input
                id="postal_code"
                value={profileData.postal_code || ''}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                className="mt-1 rounded-xl"
                placeholder="97000"
              />
            </div>

            <div>
              <Label htmlFor="street" className="text-xs text-muted-foreground">Calle</Label>
              <Input
                id="street"
                value={profileData.street || ''}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street_number" className="text-xs text-muted-foreground">Número</Label>
                <Input
                  id="street_number"
                  value={profileData.street_number || ''}
                  onChange={(e) => handleInputChange('street_number', e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood" className="text-xs text-muted-foreground">Colonia</Label>
                <Input
                  id="neighborhood"
                  value={profileData.neighborhood || ''}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              Esta es la dirección donde vives actualmente.
            </p>
          </div>
        </div>

        {/* BLOQUE 2: DATOS PROFESIONALES */}
        <div className="bg-background rounded-2xl border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Datos profesionales</h2>

          <div>
            <Label htmlFor="professional_description" className="text-xs text-muted-foreground">
              Descripción profesional (máx. 200 caracteres)
            </Label>
            <Textarea
              id="professional_description"
              value={profileData.professional_description || ''}
              onChange={(e) => handleInputChange('professional_description', e.target.value.slice(0, 200))}
              className="mt-1 rounded-xl min-h-[80px]"
              placeholder="Cuéntanos sobre tu experiencia..."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {profileData.professional_description?.length || 0}/200
            </p>
          </div>

          {/* Specialties */}
          {specialties.map((specialty, idx) => (
            <div key={specialty.id} className="p-4 bg-muted/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{specialty.role_label}</h3>
                <Badge variant="secondary">{specialty.experience_years || 0} años</Badge>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Servicios ofrecidos</Label>
                {specialty.activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{activity.activity}</span>
                    {activity.price_min && (
                      <span className="text-muted-foreground ml-auto">
                        desde ${activity.price_min}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Work Zones */}
          <div>
            <Label className="text-xs text-muted-foreground">Zona de cobertura</Label>
            <div className="mt-2 space-y-2">
              {workZones.map((zone) => (
                <div key={zone.id}>
                  <p className="font-medium text-sm">{zone.state}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {zone.cities.map((city, idx) => (
                      <Badge key={idx} variant="outline">{city}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BLOQUE 3: DOCUMENTACIÓN */}
        <div className="bg-background rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Documentación para validación</h2>
          <p className="text-sm text-muted-foreground">
            La documentación no puede ser modificada una vez enviada.
          </p>

          <div className="space-y-3">
            {profileData.id_document_url && (
              <a
                href={profileData.id_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Identificación oficial</span>
                </div>
                <span className="text-xs text-muted-foreground">Ver documento</span>
              </a>
            )}

            {profileData.csf_document_url && (
              <a
                href={profileData.csf_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Constancia de Situación Fiscal</span>
                </div>
                <span className="text-xs text-muted-foreground">Ver documento</span>
              </a>
            )}

            {profileData.address_proof_url && (
              <a
                href={profileData.address_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Comprobante de domicilio</span>
                </div>
                <span className="text-xs text-muted-foreground">Ver documento</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-40">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full px-8 py-6 shadow-lg hover:shadow-xl transition-all bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </div>
  );
}
