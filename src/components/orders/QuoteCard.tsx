import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, Package, Shield, MessageCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuoteCardProps {
  quote: any;
  orderId: string;
}

export function QuoteCard({ quote, orderId }: QuoteCardProps) {
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

  return (
    <Card className="p-4 hover:shadow-lg transition-all">
      <div className="flex gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={specialist?.avatar_url} />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {getInitials(specialist?.user_id || 'Especialista')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-foreground">
                {specialist?.user_id || 'Especialista'}
              </h3>
              {averageRating > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({specialist.reviews.length} reseñas)
                  </span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className="font-bold text-lg text-foreground">
                {quote.price_fixed 
                  ? `$${quote.price_fixed}`
                  : `$${quote.price_min}–$${quote.price_max}`
                }
              </p>
            </div>
          </div>

          {quote.proposed_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span>
                {format(new Date(quote.proposed_date), 'dd MMM', { locale: es })}
                {quote.proposed_time_start && ` · ${quote.proposed_time_start.slice(0, 5)}`}
                {quote.estimated_duration_hours && ` · ${quote.estimated_duration_hours}h estimadas`}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {quote.includes_materials && (
              <Badge variant="secondary" className="text-xs">
                <Package className="w-3 h-3 mr-1" />
                {quote.materials_list ? `Incluye: ${quote.materials_list}` : 'Incluye materiales'}
              </Badge>
            )}
            {quote.has_warranty && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Garantía
              </Badge>
            )}
            {specialist?.status === 'approved' && (
              <Badge variant="default" className="text-xs">
                Verificado
              </Badge>
            )}
          </div>

          {quote.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {quote.description}
            </p>
          )}

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/orders/${orderId}/quotes/${quote.id}`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver propuesta
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/chat/${quote.id}`)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Chatear
            </Button>
            <Button 
              size="sm"
              className="bg-accent hover:bg-accent/90"
            >
              Contratar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}