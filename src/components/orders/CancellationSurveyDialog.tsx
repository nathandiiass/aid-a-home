import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CancellationSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    mainReason: string;
    otherReasonText?: string;
    improvementText?: string;
  }) => void;
}

const CANCELLATION_REASONS = [
  'No recibí suficientes ofertas',
  'Los precios que recibí fueron demasiado altos',
  'No encontré un especialista adecuado',
  'El proveedor que quería no estaba disponible',
  'Ya no necesito el servicio',
  'Me equivoqué al crear la solicitud',
  'Encontré a un proveedor fuera de la app',
  'Tardaron mucho en responder',
  'Problemas con la app (error, mala experiencia, confusión)',
  'Otro motivo',
];

export function CancellationSurveyDialog({ open, onOpenChange, onSubmit }: CancellationSurveyDialogProps) {
  const [mainReason, setMainReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [improvementText, setImprovementText] = useState('');

  const isOtherSelected = mainReason === 'Otro motivo';
  const isValid = mainReason && (!isOtherSelected || (otherReasonText.trim().length > 0 && otherReasonText.length <= 120));

  const handleSubmit = () => {
    if (!isValid) return;

    onSubmit({
      mainReason,
      otherReasonText: isOtherSelected ? otherReasonText.trim() : undefined,
      improvementText: improvementText.trim() || undefined,
    });

    // Reset form
    setMainReason('');
    setOtherReasonText('');
    setImprovementText('');
  };

  const handleCancel = () => {
    // Reset form
    setMainReason('');
    setOtherReasonText('');
    setImprovementText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl border-0">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Antes de eliminar tu solicitud
          </DialogTitle>
          <DialogDescription className="text-base text-foreground/60">
            Tu opinión nos ayuda a mejorar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Main reason */}
          <div className="space-y-4">
            <Label className="text-base font-bold text-foreground">
              ¿Por qué deseas eliminar esta solicitud/oferta? *
            </Label>
            <RadioGroup value={mainReason} onValueChange={setMainReason} className="space-y-3">
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason} className="flex items-start space-x-3 group">
                  <RadioGroupItem 
                    value={reason} 
                    id={reason} 
                    className="mt-0.5 border-2 border-black rounded-md data-[state=checked]:bg-black data-[state=checked]:border-black" 
                  />
                  <Label
                    htmlFor={reason}
                    className="text-sm font-normal cursor-pointer leading-relaxed text-foreground/80 group-hover:text-foreground transition-colors"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Other reason text - only show if "Otro motivo" is selected */}
          {isOtherSelected && (
            <div className="space-y-3 bg-gray-50 rounded-2xl p-4">
              <Label htmlFor="otherReason" className="text-sm font-semibold text-foreground">
                Por favor especifica el motivo *
              </Label>
              <Textarea
                id="otherReason"
                placeholder="Escribe tu motivo aquí..."
                value={otherReasonText}
                onChange={(e) => setOtherReasonText(e.target.value)}
                maxLength={120}
                className="resize-none bg-white border-gray-200 rounded-xl focus:border-rappi-green focus:ring-rappi-green min-h-[80px]"
                rows={3}
              />
              <p className="text-xs text-foreground/50 text-right">
                {otherReasonText.length}/120 caracteres
              </p>
            </div>
          )}

          {/* Improvement suggestion - optional */}
          <div className="space-y-3 bg-gray-50 rounded-2xl p-4">
            <Label htmlFor="improvement" className="text-sm font-semibold text-foreground">
              ¿Qué hubiéramos podido mejorar? (opcional)
            </Label>
            <Textarea
              id="improvement"
              placeholder="Tus sugerencias son valiosas para nosotros..."
              value={improvementText}
              onChange={(e) => setImprovementText(e.target.value)}
              maxLength={120}
              className="resize-none bg-white border-gray-200 rounded-xl focus:border-rappi-green focus:ring-rappi-green min-h-[80px]"
              rows={3}
            />
            <p className="text-xs text-foreground/50 text-right">
              {improvementText.length}/120 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto rounded-full border-2 border-gray-300 hover:bg-gray-50 h-11 px-6 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full sm:w-auto bg-black hover:bg-black/90 text-white rounded-full h-11 px-6 font-semibold disabled:bg-gray-300 disabled:text-gray-500"
          >
            Enviar y eliminar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
