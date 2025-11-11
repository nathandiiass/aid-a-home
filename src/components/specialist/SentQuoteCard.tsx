import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SentQuoteCardProps {
  quote: any;
}

export const SentQuoteCard = ({ quote }: SentQuoteCardProps) => {
  const navigate = useNavigate();
  const request = quote.request;
  const location = request?.location;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aceptada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPrice = () => {
    if (quote.price_fixed) {
      return `$${quote.price_fixed.toLocaleString()}`;
    }
    if (quote.price_min && quote.price_max) {
      return `$${quote.price_min.toLocaleString()} - $${quote.price_max.toLocaleString()}`;
    }
    return 'Precio no especificado';
  };

  const handleClick = () => {
    navigate(`/chat/${quote.id}`);
  };

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-foreground">{request?.activity}</h3>
            <p className="text-sm text-muted-foreground">{request?.category}</p>
          </div>
          {getStatusBadge(quote.status)}
        </div>

        {location && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {location.neighborhood && `${location.neighborhood}, `}
              {location.city}, {location.state}
            </span>
          </div>
        )}

        {quote.proposed_date && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(quote.proposed_date), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
            {quote.proposed_time_start && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{quote.proposed_time_start}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-muted-foreground">Cotización</span>
          <span className="font-semibold text-foreground">{formatPrice()}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          Enviada {format(new Date(quote.created_at), "d 'de' MMM, yyyy", { locale: es })}
        </div>
      </div>
    </Card>
  );
};
