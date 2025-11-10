import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export function InProgressWorks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInProgressWorks();
  }, []);

  const fetchInProgressWorks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Usuario actual:', user?.id);
      if (!user) {
        console.log('❌ No hay usuario autenticado');
        return;
      }

      // Fetch service requests that have an accepted quote
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          quotes!inner(
            id,
            specialist_id,
            status,
            proposed_date,
            proposed_time_start,
            proposed_time_end,
            price_fixed,
            price_min,
            price_max
          )
        `)
        .eq('user_id', user.id)
        .eq('quotes.status', 'accepted')
        .is('quotes.attachments', null)
        .order('created_at', { ascending: false });

      console.log('📊 Datos de trabajos en curso:', data);
      console.log('❓ Cantidad de trabajos:', data?.length);
      if (error) {
        console.error('❌ Error en query:', error);
        throw error;
      }

      // Fetch specialist profiles for each work
      const worksWithSpecialists = await Promise.all(
        (data || []).map(async (work) => {
          const quote = Array.isArray(work.quotes) ? work.quotes[0] : work.quotes;
          
          const { data: specialist } = await supabase
            .from('specialist_profiles')
            .select(`
              id,
              profiles:user_id(
                first_name,
                last_name_paterno
              )
            `)
            .eq('id', quote.specialist_id)
            .single();

          return {
            ...work,
            quote,
            specialist: specialist?.profiles
          };
        })
      );

      console.log('✅ Trabajos con especialistas:', worksWithSpecialists);
      setWorks(worksWithSpecialists);
    } catch (error) {
      console.error('Error fetching in-progress works:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No pudimos cargar trabajos en curso'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Trabajos en curso
        </h2>
        <div className="flex gap-6 overflow-x-auto py-6 px-2 -mx-4">
          <Skeleton className="flex-shrink-0 w-[280px] h-[140px] rounded-2xl" />
          <Skeleton className="flex-shrink-0 w-[280px] h-[140px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (works.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-foreground mb-4">
        Trabajos en curso
      </h2>
      
      <div className="flex gap-6 overflow-x-auto py-6 px-2 -mx-4">
        {works.map((work) => (
          <div
            key={work.id}
            onClick={() => navigate(`/chat/${work.quote.id}`)}
            className="flex-shrink-0 w-[280px] p-4 cursor-pointer transition-all hover:scale-105 animate-pulse-border rounded-2xl bg-card"
          >
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-base mb-1">
                  {work.activity}
                </h3>
                <Badge className="bg-accent text-accent-foreground">
                  En curso
                </Badge>
              </div>

              {work.specialist && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>
                    {work.specialist.first_name} {work.specialist.last_name_paterno}
                  </span>
                </div>
              )}

              {work.quote.proposed_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(work.quote.proposed_date), 'dd MMM', { locale: es })}
                    {work.quote.proposed_time_start && work.quote.proposed_time_end && 
                      ` · ${work.quote.proposed_time_start.slice(0, 5)}–${work.quote.proposed_time_end.slice(0, 5)}`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
