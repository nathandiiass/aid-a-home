import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Star, Calendar, User, DollarSign } from 'lucide-react';
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
          className="p-4 hover:shadow-xl transition-all cursor-pointer bg-white rounded-2xl border-0 shadow-lg"
          onClick={() => navigate(`/chat/${order.quotes[0].id}`)}
        >
          <h3 className="font-bold text-foreground text-base mb-3">
            {order.activity}
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-semibold text-foreground">
                {getSpecialistName(order)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {format(new Date(order.updated_at), "EEE dd MMM yyyy", { locale: es })}
              </span>
            </div>

            {order.price_max && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-bold text-foreground">
                  ${order.price_max.toLocaleString('es-MX')}
                </span>
              </div>
            )}

            {order.reviews && order.reviews.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-foreground">
                  {order.reviews[0].average_score?.toFixed(1) || order.reviews[0].rating}
                </span>
                <span className="text-muted-foreground">Tu calificación</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/chat/${order.quotes[0].id}`);
                }}
                className="bg-rappi-green hover:bg-rappi-green/90 text-white text-xs font-semibold px-6 py-2 rounded-full transition-colors"
              >
                Ver detalles
              </button>
            </div>
          </div>
        </Card>
      ))}

    </div>
  );
}
