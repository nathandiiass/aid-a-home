import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { QuoteCard } from './QuoteCard';

interface ReceivedQuotesProps {
  searchQuery: string;
}

export function ReceivedQuotes({ searchQuery }: ReceivedQuotesProps) {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceivedQuotes();
  }, []);

  const fetchReceivedQuotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all service requests from this user
      const { data: requests, error: requestsError } = await supabase
        .from('service_requests')
        .select('id')
        .eq('user_id', user.id);

      if (requestsError) throw requestsError;

      const requestIds = requests?.map(r => r.id) || [];

      if (requestIds.length === 0) {
        setQuotes([]);
        setLoading(false);
        return;
      }

      // Get all quotes for these requests with specialist and profile data
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          specialist:specialist_profiles(
            *,
            profiles!specialist_profiles_user_id_fkey(*)
          ),
          request:service_requests(*)
        `)
        .in('request_id', requestIds)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      // Fetch specialist profiles separately
      const quotesWithProfiles = await Promise.all(
        (quotesData || []).map(async (quote) => {
          if (quote.specialist?.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', quote.specialist.user_id)
              .single();
            
            return {
              ...quote,
              specialist: {
                ...quote.specialist,
                profiles: profileData
              }
            };
          }
          return quote;
        })
      );

      setQuotes(quotesWithProfiles);
    } catch (error) {
      console.error('Error fetching received quotes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las cotizaciones recibidas'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.request?.activity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.specialist?.profiles?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quote.specialist?.profiles?.last_name_paterno?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;
  }

  if (filteredQuotes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No has recibido cotizaciones aún</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredQuotes.map((quote) => (
        <QuoteCard
          key={quote.id}
          quote={quote}
          orderId={quote.request_id}
        />
      ))}
    </div>
  );
}
