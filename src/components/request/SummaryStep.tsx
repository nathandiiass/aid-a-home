import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RequestData } from "@/pages/CreateRequest";
import { DollarSign, Calendar, MapPin, Camera, Edit } from "lucide-react";
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
  const editOrderId = searchParams.get("edit");
  const isEditMode = !!editOrderId;

  const handlePublish = async () => {
    // Check if user is logged in
    if (!user) {
      // Save request data to localStorage
      localStorage.setItem("pendingRequest", JSON.stringify(data));
      toast.info("Inicia sesión para publicar tu solicitud");
      navigate("/auth");
      return;
    }

    // Validate required fields
    const requestSchema = z.object({
      actividad: z.string().optional(),
      especialista: z.string().min(1, "Especialista requerido").max(200),
      serviceTitle: z.string().min(10, "Título debe tener al menos 10 caracteres").max(200),
      serviceDescription: z.string().min(20, "Descripción debe tener al menos 20 caracteres").max(2000),
      budgetMin: z.number().positive().optional(),
      budgetMax: z.number().positive().optional(),
      date: z.date().optional(),
      locationId: z.string().uuid("Debes seleccionar una ubicación").optional(),
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
        const validFiles = data.evidence.filter(
          (file): file is File => file instanceof File && file.name && file.size > 0,
        );

        const uploadPromises = validFiles.map(async (file, index) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from("specialist-documents").upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data, error: urlError } = await supabase.storage
            .from("specialist-documents")
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
          .from("service_requests")
          .update({
            activity: validatedData.actividad || validatedData.serviceTitle,
            category: validatedData.especialista,
            service_title: validatedData.serviceTitle,
            service_description: validatedData.serviceDescription,
            status: "active",
            price_min: validatedData.budgetMin || null,
            price_max: validatedData.budgetMax || null,
            scheduled_date: validatedData.date ? validatedData.date.toISOString().split("T")[0] : null,
            time_start: data.timeStart || null,
            time_end: data.timeEnd || null,
            time_preference: data.timeOption || null,
            is_urgent: data.isUrgent || false,
            location_id: validatedData.locationId || null,
            description: null,
            evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null,
          })
          .eq("id", editOrderId);

        if (updateError) throw updateError;

        toast.success("¡Solicitud actualizada exitosamente!");
      } else {
        // Create new request
        const { error: insertError } = await supabase
          .from("service_requests")
          .insert({
            user_id: user.id,
            activity: validatedData.actividad || validatedData.serviceTitle,
            category: validatedData.especialista,
            service_title: validatedData.serviceTitle,
            service_description: validatedData.serviceDescription,
            status: "active",
            price_min: validatedData.budgetMin || null,
            price_max: validatedData.budgetMax || null,
            scheduled_date: validatedData.date ? validatedData.date.toISOString().split("T")[0] : null,
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
      localStorage.removeItem("pendingRequest");

      navigate("/orders?tab=active");
    } catch (error: any) {
      console.error("Error publishing request:", error);

      if (error instanceof z.ZodError) {
        // Show specific validation errors
        const firstError = error.errors[0];
        if (firstError) {
          toast.error(firstError.message);
        } else {
          toast.error("Por favor completa todos los campos requeridos");
        }
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
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <h2 className="text-xl font-bold mb-2">Resumen</h2>
        <p className="text-muted-foreground text-sm">Revisa tu solicitud antes de publicarla</p>
      </div>

      {/* Service info */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Edit className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg">{data.serviceTitle}</h3>
              <button onClick={() => goToStep(0)} className="text-rappi-green text-sm font-semibold hover:underline">
                Editar
              </button>
            </div>
            <p className="text-muted-foreground text-sm mb-2">{data.especialista}</p>
            <p className="text-sm text-muted-foreground">{data.serviceDescription}</p>

            {/* Evidence section */}
            {data.evidence && data.evidence.filter((file): file is File => file instanceof File).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-semibold text-sm mb-3">Evidencias</p>
                <div className="grid grid-cols-3 gap-2">
                  {data.evidence
                    .filter((file): file is File => file instanceof File)
                    .map((file, index) => {
                      const isImage = file.type.startsWith("image/");
                      const isVideo = file.type.startsWith("video/");
                      const preview = URL.createObjectURL(file);

                      return (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            if (isImage) {
                              window.open(preview, "_blank");
                            }
                          }}
                        >
                          {isImage && (
                            <img src={preview} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
                          )}
                          {isVideo && (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
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
      </div>

      {/* Budget */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-bold mb-1">Presupuesto</p>
              {data.noBudget ? (
                <p className="text-muted-foreground text-sm">Sin presupuesto definido</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  ${data.budgetMin} - ${data.budgetMax}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => goToStep(1)}
            className="text-rappi-green text-sm font-semibold hover:underline flex-shrink-0"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-bold mb-1">Fecha y horario</p>
              <p className="text-muted-foreground text-sm">{formatDate(data.date)}</p>
              <p className="text-muted-foreground text-sm mt-1">{formatTimeOption(data.timeOption)}</p>
            </div>
          </div>
          <button
            onClick={() => goToStep(2)}
            className="text-rappi-green text-sm font-semibold hover:underline flex-shrink-0"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold mb-1">{data.location?.label}</p>
              <p className="text-muted-foreground text-sm">{data.location?.address}</p>
            </div>
          </div>
          <button
            onClick={() => goToStep(3)}
            className="text-rappi-green text-sm font-semibold hover:underline flex-shrink-0"
          >
            Editar
          </button>
        </div>
      </div>

      <Button
        onClick={handlePublish}
        disabled={isPublishing}
        className="w-full bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-12 font-semibold"
      >
        {isPublishing ? "Guardando..." : isEditMode ? "Guardar cambios" : "Publicar"}
      </Button>
    </div>
  );
};

export default SummaryStep;
