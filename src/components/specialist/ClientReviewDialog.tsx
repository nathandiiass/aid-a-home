import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  clientId: string;
  specialistId: string;
  onReviewSubmitted?: () => void;
}

interface RatingCategory {
  key: string;
  label: string;
  value: number;
}

export const ClientReviewDialog = ({
  open,
  onOpenChange,
  orderId,
  clientId,
  specialistId,
  onReviewSubmitted,
}: ClientReviewDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState<RatingCategory[]>([
    { key: "claridad_necesidades", label: "Claridad en las necesidades del servicio", value: 0 },
    { key: "puntualidad_disponibilidad", label: "Puntualidad y disponibilidad", value: 0 },
    { key: "respeto_profesionalismo_cliente", label: "Respeto y profesionalismo", value: 0 },
    { key: "facilito_condiciones_trabajo", label: "Facilitó las condiciones de trabajo", value: 0 },
    { key: "claridad_cumplimiento_pago", label: "Claridad y cumplimiento en el pago", value: 0 },
  ]);
  const [volveriaTrabajar, setVolveriaTrabajar] = useState<boolean | null>(null);

  const handleRatingChange = (key: string, value: number) => {
    setRatings(ratings.map(r => r.key === key ? { ...r, value } : r));
  };

  const isFormValid = () => {
    return ratings.every(r => r.value > 0) && volveriaTrabajar !== null;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor completa todas las calificaciones",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        order_id: orderId,
        client_id: clientId,
        specialist_id: specialistId,
        claridad_necesidades: ratings.find(r => r.key === "claridad_necesidades")?.value,
        puntualidad_disponibilidad: ratings.find(r => r.key === "puntualidad_disponibilidad")?.value,
        respeto_profesionalismo_cliente: ratings.find(r => r.key === "respeto_profesionalismo_cliente")?.value,
        facilito_condiciones_trabajo: ratings.find(r => r.key === "facilito_condiciones_trabajo")?.value,
        claridad_cumplimiento_pago: ratings.find(r => r.key === "claridad_cumplimiento_pago")?.value,
        volveria_trabajar_con_cliente: volveriaTrabajar,
        average_score: ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length,
      };

      const { error } = await supabase
        .from("client_reviews")
        .insert(reviewData);

      if (error) throw error;

      toast({
        title: "¡Evaluación enviada!",
        description: "Tu evaluación del cliente ha sido registrada exitosamente.",
      });

      onOpenChange(false);
      if (onReviewSubmitted) onReviewSubmitted();

      // Reset form
      setRatings(ratings.map(r => ({ ...r, value: 0 })));
      setVolveriaTrabajar(null);
    } catch (error: any) {
      console.error("Error submitting client review:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la evaluación",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "w-8 h-8",
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluar al cliente</DialogTitle>
          <DialogDescription>
            Tu opinión es importante. Califica tu experiencia con este cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {ratings.map((rating) => (
            <div key={rating.key} className="space-y-2">
              <Label className="text-base font-medium">{rating.label}</Label>
              <StarRating
                value={rating.value}
                onChange={(value) => handleRatingChange(rating.key, value)}
              />
            </div>
          ))}

          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-medium">
              ¿Volverías a trabajar con este cliente?
            </Label>
            <RadioGroup
              value={volveriaTrabajar === null ? undefined : volveriaTrabajar.toString()}
              onValueChange={(value) => setVolveriaTrabajar(value === "true")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="si" />
                <Label htmlFor="si" className="cursor-pointer font-normal">
                  Sí, definitivamente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="no" />
                <Label htmlFor="no" className="cursor-pointer font-normal">
                  No, prefiero no volver a trabajar con este cliente
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="bg-rappi-green hover:bg-rappi-green/90 text-white"
          >
            {isSubmitting ? "Enviando..." : "Enviar evaluación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
