import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface WorkOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptionSelect: (option: 'cancel' | 'finish' | 'problem') => void;
}

export function WorkOptionsSheet({ open, onOpenChange, onOptionSelect }: WorkOptionsSheetProps) {
  const options = [
    {
      id: 'cancel' as const,
      label: 'Cancelar',
      description: 'Cancelar este servicio',
      icon: XCircle,
      className: 'text-red-600'
    },
    {
      id: 'finish' as const,
      label: 'Finalizar Servicio',
      description: 'Marcar como completado',
      icon: CheckCircle2,
      className: 'text-rappi-green'
    },
    {
      id: 'problem' as const,
      label: 'Problemas con el especialista',
      description: 'Reportar un problema',
      icon: AlertCircle,
      className: 'text-orange-600'
    }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-0 p-0"
      >
        <div className="p-6 space-y-2">
          <h3 className="text-lg font-bold text-foreground text-center">
            Opciones
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Selecciona una acción
          </p>
        </div>

        <div className="pb-6 px-4 space-y-2">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => onOptionSelect(option.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 ${option.className}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
