import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface SummaryStepProps {
  data: RequestData;
  goToStep: (step: number) => void;
}

const SummaryStep = ({ data, goToStep }: SummaryStepProps) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editOrderId = searchParams.get('edit');
  const isEditMode = !!editOrderId;

  const handlePublish = async () => {
    // Check if user is logged in
    if (!user) {
      // Save request data to localStorage
      localStorage.setItem('pendingRequest', JSON.stringify(data));
      toast.info("Inicia sesión para publicar tu solicitud");
      navigate("/auth");
      return;
    }

    // Validate required fields
    const requestSchema = z.object({
      actividad: z.string().min(1, "Actividad requerida").max(200),
      especialista: z.string().min(1, "Especialista requerido").max(200),
      serviceTitle: z.string().min(10, "Título debe tener al menos 10 caracteres").max(200),
      serviceDescription: z.string().min(20, "Descripción debe tener al menos 20 caracteres").max(2000),
      budgetMin: z.number().positive().optional(),
      budgetMax: z.number().positive().optional(),
      date: z.date().optional(),
      locationId: z.string().uuid().optional(),
    });

    try {
      // Validate input
      const validatedData = requestSchema.parse({
        actividad: data.actividad,
        especialista: data.especialista,
        serviceTitle: data.serviceTitle,
        serviceDescription: data.serviceDescription,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        date: data.date,
        locationId: data.location?.id,
      });

      setIsPublishing(true);

      // Upload evidence files to storage if any
      let evidenceUrls: string[] = [];
      if (data.evidence && data.evidence.length > 0) {
        // Filter out any undefined or invalid files
        const validFiles = data.evidence.filter((file): file is File => 
          file instanceof File && file.name && file.size > 0
        );

        const uploadPromises = validFiles.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('specialist-documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data, error: urlError } = await supabase.storage
            .from('specialist-documents')
            .createSignedUrl(fileName, 31536000); // 1 year expiry

          if (urlError) throw urlError;

          return data.signedUrl;
        });

        evidenceUrls = await Promise.all(uploadPromises);
      }

      // Insert or update service request
      if (isEditMode) {
        // Update existing request
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({
            activity: validatedData.actividad,
            category: validatedData.especialista,
            service_title: validatedData.serviceTitle,
            service_description: validatedData.serviceDescription,
            status: 'active',
            price_min: validatedData.budgetMin || null,
            price_max: validatedData.budgetMax || null,
            scheduled_date: validatedData.date ? validatedData.date.toISOString().split('T')[0] : null,
            time_start: data.timeStart || null,
            time_end: data.timeEnd || null,
            time_preference: data.timeOption || null,
            is_urgent: data.isUrgent || false,
            location_id: validatedData.locationId || null,
            description: null,
            evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null,
          })
          .eq('id', editOrderId);

        if (updateError) throw updateError;

        toast.success("¡Solicitud actualizada exitosamente!");
      } else {
        // Create new request
        const { error: insertError } = await supabase
          .from('service_requests')
          .insert({
            user_id: user.id,
            activity: validatedData.actividad,
            category: validatedData.especialista,
            service_title: validatedData.serviceTitle,
            service_description: validatedData.serviceDescription,
            status: 'active',
            price_min: validatedData.budgetMin || null,
            price_max: validatedData.budgetMax || null,
            scheduled_date: validatedData.date ? validatedData.date.toISOString().split('T')[0] : null,
            time_start: data.timeStart || null,
            time_end: data.timeEnd || null,
            time_preference: data.timeOption || null,
            is_urgent: data.isUrgent || false,
            location_id: validatedData.locationId || null,
            description: null,
            evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        toast.success("¡Solicitud publicada exitosamente!");
      }
      // Clear pending request
      localStorage.removeItem('pendingRequest');

      navigate("/orders?tab=active");
    } catch (error: any) {
      console.error('Error publishing request:', error);
      
      if (error instanceof z.ZodError) {
        toast.error("Por favor completa todos los campos requeridos");
      } else {
        toast.error(error.message || "Error al publicar la solicitud");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "No especificada";
    // Ensure date is a Date object (in case it's a string from localStorage)
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateObj);
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
            <Edit className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg">{data.serviceTitle}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToStep(0)}
                className="h-7 text-xs"
              >
                Editar
              </Button>
            </div>
            <p className="text-muted-foreground mb-2">{data.especialista}</p>
            <p className="text-sm text-muted-foreground mb-3">{data.serviceDescription}</p>
            
            {/* Evidence section */}
            {data.evidence && data.evidence.filter((file): file is File => file instanceof File).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="font-medium text-sm mb-3">Evidencias</p>
                <div className="grid grid-cols-3 gap-2">
                  {data.evidence.filter((file): file is File => file instanceof File).map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    const isVideo = file.type.startsWith('video/');
                    const preview = URL.createObjectURL(file);
                    
                    return (
                      <div 
                        key={index} 
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          if (isImage) {
                            window.open(preview, '_blank');
                          }
                        }}
                      >
                        {isImage && (
                          <img 
                            src={preview} 
                            alt={`Evidencia ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isVideo && (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Camera className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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


      <Button
        onClick={handlePublish}
        disabled={isPublishing}
        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        size="lg"
      >
        {isPublishing ? "Guardando..." : isEditMode ? "Guardar cambios" : "Publicar solicitud"}
      </Button>
    </div>
  );
};

export default SummaryStep;
