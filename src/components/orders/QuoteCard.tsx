import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Package, Shield } from 'lucide-react';
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

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?';
  };

  const getQuoteSummary = () => {
    const parts = [];
    if (quote.price_fixed) {
      parts.push(`$${quote.price_fixed}`);
    } else {
      parts.push(`$${quote.price_min}–$${quote.price_max}`);
    }
    if (quote.includes_materials) {
      parts.push('Incluye materiales');
    }
    if (quote.estimated_duration_hours) {
      parts.push(`${quote.estimated_duration_hours}h estimadas`);
    }
    return parts.join(' • ');
  };

  return (
    <Card 
      className="p-5 hover:shadow-lg transition-all cursor-pointer bg-card border border-border/50"
      onClick={() => navigate(`/chat/${quote.id}`)}
    >
      <div className="flex gap-4">
        <Avatar className="w-[70px] h-[70px] flex-shrink-0">
          <AvatarImage src={specialist?.avatar_url} />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-semibold">
            {getInitials(specialist?.user_id || 'Especialista')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground mb-1 truncate">
                {specialist?.user_id || 'Especialista'}
              </h3>
              {averageRating > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm text-muted-foreground">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({specialist.reviews.length})
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1 ml-2">
              <span className="text-xs text-secondary">
                {format(new Date(quote.created_at), 'dd MMM', { locale: es })}
              </span>
              {unreadCount > 0 && (
                <div className="bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {unreadCount}
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-secondary mb-3 line-clamp-2">
            {getQuoteSummary()}
          </p>

          <div className="flex flex-wrap gap-2">
            {quote.includes_materials && (
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
                <Package className="w-3 h-3 mr-1" />
                Materiales
              </Badge>
            )}
            {quote.has_warranty && (
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
                <Shield className="w-3 h-3 mr-1" />
                Garantía
              </Badge>
            )}
            {specialist?.status === 'approved' && (
              <Badge className="text-xs bg-foreground text-background">
                Verificado
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}