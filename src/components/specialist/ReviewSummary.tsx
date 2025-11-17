import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ReviewSummaryProps {
  stats: {
    total: number;
    average: number;
    avgCalidadTrabajo: number;
    avgPuntualidad: number;
    avgProfesionalismo: number;
    avgCumplimiento: number;
    avgRelacionCalidadPrecio: number;
    porcentajeVolveria: number;
  };
}

export default function ReviewSummary({ stats }: ReviewSummaryProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (stats.total === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-white rounded-2xl shadow-sm border-0">
      <h2 className="text-lg font-bold text-foreground mb-4">Resumen General</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-3xl font-bold text-foreground mb-1">
            {stats.average.toFixed(1)}
          </div>
          <div className="flex justify-center mb-2">
            {renderStars(Math.round(stats.average))}
          </div>
          <div className="text-xs text-foreground/60">Calificación Promedio</div>
        </div>
        
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-3xl font-bold text-foreground mb-1">
            {stats.total}
          </div>
          <div className="text-xs text-foreground/60 mt-3">Total de Reseñas</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground/70">Calidad del trabajo</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {renderStars(Math.round(stats.avgCalidadTrabajo))}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {stats.avgCalidadTrabajo.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground/70">Puntualidad</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {renderStars(Math.round(stats.avgPuntualidad))}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {stats.avgPuntualidad.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground/70">Profesionalismo</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {renderStars(Math.round(stats.avgProfesionalismo))}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {stats.avgProfesionalismo.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground/70">Cumplimiento del servicio</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {renderStars(Math.round(stats.avgCumplimiento))}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {stats.avgCumplimiento.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground/70">Relación calidad-precio</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {renderStars(Math.round(stats.avgRelacionCalidadPrecio))}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {stats.avgRelacionCalidadPrecio.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm text-foreground/70">Volverían a trabajar contigo</span>
          <span className="text-lg font-bold text-rappi-green">
            {stats.porcentajeVolveria.toFixed(0)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
