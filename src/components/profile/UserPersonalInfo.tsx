import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface UserPersonalInfoProps {
  userId: string;
}

export function UserPersonalInfo({ userId }: UserPersonalInfoProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name_paterno: '',
    last_name_materno: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    avatar_url: '',
  });

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: { user } } = await supabase.auth.getUser();

      setFormData({
        first_name: profile.first_name || '',
        last_name_paterno: profile.last_name_paterno || '',
        last_name_materno: profile.last_name_materno || '',
        email: user?.email || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        avatar_url: profile.avatar_url || '',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del perfil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen no debe superar 5 MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('specialist-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('specialist-documents')
        .getPublicUrl(filePath);

      handleInputChange('avatar_url', publicUrl);

      toast({
        title: 'Éxito',
        description: 'Foto de perfil actualizada',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.last_name_paterno.trim()) {
      toast({
        title: 'Error',
        description: 'El apellido paterno es obligatorio',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Error',
        description: 'El correo electrónico es obligatorio',
        variant: 'destructive',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Error',
        description: 'El formato del correo electrónico no es válido',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: 'Error',
        description: 'El teléfono es obligatorio',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.phone.replace(/\D/g, '').length < 10) {
      toast({
        title: 'Error',
        description: 'El teléfono debe tener al menos 10 dígitos',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.date_of_birth) {
      toast({
        title: 'Error',
        description: 'La fecha de nacimiento es obligatoria',
        variant: 'destructive',
      });
      return false;
    }

    const birthDate = new Date(formData.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      toast({
        title: 'Error',
        description: 'Debes ser mayor de 18 años',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const displayName = `${formData.first_name.trim()} ${formData.last_name_paterno.trim()}`;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim(),
          last_name_paterno: formData.last_name_paterno.trim(),
          last_name_materno: formData.last_name_materno.trim(),
          phone: formData.phone.trim(),
          date_of_birth: formData.date_of_birth,
          gender: formData.gender || null,
          avatar_url: formData.avatar_url || null,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: 'Éxito',
        description: 'Tus datos se actualizaron correctamente',
      });
      
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar tu información. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Información personal</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Avatar Card */}
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="text-2xl bg-gray-100">
                  {formData.first_name?.[0]}{formData.last_name_paterno?.[0]}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-rappi-green rounded-full flex items-center justify-center cursor-pointer hover:bg-rappi-green/90 transition-colors shadow-md"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Haz clic en el ícono para cambiar tu foto
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
          <h2 className="text-lg font-bold mb-4">Datos personales</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm font-semibold text-foreground">
                Nombre completo *
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Juan"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name_paterno" className="text-sm font-semibold text-foreground">
                Apellido paterno *
              </Label>
              <Input
                id="last_name_paterno"
                value={formData.last_name_paterno}
                onChange={(e) => handleInputChange('last_name_paterno', e.target.value)}
                placeholder="García"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name_materno" className="text-sm font-semibold text-foreground">
                Apellido materno
              </Label>
              <Input
                id="last_name_materno"
                value={formData.last_name_materno}
                onChange={(e) => handleInputChange('last_name_materno', e.target.value)}
                placeholder="López"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Correo electrónico *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100 cursor-not-allowed h-12"
              />
              <p className="text-xs text-muted-foreground">
                El correo electrónico no se puede modificar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Teléfono *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="5512345678"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="text-sm font-semibold text-foreground">
                Fecha de nacimiento *
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-semibold text-foreground">
                Género
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
              >
                <SelectTrigger id="gender" className="h-12">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hombre">Hombre</SelectItem>
                  <SelectItem value="Mujer">Mujer</SelectItem>
                  <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-12 font-semibold disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  );
}
