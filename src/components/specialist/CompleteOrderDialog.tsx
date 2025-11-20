import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  
  // Client review ratings
  const [claridadNecesidades, setClaridadNecesidades] = useState<string>('');
  const [claridadPago, setClaridadPago] = useState<string>('');
  const [puntualidad, setPuntualidad] = useState<string>('');
  const [condicionesTrabajo, setCondicionesTrabajo] = useState<string>('');
  const [respetoProfesionalismo, setRespetoProfesionalismo] = useState<string>('');
  const [volveriaTrabajar, setVolveriaTrabajar] = useState<string>('');

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

    // Validate client review
    if (!claridadNecesidades || !claridadPago || !puntualidad || !condicionesTrabajo || !respetoProfesionalismo || !volveriaTrabajar) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor completa la evaluación del cliente'
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

        const { data, error: urlError } = await supabase.storage
          .from('specialist-documents')
          .createSignedUrl(fileName, 31536000); // 1 year expiry

        if (urlError) throw urlError;

        photoUrls.push(data.signedUrl);
      }

      // Update quote with final data
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          price_fixed: parseFloat(finalPrice),
          additional_notes: notes,
          attachments: photoUrls.length > 0 ? photoUrls : null
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Update service_request status to 'completed' and set final price
      const { error: requestError } = await supabase
        .from('service_requests')
        .update({
          status: 'completed',
          price_max: parseFloat(finalPrice)
        })
        .eq('id', order.service_requests?.id || order.request?.id);

      if (requestError) throw requestError;

      // Get current user (specialist)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Calculate average score
      const ratings = [
        parseInt(claridadNecesidades),
        parseInt(claridadPago),
        parseInt(puntualidad),
        parseInt(condicionesTrabajo),
        parseInt(respetoProfesionalismo)
      ];
      const averageScore = ratings.reduce((a, b) => a + b, 0) / ratings.length;

      // Insert client review
      const { error: reviewError } = await supabase
        .from('client_reviews')
        .insert({
          order_id: order.id,
          specialist_id: user.id,
          client_id: order.service_requests?.user_id || order.request?.user_id,
          claridad_necesidades: parseInt(claridadNecesidades),
          claridad_cumplimiento_pago: parseInt(claridadPago),
          puntualidad_disponibilidad: parseInt(puntualidad),
          facilito_condiciones_trabajo: parseInt(condicionesTrabajo),
          respeto_profesionalismo_cliente: parseInt(respetoProfesionalismo),
          volveria_trabajar_con_cliente: volveriaTrabajar === 'si',
          average_score: averageScore
        });

      if (reviewError) throw reviewError;

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
      <DialogContent className="max-w-lg bg-white rounded-3xl border-0">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-2xl font-bold text-foreground">Finalizar trabajo</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <Label htmlFor="finalPrice" className="text-sm font-bold text-foreground">Precio final *</Label>
            <Input
              id="finalPrice"
              type="number"
              placeholder="0.00"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              min="0"
              step="0.01"
              className="bg-white border-gray-200 rounded-xl h-12 focus:border-rappi-green focus:ring-rappi-green"
            />
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <Label htmlFor="materials" className="text-sm font-bold text-foreground">Materiales adicionales (opcional)</Label>
            <Textarea
              id="materials"
              placeholder="Describe materiales adicionales utilizados..."
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              rows={2}
              className="bg-white border-gray-200 rounded-xl focus:border-rappi-green focus:ring-rappi-green min-h-[60px]"
            />
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <Label htmlFor="notes" className="text-sm font-bold text-foreground">Notas para el cliente (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agrega notas o recomendaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="bg-white border-gray-200 rounded-xl focus:border-rappi-green focus:ring-rappi-green min-h-[80px]"
            />
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <Label className="text-sm font-bold text-foreground">Fotos finales (opcional, máx. 5)</Label>
            <label
              htmlFor="photos"
              className="flex items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-rappi-green hover:bg-gray-50 transition-all"
            >
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">
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

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="w-full sm:w-auto rounded-full border-2 border-gray-300 hover:bg-gray-50 h-11 px-6 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-11 px-6 font-semibold"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
