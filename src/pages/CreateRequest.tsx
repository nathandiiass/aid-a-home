import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceSelector from "@/components/request/ServiceSelector";
import BudgetStep from "@/components/request/BudgetStep";
import DateTimeStep from "@/components/request/DateTimeStep";
import LocationStep from "@/components/request/LocationStep";
import EvidenceStep from "@/components/request/EvidenceStep";
import SummaryStep from "@/components/request/SummaryStep";
import { Logo } from "@/components/Logo";

export interface RequestData {
  especialista: string;
  actividad: string;
  serviceTitle: string;
  serviceDescription: string;
  budgetMin?: number;
  budgetMax?: number;
  noBudget: boolean;
  date?: Date;
  timeOption?: string;
  timeStart?: string;
  timeEnd?: string;
  isUrgent: boolean;
  location?: {
    id?: string;
    lat: number;
    lng: number;
    address: string;
    label: string;
  };
  evidence: File[];
}

const CreateRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { especialista: initialEspecialista, actividad: initialActividad, categoria: initialCategoria } = location.state || {};
  
  const [step, setStep] = useState(0);
  const [requestData, setRequestData] = useState<RequestData>({
    especialista: initialEspecialista || "",
    actividad: initialActividad || "",
    serviceTitle: "",
    serviceDescription: "",
    noBudget: false,
    isUrgent: false,
    evidence: [],
  });

  // Check for pending request after login
  useEffect(() => {
    const pendingRequest = localStorage.getItem('pendingRequest');
    if (pendingRequest) {
      const data = JSON.parse(pendingRequest);
      // Convert date string back to Date object
      if (data.date) {
        data.date = new Date(data.date);
      }
      setRequestData(data);
      setStep(5); // Go to summary
    }
  }, []);

  const updateData = (data: Partial<RequestData>) => {
    setRequestData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    // Validate service selection before moving forward
    if (step === 0 && (!requestData.especialista || !requestData.actividad)) {
      return;
    }
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const goToStep = (targetStep: number) => {
    setStep(targetStep);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Logo className="pt-4 pb-2" />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => step === 0 ? navigate("/") : prevStep()}
              className="shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {requestData.actividad || "Nueva solicitud"}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {requestData.especialista || "Selecciona un servicio"}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {step === 0 && (
          <div className="space-y-6">
            <ServiceSelector
              especialista={requestData.especialista}
              actividad={requestData.actividad}
              serviceTitle={requestData.serviceTitle}
              serviceDescription={requestData.serviceDescription}
              categoria={initialCategoria}
              onEspecialistaChange={(value) => updateData({ especialista: value })}
              onActividadChange={(value) => updateData({ actividad: value })}
              onServiceTitleChange={(value) => updateData({ serviceTitle: value })}
              onServiceDescriptionChange={(value) => updateData({ serviceDescription: value })}
            />
            <Button
              onClick={nextStep}
              disabled={
                !requestData.especialista || 
                !requestData.serviceTitle?.trim() || 
                requestData.serviceTitle.trim().length < 10 ||
                !requestData.serviceDescription?.trim() ||
                requestData.serviceDescription.trim().length < 20
              }
              className="w-full h-12 text-base"
              size="lg"
            >
              Continuar
            </Button>
          </div>
        )}
        {step === 1 && (
          <BudgetStep data={requestData} updateData={updateData} onNext={nextStep} />
        )}
        {step === 2 && (
          <DateTimeStep data={requestData} updateData={updateData} onNext={nextStep} />
        )}
        {step === 3 && (
          <LocationStep data={requestData} updateData={updateData} onNext={nextStep} />
        )}
        {step === 4 && (
          <EvidenceStep data={requestData} updateData={updateData} onNext={nextStep} />
        )}
        {step === 5 && (
          <SummaryStep data={requestData} goToStep={goToStep} />
        )}
      </div>
    </div>
  );
};

export default CreateRequest;
