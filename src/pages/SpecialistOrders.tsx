import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BottomNavSpecialist } from '@/components/BottomNavSpecialist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { InProgressOrderCard } from '@/components/specialist/InProgressOrderCard';
import { CompletedOrderCard } from '@/components/specialist/CompletedOrderCard';
import { useSpecialistMode } from '@/hooks/use-specialist-mode';

export default function SpecialistOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSpecialistMode } = useSpecialistMode();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'en-curso');
  const [inProgressOrders, setInProgressOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date_desc');
  const [specialistProfile, setSpecialistProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?returnTo=/specialist/orders?tab=${activeTab}`);
      return;
    }

    if (!isSpecialistMode) {
      navigate('/profile');
      return;
    }

    if (user) {
      loadSpecialistOrders();
    }
  }, [user, authLoading, navigate, isSpecialistMode]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const loadSpecialistOrders = async () => {
    try {
      setLoading(true);

      // Get specialist profile
      const { data: profile, error: profileError } = await supabase
        .from('specialist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        navigate('/specialist-registration');
        return;
      }

      setSpecialistProfile(profile);

      // Get in-progress orders (quotes that were accepted)
      const { data: inProgressData, error: inProgressError } = await supabase
        .from('quotes')
        .select(`
          id,
          price_fixed,
          price_min,
          price_max,
          proposed_date,
          proposed_time_start,
          proposed_time_end,
          status,
          created_at,
          request:service_requests!inner(
            id,
            activity,
            category,
            user_id,
            location:locations(
              neighborhood,
              city,
              state
            )
          )
        `)
        .eq('specialist_id', profile.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (inProgressError) throw inProgressError;

      // Get completed orders
      const { data: completedData, error: completedError } = await supabase
        .from('quotes')
        .select(`
          id,
          price_fixed,
          price_min,
          price_max,
          proposed_date,
          proposed_time_start,
          proposed_time_end,
          status,
          created_at,
          request:service_requests!inner(
            id,
            activity,
            category,
            user_id,
            location:locations(
              neighborhood,
              city,
              state
            )
          )
        `)
        .eq('specialist_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (completedError) throw completedError;

      setInProgressOrders(inProgressData || []);
      setCompletedOrders(completedData || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las órdenes'
      });
    } finally {
      setLoading(false);
    }
  };

  const sortOrders = (orders: any[]) => {
    const sorted = [...orders];
    switch (sortBy) {
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.proposed_date || a.created_at).getTime() - new Date(b.proposed_date || b.created_at).getTime());
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.proposed_date || b.created_at).getTime() - new Date(a.proposed_date || a.created_at).getTime());
      default:
        return sorted;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  const sortedInProgress = sortOrders(inProgressOrders);
  const sortedCompleted = sortOrders(completedOrders);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#003049' }}>Órdenes</h1>

        <div className="mb-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Fecha ↓</SelectItem>
              <SelectItem value="date_asc">Fecha ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="en-curso">En curso</TabsTrigger>
            <TabsTrigger value="completadas">Completadas</TabsTrigger>
          </TabsList>

          <TabsContent value="en-curso" className="space-y-4">
            {sortedInProgress.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No tienes órdenes en curso</p>
              </Card>
            ) : (
              sortedInProgress.map((order) => (
                <InProgressOrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdate={loadSpecialistOrders}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completadas" className="space-y-4">
            {sortedCompleted.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No tienes órdenes completadas</p>
              </Card>
            ) : (
              sortedCompleted.map((order) => (
                <CompletedOrderCard key={order.id} order={order} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavSpecialist />
    </div>
  );
}
