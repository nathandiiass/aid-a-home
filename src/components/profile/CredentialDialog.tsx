import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Credential {
  id: string;
  type: 'degree' | 'cert' | 'course';
  title: string;
  issuer: string;
  start_year?: number;
  end_year?: number;
  issued_at?: string;
  expires_at?: string;
  description?: string;
  attachment_url?: string;
}

interface CredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialistId: string;
  credential?: Credential | null;
  onSuccess: () => void;
}

export function CredentialDialog({
  open,
  onOpenChange,
  specialistId,
  credential,
  onSuccess,
}: CredentialDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'cert' as 'degree' | 'cert' | 'course',
    title: '',
    issuer: '',
    start_year: '',
    end_year: '',
    issued_at: '',
    expires_at: '',
    description: '',
    attachment_url: '',
  });

  useEffect(() => {
    if (credential) {
      setFormData({
        type: credential.type,
        title: credential.title,
        issuer: credential.issuer,
        start_year: credential.start_year?.toString() || '',
        end_year: credential.end_year?.toString() || '',
        issued_at: credential.issued_at || '',
        expires_at: credential.expires_at || '',
        description: credential.description || '',
        attachment_url: credential.attachment_url || '',
      });
    } else {
      setFormData({
        type: 'cert',
        title: '',
        issuer: '',
        start_year: '',
        end_year: '',
        issued_at: '',
        expires_at: '',
        description: '',
        attachment_url: '',
      });
    }
  }, [credential, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El archivo no debe superar 5 MB',
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos PDF, JPG o PNG',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${specialistId}-${Date.now()}.${fileExt}`;
      const filePath = `credentials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('specialist-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data, error: urlError } = await supabase.storage
        .from('specialist-documents')
        .createSignedUrl(filePath, 31536000); // 1 year expiry

      if (urlError) throw urlError;

      handleInputChange('attachment_url', data.signedUrl);
      
      toast({
        title: 'Éxito',
        description: 'Archivo subido correctamente',
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el archivo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim() || !formData.issuer.trim()) {
      toast({
        title: 'Error',
        description: 'El título y la institución son obligatorios',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.start_year && formData.end_year) {
      if (parseInt(formData.end_year) < parseInt(formData.start_year)) {
        toast({
          title: 'Error',
          description: 'El año de finalización debe ser posterior al de inicio',
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

      const dataToSave = {
        specialist_id: specialistId,
        type: formData.type,
        title: formData.title,
        issuer: formData.issuer,
        start_year: formData.start_year ? parseInt(formData.start_year) : null,
        end_year: formData.end_year ? parseInt(formData.end_year) : null,
        issued_at: formData.issued_at || null,
        expires_at: formData.expires_at || null,
        description: formData.description || null,
        attachment_url: formData.attachment_url || null,
      };

      if (credential) {
        const { error } = await supabase
          .from('specialist_credentials')
          .update(dataToSave)
          .eq('id', credential.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('specialist_credentials')
          .insert(dataToSave);

        if (error) throw error;
      }

      toast({
        title: 'Éxito',
        description: credential ? 'Credencial actualizada' : 'Credencial agregada',
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error saving credential:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la credencial',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {credential ? 'Editar credencial' : 'Agregar credencial'}
          </DialogTitle>
          <DialogDescription>
            Completa la información de tu estudio, certificación o curso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.type} onValueChange={(value: any) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="degree">Estudio</SelectItem>
                <SelectItem value="cert">Certificación</SelectItem>
                <SelectItem value="course">Curso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Título / Programa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ej. Técnico en Electricidad"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuer">
              Institución / Emisor <span className="text-destructive">*</span>
            </Label>
            <Input
              id="issuer"
              value={formData.issuer}
              onChange={(e) => handleInputChange('issuer', e.target.value)}
              placeholder="Ej. Universidad Nacional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_year">Año de inicio</Label>
              <Input
                id="start_year"
                type="number"
                value={formData.start_year}
                onChange={(e) => handleInputChange('start_year', e.target.value)}
                placeholder="2020"
                min="1950"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_year">Año de fin</Label>
              <Input
                id="end_year"
                type="number"
                value={formData.end_year}
                onChange={(e) => handleInputChange('end_year', e.target.value)}
                placeholder="2024"
                min="1950"
                max={new Date().getFullYear() + 10}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issued_at">Fecha de emisión</Label>
              <Input
                id="issued_at"
                type="date"
                value={formData.issued_at}
                onChange={(e) => handleInputChange('issued_at', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Fecha de expiración</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => handleInputChange('expires_at', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción breve</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Descripción opcional..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <Label>Adjuntar archivo (PDF, JPG, PNG - máx 5 MB)</Label>
            {formData.attachment_url ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <div className="flex-1 text-sm text-muted-foreground truncate">
                  Archivo adjunto
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange('attachment_url', '')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  id="attachment"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="attachment">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar archivo
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}