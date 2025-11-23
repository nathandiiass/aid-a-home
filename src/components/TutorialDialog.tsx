import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Plus, Receipt, UserCircle } from "lucide-react";

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSteps = [
  {
    icon: Search,
    title: "Encuentra tu servicio",
    subtitle: "(1era forma de crear una solicitud)",
    description: "Escribe lo que necesitas y elige la categoría para enviar tu solicitud.",
    iconColor: "text-primary",
    iconBg: "bg-primary/10"
  },
  {
    icon: Plus,
    title: "Crear nueva solicitud",
    subtitle: "(2da forma de crear una solicitud)",
    description: "Toca el botón '+' para crear una solicitud y enviarla a los especialistas.",
    iconColor: "text-rappi-green",
    iconBg: "bg-rappi-green/10"
  },
  {
    icon: Receipt,
    title: "Tus solicitudes",
    subtitle: "",
    description: "Aquí ves tus solicitudes activas, en borradores o ya completadas. Adminístralos cuando lo necesites.",
    iconColor: "text-primary",
    iconBg: "bg-primary/10"
  },
  {
    icon: UserCircle,
    title: "Tu cuenta",
    subtitle: "",
    description: "Administra tus datos, direcciones y ajustes. Desde aquí también puedes registrarte o activar el modo especialista si ofreces algún servicio.",
    iconColor: "text-gray-700",
    iconBg: "bg-gray-100"
  }
];

export const TutorialDialog = ({ open, onOpenChange }: TutorialDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      setCurrentStep(0);
    }
  };

  const handleDismiss = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-0 gap-0 border-none">
        <div className="flex flex-col items-center px-8 pt-12 pb-8">
          {/* Icon */}
          <div className={`w-32 h-32 rounded-full ${step.iconBg} flex items-center justify-center mb-8`}>
            <Icon className={`w-16 h-16 ${step.iconColor}`} strokeWidth={1.5} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {step.title}
          </h2>
          
          {/* Subtitle */}
          {step.subtitle && (
            <p className="text-sm text-gray-600 text-center mb-4">
              {step.subtitle}
            </p>
          )}

          {/* Description */}
          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            {step.description}
          </p>

          {/* Pagination dots */}
          <div className="flex gap-2 mb-8">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep ? "bg-gray-900 w-8" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Next button */}
          <Button
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-14 text-lg font-semibold mb-4"
          >
            {currentStep < tutorialSteps.length - 1 ? "SIGUIENTE" : "EMPEZAR"}
          </Button>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="text-gray-600 font-medium"
          >
            Saltar tutorial
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
