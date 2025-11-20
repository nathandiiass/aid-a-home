import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, FileText, Save, ChevronRight, Plus, Award, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CategoryServicesSelector, { SelectedCategory } from '@/components/specialist/CategoryServicesSelector';
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
interface Credential {
  id: string;
  type: string;
  title: string;
  issuer: string;
  description: string | null;
  issued_at: string | null;
  expires_at: string | null;
  start_year: number | null;
  end_year: number | null;
  attachment_url: string | null;
}

interface PortfolioItem {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
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
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>([]);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showAddCredentialDialog, setShowAddCredentialDialog] = useState(false);
  const [credentialForm, setCredentialForm] = useState({
    type: '',
    title: '',
    issuer: '',
    description: '',
    issued_at: '',
    expires_at: '',
    start_year: '',
    end_year: '',
  });
  const [uploadingCredential, setUploadingCredential] = useState(false);
  const [credentialFile, setCredentialFile] = useState<File | null>(null);
  
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [showAddPortfolioDialog, setShowAddPortfolioDialog] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
  });
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  
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

      // Get categories with tags
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('specialist_categories')
        .select(`
          id,
          category_id,
          experience_years,
          categories(id, category_name, category_key)
        `)
        .eq('specialist_id', specialist.id);
      if (categoriesError) throw categoriesError;

      const { data: tagsData, error: tagsError } = await supabase
        .from('specialist_tags')
        .select(`
          tag_id,
          category_tags(id, tag_name, category_id)
        `)
        .eq('specialist_id', specialist.id);
      if (tagsError) throw tagsError;

      const formattedSpecialties = categoriesData?.map(c => ({
        id: c.id.toString(),
        specialty: (c.categories as any)?.category_name || '',
        role_label: (c.categories as any)?.category_name || '',
        experience_years: c.experience_years,
        activities: tagsData
          ?.filter(t => (t.category_tags as any)?.category_id === c.category_id)
          .map(t => ({
            id: t.tag_id.toString(),
            activity: (t.category_tags as any)?.tag_name || '',
            price_min: null
          })) || []
      })) || [];
      setSpecialties(formattedSpecialties);

      // Convert to SelectedCategory format
      const convertedCategories: SelectedCategory[] = categoriesData?.map(c => {
        const categoryData = c.categories as any;
        return {
          category: {
            id: categoryData?.id || 0,
            category_key: categoryData?.category_key || '',
            category_name: categoryData?.category_name || ''
          },
          selectedTags: tagsData
            ?.filter(t => (t.category_tags as any)?.category_id === c.category_id)
            .map(t => (t.category_tags as any)?.tag_name || '') || [],
          experienceYears: c.experience_years || undefined
        };
      }) || [];
      setSelectedCategories(convertedCategories);

      // Get work zones
      const {
        data: zonesData,
        error: zonesError
      } = await supabase.from('specialist_work_zones').select('*').eq('specialist_id', specialist.id);
      if (zonesError) throw zonesError;
      setWorkZones(zonesData || []);

      // Get credentials
      const {
        data: credentialsData,
        error: credentialsError
      } = await supabase.from('specialist_credentials').select('*').eq('specialist_id', specialist.id).order('created_at', { ascending: false });
      if (credentialsError) throw credentialsError;
      setCredentials(credentialsData || []);

      // Get portfolio items
      const {
        data: portfolioData,
        error: portfolioError
      } = await supabase.from('specialist_portfolio').select('*').eq('specialist_id', specialist.id).order('created_at', { ascending: false });
      if (portfolioError) throw portfolioError;
      
      // Generate public URLs for portfolio images
      const portfolioWithUrls = portfolioData?.map(item => {
        // If URL doesn't start with http, it's a storage path that needs to be converted
        if (item.image_url && !item.image_url.startsWith('http')) {
          const { data: { publicUrl } } = supabase.storage
            .from('specialist-documents')
            .getPublicUrl(item.image_url);
          return { ...item, image_url: publicUrl };
        }
        return item;
      }) || [];
      
      setPortfolioItems(portfolioWithUrls);
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
  const handleCategoriesChange = (categories: SelectedCategory[]) => {
    setSelectedCategories(categories);
    setHasChanges(true);
  };

  const handleWorkZoneChange = (zoneId: string, cities: string[]) => {
    setWorkZones(prev => prev.map(z => z.id === zoneId ? {
      ...z,
      cities
    } : z));
    setHasChanges(true);
  };

  const handleAddCredential = async () => {
    if (!specialistId || !credentialForm.title || !credentialFile) {
      toast({
        title: "Error",
        description: "Por favor ingresa el título y adjunta el archivo de la certificación",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setUploadingCredential(true);

      // Upload file (required)
      const fileExt = credentialFile.name.split('.').pop();
      const filePath = `${user?.id}/credentials/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('specialist-documents')
        .upload(filePath, credentialFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('specialist-documents')
        .getPublicUrl(filePath);
      
      setUploadingCredential(false);

      // Create credential
      const { data: newCredential, error } = await supabase
        .from('specialist_credentials')
        .insert({
          specialist_id: specialistId,
          type: 'cert',
          title: credentialForm.title,
          issuer: '',
          description: null,
          issued_at: null,
          expires_at: null,
          start_year: null,
          end_year: null,
          attachment_url: publicUrl,
        })
        .select()
        .single();

      if (error) throw error;

      setCredentials(prev => [newCredential, ...prev]);
      
      toast({
        title: "Éxito",
        description: "Certificación agregada correctamente",
      });

      // Reset form
      setShowAddCredentialDialog(false);
      setCredentialForm({
        type: '',
        title: '',
        issuer: '',
        description: '',
        issued_at: '',
        expires_at: '',
        start_year: '',
        end_year: '',
      });
      setCredentialFile(null);
    } catch (error) {
      console.error('Error adding credential:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la certificación",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploadingCredential(false);
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta certificación?')) return;

    try {
      const { error } = await supabase
        .from('specialist_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;

      setCredentials(prev => prev.filter(c => c.id !== credentialId));
      
      toast({
        title: "Éxito",
        description: "Certificación eliminada correctamente",
      });
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la certificación",
        variant: "destructive",
      });
    }
  };

  const handleAddPortfolio = async () => {
    if (!specialistId || !portfolioForm.title || !portfolioFile) {
      toast({
        title: "Error",
        description: "Por favor ingresa el título y adjunta una imagen",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setUploadingPortfolio(true);

      // Upload image
      const fileExt = portfolioFile.name.split('.').pop();
      const filePath = `${user?.id}/portfolio/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('specialist-documents')
        .upload(filePath, portfolioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('specialist-documents')
        .getPublicUrl(filePath);
      
      setUploadingPortfolio(false);

      // Create portfolio item
      const { data: newPortfolio, error } = await supabase
        .from('specialist_portfolio')
        .insert({
          specialist_id: specialistId,
          title: portfolioForm.title,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (error) throw error;

      setPortfolioItems(prev => [newPortfolio, ...prev]);
      
      toast({
        title: "Éxito",
        description: "Elemento agregado al portafolio correctamente",
      });

      // Reset form
      setShowAddPortfolioDialog(false);
      setPortfolioForm({
        title: '',
      });
      setPortfolioFile(null);
    } catch (error) {
      console.error('Error adding portfolio:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el elemento al portafolio",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploadingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!confirm('¿Estás seguro de eliminar este elemento del portafolio?')) return;

    try {
      const { error } = await supabase
        .from('specialist_portfolio')
        .delete()
        .eq('id', portfolioId);

      if (error) throw error;

      setPortfolioItems(prev => prev.filter(p => p.id !== portfolioId));
      
      toast({
        title: "Éxito",
        description: "Elemento eliminado del portafolio correctamente",
      });
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el elemento del portafolio",
        variant: "destructive",
      });
    }
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

      // Update categories and tags
      if (selectedCategories.length > 0) {
        // Delete existing categories and tags for this specialist
        await supabase
          .from('specialist_categories')
          .delete()
          .eq('specialist_id', specialistId);

        await supabase
          .from('specialist_tags')
          .delete()
          .eq('specialist_id', specialistId);

        // Insert new categories and tags
        for (const selectedCategory of selectedCategories) {
          // Insert category
          const { error: categoryError } = await supabase
            .from('specialist_categories')
            .insert({
              specialist_id: specialistId,
              category_id: selectedCategory.category.id,
              experience_years: selectedCategory.experienceYears || null
            });

          if (categoryError) throw categoryError;

          // Insert tags for this category
          if (selectedCategory.selectedTags.length > 0) {
            // Get tag IDs from tag names
            const { data: tagsData, error: tagsError } = await supabase
              .from('category_tags')
              .select('id, tag_name')
              .eq('category_id', selectedCategory.category.id)
              .in('tag_name', selectedCategory.selectedTags);

            if (tagsError) throw tagsError;

            if (tagsData && tagsData.length > 0) {
              const tagInserts = tagsData.map(tag => ({
                specialist_id: specialistId,
                tag_id: tag.id
              }));

              const { error: tagInsertError } = await supabase
                .from('specialist_tags')
                .insert(tagInserts);

              if (tagInsertError) throw tagInsertError;
            }
          }
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
      // Reload data to show updated categories
      await loadData();
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-rappi-green rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Especialidades y servicios</h2>
            </div>
            {!isEditingCategories && selectedCategories.length > 0 && (
              <Button
                onClick={() => setIsEditingCategories(true)}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                Editar
              </Button>
            )}
          </div>

          {!isEditingCategories ? (
            // Vista de solo lectura
            <div className="space-y-4">
              {selectedCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">No tienes especialidades registradas</p>
                  <Button
                    onClick={() => setIsEditingCategories(true)}
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar especialidades
                  </Button>
                </div>
              ) : (
                selectedCategories.map((selectedCat, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2 bg-white border-rappi-green/20 text-rappi-green font-semibold">
                          {selectedCat.category.category_name}
                        </Badge>
                        {selectedCat.experienceYears && (
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedCat.experienceYears} {selectedCat.experienceYears === 1 ? 'año' : 'años'} de experiencia
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {selectedCat.selectedTags.length > 0 && (
                      <div>
                        <Label className="text-xs text-gray-500 mb-2 block">Servicios específicos</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedCat.selectedTags.map((tag, tagIdx) => (
                            <Badge key={tagIdx} variant="secondary" className="bg-white text-gray-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            // Modo de edición
            <div className="space-y-4">
              <CategoryServicesSelector
                value={selectedCategories}
                onChange={handleCategoriesChange}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setIsEditingCategories(false);
                    // Recargar datos originales si se cancela
                    loadData();
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    setIsEditingCategories(false);
                    await handleSave();
                  }}
                  className="flex-1 bg-rappi-green hover:bg-rappi-green/90 rounded-xl"
                >
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}

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

        {/* BLOQUE: CERTIFICACIONES */}
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Certificaciones y credenciales</h2>
            </div>
            <Button
              onClick={() => setShowAddCredentialDialog(true)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          {credentials.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No hay certificaciones agregadas</p>
              <p className="text-xs text-gray-400 mt-1">Agrega tus certificaciones y credenciales profesionales</p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map(credential => (
                <div key={credential.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2 bg-white border-blue-200 text-blue-700 font-semibold">
                        {credential.type}
                      </Badge>
                      <h3 className="font-bold text-gray-900">{credential.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{credential.issuer}</p>
                      {credential.description && (
                        <p className="text-sm text-gray-500 mt-2">{credential.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {credential.issued_at && (
                          <span className="text-xs text-gray-500">
                            Emitido: {new Date(credential.issued_at).toLocaleDateString()}
                          </span>
                        )}
                        {credential.expires_at && (
                          <span className="text-xs text-gray-500">
                            • Expira: {new Date(credential.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {credential.start_year && (
                          <span className="text-xs text-gray-500">
                            {credential.start_year} - {credential.end_year || 'Presente'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {credential.attachment_url && (
                        <a
                          href={credential.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-white hover:bg-blue-100 flex items-center justify-center transition-all"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteCredential(credential.id)}
                        className="w-9 h-9 rounded-full bg-white hover:bg-red-100 flex items-center justify-center transition-all"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOQUE: PORTAFOLIO */}
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-500 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Portafolio</h2>
            </div>
            <Button
              onClick={() => setShowAddPortfolioDialog(true)}
              size="sm"
              className="bg-purple-500 hover:bg-purple-600 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          {portfolioItems.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No hay imágenes en el portafolio</p>
              <p className="text-xs text-gray-400 mt-1">Agrega imágenes de tus trabajos previos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {portfolioItems.map(item => (
                <div key={item.id} className="relative group">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm mb-2">{item.title}</p>
                      <button
                        onClick={() => handleDeletePortfolio(item.id)}
                        className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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


      {/* Add Credential Dialog */}
      <Dialog open={showAddCredentialDialog} onOpenChange={setShowAddCredentialDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar certificación</DialogTitle>
            <DialogDescription>
              Ingresa el título de tu certificación profesional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cred-title">Título *</Label>
              <Input
                id="cred-title"
                value={credentialForm.title}
                onChange={(e) => setCredentialForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Certificación en Instalación Eléctrica"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Adjuntar documento *</Label>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCredentialFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {credentialFile && (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <FileText className="w-3 h-3" />
                    {credentialFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">PDF, JPG o PNG - Máximo 5MB</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCredentialDialog(false);
                  setCredentialForm({
                    type: '',
                    title: '',
                    issuer: '',
                    description: '',
                    issued_at: '',
                    expires_at: '',
                    start_year: '',
                    end_year: '',
                  });
                  setCredentialFile(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddCredential}
                disabled={!credentialForm.title || !credentialFile || saving || uploadingCredential}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {uploadingCredential ? 'Subiendo archivo...' : saving ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Portfolio Dialog */}
      <Dialog open={showAddPortfolioDialog} onOpenChange={setShowAddPortfolioDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar al portafolio</DialogTitle>
            <DialogDescription>
              Agrega una imagen de tus trabajos con un título descriptivo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ej: Instalación de sistema eléctrico"
                value={portfolioForm.title}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Adjuntar imagen *</Label>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {portfolioFile && (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Camera className="w-3 h-3" />
                    {portfolioFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">JPG, PNG o WEBP - Máximo 5MB</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddPortfolioDialog(false);
                  setPortfolioForm({ title: '' });
                  setPortfolioFile(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddPortfolio}
                disabled={!portfolioForm.title || !portfolioFile || saving || uploadingPortfolio}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                {uploadingPortfolio ? 'Subiendo imagen...' : saving ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Save Button - Rappi Style */}
      {hasChanges && <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4 z-40 animate-in slide-in-from-bottom duration-300">
          <Button onClick={handleSave} disabled={saving} className="h-14 px-8 bg-rappi-green hover:bg-rappi-green/90 text-white font-bold rounded-full shadow-2xl hover:shadow-rappi-green/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>}
    </div>;
}