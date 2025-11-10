import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Inbox = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
        </div>

        <Card className="p-8 text-center bg-gradient-card border-border">
          <p className="text-muted-foreground">
            Tus cotizaciones aparecerán aquí próximamente
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Inbox;
