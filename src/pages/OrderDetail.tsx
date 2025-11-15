import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { QuoteCard } from '@/components/orders/QuoteCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('best_match');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?returnTo=orders');
    } else if (user) {
      fetchOrderAndQuotes();
    }
  }, [user, authLoading, id]);

  const fetchOrderAndQuotes = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          specialist:specialist_profiles!inner(
            id,
            user_id,
            phone,
            status,
            reviews(rating)
          )
        `)
        .eq('request_id', id);

      if (quotesError) throw quotesError;

      // Fetch profiles separately to avoid FK relationship issues
      const specialistIds = quotesData?.map(q => q.specialist.user_id).filter(Boolean) || [];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name_paterno, last_name_materno, display_name')
        .in('id', specialistIds);

      // Merge profiles into quotes
      const quotesWithProfiles = quotesData?.map(quote => ({
        ...quote,
        specialist: {
          ...quote.specialist,
          profiles: profilesData?.find(p => p.id === quote.specialist.user_id)
        }
      })) || [];

      setQuotes(quotesWithProfiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la información'
      });
    } finally {
      setLoading(false);
    }
  };

  const sortQuotes = (quotesToSort: any[]) => {
    switch (sortBy) {
      case 'price_asc':
        return [...quotesToSort].sort((a, b) => 
          (a.price_fixed || a.price_min) - (b.price_fixed || b.price_min)
        );
      case 'price_desc':
        return [...quotesToSort].sort((a, b) => 
          (b.price_fixed || b.price_min) - (a.price_fixed || a.price_min)
        );
      case 'rating':
        return [...quotesToSort].sort((a, b) => {
          const avgA = a.specialist?.reviews?.reduce((sum: number, r: any) => sum + r.rating, 0) / (a.specialist?.reviews?.length || 1);
          const avgB = b.specialist?.reviews?.reduce((sum: number, r: any) => sum + r.rating, 0) / (b.specialist?.reviews?.length || 1);
          return avgB - avgA;
        });
      case 'duration':
        return [...quotesToSort].sort((a, b) => 
          (a.estimated_duration_hours || 999) - (b.estimated_duration_hours || 999)
        );
      default:
        return quotesToSort;
    }
  };

  const handleEdit = () => {
    navigate(`/create-request?edit=${id}`);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Solicitud eliminada',
        description: 'La solicitud ha sido eliminada correctamente',
      });

      navigate('/orders');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la solicitud'
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Orden no encontrada</div>
      </div>
    );
  }

  const sortedQuotes = sortQuotes(quotes);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{order.activity}</h1>
            <p className="text-sm text-muted-foreground">
              {quotes.length} cotizacion{quotes.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best_match">Mejor ajuste</SelectItem>
              <SelectItem value="price_asc">Precio ↑</SelectItem>
              <SelectItem value="price_desc">Precio ↓</SelectItem>
              <SelectItem value="rating">Calificación</SelectItem>
              <SelectItem value="duration">Tiempo estimado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sortedQuotes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Aún no hay cotizaciones para esta orden
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedQuotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} orderId={order.id} />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los especialistas ya no podrán cotizarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}