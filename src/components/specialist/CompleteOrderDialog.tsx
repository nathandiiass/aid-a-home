import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CompleteOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onComplete: () => void;
}

export function CompleteOrderDialog({ open, onOpenChange, order, onComplete }: CompleteOrderDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [finalPrice, setFinalPrice] = useState(order.price_fixed || order.price_min || '');
  const [materials, setMaterials] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Máximo 5 fotos'
      });
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const handleSubmit = async () => {
    if (!finalPrice || parseFloat(finalPrice) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ingresa un precio final válido'
      });
      return;
    }

    try {
      setLoading(true);

      // Upload photos if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${order.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('specialist-documents')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('specialist-documents')
          .getPublicUrl(fileName);

        photoUrls.push(publicUrl);
      }

      // Update quote with final data (status remains 'accepted' for now)
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          price_fixed: parseFloat(finalPrice),
          additional_notes: notes,
          attachments: photoUrls.length > 0 ? photoUrls : null
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: '¡Trabajo completado!',
        description: 'El trabajo ha sido marcado como completado'
      });

      onOpenChange(false);
      onComplete();
    } catch (error: any) {
      console.error('Error completing order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo completar el trabajo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: '#003049' }}>Finalizar trabajo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="finalPrice">Precio final *</Label>
            <Input
              id="finalPrice"
              type="number"
              placeholder="0.00"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="materials">Materiales adicionales (opcional)</Label>
            <Textarea
              id="materials"
              placeholder="Describe materiales adicionales utilizados..."
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas para el cliente (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agrega notas o recomendaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Fotos finales (opcional, máx. 5)</Label>
            <div className="mt-2">
              <label
                htmlFor="photos"
                className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {photos.length > 0 ? `${photos.length} foto(s) seleccionada(s)` : 'Seleccionar fotos'}
                  </span>
                </div>
                <input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: '#C1121F' }}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
