import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RejectRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, otherText?: string) => void;
}

const REJECT_REASONS = [
  { value: "no_disponibilidad", label: "No tengo disponibilidad para la fecha solicitada." },
  { value: "precio_no_corresponde", label: "El precio o presupuesto esperado no corresponde al trabajo." },
  { value: "fuera_habilidades", label: "El trabajo solicitado no está dentro de mis habilidades o servicios." },
  { value: "fuera_zona", label: "La ubicación está fuera de mi zona de cobertura." },
  { value: "descripcion_poco_clara", label: "La descripción del servicio es poco clara o insuficiente." },
  { value: "no_interesa", label: "No me interesa tomar este servicio." },
  { value: "exceso_trabajo", label: "Tengo exceso de trabajo / carga actual muy alta." },
  { value: "problema_app", label: "Problemas con la app (error o confusión)." },
  { value: "otro", label: "Otro motivo" },
];

export function RejectRequestDialog({ open, onOpenChange, onConfirm }: RejectRequestDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherText, setOtherText] = useState("");

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason, selectedReason === "otro" ? otherText : undefined);
    setSelectedReason("");
    setOtherText("");
  };

  const handleCancel = () => {
    setSelectedReason("");
    setOtherText("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Por qué deseas rechazar esta solicitud?</AlertDialogTitle>
          <AlertDialogDescription>
            Selecciona el motivo principal:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-3">
          {REJECT_REASONS.map((reason) => (
            <div key={reason.value} className="flex items-start space-x-3">
              <RadioGroupItem value={reason.value} id={reason.value} className="mt-1" />
              <Label htmlFor={reason.value} className="font-normal cursor-pointer leading-relaxed">
                {reason.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selectedReason === "otro" && (
          <div className="mt-4">
            <Label htmlFor="other-text" className="text-sm font-medium mb-2 block">
              Describe el motivo
            </Label>
            <Textarea
              id="other-text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Escribe aquí el motivo..."
              className="min-h-[80px]"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === "otro" && !otherText.trim())}
            className="bg-red-600 hover:bg-red-700"
          >
            Confirmar rechazo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
