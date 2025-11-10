import ServiceSearch from "@/components/ServiceSearch";
import { Card } from "@/components/ui/card";
import { Wrench, Zap, Home as HomeIcon } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-card border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <HomeIcon className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Aid a Home</h1>
          </div>
          <p className="text-muted-foreground">
            Encuentra especialistas para tus servicios domésticos
          </p>
        </div>
      </div>

      {/* Search section */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <ServiceSearch />

        {/* Popular categories */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
            Categorías populares
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer bg-gradient-card border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Plomería</p>
                  <p className="text-xs text-muted-foreground">Reparaciones</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer bg-gradient-card border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Electricidad</p>
                  <p className="text-xs text-muted-foreground">Instalación</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Info card */}
        <Card className="mt-8 p-6 bg-primary/10 border-primary/20">
          <h3 className="font-semibold mb-2">¿Cómo funciona?</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Busca el servicio que necesitas</li>
            <li>2. Completa los detalles de tu solicitud</li>
            <li>3. Recibe cotizaciones de especialistas</li>
            <li>4. Elige al mejor y agenda tu servicio</li>
          </ol>
        </Card>
      </div>
    </div>
  );
};

export default Index;
