import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, DollarSign, MessageCircle, Play, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CompleteOrderDialog } from './CompleteOrderDialog';
interface InProgressOrderCardProps {
  order: any;
  onUpdate: () => void;
}
export function InProgressOrderCard({
  order,
  onUpdate
}: InProgressOrderCardProps) {
  const navigate = useNavigate();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const request = order.request;
  const location = request?.location;
  const isCancelled = request?.status === 'cancelled';
  const hasProblemReport = order.hasProblemReport;
  const getPrice = () => {
    if (order.price_fixed) {
      return `$${order.price_fixed.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} MXN`;
    }
    return `$${order.price_min.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} - $${order.price_max.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} MXN`;
  };
  const getZone = () => {
    if (!location) return 'Sin ubicación';
    return `${location.neighborhood || ''}, ${location.city || ''}`.trim();
  };
  return <>
      <Card className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate(`/chat/${order.id}`)}>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground mb-2">
                {request?.activity || 'Trabajo'}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {isCancelled ? <Badge variant="secondary" className="bg-red-100 text-red-700 border-0 rounded-full px-3 py-1 text-xs font-medium">
                    Cancelado
                  </Badge> : hasProblemReport ? <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 rounded-full px-3 py-1 text-xs font-medium">
                    Inconveniente
                  </Badge> : <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-0 rounded-full px-3 py-1 text-xs font-medium">
                    Pendiente de iniciar
                  </Badge>}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={e => {
            e.stopPropagation();
            navigate(`/chat/${order.id}`);
          }}>
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {order.proposed_date && <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm text-foreground/70">
                  {format(new Date(order.proposed_date), 'dd MMM yyyy', {
                locale: es
              })}
                </span>
              </div>}

            {order.proposed_time_start && order.proposed_time_end && <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm text-foreground/70">{order.proposed_time_start} - {order.proposed_time_end}</span>
              </div>}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-foreground/70">{getZone()}</span>
            </div>
          </div>

          {/* Price */}
          <div className="pt-3 mt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/50 uppercase tracking-wide">Precio</span>
              <span className="font-bold text-base text-foreground">
                {getPrice()}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2" onClick={e => e.stopPropagation()}>
            
            <Button onClick={e => {
            e.stopPropagation();
            setShowCompleteDialog(true);
          }} className="flex-1 bg-rappi-green hover:bg-rappi-green/90 text-white h-10 font-semibold rounded-full mt-[4px] mr-[4px] mb-[4px] ml-[4px] mx-0 my-0">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
      </Card>

      <CompleteOrderDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog} order={order} onComplete={onUpdate} />
    </>;
}