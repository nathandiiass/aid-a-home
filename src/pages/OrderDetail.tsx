import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
import { CancellationSurveyDialog } from '@/components/orders/CancellationSurveyDialog';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('best_match');
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);

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
        .select('id, first_name, last_name_paterno, last_name_materno, display_name, avatar_url')
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
          (a.estimated_duration_hours || 0) - (b.estimated_duration_hours || 0)
        );
      default:
        return quotesToSort;
    }
  };

  const handleEdit = () => {
    navigate(`/create-request?edit=${id}`);
  };

  const handleSurveySubmit = async (surveyData: {
    mainReason: string;
    otherReasonText?: string;
    improvementText?: string;
  }) => {
    if (!id || !user) return;

    try {
      // Save survey feedback
      const { error: surveyError } = await supabase
        .from('request_cancellation_feedback')
        .insert({
          user_id: user.id,
          request_id: id,
          main_reason: surveyData.mainReason,
          other_reason_text: surveyData.otherReasonText,
          improvement_text: surveyData.improvementText,
        });

      if (surveyError) throw surveyError;

      // Delete the request (set status to cancelled)
      const { error: deleteError } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Gracias por tu tiempo',
        description: 'Tu solicitud ha sido eliminada.',
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
      setShowSurveyDialog(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-foreground">Orden no encontrada</div>
      </div>
    );
  }

  const sortedQuotes = sortQuotes(quotes);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/orders')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{order.activity}</h1>
                <p className="text-sm text-muted-foreground">
                  {quotes.length} cotizacion{quotes.length !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowSurveyDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Sort Filter */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full h-12 bg-white rounded-full shadow-sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="best_match">Mejor ajuste</SelectItem>
            <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
            <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
            <SelectItem value="rating">Mejor calificación</SelectItem>
            <SelectItem value="duration">Tiempo estimado</SelectItem>
          </SelectContent>
        </Select>

        {sortedQuotes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border-0 p-8 text-center">
            <p className="text-muted-foreground">
              Aún no hay cotizaciones para esta orden
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedQuotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} orderId={order.id} />
            ))}
          </div>
        )}
      </div>

      <CancellationSurveyDialog
        open={showSurveyDialog}
        onOpenChange={setShowSurveyDialog}
        onSubmit={handleSurveySubmit}
      />
    </div>
  );
}
