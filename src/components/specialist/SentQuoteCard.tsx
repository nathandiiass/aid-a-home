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
  // Handle both single object and array format from Supabase
  const request = Array.isArray(quote.service_requests) 
    ? quote.service_requests[0] 
    : quote.service_requests;
  const location = Array.isArray(request?.locations)
    ? request?.locations[0]
    : request?.locations;
  
  const isCancelled = quote.isCancelled;
  const hasProblemReport = quote.hasProblemReport;

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
      className="bg-white rounded-2xl shadow-md border-0 p-5 hover:shadow-xl transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div className="space-y-4">
        {/* Header with title and status badge */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-bold text-foreground text-lg flex-1">
            {request?.service_title || request?.activity}
          </h3>
          <div className="flex flex-col gap-2 items-end">
            {getStatusBadge(quote.status)}
            {isCancelled && (
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-0 rounded-full px-3 py-1 text-xs font-medium">
                Cancelado
              </Badge>
            )}
            {hasProblemReport && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 rounded-full px-3 py-1 text-xs font-medium">
                Inconveniente
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Date */}
          {getDisplayDate() && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-foreground/70">
                {format(new Date(getDisplayDate()), "EEE d MMM", { locale: es })}
              </span>
            </div>
          )}

          {/* Time */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            <span className={`text-sm ${request?.is_urgent ? "text-red-600 font-semibold" : "text-foreground/70"}`}>
              {request?.is_urgent ? "¡Urgente!" : formatTimeDisplay()}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Timer className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm text-foreground/70">{formatDuration()}</span>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-foreground/70">
                {location.neighborhood && `${location.neighborhood}, `}
                {location.city}
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/50 uppercase tracking-wide">Precio</span>
            <span className="font-bold text-base text-foreground">{formatPrice()}</span>
          </div>
        </div>

        {/* Sent date */}
        <div className="text-xs text-foreground/50 pt-2">
          Enviada el {format(new Date(quote.created_at), "d 'de' MMM, yyyy", { locale: es })}
        </div>
      </div>
    </Card>
  );
};
