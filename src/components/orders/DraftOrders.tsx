import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface DraftOrdersProps {
  searchQuery: string;
}

export function DraftOrders({ searchQuery }: DraftOrdersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDrafts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los borradores'
      });
    } finally {
      setLoading(false);
    }
  };

  const publishDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'active' })
        .eq('id', draftId);

      if (error) throw error;

      toast({
        title: 'Publicado',
        description: 'Tu solicitud ha sido publicada exitosamente'
      });

      fetchDrafts();
    } catch (error) {
      console.error('Error publishing draft:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo publicar la solicitud'
      });
    }
  };

  const filteredDrafts = drafts.filter(draft =>
    draft.activity?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Cargando...</div>;
  }

  if (filteredDrafts.length === 0) {
    return (
      <Card className="p-8 text-center bg-white rounded-2xl border-0 shadow-lg">
        <p className="text-muted-foreground mb-4">No tienes borradores guardados</p>
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
    <div className="space-y-3">
      {filteredDrafts.map((draft) => (
        <Card key={draft.id} className="p-4 bg-white rounded-2xl border-0 shadow-lg">
          <h3 className="font-bold text-foreground text-base mb-3">
            {draft.activity || 'Selecciona una actividad'}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge 
              variant={draft.price_min && draft.price_max ? 'default' : 'outline'}
              className="rounded-full px-3 py-1 text-xs"
            >
              {draft.price_min && draft.price_max ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
              Presupuesto
            </Badge>
            <Badge 
              variant={draft.scheduled_date ? 'default' : 'outline'}
              className="rounded-full px-3 py-1 text-xs"
            >
              {draft.scheduled_date ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
              Fecha/Hora
            </Badge>
            <Badge 
              variant={draft.location_id ? 'default' : 'outline'}
              className="rounded-full px-3 py-1 text-xs"
            >
              {draft.location_id ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
              Ubicación
            </Badge>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => publishDraft(draft.id)}
              disabled={!draft.activity || !draft.price_min || !draft.scheduled_date || !draft.location_id}
              className="bg-rappi-green hover:bg-rappi-green/90 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publicar
            </button>
            <button
              onClick={() => navigate(`/create-request?edit=${draft.id}`)}
              className="bg-white hover:bg-gray-50 text-foreground text-sm font-semibold px-4 py-2 rounded-full border border-border/30 transition-colors flex-1"
            >
              Seguir editando
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}