import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, FileText, Save, ChevronRight } from 'lucide-react';
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

interface Activity {
  id: string;
  activity: string;
  price_min: number | null;
  price_max: number | null;
}

interface Specialty {
  id: string;
  specialty: string;
  role_label: string;
  experience_years: number | null;
  activities: Activity[];
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
  const [editingSpecialty, setEditingSpecialty] = useState<string | null>(null);

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

  const handleSpecialtyChange = (specialtyId: string, field: string, value: any) => {
    setSpecialties(prev => prev.map(s => 
      s.id === specialtyId ? { ...s, [field]: value } : s
    ));
    setHasChanges(true);
  };

  const handleActivityChange = (specialtyId: string, activityId: string, field: string, value: any) => {
    setSpecialties(prev => prev.map(s => 
      s.id === specialtyId 
        ? {
            ...s,
            activities: s.activities.map(a => 
              a.id === activityId ? { ...a, [field]: value } : a
            )
          }
        : s
    ));
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

      // Update specialties
      for (const specialty of specialties) {
        const { error: specError } = await supabase
          .from('specialist_specialties')
          .update({
            experience_years: specialty.experience_years
          })
          .eq('id', specialty.id);

        if (specError) throw specError;

        // Update activities
        for (const activity of specialty.activities) {
          const { error: actError } = await supabase
            .from('specialist_activities')
            .update({
              activity: activity.activity,
              price_min: activity.price_min,
              price_max: activity.price_max
            })
            .eq('id', activity.id);

          if (actError) throw actError;
        }
      }

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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with blur - Rappi style */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Información personal</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* BLOQUE 1: DATOS PERSONALES */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <h2 className="text-base font-bold text-gray-900">Datos personales</h2>
          
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-gray-100">
                <AvatarImage src={profileData.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-primary/80 text-white">
                  {profileData.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors shadow-md">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-gray-500">Cambiar foto</span>
          </div>

          {/* Read-only fields */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de persona</Label>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {profileData.person_type === 'fisica' ? 'Persona Física' : 'Persona Moral'}
              </p>
            </div>

            {profileData.person_type === 'fisica' ? (
              <>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre completo</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{profileData.first_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Apellido paterno</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{profileData.last_name_paterno || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Apellido materno</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{profileData.last_name_materno || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de nacimiento</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{profileData.date_of_birth || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Género</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{profileData.gender || '—'}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Razón social</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{profileData.razon_social || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de constitución</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{profileData.date_of_birth || '—'}</p>
                </div>
              </>
            )}

            <div>
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">RFC</Label>
              <p className="text-sm font-medium text-gray-900 mt-1">{profileData.rfc}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div>
              <Label htmlFor="phone" className="text-xs font-medium text-gray-700 mb-1.5 block">Teléfono móvil *</Label>
              <Input
                id="phone"
                value={profileData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="rounded-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                placeholder="Ingresa tu teléfono"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-medium text-gray-700 mb-1.5 block">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="rounded-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                placeholder="tu@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="state" className="text-xs font-medium text-gray-700 mb-1.5 block">Estado *</Label>
                <Input
                  id="state"
                  value={profileData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="rounded-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-xs font-medium text-gray-700 mb-1.5 block">Ciudad *</Label>
                <Input
                  id="city"
                  value={profileData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="rounded-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="postal_code" className="text-xs font-medium text-gray-700 mb-1.5 block">Código postal</Label>
              <Input
                id="postal_code"
                value={profileData.postal_code || ''}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                className="rounded-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                placeholder="97000"
              />
            </div>

            <div>
              <Label htmlFor="street" className="text-xs font-medium text-gray-700 mb-1.5 block">Calle</Label>
              <Input
                id="street"
                value={profileData.street || ''}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className="rounded-full border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="street_number" className="text-xs font-medium text-gray-700 mb-1.5 block">Número</Label>
                <Input
                  id="street_number"
                  value={profileData.street_number || ''}
                  onChange={(e) => handleInputChange('street_number', e.target.value)}
                  className="rounded-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood" className="text-xs font-medium text-gray-700 mb-1.5 block">Colonia</Label>
                <Input
                  id="neighborhood"
                  value={profileData.neighborhood || ''}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  className="rounded-full border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 italic pt-1">
              Esta es la dirección donde vives actualmente.
            </p>
          </div>
        </div>

        {/* BLOQUE 2: DATOS PROFESIONALES */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <h2 className="text-base font-bold text-gray-900">Datos profesionales</h2>

          <div>
            <Label htmlFor="professional_description" className="text-xs font-medium text-gray-700 mb-1.5 block">
              Descripción profesional (máx. 200 caracteres)
            </Label>
            <Textarea
              id="professional_description"
              value={profileData.professional_description || ''}
              onChange={(e) => handleInputChange('professional_description', e.target.value.slice(0, 200))}
              className="rounded-2xl min-h-[70px] border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm"
              placeholder="Cuéntanos sobre tu experiencia..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {profileData.professional_description?.length || 0}/200
            </p>
          </div>

          {/* Specialties - Editable */}
          {specialties.map((specialty) => (
            <div key={specialty.id} className="p-4 bg-gray-50 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-gray-900 text-sm">{specialty.role_label}</h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={specialty.experience_years || 0}
                    onChange={(e) => handleSpecialtyChange(specialty.id, 'experience_years', parseInt(e.target.value))}
                    className="w-16 h-8 rounded-full border-gray-200 text-center text-xs font-medium"
                    min="0"
                  />
                  <span className="text-xs text-gray-600">años</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Servicios que ofreces</Label>
                {specialty.activities.map((activity) => (
                  <div key={activity.id} className="space-y-2">
                    <Input
                      value={activity.activity}
                      onChange={(e) => handleActivityChange(specialty.id, activity.id, 'activity', e.target.value)}
                      className="rounded-full border-gray-200 text-sm focus:border-green-500 focus:ring-green-500"
                      placeholder="Nombre del servicio"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Precio mínimo</Label>
                        <Input
                          type="number"
                          value={activity.price_min || ''}
                          onChange={(e) => handleActivityChange(specialty.id, activity.id, 'price_min', e.target.value ? parseFloat(e.target.value) : null)}
                          className="rounded-full border-gray-200 text-sm focus:border-green-500 focus:ring-green-500"
                          placeholder="$0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Precio máximo</Label>
                        <Input
                          type="number"
                          value={activity.price_max || ''}
                          onChange={(e) => handleActivityChange(specialty.id, activity.id, 'price_max', e.target.value ? parseFloat(e.target.value) : null)}
                          className="rounded-full border-gray-200 text-sm focus:border-green-500 focus:ring-green-500"
                          placeholder="$0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Work Zones */}
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-2 block">Zona de cobertura</Label>
            <div className="space-y-2">
              {workZones.map((zone) => (
                <div key={zone.id} className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-sm text-gray-900 mb-2">{zone.state}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.cities.map((city, idx) => (
                      <Badge key={idx} variant="outline" className="rounded-full text-xs border-gray-300 bg-white">
                        {city}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BLOQUE 3: DOCUMENTACIÓN */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="text-base font-bold text-gray-900">Documentación para validación</h2>
          <p className="text-xs text-gray-500">
            La documentación no puede ser modificada una vez enviada.
          </p>

          <div className="space-y-2">
            {profileData.id_document_url && (
              <a
                href={profileData.id_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Identificación oficial</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </a>
            )}

            {profileData.csf_document_url && (
              <a
                href={profileData.csf_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Constancia de Situación Fiscal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </a>
            )}

            {profileData.address_proof_url && (
              <a
                href={profileData.address_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Comprobante de domicilio</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Floating Save Button - Rappi Style */}
      {hasChanges && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-40 animate-in slide-in-from-bottom duration-300">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full px-10 py-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.16)] transition-all bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-base active:scale-95"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </div>
  );
}
