import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export function InProgressWorks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
          locations(neighborhood, city),
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
      <div className="mb-10 bg-gray-50 -mx-4 px-4 py-6">
        <h2 className="text-lg font-bold text-foreground mb-5">
          Trabajos en curso
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Skeleton className="flex-shrink-0 w-[320px] h-[200px] rounded-2xl" />
          <Skeleton className="flex-shrink-0 w-[320px] h-[200px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (works.length === 0) {
    return null;
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const cardWidth = 300 + 16; // card width + gap
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(index);
    }
  };

  return (
    <div className="mb-10 bg-gray-50 -mx-4 px-4 py-6">
      <h2 className="text-lg font-bold text-foreground mb-5">
        Trabajos en curso
      </h2>
      
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
      >
        {works.map((work) => {
          const getPrice = () => {
            if (work.quote.price_fixed) {
              return `$${work.quote.price_fixed.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
            }
            if (work.quote.price_min && work.quote.price_max) {
              return `$${work.quote.price_min.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - $${work.quote.price_max.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
            }
            return 'Precio por definir';
          };

          return (
            <Card
              key={work.id}
              className="flex-shrink-0 w-[300px] bg-white rounded-2xl shadow-sm border-0 p-4 cursor-pointer hover:shadow-md transition-all snap-start"
              onClick={() => navigate(`/chat/${work.quote.id}`)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-foreground line-clamp-2">
                    {work.service_title || work.activity}
                  </h3>
                  <Badge 
                    className="bg-rappi-green text-white border-0 rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 animate-pulse"
                  >
                    En curso
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  {work.specialist && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <span className="text-xs text-foreground/70">
                        {work.specialist.first_name} {work.specialist.last_name_paterno}
                      </span>
                    </div>
                  )}

                  {work.quote.proposed_date && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <span className="text-xs text-foreground/70">
                        {format(new Date(work.quote.proposed_date), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  )}

                  {work.quote.proposed_time_start && work.quote.proposed_time_end && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <span className="text-xs text-foreground/70">
                        {work.quote.proposed_time_start.slice(0, 5)} - {work.quote.proposed_time_end.slice(0, 5)}
                      </span>
                    </div>
                  )}

                  {work.locations && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <span className="text-xs text-foreground/70 line-clamp-1">
                        {work.locations.neighborhood ? `${work.locations.neighborhood}, ` : ''}{work.locations.city}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/50 uppercase tracking-wide">Precio</span>
                    <span className="font-bold text-base text-foreground">
                      {getPrice()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Dots Indicator */}
      {works.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {works.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (scrollContainerRef.current) {
                  const cardWidth = 300 + 16;
                  scrollContainerRef.current.scrollTo({
                    left: cardWidth * index,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex 
                  ? 'w-6 bg-rappi-green' 
                  : 'w-1.5 bg-gray-300'
              }`}
              aria-label={`Ir a trabajo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
