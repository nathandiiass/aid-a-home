import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompletedOrdersProps {
  searchQuery: string;
}

export function CompletedOrders({ searchQuery }: CompletedOrdersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompleted();
  }, []);

  const fetchCompleted = async () => {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCompleted([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          reviews(rating, comment)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCompleted(data || []);
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las órdenes completadas'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCompleted = completed.filter(order =>
    order.activity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Cargando...</div>;
  }

  if (filteredCompleted.length === 0) {
    return (
      <Card className="p-8 text-center bg-white rounded-2xl border-0 shadow-lg">
        <p className="text-muted-foreground">No tienes órdenes completadas</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredCompleted.map((order) => (
        <Card 
          key={order.id} 
          className="p-4 hover:shadow-xl transition-all cursor-pointer bg-white rounded-2xl border-0 shadow-lg"
          onClick={() => navigate(`/orders/${order.id}`)}
        >
          <h3 className="font-bold text-foreground text-base mb-2">
            {order.activity}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-3">
            {format(new Date(order.updated_at), "dd MMM yyyy · HH:mm", { locale: es })}
          </p>

          {order.price_max && (
            <p className="text-foreground font-semibold text-sm mb-3">
              Precio final: ${order.price_max}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {order.reviews && order.reviews.length > 0 ? (
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-foreground">{order.reviews[0].rating}</span>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/orders/${order.id}/review`);
                }}
                className="bg-white hover:bg-gray-50 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full border border-border/30 transition-colors"
              >
                Deja tu reseña
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/create-request?template=${order.id}`);
              }}
              className="bg-rappi-green hover:bg-rappi-green/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              Recontratar
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}