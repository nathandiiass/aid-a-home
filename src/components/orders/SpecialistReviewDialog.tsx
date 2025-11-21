import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Star, Briefcase, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SpecialistReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  specialistId: string;
  requestTitle?: string;
  specialistName?: string;
  completedDate?: string;
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
  requestTitle,
  specialistName,
  completedDate,
  onReviewSubmitted 
}: SpecialistReviewDialogProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`w-6 h-6 ${
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );

  const contentSection = (
    <>
      {(requestTitle || specialistName || completedDate) && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
          {requestTitle && (
            <div className="flex items-start gap-2">
              <Briefcase className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Servicio</p>
                <p className="text-sm font-bold text-foreground">{requestTitle}</p>
              </div>
            </div>
          )}
          {specialistName && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Especialista</p>
                <p className="text-sm font-bold text-foreground">{specialistName}</p>
              </div>
            </div>
          )}
          {completedDate && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Fecha de finalización</p>
                <p className="text-sm font-bold text-foreground">
                  {format(new Date(completedDate), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        Tu opinión ayuda a otros usuarios
      </p>

      <div className="space-y-3">
        {ratings.map((rating, index) => (
          <div key={rating.key} className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              {rating.label}
            </label>
            <StarRating 
              value={rating.value} 
              onChange={(v) => handleRatingChange(index, v)} 
            />
          </div>
        ))}

        <div className="space-y-2 pt-2 border-t border-border/30">
          <label className="text-xs font-semibold text-foreground block">
            ¿Volverías a trabajar con este especialista?
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVolveriaTrabajar(true)}
              className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                volveriaTrabajar === true
                  ? 'bg-rappi-green text-white shadow-md'
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setVolveriaTrabajar(false)}
              className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                volveriaTrabajar === false
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              No
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const footerButtons = (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="flex-1 rounded-full h-10 text-sm"
        disabled={submitting}
      >
        Cancelar
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid() || submitting}
        className="flex-1 bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-10 font-semibold text-sm"
      >
        {submitting ? 'Enviando...' : 'Enviar evaluación'}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="pb-3">
            <DrawerTitle className="text-xl font-bold text-foreground">
              Evalúa el servicio
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 space-y-3 pb-4">
            {contentSection}
          </div>
          <div className="flex gap-2 p-4 border-t border-border/20">
            {footerButtons}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-2xl">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl font-bold text-foreground">
            Evalúa el servicio
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {contentSection}
        </div>
        <div className="flex gap-2 pt-2">
          {footerButtons}
        </div>
      </DialogContent>
    </Dialog>
  );
}