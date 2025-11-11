import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PersonalInfoTabProps {
  userId: string;
  specialistId: string | null;
}

export function PersonalInfoTab({ userId, specialistId }: PersonalInfoTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name_paterno: '',
    last_name_materno: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    phone: '',
    rfc: '',
    avatar_url: '',
    bio: '',
    materials_policy: false,
    warranty_days: 0,
  });

  useEffect(() => {
    loadProfileData();
  }, [userId, specialistId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      let specialistData = null;
      if (specialistId) {
        const { data, error } = await supabase
          .from('specialist_profiles')
          .select('*')
          .eq('id', specialistId)
          .single();
        
        if (error) throw error;
        specialistData = data;
      }

      setFormData({
        first_name: profile.first_name || '',
        last_name_paterno: profile.last_name_paterno || '',
        last_name_materno: profile.last_name_materno || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        phone: specialistData?.phone || '',
        rfc: specialistData?.rfc || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        materials_policy: specialistData?.materials_policy || false,
        warranty_days: specialistData?.warranty_days || 0,
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
        description: 'Foto actualizada',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la foto',
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

    if (formData.date_of_birth) {
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
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const displayName = `${formData.first_name} ${formData.last_name_paterno || formData.last_name_materno || ''}`.trim();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name_paterno: formData.last_name_paterno || null,
          last_name_materno: formData.last_name_materno || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          nationality: formData.nationality || null,
          avatar_url: formData.avatar_url || null,
          bio: formData.bio || null,
          display_name: displayName,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      if (specialistId) {
        const { error: specialistError } = await supabase
          .from('specialist_profiles')
          .update({
            phone: formData.phone,
            rfc: formData.rfc || null,
            materials_policy: formData.materials_policy,
            warranty_days: formData.warranty_days,
          })
          .eq('id', specialistId);

        if (specialistError) throw specialistError;
      }

      setHasChanges(false);
      toast({
        title: 'Éxito',
        description: 'Información actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la información',
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

  const initials = `${formData.first_name.charAt(0)}${formData.last_name_paterno.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 pb-6 border-b border-border">
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage src={formData.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {initials || 'U'}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:bg-accent/90 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-white" />
            )}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
        </div>
        <p className="text-sm text-muted-foreground">Haz clic en el ícono para cambiar tu foto</p>
      </div>

      {/* Personal Information Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">
              Nombre(s) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              maxLength={60}
              placeholder="Juan Carlos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name_paterno">Apellido paterno</Label>
            <Input
              id="last_name_paterno"
              value={formData.last_name_paterno}
              onChange={(e) => handleInputChange('last_name_paterno', e.target.value)}
              maxLength={60}
              placeholder="García"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name_materno">Apellido materno</Label>
            <Input
              id="last_name_materno"
              value={formData.last_name_materno}
              onChange={(e) => handleInputChange('last_name_materno', e.target.value)}
              maxLength={60}
              placeholder="López"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="femenino">Femenino</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
                <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nacionalidad</Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              placeholder="Mexicana"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Teléfono <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+52 1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rfc">RFC</Label>
            <Input
              id="rfc"
              value={formData.rfc}
              onChange={(e) => handleInputChange('rfc', e.target.value.toUpperCase())}
              maxLength={13}
              placeholder="GARC850101ABC"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Sobre mí</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Cuéntanos sobre tu experiencia y servicios..."
          />
          <p className="text-xs text-muted-foreground text-right">
            {formData.bio.length}/500
          </p>
        </div>

        {specialistId && (
          <>
            <div className="pt-4 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Políticas generales</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="materials_policy">Incluye materiales</Label>
                    <p className="text-sm text-muted-foreground">
                      Indica si generalmente incluyes materiales en tus cotizaciones
                    </p>
                  </div>
                  <Switch
                    id="materials_policy"
                    checked={formData.materials_policy}
                    onCheckedChange={(checked) => handleInputChange('materials_policy', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty_days">Días de garantía (0-365)</Label>
                  <Input
                    id="warranty_days"
                    type="number"
                    min="0"
                    max="365"
                    value={formData.warranty_days}
                    onChange={(e) => handleInputChange('warranty_days', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-background pt-4 pb-6 border-t border-border">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full h-12 text-base"
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