import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SpecialistReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  specialistId: string;
  onReviewSubmitted: () => void;
}

interface RatingCategory {
  key: 'puntualidad' | 'calidad_trabajo' | 'profesionalismo' | 'cumplimiento_servicio' | 'relacion_calidad_precio';
  label: string;
  value: number;
}

export function SpecialistReviewDialog({ 
  open, 
  onOpenChange, 
  requestId,
  specialistId,
  onReviewSubmitted 
}: SpecialistReviewDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const [ratings, setRatings] = useState<RatingCategory[]>([
    { key: 'puntualidad', label: 'Puntualidad', value: 0 },
    { key: 'calidad_trabajo', label: 'Calidad del trabajo', value: 0 },
    { key: 'profesionalismo', label: 'Profesionalismo', value: 0 },
    { key: 'cumplimiento_servicio', label: 'Cumplimiento del servicio', value: 0 },
    { key: 'relacion_calidad_precio', label: 'Relación calidad-precio', value: 0 }
  ]);
  
  const [volveriaTrabajar, setVolveriaTrabajar] = useState<boolean | null>(null);

  const handleRatingChange = (index: number, value: number) => {
    const newRatings = [...ratings];
    newRatings[index].value = value;
    setRatings(newRatings);
  };

  const isFormValid = () => {
    return ratings.every(r => r.value > 0) && volveriaTrabajar !== null;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        variant: 'destructive',
        title: 'Formulario incompleto',
        description: 'Por favor completa todas las calificaciones'
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Calcular promedio
      const average = ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;

      // Insertar reseña
      const { error } = await supabase
        .from('reviews')
        .insert({
          request_id: requestId,
          user_id: user.id,
          specialist_id: specialistId,
          puntualidad: ratings[0].value,
          calidad_trabajo: ratings[1].value,
          profesionalismo: ratings[2].value,
          cumplimiento_servicio: ratings[3].value,
          relacion_calidad_precio: ratings[4].value,
          volveria_trabajar: volveriaTrabajar,
          average_score: average,
          rating: average // Para mantener compatibilidad
        });

      if (error) throw error;

      toast({
        title: '¡Gracias por tu evaluación!',
        description: 'Tu opinión nos ayuda a mejorar el servicio'
      });

      onReviewSubmitted();
      onOpenChange(false);
      
      // Resetear formulario
      setRatings(ratings.map(r => ({ ...r, value: 0 })));
      setVolveriaTrabajar(null);
      
    } catch (error: any) {
      console.error('Error al enviar reseña:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo enviar la evaluación'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`w-8 h-8 ${
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Evalúa el servicio
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tu opinión es muy importante para nosotros y ayuda a otros usuarios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Calificaciones por categoría */}
          {ratings.map((rating, index) => (
            <div key={rating.key} className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {rating.label}
              </label>
              <StarRating 
                value={rating.value} 
                onChange={(v) => handleRatingChange(index, v)} 
              />
            </div>
          ))}

          {/* Pregunta de volvería a trabajar */}
          <div className="space-y-3 pt-4 border-t border-border/30">
            <label className="text-sm font-semibold text-foreground block">
              ¿Volverías a trabajar con este especialista?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVolveriaTrabajar(true)}
                className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition-all ${
                  volveriaTrabajar === true
                    ? 'bg-rappi-green text-white shadow-lg'
                    : 'bg-gray-100 text-foreground hover:bg-gray-200'
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setVolveriaTrabajar(false)}
                className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition-all ${
                  volveriaTrabajar === false
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-foreground hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full h-12"
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
            className="flex-1 bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-12 font-semibold"
          >
            {submitting ? 'Enviando...' : 'Enviar evaluación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}