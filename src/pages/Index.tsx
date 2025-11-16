import { useState, useEffect } from "react";
import ServiceSearch from "@/components/ServiceSearch";
import { BottomNav } from "@/components/BottomNav";
import { InProgressWorks } from "@/components/InProgressWorks";
import { Logo } from "@/components/Logo";
import { HowItWorksStep } from "@/components/HowItWorksStep";
import step1Image from "@/assets/step-1-busca.png";
import step2Image from "@/assets/step-2-completa.png";
import step3Image from "@/assets/step-3-recibe.png";
import step4Image from "@/assets/step-4-elige.png";
const howItWorksSteps = [{
  stepNumber: 1,
  title: "Busca al especialista que necesitas",
  imageSrc: step1Image,
  imagePosition: "left" as const
}, {
  stepNumber: 2,
  title: "Completa los detalles",
  imageSrc: step2Image,
  imagePosition: "right" as const
}, {
  stepNumber: 3,
  title: "Recibe cotizaciones",
  imageSrc: step3Image,
  imagePosition: "left" as const
}, {
  stepNumber: 4,
  title: "Elige al mejor y agenda tu servicio",
  imageSrc: step4Image,
  imagePosition: "right" as const
}];
const Index = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with search - STICKY with BLUR */}
      <div className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-md' 
          : 'bg-white'
      }`}>
        <div className="container max-w-2xl mx-auto px-4 py-4">
          {!scrolled && (
            <div className="mb-4 animate-fade-in">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Aid a Home</h1>
              <p className="text-gray-600 text-sm">
                Encuentra especialistas para tus servicios domésticos
              </p>
            </div>
          )}
          
          <ServiceSearch />
        </div>
      </div>

      {/* In Progress Works */}
      <div className="container max-w-2xl mx-auto px-4 pt-4">
        <InProgressWorks />
      </div>

      {/* How it works */}
      <div className="container max-w-md mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          ¿Cómo funciona?
        </h2>
        
        {howItWorksSteps.map(step => <HowItWorksStep key={step.stepNumber} stepNumber={step.stepNumber} title={step.title} imageSrc={step.imageSrc} imagePosition={step.imagePosition} />)}
      </div>

      <BottomNav />
    </div>;
};
export default Index;