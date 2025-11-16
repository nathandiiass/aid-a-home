import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, DollarSign, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CancellationSurveyDialog } from './CancellationSurveyDialog';

interface ActiveOrdersProps {
  searchQuery: string;
}

interface ServiceRequest {
  id: string;
  activity: string;
  category: string;
  service_title: string | null;
  scheduled_date: string | null;
  time_start: string | null;
  time_end: string | null;
  time_preference: string | null;
  is_urgent: boolean | null;
  price_min: number | null;
  price_max: number | null;
  location_id: string | null;
  locations?: {
    neighborhood: string;
    city: string;
  };
}

export function ActiveOrders({ searchQuery }: ActiveOrdersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [longPressOrder, setLongPressOrder] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const fetchActiveOrders = async () => {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data: allRequests, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          quotes(id, status),
          locations(street, neighborhood, city, state, ext_number)
        `)
        .eq('user_id', user.id)
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
    order.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.activity?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLongPressStart = (orderId: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressOrder(orderId);
    }, 800); // 800ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleEdit = (orderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/create-request?edit=${orderId}`);
    setLongPressOrder(null);
  };

  const handleDeleteClick = (orderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOrderToDelete(orderId);
    setShowSurveyDialog(true);
    setLongPressOrder(null);
  };

  const handleSurveySubmit = async (surveyData: {
    mainReason: string;
    otherReasonText?: string;
    improvementText?: string;
  }) => {
    if (!orderToDelete) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Save survey feedback
      const { error: surveyError } = await supabase
        .from('request_cancellation_feedback')
        .insert({
          user_id: user.id,
          request_id: orderToDelete,
          main_reason: surveyData.mainReason,
          other_reason_text: surveyData.otherReasonText,
          improvement_text: surveyData.improvementText,
        });

      if (surveyError) throw surveyError;

      // Delete the request (set status to cancelled)
      const { error: deleteError } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', orderToDelete);

      if (deleteError) throw deleteError;

      toast({
        title: 'Gracias por tu tiempo',
        description: 'Tu solicitud ha sido eliminada.',
      });

      fetchActiveOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la solicitud'
      });
    } finally {
      setShowSurveyDialog(false);
      setOrderToDelete(null);
    }
  };

  const formatTimeDisplay = (order: ServiceRequest) => {
    if (order.is_urgent) {
      return "¡Urgente!";
    }
    
    if (order.time_start && order.time_end) {
      return `${order.time_start.slice(0, 5)}–${order.time_end.slice(0, 5)}`;
    }

    const timeOptions: Record<string, string> = {
      morning: "Mañana (9:00-12:00)",
      afternoon: "Tarde (12:00-17:00)",
      evening: "Noche (17:00-21:00)",
      anytime: "Cualquier hora",
    };

    return timeOptions[order.time_preference || ''] || "Por definir";
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Cargando...</div>;
  }

  if (filteredOrders.length === 0) {
    return (
      <Card className="p-8 text-center bg-white rounded-xl border border-border/20">
        <p className="text-muted-foreground mb-4">No tienes órdenes activas</p>
        <button
          onClick={() => navigate('/create-request')}
          className="bg-rappi-green hover:bg-rappi-green/90 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Crear una solicitud
        </button>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Card
            key={order.id}
            className="p-4 hover:shadow-md transition-all cursor-pointer relative bg-white rounded-xl border border-border/20"
            onClick={() => navigate(`/orders/${order.id}`)}
            onTouchStart={() => handleLongPressStart(order.id)}
            onTouchEnd={handleLongPressEnd}
            onMouseDown={() => handleLongPressStart(order.id)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
          >
            {order.quotes && order.quotes.length > 0 && (
              <div className="absolute top-3 right-3 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {order.quotes.length}
              </div>
            )}
            
            <h3 className="font-bold text-foreground text-base mb-3 pr-9">
              {order.service_title || order.activity}
            </h3>
            
            <div className="space-y-2">
              {order.scheduled_date && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {format(new Date(order.scheduled_date), "EEE dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className={order.is_urgent ? "text-destructive font-semibold" : ""}>
                  {formatTimeDisplay(order)}
                </span>
              </div>

              {order.locations && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {order.locations.neighborhood ? `${order.locations.neighborhood}, ` : ''}
                    {order.locations.city}
                  </span>
                </div>
              )}
              
              {/* Price and button */}
              <div className="flex justify-between items-center pt-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-foreground">
                    {order.price_min && order.price_max 
                      ? `$${order.price_min.toLocaleString('es-MX')} - $${order.price_max.toLocaleString('es-MX')}`
                      : 'Sin presupuesto'
                    }
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${order.id}`);
                  }}
                  className="bg-rappi-green hover:bg-rappi-green/90 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Long press contextual menu */}
      {longPressOrder && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-end" onClick={() => setLongPressOrder(null)}>
          <div className="bg-background w-full rounded-t-2xl p-4 space-y-2 animate-in slide-in-from-bottom">
            <Button
              className="w-full justify-start text-base h-14"
              variant="ghost"
              onClick={() => handleEdit(longPressOrder)}
            >
              <Edit className="w-5 h-5 mr-3" />
              Editar
            </Button>
            <Button
              className="w-full justify-start text-base h-14 text-destructive hover:text-destructive"
              variant="ghost"
              onClick={() => handleDeleteClick(longPressOrder)}
            >
              <Trash2 className="w-5 h-5 mr-3" />
              Eliminar
            </Button>
            <Button
              className="w-full h-14 mt-2"
              variant="outline"
              onClick={() => setLongPressOrder(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Cancellation survey dialog */}
      <CancellationSurveyDialog
        open={showSurveyDialog}
        onOpenChange={setShowSurveyDialog}
        onSubmit={handleSurveySubmit}
      />
    </>
  );
}