import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BudgetStep from "@/components/request/BudgetStep";
import DateTimeStep from "@/components/request/DateTimeStep";
import LocationStep from "@/components/request/LocationStep";
import EvidenceStep from "@/components/request/EvidenceStep";
import SummaryStep from "@/components/request/SummaryStep";

export interface RequestData {
  especialista: string;
  actividad: string;
  budgetMin?: number;
  budgetMax?: number;
  noBudget: boolean;
  date?: Date;
  timeOption?: string;
  timeStart?: string;
  timeEnd?: string;
  isUrgent: boolean;
  location?: {
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
  const { especialista, actividad } = location.state || {};
  
  const [step, setStep] = useState(1);
  const [requestData, setRequestData] = useState<RequestData>({
    especialista: especialista || "",
    actividad: actividad || "",
    noBudget: false,
    isUrgent: false,
    evidence: [],
  });

  if (!especialista || !actividad) {
    navigate("/");
    return null;
  }

  const updateData = (data: Partial<RequestData>) => {
    setRequestData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const goToStep = (targetStep: number) => {
    setStep(targetStep);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => step === 1 ? navigate("/") : prevStep()}
              className="shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{actividad}</h1>
              <p className="text-sm text-muted-foreground truncate">{especialista}</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
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
