import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RequestData } from "@/pages/CreateRequest";
import { Camera, X, Upload } from "lucide-react";

interface EvidenceStepProps {
  data: RequestData;
  updateData: (data: Partial<RequestData>) => void;
  onNext: () => void;
}

const EvidenceStep = ({ data, updateData, onNext }: EvidenceStepProps) => {
  const [files, setFiles] = useState<File[]>(data.evidence || []);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const totalFiles = files.length + selectedFiles.length;

    if (totalFiles > 5) {
      setError("Máximo 5 archivos permitidos");
      return;
    }

    // Validate file types and sizes
    for (const file of selectedFiles) {
      const validTypes = ["image/jpeg", "image/png", "video/mp4"];
      if (!validTypes.includes(file.type)) {
        setError("Solo se permiten archivos JPG, PNG o MP4");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Cada archivo debe ser menor a 10MB");
        return;
      }
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
    setError("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    updateData({ evidence: files });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Evidencias</h2>
        <p className="text-muted-foreground">
          Sube fotos o videos del área de trabajo (opcional pero recomendado)
        </p>
      </div>

      {/* Upload area */}
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center p-8 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <p className="font-medium text-foreground mb-1">
            Toca para subir archivos
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Máximo 5 fotos (JPG, PNG) o 1 video (MP4)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Límite: 10MB por archivo
          </p>
          <input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/png,video/mp4"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* File previews */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Archivos seleccionados ({files.length}/5)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {files.map((file, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="aspect-video bg-muted/50 flex items-center justify-center">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Video</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/90 flex items-center justify-center hover:bg-destructive transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="p-2 bg-card">
                  <p className="text-xs truncate">{file.name}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 Las imágenes claras del área de trabajo ayudan a los especialistas a
          hacer cotizaciones más precisas
        </p>
      </div>

      <Button
        onClick={handleContinue}
        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        size="lg"
      >
        Continuar al resumen
      </Button>
    </div>
  );
};

export default EvidenceStep;
