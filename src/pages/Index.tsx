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
  return <div className="min-h-screen bg-background pb-20">
      {/* Logo */}
      
      
      {/* Header with search - STICKY */}
      <div className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Aid a Home</h1>
            <p className="text-muted-foreground text-sm">
              Encuentra especialistas para tus servicios domésticos
            </p>
          </div>
          
          <ServiceSearch />
        </div>
      </div>

      {/* In Progress Works */}
      <div className="container max-w-2xl mx-auto px-4">
        <InProgressWorks />
      </div>

      {/* How it works */}
      <div className="container max-w-md mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          ¿Cómo funciona?
        </h2>
        
        {howItWorksSteps.map(step => <HowItWorksStep key={step.stepNumber} stepNumber={step.stepNumber} title={step.title} imageSrc={step.imageSrc} imagePosition={step.imagePosition} />)}
      </div>

      <BottomNav />
    </div>;
};
export default Index;