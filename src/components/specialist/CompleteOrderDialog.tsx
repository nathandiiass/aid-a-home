import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Star } from 'lucide-react';
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
  const [claridadNecesidades, setClaridadNecesidades] = useState(0);
  const [puntualidadDisponibilidad, setPuntualidadDisponibilidad] = useState(0);
  const [respetoCliente, setRespetoCliente] = useState(0);
  const [facilitoCondiciones, setFacilitoCondiciones] = useState(0);
  const [claridadPago, setClaridadPago] = useState(0);
  const [volveriaTrabajar, setVolveriaTrabajar] = useState<boolean | null>(null);

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
    if (!claridadNecesidades || !puntualidadDisponibilidad || !respetoCliente || 
        !facilitoCondiciones || !claridadPago || volveriaTrabajar === null) {
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

      // Calculate average score for client review
      const averageScore = (
        claridadNecesidades + 
        puntualidadDisponibilidad + 
        respetoCliente + 
        facilitoCondiciones + 
        claridadPago
      ) / 5;

      // Insert client review
      const { error: reviewError } = await supabase
        .from('client_reviews')
        .insert({
          client_id: order.service_requests?.user_id || order.request?.user_id,
          specialist_id: order.specialist_id,
          order_id: order.service_requests?.id || order.request?.id,
          claridad_necesidades: claridadNecesidades,
          puntualidad_disponibilidad: puntualidadDisponibilidad,
          respeto_profesionalismo_cliente: respetoCliente,
          facilito_condiciones_trabajo: facilitoCondiciones,
          claridad_cumplimiento_pago: claridadPago,
          volveria_trabajar_con_cliente: volveriaTrabajar,
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

          {/* Client Review Section */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-5 space-y-4 border-2 border-orange-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <Label className="text-base font-bold text-foreground">Evaluación del cliente *</Label>
            </div>

            <div className="space-y-4">
              <ReviewQuestion
                question="¿El cliente explicó claramente lo que necesitaba?"
                value={claridadNecesidades}
                onChange={setClaridadNecesidades}
              />
              
              <ReviewQuestion
                question="¿El cliente estuvo disponible y puntual para recibir el servicio?"
                value={puntualidadDisponibilidad}
                onChange={setPuntualidadDisponibilidad}
              />
              
              <ReviewQuestion
                question="¿Qué tan respetuoso y profesional fue el cliente durante la interacción?"
                value={respetoCliente}
                onChange={setRespetoCliente}
              />
              
              <ReviewQuestion
                question="¿El cliente facilitó las condiciones necesarias para realizar el trabajo?"
                value={facilitoCondiciones}
                onChange={setFacilitoCondiciones}
              />
              
              <ReviewQuestion
                question="¿Hubo claridad y cumplimiento en el pago del servicio?"
                value={claridadPago}
                onChange={setClaridadPago}
              />

              <div className="bg-white rounded-xl p-4 border-2 border-orange-200">
                <Label className="text-sm font-bold text-foreground mb-3 block">
                  ¿Volverías a trabajar con este cliente? *
                </Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={volveriaTrabajar === true ? "default" : "outline"}
                    onClick={() => setVolveriaTrabajar(true)}
                    className={`flex-1 h-12 rounded-xl font-semibold ${
                      volveriaTrabajar === true 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'border-2 border-gray-300 hover:border-green-500 hover:bg-green-50'
                    }`}
                  >
                    Sí
                  </Button>
                  <Button
                    type="button"
                    variant={volveriaTrabajar === false ? "default" : "outline"}
                    onClick={() => setVolveriaTrabajar(false)}
                    className={`flex-1 h-12 rounded-xl font-semibold ${
                      volveriaTrabajar === false 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'border-2 border-gray-300 hover:border-red-500 hover:bg-red-50'
                    }`}
                  >
                    No
                  </Button>
                </div>
              </div>
            </div>
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

// Star Rating Component
function ReviewQuestion({ question, value, onChange }: { 
  question: string; 
  value: number; 
  onChange: (value: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <Label className="text-sm font-medium text-foreground mb-3 block">{question}</Label>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-all hover:scale-110 focus:outline-none"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? 'fill-orange-500 text-orange-500'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
