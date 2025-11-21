import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CancelWorkSurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { mainReason: string; otherReasonText?: string; improvementText?: string }) => void;
}

const CANCELLATION_REASONS = [
  'Ya no necesito el servicio',
  'Encontré otra opción fuera de la app',
  'El precio final no me convenció',
  'Cambié la fecha u horarios y ya no me funciona',
  'Me equivoqué al contratar el servicio',
  'La información del servicio no era clara',
  'Problemas personales / imprevistos',
  'Problemas con la app (error, confusión)',
  'Otro motivo'
];

export function CancelWorkSurvey({ open, onOpenChange, onSubmit }: CancelWorkSurveyProps) {
  const isMobile = useIsMobile();
  const [mainReason, setMainReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [improvementText, setImprovementText] = useState('');

  const isValid = mainReason && (mainReason !== 'Otro motivo' || otherReasonText.trim());

  const handleSubmit = () => {
    if (!isValid) return;

    onSubmit({
      mainReason,
      otherReasonText: mainReason === 'Otro motivo' ? otherReasonText : undefined,
      improvementText: improvementText || undefined
    });

    // Reset form
    setMainReason('');
    setOtherReasonText('');
    setImprovementText('');
  };

  const handleCancel = () => {
    setMainReason('');
    setOtherReasonText('');
    setImprovementText('');
    onOpenChange(false);
  };

  const content = (
    <>
      <div className="space-y-4 py-4">
        <RadioGroup value={mainReason} onValueChange={setMainReason}>
          <div className="space-y-3">
            {CANCELLATION_REASONS.map((reason) => (
              <div key={reason} className="flex items-start space-x-3">
                <RadioGroupItem value={reason} id={reason} className="mt-0.5" />
                <Label htmlFor={reason} className="text-sm font-normal cursor-pointer leading-relaxed">
                  {reason}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        {mainReason === 'Otro motivo' && (
          <Textarea
            placeholder="Por favor, explícanos el motivo"
            value={otherReasonText}
            onChange={(e) => setOtherReasonText(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        )}

        <div className="pt-4 space-y-2">
          <Label htmlFor="improvement" className="text-sm font-semibold">
            ¿Cómo podemos mejorar? (opcional)
          </Label>
          <Textarea
            id="improvement"
            placeholder="Tus sugerencias nos ayudan a mejorar"
            value={improvementText}
            onChange={(e) => setImprovementText(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-0">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-xl">¿Por qué deseas cancelar este servicio?</DrawerTitle>
            <DrawerDescription>
              Selecciona el motivo principal
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto max-h-[55vh]">
            {content}
          </div>
          <DrawerFooter className="flex-row gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Volver
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid}
              className="flex-1 bg-rappi-green hover:bg-rappi-green/90 text-white"
            >
              Enviar y cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">¿Por qué deseas cancelar este servicio?</DialogTitle>
          <DialogDescription>
            Selecciona el motivo principal
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Volver
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid}
            className="bg-rappi-green hover:bg-rappi-green/90 text-white"
          >
            Enviar y cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
