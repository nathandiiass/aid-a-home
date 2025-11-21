import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface SpecialistProblemSurveyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { mainProblem: string; otherProblemText?: string }) => void;
}

const PROBLEM_REASONS = [
  'El especialista no llegó',
  'El especialista no responde mensajes o llamadas',
  'El especialista cambió el precio acordado',
  'El especialista pidió cancelar sin motivo válido',
  'Problemas de seguridad / comportamiento inapropiado',
  'Otro problema'
];

export function SpecialistProblemSurvey({ open, onOpenChange, onSubmit }: SpecialistProblemSurveyProps) {
  const isMobile = useIsMobile();
  const [mainProblem, setMainProblem] = useState('');
  const [otherProblemText, setOtherProblemText] = useState('');

  const isValid = mainProblem && (mainProblem !== 'Otro problema' || otherProblemText.trim());

  const handleSubmit = () => {
    if (!isValid) return;

    onSubmit({
      mainProblem,
      otherProblemText: mainProblem === 'Otro problema' ? otherProblemText : undefined
    });

    // Reset form
    setMainProblem('');
    setOtherProblemText('');
  };

  const handleCancel = () => {
    setMainProblem('');
    setOtherProblemText('');
    onOpenChange(false);
  };

  const content = (
    <>
      <div className="space-y-4 py-4">
        <RadioGroup value={mainProblem} onValueChange={setMainProblem}>
          <div className="space-y-3">
            {PROBLEM_REASONS.map((reason) => (
              <div key={reason} className="flex items-start space-x-3">
                <RadioGroupItem value={reason} id={reason} className="mt-0.5" />
                <Label htmlFor={reason} className="text-sm font-normal cursor-pointer leading-relaxed">
                  {reason}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        {mainProblem === 'Otro problema' && (
          <Textarea
            placeholder="Por favor, describe el problema"
            value={otherProblemText}
            onChange={(e) => setOtherProblemText(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80vh] rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-0">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-xl">¿Qué problema tuviste con el especialista?</DrawerTitle>
            <DrawerDescription>
              Selecciona el motivo principal
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto max-h-[50vh]">
            {content}
          </div>
          <DrawerFooter className="flex-row gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid}
              className="flex-1 bg-rappi-green hover:bg-rappi-green/90 text-white"
            >
              Enviar reporte
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
          <DialogTitle className="text-xl">¿Qué problema tuviste con el especialista?</DialogTitle>
          <DialogDescription>
            Selecciona el motivo principal
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid}
            className="bg-rappi-green hover:bg-rappi-green/90 text-white"
          >
            Enviar reporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
