import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuoteCardProps {
  quote: any;
  orderId: string;
  unreadCount?: number;
}

export function QuoteCard({ quote, orderId, unreadCount = 0 }: QuoteCardProps) {
  const navigate = useNavigate();
  const specialist = quote.specialist;
  
  const averageRating = specialist?.reviews?.length > 0
    ? specialist.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / specialist.reviews.length
    : 0;

  const capitalizeWords = (text: string) => {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getSpecialistName = () => {
    const profiles = specialist?.profiles;
    
    if (!profiles) return 'Especialista';
    
    const { first_name, last_name_paterno, last_name_materno, display_name } = profiles;
    
    // Priority 1: first_name + last_name_paterno
    if (first_name && last_name_paterno) {
      const fullName = `${first_name} ${last_name_paterno}`;
      return capitalizeWords(fullName);
    }
    
    // Priority 2: first_name + last_name_materno
    if (first_name && last_name_materno) {
      const fullName = `${first_name} ${last_name_materno}`;
      return capitalizeWords(fullName);
    }
    
    // Priority 3: display_name
    if (display_name) {
      return capitalizeWords(display_name);
    }
    
    // Priority 4: just first_name
    if (first_name) {
      return capitalizeWords(first_name);
    }
    
    // Fallback
    return 'Especialista';
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?';
  };

  const specialistName = getSpecialistName();

  const formatPrice = () => {
    if (quote.price_fixed) {
      return `$${quote.price_fixed.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${quote.price_min.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - $${quote.price_max.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = () => {
    if (!quote.proposed_date) return null;
    
    const dateStr = format(new Date(quote.proposed_date), "d 'de' MMMM", { locale: es });
    
    if (quote.proposed_time_start) {
      return `${dateStr} a las ${quote.proposed_time_start.slice(0, 5)}`;
    }
    
    return dateStr;
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg border-0 p-4 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => navigate(`/chat/${quote.id}`)}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="w-14 h-14 flex-shrink-0">
          <AvatarImage src={specialist?.profiles?.avatar_url} />
          <AvatarFallback className="bg-gray-100 text-foreground text-sm font-semibold">
            {getInitials(specialistName)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Rating */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">
                {specialistName}
              </h3>
              {averageRating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-foreground">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({specialist.reviews.length})
                  </span>
                </div>
              )}
            </div>
            
            {/* Unread badge */}
            {unreadCount > 0 && (
              <div className="bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {unreadCount}
              </div>
            )}
          </div>

          {/* Date and Time */}
          {formatDateTime() && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime()}</span>
            </div>
          )}

          {/* Duration */}
          {quote.estimated_duration_hours && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
              <Clock className="w-4 h-4" />
              <span>{quote.estimated_duration_hours}h estimadas</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-lg font-bold text-foreground">
              {formatPrice()}
            </span>
            <div className="bg-rappi-green text-white px-4 py-1.5 rounded-full text-sm font-semibold">
              Ver detalles
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
