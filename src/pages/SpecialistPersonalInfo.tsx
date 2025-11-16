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
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
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
      const {
        data: specialist,
        error: specialistError
      } = await supabase.from('specialist_profiles').select('*').eq('user_id', user.id).single();
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
      const {
        data: profile,
        error: profileError
      } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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
      const {
        data: specialtiesData,
        error: specialtiesError
      } = await supabase.from('specialist_specialties').select(`
          *,
          specialist_activities (*)
        `).eq('specialist_id', specialist.id);
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
      const {
        data: zonesData,
        error: zonesError
      } = await supabase.from('specialist_work_zones').select('*').eq('specialist_id', specialist.id);
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
      const {
        error: uploadError
      } = await supabase.storage.from('specialist-documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('specialist-documents').getPublicUrl(filePath);
      setProfileData(prev => prev ? {
        ...prev,
        avatar_url: publicUrl
      } : null);
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
    setProfileData(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
    setHasChanges(true);
  };
  const handleSpecialtyChange = (specialtyId: string, field: string, value: any) => {
    setSpecialties(prev => prev.map(s => s.id === specialtyId ? {
      ...s,
      [field]: value
    } : s));
    setHasChanges(true);
  };
  const handleActivityChange = (specialtyId: string, activityId: string, field: string, value: any) => {
    setSpecialties(prev => prev.map(s => s.id === specialtyId ? {
      ...s,
      activities: s.activities.map(a => a.id === activityId ? {
        ...a,
        [field]: value
      } : a)
    } : s));
    setHasChanges(true);
  };
  const handleWorkZoneChange = (zoneId: string, cities: string[]) => {
    setWorkZones(prev => prev.map(z => z.id === zoneId ? {
      ...z,
      cities
    } : z));
    setHasChanges(true);
  };
  const handleSave = async () => {
    if (!user || !profileData || !specialistId) return;
    try {
      setSaving(true);

      // Update profile
      const {
        error: profileError
      } = await supabase.from('profiles').update({
        avatar_url: profileData.avatar_url,
        date_of_birth: profileData.date_of_birth,
        gender: profileData.gender
      }).eq('id', user.id);
      if (profileError) throw profileError;

      // Update specialist profile
      const {
        error: specialistError
      } = await supabase.from('specialist_profiles').update({
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
      }).eq('id', specialistId);
      if (specialistError) throw specialistError;

      // Update specialties
      for (const specialty of specialties) {
        const {
          error: specError
        } = await supabase.from('specialist_specialties').update({
          experience_years: specialty.experience_years
        }).eq('id', specialty.id);
        if (specError) throw specError;

        // Update activities
        for (const activity of specialty.activities) {
          const {
            error: actError
          } = await supabase.from('specialist_activities').update({
            activity: activity.activity,
            price_min: activity.price_min
          }).eq('id', activity.id);
          if (actError) throw actError;
        }
      }

      // Update work zones
      for (const zone of workZones) {
        const {
          error: zoneError
        } = await supabase.from('specialist_work_zones').update({
          cities: zone.cities
        }).eq('id', zone.id);
        if (zoneError) throw zoneError;
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
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>;
  }
  if (!profileData) return null;
  return <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with blur - Rappi style */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/specialist/account')} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all active:scale-95">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Información personal</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* BLOQUE 1: DATOS PERSONALES */}
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-rappi-green rounded-full" />
            <h2 className="text-lg font-bold text-gray-900">Datos personales</h2>
          </div>
          
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg ring-2 ring-gray-100">
                <AvatarImage src={profileData.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-rappi-green to-emerald-600 text-white">
                  {profileData.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-9 h-9 bg-rappi-green rounded-full flex items-center justify-center cursor-pointer hover:bg-rappi-green/90 transition-all shadow-lg group-hover:scale-110 active:scale-95">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
            <span className="text-sm text-gray-500 font-medium">Cambiar foto de perfil</span>
          </div>

          {/* Read-only fields */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de persona</Label>
              <p className="text-base font-semibold text-gray-900 mt-2">
                {profileData.person_type === 'fisica' ? 'Persona Física' : 'Persona Moral'}
              </p>
            </div>

            {profileData.person_type === 'fisica' ? <>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre completo</Label>
                  <p className="text-base font-semibold text-gray-900 mt-2">{profileData.first_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Apellido paterno</Label>
                    <p className="text-base font-semibold text-gray-900 mt-2">{profileData.last_name_paterno || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Apellido materno</Label>
                    <p className="text-base font-semibold text-gray-900 mt-2">{profileData.last_name_materno || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date_of_birth" className="text-sm font-semibold text-gray-700 mb-2 block">Fecha de nacimiento</Label>
                    <Input id="date_of_birth" type="date" value={profileData.date_of_birth || ''} onChange={e => handleInputChange('date_of_birth', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-sm font-semibold text-gray-700 mb-2 block">Género</Label>
                    <Input id="gender" value={profileData.gender || ''} onChange={e => handleInputChange('gender', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" placeholder="Masculino/Femenino" />
                  </div>
                </div>
              </> : <>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Razón social</Label>
                  <p className="text-base font-semibold text-gray-900 mt-2">{profileData.razon_social || '—'}</p>
                </div>
                <div>
                  <Label htmlFor="date_of_birth" className="text-sm font-semibold text-gray-700 mb-2 block">Fecha de constitución</Label>
                  <Input id="date_of_birth" type="date" value={profileData.date_of_birth || ''} onChange={e => handleInputChange('date_of_birth', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" />
                </div>
              </>}

            <div className="bg-gray-50 rounded-2xl p-4">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">RFC</Label>
              <p className="text-base font-semibold text-gray-900 mt-2">{profileData.rfc}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 block">Teléfono móvil *</Label>
              <Input id="phone" value={profileData.phone || ''} onChange={e => handleInputChange('phone', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" placeholder="Ingresa tu teléfono" />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">Correo electrónico *</Label>
              <Input id="email" type="email" value={profileData.email || ''} onChange={e => handleInputChange('email', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" placeholder="tu@email.com" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="state" className="text-sm font-semibold text-gray-700 mb-2 block">Estado *</Label>
                <Input id="state" value={profileData.state || ''} onChange={e => handleInputChange('state', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" />
              </div>
              <div>
                <Label htmlFor="city" className="text-sm font-semibold text-gray-700 mb-2 block">Ciudad *</Label>
                <Input id="city" value={profileData.city || ''} onChange={e => handleInputChange('city', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" />
              </div>
            </div>

            <div>
              <Label htmlFor="postal_code" className="text-sm font-semibold text-gray-700 mb-2 block">Código postal</Label>
              <Input id="postal_code" value={profileData.postal_code || ''} onChange={e => handleInputChange('postal_code', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" placeholder="00000" />
            </div>

            <div>
              <Label htmlFor="street" className="text-sm font-semibold text-gray-700 mb-2 block">Calle</Label>
              <Input id="street" value={profileData.street || ''} onChange={e => handleInputChange('street', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="street_number" className="text-sm font-semibold text-gray-700 mb-2 block">Número ext.</Label>
                <Input id="street_number" value={profileData.street_number || ''} onChange={e => handleInputChange('street_number', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" />
              </div>
              <div>
                <Label htmlFor="neighborhood" className="text-sm font-semibold text-gray-700 mb-2 block">Colonia</Label>
                <Input id="neighborhood" value={profileData.neighborhood || ''} onChange={e => handleInputChange('neighborhood', e.target.value)} className="rounded-2xl border-gray-200 text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" />
              </div>
            </div>

            <div>
              <Label htmlFor="professional_description" className="text-sm font-semibold text-gray-700 mb-2 block">Descripción profesional</Label>
              <Textarea id="professional_description" value={profileData.professional_description || ''} onChange={e => handleInputChange('professional_description', e.target.value)} className="rounded-2xl border-gray-200 text-sm focus:border-rappi-green focus:ring-rappi-green min-h-[100px]" placeholder="Cuéntanos sobre tu experiencia y servicios..." />
            </div>

            
          </div>
        </div>

        {/* BLOQUE 2: ESPECIALIDADES Y ZONAS */}
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-rappi-green rounded-full" />
            <h2 className="text-lg font-bold text-gray-900">Especialidades y servicios</h2>
          </div>

          <div className="space-y-4">
            {specialties.map(specialty => <div key={specialty.id} className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2 bg-white border-rappi-green/20 text-rappi-green font-semibold">
                      {specialty.role_label}
                    </Badge>
                    <h3 className="font-bold text-gray-900 text-lg">{specialty.specialty}</h3>
                  </div>
                  <button onClick={() => setEditingSpecialty(editingSpecialty === specialty.id ? null : specialty.id)} className="w-9 h-9 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-all active:scale-95 shadow-sm">
                    <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${editingSpecialty === specialty.id ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {editingSpecialty === specialty.id && <div className="space-y-4 pt-2">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Años de experiencia</Label>
                      <Input type="number" value={specialty.experience_years || ''} onChange={e => handleSpecialtyChange(specialty.id, 'experience_years', parseInt(e.target.value) || null)} className="rounded-2xl border-gray-200 bg-white text-sm h-12 focus:border-rappi-green focus:ring-rappi-green" placeholder="5" />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700">Actividades</Label>
                      {specialty.activities.map(activity => <div key={activity.id} className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
                          <Input value={activity.activity} onChange={e => handleActivityChange(specialty.id, activity.id, 'activity', e.target.value)} className="rounded-xl border-gray-200 text-sm h-11 font-medium focus:border-rappi-green focus:ring-rappi-green" placeholder="Nombre de la actividad" />
                          <div>
                            <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Precio desde</Label>
                            <Input type="number" value={activity.price_min || ''} onChange={e => handleActivityChange(specialty.id, activity.id, 'price_min', parseFloat(e.target.value) || null)} className="rounded-xl border-gray-200 text-sm h-10 focus:border-rappi-green focus:ring-rappi-green" placeholder="$0" />
                          </div>
                        </div>)}
                    </div>
                  </div>}
              </div>)}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <h3 className="text-base font-bold text-gray-900">Zonas de trabajo</h3>
            </div>
            <div className="space-y-3">
              {workZones.map(zone => <div key={zone.id} className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      {zone.state}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Ciudades (separadas por coma)</Label>
                    <Textarea value={zone.cities.join(', ')} onChange={e => handleWorkZoneChange(zone.id, e.target.value.split(',').map(c => c.trim()).filter(Boolean))} className="rounded-2xl border-gray-200 bg-white text-sm focus:border-emerald-500 focus:ring-emerald-500 min-h-[60px]" placeholder="Mérida, Progreso, Valladolid..." />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {zone.cities.map((city, idx) => <Badge key={idx} variant="outline" className="bg-white border-emerald-200 text-emerald-700 font-medium">
                        {city}
                      </Badge>)}
                  </div>
                </div>)}
            </div>
          </div>
        </div>

        {/* BLOQUE 3: DOCUMENTACIÓN */}
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-amber-500 rounded-full" />
            <h2 className="text-lg font-bold text-gray-900">Documentación para validación</h2>
          </div>
          <p className="text-sm text-gray-500">
            La documentación no puede ser modificada una vez enviada.
          </p>

          <div className="space-y-3">
            {profileData.id_document_url && <a href={profileData.id_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl hover:shadow-md transition-all active:scale-[0.98] group">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Identificación oficial</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
              </a>}

            {profileData.csf_document_url && <a href={profileData.csf_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl hover:shadow-md transition-all active:scale-[0.98] group">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Constancia de Situación Fiscal</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </a>}

            {profileData.address_proof_url && <a href={profileData.address_proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:shadow-md transition-all active:scale-[0.98] group">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Comprobante de domicilio</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </a>}
          </div>
        </div>
      </div>

      {/* Floating Save Button - Rappi Style */}
      {hasChanges && <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4 z-40 animate-in slide-in-from-bottom duration-300">
          <Button onClick={handleSave} disabled={saving} className="h-14 px-8 bg-rappi-green hover:bg-rappi-green/90 text-white font-bold rounded-full shadow-2xl hover:shadow-rappi-green/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>}
    </div>;
}