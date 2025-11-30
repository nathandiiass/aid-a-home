import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ServiceSearch from "@/components/ServiceSearch";
import { BottomNav } from "@/components/BottomNav";
import { InProgressWorks } from "@/components/InProgressWorks";
import { Logo } from "@/components/Logo";
import { TutorialDialog } from "@/components/TutorialDialog";
import { Plus, HelpCircle } from "lucide-react";
import logoEnlazo from "@/assets/logo-enlazo.png";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleCreateRequest = () => {
    if (!user) {
      toast.info("Inicia sesión para crear una solicitud");
      navigate("/auth");
      return;
    }
    navigate('/create-request');
  };
  return <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with search - STICKY with BLUR */}
      <div className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-md' : 'bg-white'}`}>
        <div className="container max-w-2xl mx-auto px-4 py-4">
          {!scrolled && <div className="mb-4 animate-fade-in">
              <img src={logoEnlazo} alt="enlazo" className="h-8 max-w-[40%] mb-1 object-contain" />
              <p className="text-gray-600 text-sm font-semibold">
                Cotiza, compara y elige tu especialista.
              </p>
            </div>}
          
          <div className="service-search-container">
            <ServiceSearch />
          </div>
        </div>
      </div>

      {/* In Progress Works */}
      <div className="container max-w-2xl mx-auto px-4 pt-4">
        <InProgressWorks />
      </div>

      {/* Tutorial Card */}
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-white border-0 rounded-2xl p-6 cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={() => setShowTutorial(true)}>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-rappi-orange to-rappi-green flex items-center justify-center rounded-2xl shadow-none">
              <HelpCircle strokeWidth={2.5} className="w-8 h-8 text-slate-950" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                ¿Cómo usar la app?
              </h3>
              <p className="text-sm text-gray-600">
                Aprende a crear solicitudes y gestionar tus servicios
              </p>
            </div>
            <div className="text-rappi-orange">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <TutorialDialog open={showTutorial} onOpenChange={setShowTutorial} />

      <BottomNav />
      
      {/* Floating Action Button */}
      <button onClick={handleCreateRequest} className="fab-button fixed bottom-24 right-6 w-14 h-14 bg-rappi-green text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 z-40 flex items-center justify-center" aria-label="Crear nueva solicitud">
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>
    </div>;
};
export default Index;