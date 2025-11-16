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
    <Card className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground mb-2">
              {request?.activity || 'Trabajo'}
            </h3>
            <Badge className="bg-green-100 text-green-700 border-0 rounded-full px-3 py-1 text-xs font-medium">
              Completada
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm text-foreground/70">
              Finalizada el {format(new Date(order.created_at), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs text-foreground/70">Esperando calificación del cliente</span>
          </div>
        </div>

        {/* Price */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/50 uppercase tracking-wide">Precio</span>
            <span className="font-bold text-lg text-foreground">
              {getPrice()}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 rounded-full border-2 border-gray-300 hover:bg-gray-50 h-10 font-semibold" 
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Ver detalle
          </Button>
        </div>
      </div>
    </Card>
  );
}
