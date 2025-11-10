import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { RequestData } from "@/pages/CreateRequest";
import { Zap } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fecha y horario</h2>
        <p className="text-muted-foreground">
          ¿Cuándo necesitas el servicio?
        </p>
      </div>

      {/* Urgent option */}
      <Card
        className={`p-4 cursor-pointer transition-all border-2 ${
          isUrgent
            ? "border-destructive bg-destructive/10"
            : "border-border hover:border-destructive/50"
        }`}
        onClick={() => setIsUrgent(!isUrgent)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">¡Urgente!</p>
            <p className="text-sm text-muted-foreground">
              Lo necesito lo antes posible
            </p>
          </div>
          {isUrgent && (
            <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
      </Card>

      {!isUrgent && (
        <>
          {/* Calendar */}
          <div className="space-y-2">
            <Label>Selecciona la fecha</Label>
            <Card className="p-4 flex justify-center bg-card">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setError("");
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="pointer-events-auto"
              />
            </Card>
          </div>

          {/* Time options */}
          <div className="space-y-3">
            <Label>Horario preferido</Label>
            <RadioGroup value={timeOption} onValueChange={setTimeOption}>
              <div className="space-y-2">
                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="morning" id="morning" />
                    <Label htmlFor="morning" className="flex-1 cursor-pointer">
                      <span className="font-medium">Mañana</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (8:00 - 12:00)
                      </span>
                    </Label>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="afternoon" id="afternoon" />
                    <Label htmlFor="afternoon" className="flex-1 cursor-pointer">
                      <span className="font-medium">Tarde</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (12:00 - 18:00)
                      </span>
                    </Label>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="evening" id="evening" />
                    <Label htmlFor="evening" className="flex-1 cursor-pointer">
                      <span className="font-medium">Noche</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (18:00 - 22:00)
                      </span>
                    </Label>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="anytime" id="anytime" />
                    <Label htmlFor="anytime" className="flex-1 cursor-pointer">
                      <span className="font-medium">Cualquier hora</span>
                    </Label>
                  </div>
                </Card>

                <Card className="p-4">
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
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </RadioGroup>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleContinue}
        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        size="lg"
      >
        Continuar
      </Button>
    </div>
  );
};

export default DateTimeStep;
