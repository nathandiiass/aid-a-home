import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RequestData } from "@/pages/CreateRequest";
import {
  DollarSign,
  Calendar,
  MapPin,
  Camera,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface SummaryStepProps {
  data: RequestData;
  goToStep: (step: number) => void;
}

const SummaryStep = ({ data, goToStep }: SummaryStepProps) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePublish = async () => {
    // Check if user is logged in
    if (!user) {
      // Save request data to localStorage
      localStorage.setItem('pendingRequest', JSON.stringify(data));
      toast.info("Inicia sesión para publicar tu solicitud");
      navigate("/auth");
      return;
    }

    setIsPublishing(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Clear pending request
    localStorage.removeItem('pendingRequest');
    
    setIsPublishing(false);
    navigate("/success", { state: { specialistsCount: 12 } });
  };

  const formatDate = (date?: Date) => {
    if (!date) return "No especificada";
    return new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  };

  const formatTimeOption = (option?: string) => {
    const options: Record<string, string> = {
      morning: "Mañana (8:00 - 12:00)",
      afternoon: "Tarde (12:00 - 18:00)",
      evening: "Noche (18:00 - 22:00)",
      anytime: "Cualquier hora",
      specific: `${data.timeStart} - ${data.timeEnd}`,
      urgent: "¡Urgente!",
    };
    return options[option || ""] || "No especificado";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Resumen</h2>
        <p className="text-muted-foreground">
          Revisa tu solicitud antes de publicarla
        </p>
      </div>

      {/* Service info */}
      <Card className="p-4 bg-gradient-card border-border">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-lg">
              {data.actividad.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{data.actividad}</h3>
            <p className="text-muted-foreground">{data.especialista}</p>
          </div>
        </div>
      </Card>

      {/* Budget */}
      <Card className="p-4 border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">Presupuesto</p>
              {data.noBudget ? (
                <p className="text-muted-foreground">
                  Sin presupuesto definido
                </p>
              ) : (
                <p className="text-muted-foreground">
                  ${data.budgetMin} - ${data.budgetMax}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToStep(1)}
            className="shrink-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Date & Time */}
      <Card className="p-4 border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">Fecha y horario</p>
              <p className="text-muted-foreground">{formatDate(data.date)}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {formatTimeOption(data.timeOption)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToStep(2)}
            className="shrink-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Location */}
      <Card className="p-4 border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium mb-1">{data.location?.label}</p>
              <p className="text-muted-foreground text-sm">
                {data.location?.address}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToStep(3)}
            className="shrink-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Evidence */}
      <Card className="p-4 border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">Evidencias</p>
              <p className="text-muted-foreground">
                {data.evidence.length > 0
                  ? `${data.evidence.length} archivo${
                      data.evidence.length !== 1 ? "s" : ""
                    } adjunto${data.evidence.length !== 1 ? "s" : ""}`
                  : "Sin archivos"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToStep(4)}
            className="shrink-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Button
        onClick={handlePublish}
        disabled={isPublishing}
        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        size="lg"
      >
        {isPublishing ? "Publicando..." : "Publicar solicitud"}
      </Button>
    </div>
  );
};

export default SummaryStep;
