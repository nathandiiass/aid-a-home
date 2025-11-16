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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Antes de eliminar tu solicitud</DialogTitle>
          <DialogDescription>
            Tu opinión nos ayuda a mejorar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main reason */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              ¿Por qué deseas eliminar esta solicitud/oferta? *
            </Label>
            <RadioGroup value={mainReason} onValueChange={setMainReason}>
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason} className="flex items-start space-x-2">
                  <RadioGroupItem value={reason} id={reason} className="mt-1" />
                  <Label
                    htmlFor={reason}
                    className="text-sm font-normal cursor-pointer leading-relaxed"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Other reason text - only show if "Otro motivo" is selected */}
          {isOtherSelected && (
            <div className="space-y-2">
              <Label htmlFor="otherReason" className="text-sm font-medium">
                Por favor especifica el motivo *
              </Label>
              <Textarea
                id="otherReason"
                placeholder="Escribe tu motivo aquí..."
                value={otherReasonText}
                onChange={(e) => setOtherReasonText(e.target.value)}
                maxLength={120}
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {otherReasonText.length}/120 caracteres
              </p>
            </div>
          )}

          {/* Improvement suggestion - optional */}
          <div className="space-y-2">
            <Label htmlFor="improvement" className="text-sm font-medium">
              ¿Qué hubiéramos podido mejorar? (opcional)
            </Label>
            <Textarea
              id="improvement"
              placeholder="Tus sugerencias son valiosas para nosotros..."
              value={improvementText}
              onChange={(e) => setImprovementText(e.target.value)}
              maxLength={120}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {improvementText.length}/120 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full sm:w-auto"
          >
            Enviar y eliminar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
