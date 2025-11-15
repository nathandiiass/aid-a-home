import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { RequestData } from "@/pages/CreateRequest";

interface BudgetStepProps {
  data: RequestData;
  updateData: (data: Partial<RequestData>) => void;
  onNext: () => void;
}

const BudgetStep = ({ data, updateData, onNext }: BudgetStepProps) => {
  const [minBudget, setMinBudget] = useState(data.budgetMin?.toString() || "");
  const [maxBudget, setMaxBudget] = useState(data.budgetMax?.toString() || "");
  const [noBudget, setNoBudget] = useState(data.noBudget);
  const [error, setError] = useState("");


  const handleContinue = () => {
    if (noBudget) {
      updateData({ noBudget: true, budgetMin: undefined, budgetMax: undefined });
      onNext();
      return;
    }

    const min = parseFloat(minBudget);
    const max = parseFloat(maxBudget);

    if (!minBudget || !maxBudget) {
      setError("Ingresa ambos valores o marca 'Sin presupuesto'");
      return;
    }

    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
      setError("Ingresa valores válidos mayores a 0");
      return;
    }

    if (min > max) {
      setError("El mínimo no puede ser mayor al máximo");
      return;
    }

    updateData({ budgetMin: min, budgetMax: max, noBudget: false });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Presupuesto</h2>
        <p className="text-muted-foreground">
          Establece tu rango de presupuesto o deja que los especialistas propongan
        </p>
      </div>

      {/* Budget range */}
      <div className="space-y-4">
        <Label>Estoy dispuesto a pagar</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-budget" className="text-sm text-muted-foreground">
              Desde
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="min-budget"
                type="number"
                placeholder="0"
                value={minBudget}
                onChange={(e) => {
                  setMinBudget(e.target.value);
                  setError("");
                }}
                disabled={noBudget}
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-budget" className="text-sm text-muted-foreground">
              Hasta
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="max-budget"
                type="number"
                placeholder="0"
                value={maxBudget}
                onChange={(e) => {
                  setMaxBudget(e.target.value);
                  setError("");
                }}
                disabled={noBudget}
                className="pl-7"
              />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* No budget option */}
      <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="no-budget"
          checked={noBudget}
          onCheckedChange={(checked) => {
            setNoBudget(checked as boolean);
            setError("");
          }}
        />
        <div className="space-y-1">
          <Label
            htmlFor="no-budget"
            className="text-sm font-medium cursor-pointer"
          >
            Sin presupuesto definido
          </Label>
          <p className="text-xs text-muted-foreground">
            Deja que los especialistas propongan sus cotizaciones
          </p>
        </div>
      </div>

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

export default BudgetStep;
