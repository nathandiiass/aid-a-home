import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SpecialistReviewDialog } from './SpecialistReviewDialog';

export function AutoReviewPrompt() {
  const [pendingReviewOrder, setPendingReviewOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [specialistName, setSpecialistName] = useState<string>('');

  useEffect(() => {
    checkForPendingReviews();
    
    // Set up real-time subscription to detect completed orders
    const channel = supabase
      .channel('service_requests_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `status=eq.completed`
        },
        (payload) => {
          handleOrderCompleted(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkForPendingReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar órdenes completadas sin reseña
      const { data: orders, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          reviews(id),
          quotes!inner(specialist_id, status)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('quotes.status', 'accepted')
        .is('review_submitted', false)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (orders && orders.length > 0 && !orders[0].reviews?.length) {
        setPendingReviewOrder(orders[0]);
        
        // Obtener nombre del especialista
        if (orders[0].quotes?.[0]?.specialist_id) {
          const { data: specialistProfile } = await supabase
            .from('specialist_profiles')
            .select('user_id')
            .eq('id', orders[0].quotes[0].specialist_id)
            .single();
          
          if (specialistProfile) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name_paterno')
              .eq('id', specialistProfile.user_id)
              .single();
            
            if (profile) {
              const fullName = `${profile.first_name} ${profile.last_name_paterno || ''}`.trim();
              setSpecialistName(fullName);
            }
          }
        }
        
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error checking pending reviews:', error);
    }
  };

  const handleOrderCompleted = async (order: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar que es una orden del usuario actual
      if (order.user_id !== user.id) return;

      // Verificar que no tiene reseña
      const { data: review } = await supabase
        .from('reviews')
        .select('id')
        .eq('request_id', order.id)
        .eq('user_id', user.id)
        .single();

      if (review) return; // Ya tiene reseña

      // Obtener la quote aceptada con specialist_id
      const { data: quote } = await supabase
        .from('quotes')
        .select('specialist_id')
        .eq('request_id', order.id)
        .eq('status', 'accepted')
        .single();

      if (quote) {
        setPendingReviewOrder({ ...order, quotes: [quote] });
        
        // Obtener nombre del especialista
        const { data: specialistProfile } = await supabase
          .from('specialist_profiles')
          .select('user_id')
          .eq('id', quote.specialist_id)
          .single();
        
        if (specialistProfile) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name_paterno')
            .eq('id', specialistProfile.user_id)
            .single();
          
          if (profile) {
            const fullName = `${profile.first_name} ${profile.last_name_paterno || ''}`.trim();
            setSpecialistName(fullName);
          }
        }
        
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error handling completed order:', error);
    }
  };

  const handleReviewSubmitted = () => {
    setPendingReviewOrder(null);
    setDialogOpen(false);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Si cierra el diálogo sin completar, volverá a aparecer al recargar
      setPendingReviewOrder(null);
    }
  };

  if (!pendingReviewOrder || !pendingReviewOrder.quotes?.[0]?.specialist_id) {
    return null;
  }

  // Usar service_title o activity como fallback
  const displayTitle = pendingReviewOrder.service_title || pendingReviewOrder.activity;

  return (
    <SpecialistReviewDialog
      open={dialogOpen}
      onOpenChange={handleDialogClose}
      requestId={pendingReviewOrder.id}
      specialistId={pendingReviewOrder.quotes[0].specialist_id}
      requestTitle={displayTitle}
      specialistName={specialistName}
      onReviewSubmitted={handleReviewSubmitted}
    />
  );
}
