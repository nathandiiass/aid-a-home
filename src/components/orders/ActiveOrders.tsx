import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, DollarSign, Eye, Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActiveOrdersProps {
  searchQuery: string;
}

export function ActiveOrders({ searchQuery }: ActiveOrdersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const { data: allRequests, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          quotes(id, status)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out requests that have an accepted quote (those are in progress)
      const activeOnly = (allRequests || []).filter(request => {
        if (!request.quotes || request.quotes.length === 0) return true;
        // Check if any quote is accepted
        const hasAcceptedQuote = request.quotes.some((q: any) => q.status === 'accepted');
        return !hasAcceptedQuote;
      });
      
      setOrders(activeOnly);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las órdenes activas'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.activity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;
  }

  if (filteredOrders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No tienes órdenes activas</p>
        <Button onClick={() => navigate('/create-request')}>
          Crear una solicitud
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredOrders.map((order) => (
        <Card
          key={order.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer relative"
          onClick={() => navigate(`/orders/${order.id}`)}
        >
          {order.quotes && order.quotes.length > 0 && (
            <Badge 
              className="absolute top-3 right-3 bg-accent text-accent-foreground rounded-full px-2 py-1"
            >
              {order.quotes.length}
            </Badge>
          )}
          
          <h3 className="font-semibold text-foreground text-lg mb-2">
            {order.activity}
          </h3>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            {order.scheduled_date && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {format(new Date(order.scheduled_date), 'dd MMM yyyy', { locale: es })}
                  {order.time_start && order.time_end && 
                    ` · ${order.time_start.slice(0, 5)}–${order.time_end.slice(0, 5)}`
                  }
                </span>
              </div>
            )}
            
            {order.price_min && order.price_max && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>${order.price_min}–${order.price_max}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order.id}`);
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver cotizaciones
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/create-request?edit=${order.id}`);
              }}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}