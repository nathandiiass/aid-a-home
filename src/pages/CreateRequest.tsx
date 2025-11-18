import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceSelector from "@/components/request/ServiceSelector";
import BudgetStep from "@/components/request/BudgetStep";
import DateTimeStep from "@/components/request/DateTimeStep";
import LocationStep from "@/components/request/LocationStep";
import SummaryStep from "@/components/request/SummaryStep";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RequestData {
  categoria: string;
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const editOrderId = searchParams.get('edit');
  const { 
    selectedType,
    especialista: initialEspecialista, 
    actividad: initialActividad, 
    categoria: initialCategoria,
    serviceTitle: initialServiceTitle 
  } = location.state || {};
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(!!editOrderId);
  const [requestData, setRequestData] = useState<RequestData>({
    categoria: initialCategoria || "",
    actividad: initialActividad || "",
    serviceTitle: initialServiceTitle || "",
    serviceDescription: "",
    noBudget: false,
    isUrgent: false,
    evidence: [],
  });

  // Load order data for editing
  useEffect(() => {
    const loadOrderForEdit = async () => {
      if (!editOrderId) return;

      try {
        const { data: order, error } = await supabase
          .from('service_requests')
          .select(`
            *,
            locations(*)
          `)
          .eq('id', editOrderId)
          .single();

        if (error) throw error;

        if (order) {
          // Map order data to request data format
          setRequestData({
            categoria: order.category || "",
            actividad: order.activity || "",
            serviceTitle: order.service_title || "",
            serviceDescription: order.service_description || "",
            budgetMin: order.price_min || undefined,
            budgetMax: order.price_max || undefined,
            noBudget: !order.price_min && !order.price_max,
            date: order.scheduled_date ? new Date(order.scheduled_date) : undefined,
            timeOption: order.time_start && order.time_end ? 'specific' : undefined,
            timeStart: order.time_start || undefined,
            timeEnd: order.time_end || undefined,
            isUrgent: false,
            location: order.locations ? {
              id: order.location_id || undefined,
              lat: order.locations.lat || 0,
              lng: order.locations.lng || 0,
              address: `${order.locations.street} ${order.locations.ext_number || ''}, ${order.locations.neighborhood || ''}, ${order.locations.city}, ${order.locations.state}`.trim(),
              label: order.locations.label || ""
            } : undefined,
            evidence: [],
          });
          
          // Start at summary step (step 4)
          setStep(4);
        }
      } catch (error) {
        console.error('Error loading order:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar la solicitud para editar'
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrderForEdit();
  }, [editOrderId, toast]);

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
      setStep(4); // Go to summary
    }
  }, []);

  const updateData = (data: Partial<RequestData>) => {
    setRequestData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    // Validate required fields for step 0
    if (step === 0) {
      if (!requestData.categoria || 
          !requestData.serviceTitle?.trim() || 
          requestData.serviceTitle.trim().length < 10 ||
          !requestData.serviceDescription?.trim() ||
          requestData.serviceDescription.trim().length < 20) {
        return;
      }
    }
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const goToStep = (targetStep: number) => {
    setStep(targetStep);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Logo className="pt-4 pb-2" />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => step === 0 ? navigate("/") : prevStep()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">
                {requestData.actividad || "Nueva solicitud"}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {requestData.categoria || "Selecciona un servicio"}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {[0, 1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-rappi-green" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 0 && (
          <div className="space-y-4">
            <ServiceSelector
              categoria={requestData.categoria}
              actividad={requestData.actividad}
              serviceTitle={requestData.serviceTitle}
              serviceDescription={requestData.serviceDescription}
              evidence={requestData.evidence}
              onCategoriaChange={(value) => updateData({ categoria: value })}
              onActividadChange={(value) => updateData({ actividad: value })}
              onServiceTitleChange={(value) => updateData({ serviceTitle: value })}
              onServiceDescriptionChange={(value) => updateData({ serviceDescription: value })}
              onEvidenceChange={(files) => updateData({ evidence: files })}
            />
            <Button
              onClick={nextStep}
              disabled={
                !requestData.categoria || 
                !requestData.serviceTitle?.trim() || 
                requestData.serviceTitle.trim().length < 10 ||
                !requestData.serviceDescription?.trim() ||
                requestData.serviceDescription.trim().length < 20
              }
              className="w-full bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-12 font-semibold disabled:opacity-50"
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
          <SummaryStep data={requestData} goToStep={goToStep} />
        )}
      </div>
    </div>
  );
};

export default CreateRequest;
