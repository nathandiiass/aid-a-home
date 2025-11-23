import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    targetSelector: ".service-search-container", // Search bar
    spotlightSize: { width: "calc(100% - 2rem)", height: "60px" },
    spotlightPosition: { top: "70px", left: "1rem", right: "1rem" }
  },
  {
    image: tutorialCreateImage,
    title: "Crear nueva solicitud",
    subtitle: "(2da forma de crear una solicitud)",
    description: "Toca el botón '+' para crear una solicitud y enviarla a los especialistas.",
    targetSelector: ".fab-button", // FAB button
    spotlightSize: { width: "64px", height: "64px" },
    spotlightPosition: { bottom: "7rem", right: "1.5rem" }
  },
  {
    image: tutorialOrdersImage,
    title: "Tus solicitudes",
    subtitle: "",
    description: "Aquí ves tus solicitudes activas, en borradores o ya completadas. Adminístralos cuando lo necesites.",
    targetSelector: ".nav-orders", // Orders nav item
    spotlightSize: { width: "80px", height: "64px" },
    spotlightPosition: { bottom: "0", left: "33.33%" }
  },
  {
    image: tutorialAccountImage,
    title: "Tu cuenta",
    subtitle: "",
    description: "Administra tus datos, direcciones y ajustes. Desde aquí también puedes registrarte o activar el modo especialista si ofreces algún servicio.",
    targetSelector: ".nav-account", // Account nav item
    spotlightSize: { width: "80px", height: "64px" },
    spotlightPosition: { bottom: "0", right: "0" }
  }
];

export const TutorialDialog = ({ open, onOpenChange }: TutorialDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

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

  if (!open) return null;

  const step = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      {/* Dark overlay with spotlight cutout */}
      <div 
        className="absolute inset-0 bg-black/80"
        style={{
          boxShadow: step.spotlightPosition ? 
            `0 0 0 9999px rgba(0, 0, 0, 0.8),
             inset ${step.spotlightPosition.left || 'auto'} 
             ${step.spotlightPosition.top || 'auto'} 
             0 0 rgba(0, 0, 0, 0)` 
            : undefined
        }}
      />

      {/* Spotlight highlight on actual element */}
      <div
        className="absolute border-4 border-primary rounded-2xl pointer-events-none animate-pulse"
        style={{
          ...step.spotlightPosition,
          width: step.spotlightSize.width,
          height: step.spotlightSize.height,
          boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px 8px rgba(59, 130, 246, 0.4)"
        }}
      />

      {/* Content card at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 animate-slide-in-bottom">
        <Card className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto">
          {/* Screenshot preview */}
          <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
            <img 
              src={step.image} 
              alt={step.title}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="px-6 py-6">
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
        </Card>
      </div>
    </div>
  );
};
