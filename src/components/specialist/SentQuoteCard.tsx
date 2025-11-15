import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Timer, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SentQuoteCardProps {
  quote: any;
}

export const SentQuoteCard = ({ quote }: SentQuoteCardProps) => {
  const navigate = useNavigate();
  const request = quote.service_requests;
  const location = request?.locations;

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
      return `$${quote.price_fixed.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    }
    if (quote.price_min && quote.price_max) {
      return `$${quote.price_min.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - $${quote.price_max.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    }
    return 'Precio no especificado';
  };

  const formatDuration = () => {
    const hours = quote.estimated_duration_hours;
    if (!hours) return 'No especificado';
    
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours === 1) {
      return '1 h';
    } else if (hours < 4) {
      return `${hours} h`;
    } else {
      return '4+ h';
    }
  };

  const formatTimeDisplay = () => {
    if (quote.proposed_time_start && quote.proposed_time_end) {
      return `${quote.proposed_time_start.substring(0, 5)}-${quote.proposed_time_end.substring(0, 5)}`;
    }
    if (request?.time_start && request?.time_end) {
      return `${request.time_start.substring(0, 5)}-${request.time_end.substring(0, 5)}`;
    }

    const timeOptions: Record<string, string> = {
      morning: "Mañana (9:00-12:00)",
      afternoon: "Tarde (12:00-17:00)",
      evening: "Noche (17:00-21:00)",
      anytime: "Cualquier hora",
    };

    return timeOptions[request?.time_preference || ''] || "Por definir";
  };

  const getDisplayDate = () => {
    if (quote.proposed_date) {
      return quote.proposed_date;
    }
    return request?.scheduled_date;
  };

  const handleClick = () => {
    navigate(`/chat/${quote.id}`);
  };

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-border"
      onClick={handleClick}
    >
      <div className="space-y-3">
        {/* Header with title and status badge on top right */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-semibold text-foreground text-lg flex-1">
            {request?.service_title || request?.activity}
          </h3>
          {getStatusBadge(quote.status)}
        </div>

        {/* Date */}
        {getDisplayDate() && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              {format(new Date(getDisplayDate()), "EEE d MMM", { locale: es })}
            </span>
          </div>
        )}

        {/* Time */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <span className={request?.is_urgent ? "text-destructive font-semibold" : "text-muted-foreground"}>
            {request?.is_urgent ? "¡Urgente!" : formatTimeDisplay()}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{formatDuration()}</span>
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              {location.neighborhood && `${location.neighborhood}, `}
              {location.city}
            </span>
          </div>
        )}

        {/* Price - bottom right */}
        <div className="flex justify-end pt-2 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" />
            <span className="font-bold text-accent text-base">{formatPrice()}</span>
          </div>
        </div>

        {/* Sent date */}
        <div className="text-xs text-muted-foreground">
          Enviada el {format(new Date(quote.created_at), "d 'de' MMM, yyyy", { locale: es })}
        </div>
      </div>
    </Card>
  );
};
