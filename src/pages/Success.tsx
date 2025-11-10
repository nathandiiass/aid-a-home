import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Home, Mail } from "lucide-react";

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const specialistsCount = location.state?.specialistsCount || 0;

  useEffect(() => {
    if (!specialistsCount) {
      navigate("/");
    }
  }, [specialistsCount, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-gradient-card border-border text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-2xl font-bold mb-3">¡Solicitud enviada!</h1>
        
        <p className="text-muted-foreground mb-6">
          Tu solicitud se envió a{" "}
          <span className="font-semibold text-primary">{specialistsCount}</span>{" "}
          especialistas que atienden en tu ciudad.
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          Pronto recibirás cotizaciones de los especialistas interesados.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/inbox")}
            className="w-full h-12 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Mail className="w-5 h-5 mr-2" />
            Ver cotizaciones
          </Button>

          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full h-12"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir al inicio
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Success;
