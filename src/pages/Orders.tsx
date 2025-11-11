import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { ActiveOrders } from '@/components/orders/ActiveOrders';
import { DraftOrders } from '@/components/orders/DraftOrders';
import { CompletedOrders } from '@/components/orders/CompletedOrders';
import { Logo } from '@/components/Logo';

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'active');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?returnTo=orders&tab=' + activeTab);
    }
  }, [user, authLoading, navigate, activeTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Logo className="pt-4 pb-2" />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Órdenes</h1>
        
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por actividad o folio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <button className="p-2 border border-border rounded-md hover:bg-accent transition-colors">
            <Filter className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="draft">Por activar</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <ActiveOrders searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="draft">
            <DraftOrders searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="completed">
            <CompletedOrders searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}