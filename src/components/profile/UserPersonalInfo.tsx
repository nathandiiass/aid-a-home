import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, ArrowLeft } from 'lucide-react';
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Información Personal</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback className="text-2xl">
                {formData.first_name?.[0]}{formData.last_name_paterno?.[0]}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-primary-foreground" />
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
          <p className="text-sm text-muted-foreground">Haz clic en el ícono para cambiar tu foto</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre completo *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Juan"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name_paterno">Apellido paterno *</Label>
            <Input
              id="last_name_paterno"
              value={formData.last_name_paterno}
              onChange={(e) => handleInputChange('last_name_paterno', e.target.value)}
              placeholder="García"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name_materno">Apellido materno</Label>
            <Input
              id="last_name_materno"
              value={formData.last_name_materno}
              onChange={(e) => handleInputChange('last_name_materno', e.target.value)}
              placeholder="López"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              El correo electrónico no se puede modificar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="5512345678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Fecha de nacimiento *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange('gender', value)}
            >
              <SelectTrigger id="gender">
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

        {/* Save Button */}
        <div className="sticky bottom-20 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full h-12"
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
    </div>
  );
}
