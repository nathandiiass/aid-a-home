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
      {/* Header con blur estilo Rappi */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-border/10 shadow-sm">
        <Logo className="pt-4 pb-2" />
        <div className="container max-w-4xl mx-auto px-4 pb-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">Órdenes</h1>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por actividad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 rounded-full h-11 focus-visible:ring-1"
              />
            </div>
            <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
              <Filter className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-gray-100 p-1 rounded-full">
            <TabsTrigger value="active" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium">
              Activas
            </TabsTrigger>
            <TabsTrigger value="draft" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium">
              Por activar
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium">
              Completadas
            </TabsTrigger>
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