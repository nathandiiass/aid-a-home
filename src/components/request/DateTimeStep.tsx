import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RequestData } from "@/pages/CreateRequest";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimeStepProps {
  data: RequestData;
  updateData: (data: Partial<RequestData>) => void;
  onNext: () => void;
}

const DateTimeStep = ({ data, updateData, onNext }: DateTimeStepProps) => {
  const [date, setDate] = useState<Date | undefined>(data.date);
  const [timeOption, setTimeOption] = useState(data.timeOption || "morning");
  const [timeStart, setTimeStart] = useState(data.timeStart || "");
  const [timeEnd, setTimeEnd] = useState(data.timeEnd || "");
  const [isUrgent, setIsUrgent] = useState(data.isUrgent);
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (isUrgent) {
      updateData({ isUrgent: true, date: new Date(), timeOption: "urgent" });
      onNext();
      return;
    }

    if (!date) {
      setError("Selecciona una fecha");
      return;
    }

    if (timeOption === "specific" && (!timeStart || !timeEnd)) {
      setError("Ingresa hora de inicio y fin");
      return;
    }

    if (timeOption === "specific" && timeStart >= timeEnd) {
      setError("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    updateData({ date, timeOption, timeStart, timeEnd, isUrgent: false });
    onNext();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
        <h2 className="text-xl font-bold mb-2">Fecha y horario</h2>
        <p className="text-muted-foreground text-sm">
          ¿Cuándo necesitas el servicio?
        </p>
      </div>

      {/* Urgent option */}
      <div
        className={`bg-white rounded-2xl shadow-lg border-0 p-4 cursor-pointer transition-all ${
          isUrgent ? "ring-2 ring-accent" : ""
        }`}
        onClick={() => setIsUrgent(!isUrgent)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">¡Urgente!</p>
            <p className="text-sm text-muted-foreground">
              Lo necesito lo antes posible
            </p>
          </div>
          {isUrgent && (
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
        </div>
      </div>

      {!isUrgent && (
        <>
          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-3">
            <Label className="text-sm font-semibold">Selecciona la fecha</Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setError("");
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className={cn("pointer-events-auto")}
              />
            </div>
          </div>

          {/* Time options */}
          <div className="bg-white rounded-2xl shadow-lg border-0 p-6 space-y-3">
            <Label className="text-sm font-semibold">Horario preferido</Label>
            <RadioGroup value={timeOption} onValueChange={setTimeOption}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="morning" id="morning" />
                  <Label htmlFor="morning" className="flex-1 cursor-pointer">
                    <span className="font-medium">Mañana</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (8:00 - 12:00)
                    </span>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="afternoon" id="afternoon" />
                  <Label htmlFor="afternoon" className="flex-1 cursor-pointer">
                    <span className="font-medium">Tarde</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (12:00 - 18:00)
                    </span>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="evening" id="evening" />
                  <Label htmlFor="evening" className="flex-1 cursor-pointer">
                    <span className="font-medium">Noche</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (18:00 - 22:00)
                    </span>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="anytime" id="anytime" />
                  <Label htmlFor="anytime" className="flex-1 cursor-pointer">
                    <span className="font-medium">Cualquier hora</span>
                  </Label>
                </div>

                <div className="p-3 rounded-lg hover:bg-gray-50">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="specific" id="specific" />
                      <Label htmlFor="specific" className="flex-1 cursor-pointer font-medium">
                        Especificar horario
                      </Label>
                    </div>
                    {timeOption === "specific" && (
                      <div className="grid grid-cols-2 gap-3 ml-8">
                        <div className="space-y-1">
                          <Label htmlFor="time-start" className="text-xs text-muted-foreground">
                            De
                          </Label>
                          <Input
                            id="time-start"
                            type="time"
                            value={timeStart}
                            onChange={(e) => {
                              setTimeStart(e.target.value);
                              setError("");
                            }}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="time-end" className="text-xs text-muted-foreground">
                            A
                          </Label>
                          <Input
                            id="time-end"
                            type="time"
                            value={timeEnd}
                            onChange={(e) => {
                              setTimeEnd(e.target.value);
                              setError("");
                            }}
                            className="h-10"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 text-destructive p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handleContinue}
        className="w-full bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-12 font-semibold"
      >
        Continuar
      </Button>
    </div>
  );
};

export default DateTimeStep;
