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

export function InProgressOrderCard({ order, onUpdate }: InProgressOrderCardProps) {
  const navigate = useNavigate();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const request = order.request;
  const location = request?.location;

  const getPrice = () => {
    if (order.price_fixed) {
      return `$${order.price_fixed.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    }
    return `$${order.price_min.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - $${order.price_max.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  };

  const getZone = () => {
    if (!location) return 'Sin ubicación';
    return `${location.neighborhood || ''}, ${location.city || ''}`.trim();
  };

  return (
    <>
      <Card 
        className="p-5 hover:shadow-lg transition-all cursor-pointer bg-card"
        style={{ borderColor: '#669BBC', borderWidth: '1px' }}
        onClick={() => navigate(`/chat/${order.id}`)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2" style={{ color: '#003049' }}>
                {request?.activity || 'Trabajo'}
              </h3>
              <Badge variant="secondary" className="mb-3">
                Pendiente de iniciar
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/chat/${order.id}`);
              }}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            {order.proposed_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(order.proposed_date), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
            )}

            {order.proposed_time_start && order.proposed_time_end && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{order.proposed_time_start} - {order.proposed_time_end}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{getZone()}</span>
            </div>

            {/* Price in bottom right */}
            <div className="flex justify-end pt-2 border-t">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold" style={{ color: '#003049' }}>
                  {getPrice()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              className="flex-1"
              style={{ borderColor: '#003049', color: '#003049' }}
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
            <Button
              className="flex-1"
              style={{ backgroundColor: '#C1121F' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowCompleteDialog(true);
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
      </Card>

      <CompleteOrderDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        order={order}
        onComplete={onUpdate}
      />
    </>
  );
}
