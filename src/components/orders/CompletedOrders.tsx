import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
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
          reviews(rating, comment, average_score),
          quotes!inner(
            specialist_id, 
            status,
            specialist_profiles(
              id,
              user_id,
              profiles(first_name, last_name_paterno, display_name)
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('quotes.status', 'accepted')
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

  const getSpecialistName = (order: any) => {
    const specialist = order.quotes?.[0]?.specialist_profiles;
    if (!specialist?.profiles) return 'Especialista';
    
    const profile = specialist.profiles;
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name_paterno) {
      return `${profile.first_name} ${profile.last_name_paterno}`;
    }
    return profile.first_name || 'Especialista';
  };

  return (
    <div className="space-y-3">
      {filteredCompleted.map((order) => (
        <Card 
          key={order.id} 
          className="p-4 bg-white rounded-2xl border-0 shadow-lg"
        >
          <h3 className="font-bold text-foreground text-base mb-2">
            {order.activity}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-2">
            Completado por: <span className="font-semibold text-foreground">{getSpecialistName(order)}</span>
          </p>
          
          <p className="text-xs text-muted-foreground mb-3">
            {format(new Date(order.updated_at), "dd MMM yyyy · HH:mm", { locale: es })}
          </p>

          {order.price_max && (
            <p className="text-foreground font-semibold text-sm mb-3">
              Precio final: ${order.price_max}
            </p>
          )}

          {order.reviews && order.reviews.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-foreground">
                {order.reviews[0].average_score?.toFixed(1) || order.reviews[0].rating}
              </span>
              <span className="text-xs text-muted-foreground ml-1">Tu calificación</span>
            </div>
          )}

          <button
            onClick={() => navigate(`/chat/${order.quotes[0].id}`)}
            className="w-full bg-rappi-green hover:bg-rappi-green/90 text-white text-sm font-semibold py-2.5 rounded-full transition-colors"
          >
            Ver detalles
          </button>
        </Card>
      ))}

    </div>
  );
}
