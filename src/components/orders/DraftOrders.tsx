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
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
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
    return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;
  }

  if (filteredDrafts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No tienes borradores guardados</p>
        <Button onClick={() => navigate('/create-request')}>
          Crear una solicitud
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredDrafts.map((draft) => (
        <Card key={draft.id} className="p-4">
          <h3 className="font-semibold text-foreground text-lg mb-3">
            {draft.activity || 'Selecciona una actividad'}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={draft.price_min && draft.price_max ? 'default' : 'outline'}>
              {draft.price_min && draft.price_max ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
              Presupuesto
            </Badge>
            <Badge variant={draft.scheduled_date ? 'default' : 'outline'}>
              {draft.scheduled_date ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
              Fecha/Hora
            </Badge>
            <Badge variant={draft.location_id ? 'default' : 'outline'}>
              {draft.location_id ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
              Ubicación
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => publishDraft(draft.id)}
              disabled={!draft.activity || !draft.price_min || !draft.scheduled_date || !draft.location_id}
              className="bg-accent hover:bg-accent/90"
            >
              Publicar
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/create-request?edit=${draft.id}`)}
            >
              Seguir editando
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}