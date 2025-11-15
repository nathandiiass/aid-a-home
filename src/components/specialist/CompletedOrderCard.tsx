import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Star, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompletedOrderCardProps {
  order: any;
}

export function CompletedOrderCard({ order }: CompletedOrderCardProps) {
  const request = order.request;

  const getPrice = () => {
    if (order.price_fixed) {
      return `$${order.price_fixed.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    }
    return `$${order.price_min.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - $${order.price_max.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  };

  return (
    <Card className="p-5 hover:shadow-lg transition-all bg-card border border-border/50">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2" style={{ color: '#003049' }}>
              {request?.activity || 'Trabajo'}
            </h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
              Completada
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Finalizada el {format(new Date(order.created_at), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="w-4 h-4" />
            <span className="text-xs">Esperando calificación del cliente</span>
          </div>

          {/* Price in bottom right */}
          <div className="flex justify-end pt-2 border-t">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-lg" style={{ color: '#C1121F' }}>
                {getPrice()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Ver detalle
          </Button>
        </div>
      </div>
    </Card>
  );
}
