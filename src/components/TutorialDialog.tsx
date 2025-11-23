import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import tutorialSearchImage from "@/assets/tutorial-search.png";
import tutorialCreateImage from "@/assets/tutorial-create.png";
import tutorialOrdersImage from "@/assets/tutorial-orders.png";
import tutorialAccountImage from "@/assets/tutorial-account.png";

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSteps = [
  {
    image: tutorialSearchImage,
    title: "Encuentra tu servicio",
    subtitle: "(1era forma de crear una solicitud)",
    description: "Escribe lo que necesitas y elige la categoría para enviar tu solicitud.",
    highlightPosition: "top" // Highlight search bar at top
  },
  {
    image: tutorialCreateImage,
    title: "Crear nueva solicitud",
    subtitle: "(2da forma de crear una solicitud)",
    description: "Toca el botón '+' para crear una solicitud y enviarla a los especialistas.",
    highlightPosition: "bottom-right" // Highlight FAB button
  },
  {
    image: tutorialOrdersImage,
    title: "Tus solicitudes",
    subtitle: "",
    description: "Aquí ves tus solicitudes activas, en borradores o ya completadas. Adminístralos cuando lo necesites.",
    highlightPosition: "bottom-nav" // Highlight nav item
  },
  {
    image: tutorialAccountImage,
    title: "Tu cuenta",
    subtitle: "",
    description: "Administra tus datos, direcciones y ajustes. Desde aquí también puedes registrarte o activar el modo especialista si ofreces algún servicio.",
    highlightPosition: "bottom-nav-right" // Highlight account nav
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900/95 backdrop-blur-sm rounded-3xl p-0 gap-0 border-none overflow-hidden max-h-[90vh]">
        {/* Screenshot with overlay */}
        <div className="relative w-full aspect-[9/16] bg-gray-100">
          <img 
            src={step.image} 
            alt={step.title}
            className="w-full h-full object-cover"
          />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* Spotlight effect based on position */}
          {step.highlightPosition === "top" && (
            <div className="absolute top-4 left-4 right-4 h-20">
              <div className="absolute inset-0 rounded-2xl border-4 border-primary shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] animate-pulse" />
            </div>
          )}
          
          {step.highlightPosition === "bottom-right" && (
            <div className="absolute bottom-24 right-6 w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-rappi-green shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] animate-pulse" />
            </div>
          )}
          
          {step.highlightPosition === "bottom-nav" && (
            <div className="absolute bottom-4 left-1/4 w-20 h-16">
              <div className="absolute inset-0 rounded-xl border-4 border-primary shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] animate-pulse" />
            </div>
          )}
          
          {step.highlightPosition === "bottom-nav-right" && (
            <div className="absolute bottom-4 right-1/4 w-20 h-16">
              <div className="absolute inset-0 rounded-xl border-4 border-primary shadow-[0_0_0_4000px_rgba(0,0,0,0.6)] animate-pulse" />
            </div>
          )}
        </div>

        {/* Content overlay at bottom */}
        <div className="bg-white px-6 py-8">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
            {step.title}
          </h2>
          
          {/* Subtitle */}
          {step.subtitle && (
            <p className="text-xs text-gray-600 text-center mb-3">
              {step.subtitle}
            </p>
          )}

          {/* Description */}
          <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
            {step.description}
          </p>

          {/* Pagination dots */}
          <div className="flex gap-2 mb-6 justify-center">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? "bg-primary w-8" : "bg-gray-300 w-2"
                }`}
              />
            ))}
          </div>

          {/* Next button */}
          <Button
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 text-base font-semibold mb-3"
          >
            {currentStep < tutorialSteps.length - 1 ? "SIGUIENTE" : "EMPEZAR"}
          </Button>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="w-full text-gray-600 font-medium text-sm"
          >
            Saltar tutorial
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
