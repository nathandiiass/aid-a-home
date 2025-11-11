import ServiceSearch from "@/components/ServiceSearch";
import { Card } from "@/components/ui/card";
import { Leaf, Wrench, Zap, Paintbrush, Sparkles, Hammer, Lock, Flame, Car, Droplets, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { InProgressWorks } from "@/components/InProgressWorks";
import { Logo } from "@/components/Logo";

const categories = [
  { name: "Jardinería", icon: Leaf, color: "bg-category-jardines", textColor: "text-white", requests: "12,356", especialista: "Jardinero", actividad: "Mantenimiento de jardín" },
  { name: "Plomería", icon: Wrench, color: "bg-category-plomeria", textColor: "text-white", requests: "8,742", especialista: "Plomero", actividad: "Reparar fugas" },
  { name: "Electricidad", icon: Zap, color: "bg-category-electricidad", textColor: "text-white", requests: "9,421", especialista: "Electricista", actividad: "Instalar contacto o apagador" },
  { name: "Pintura", icon: Paintbrush, color: "bg-category-pintura", textColor: "text-white", requests: "6,234", especialista: "Pintor", actividad: "Pintar interiores o exteriores" },
  { name: "Limpieza", icon: Sparkles, color: "bg-category-limpieza", textColor: "text-foreground", requests: "15,789", especialista: "Limpiadora / Personal de limpieza", actividad: "Limpieza general de casa" },
  { name: "Carpintería", icon: Hammer, color: "bg-category-carpinteria", textColor: "text-white", requests: "4,567", especialista: "Carpintero", actividad: "Reparar muebles" },
  { name: "Cerrajería", icon: Lock, color: "bg-category-cerrajeria", textColor: "text-white", requests: "3,890", especialista: "Cerrajero", actividad: "Abrir cerraduras" },
  { name: "Soldadura", icon: Flame, color: "bg-category-soldadura", textColor: "text-white", requests: "2,456", especialista: "Soldador", actividad: "Soldadura eléctrica" },
  { name: "Mecánica", icon: Car, color: "bg-category-mecanica", textColor: "text-white", requests: "7,123", especialista: "Mecánico", actividad: "Cambio de aceite" },
  { name: "Albercas", icon: Droplets, color: "bg-category-albercas", textColor: "text-white", requests: "1,890", especialista: "Técnico de albercas", actividad: "Limpieza regular" },
];

const Index = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (especialista: string, actividad: string) => {
    navigate("/create-request", { state: { especialista, actividad } });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Logo */}
      <Logo className="pt-4 pb-2" />
      
      {/* Header with search */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Aid a Home</h1>
          <p className="text-muted-foreground text-sm">
            Encuentra especialistas para tus servicios domésticos
          </p>
        </div>
        
        <ServiceSearch />
      </div>

      {/* In Progress Works */}
      <div className="container max-w-2xl mx-auto px-4">
        <InProgressWorks />
      </div>

      {/* Popular categories */}
      <div className="container max-w-2xl mx-auto px-4 pb-8">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Categorías populares
        </h2>
        
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.name}
                  onClick={() => handleCategoryClick(category.especialista, category.actividad)}
                  className={`flex-shrink-0 w-[140px] h-[180px] ${category.color} border-0 shadow-card cursor-pointer transition-transform hover:scale-103 active:scale-98`}
                >
                  <div className="h-full p-4 flex flex-col items-center justify-between">
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className={`w-8 h-8 ${category.textColor}`} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold text-sm mb-1 ${category.textColor}`}>
                        {category.name}
                      </p>
                      <div className={`flex items-center justify-center gap-1 text-xs ${category.textColor} opacity-80`}>
                        <Users className="w-3 h-3" />
                        <span>{category.requests}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info card */}
        <Card className="mt-8 p-6 bg-muted border border-border shadow-subtle">
          <h3 className="font-semibold text-foreground mb-3">¿Cómo funciona?</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Busca el servicio que necesitas</li>
            <li>2. Completa los detalles de tu solicitud</li>
            <li>3. Recibe cotizaciones de especialistas</li>
            <li>4. Elige al mejor y agenda tu servicio</li>
          </ol>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
