import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Star, Clock, Package, Shield, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface QuoteCardProps {
  quote: any;
  orderId: string;
}

export function QuoteCard({ quote, orderId }: QuoteCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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

  const handleContratarConfirm = async () => {
    // TODO: Implement actual hiring logic with database update
    setShowConfirmDialog(false);
    
    // Show confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    toast({
      title: "🎉 ¡Felicidades! Encontraste a tu especialista",
      description: "La orden ha sido asignada exitosamente.",
    });

    // TODO: Navigate to chat or order view
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
              <h3 className="font-semibold text-xl text-foreground">
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
              onClick={() => navigate(`/chat/${quote.id}`)}
              className="border-secondary text-secondary hover:bg-secondary/10"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Chatear
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Contratar
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Aceptas los términos y condiciones del especialista y continuar con la contratación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">
              No, cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleContratarConfirm}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Sí, contratar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}