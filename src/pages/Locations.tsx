import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Home, Briefcase, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Location {
  id: string;
  label: string;
  street: string;
  neighborhood?: string;
  ext_number?: string;
  int_number?: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

export default function Locations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    street: '',
    neighborhood: '',
    ext_number: '',
    int_number: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (user) {
      fetchLocations();
    } else {
      navigate('/auth');
    }
  }, [user, navigate]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        label: location.label,
        street: location.street,
        neighborhood: location.neighborhood || '',
        ext_number: location.ext_number || '',
        int_number: location.int_number || '',
        city: location.city,
        state: location.state,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        label: '',
        street: '',
        neighborhood: '',
        ext_number: '',
        int_number: '',
        city: '',
        state: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.label || !formData.street || !formData.city || !formData.state) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('locations')
          .update(formData)
          .eq('id', editingLocation.id);

        if (error) throw error;
        toast({ title: "Ubicación actualizada" });
      } else {
        const { error } = await supabase
          .from('locations')
          .insert([{ ...formData, user_id: user?.id }]);

        if (error) throw error;
        toast({ title: "Ubicación agregada" });
      }

      setIsDialogOpen(false);
      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast({ title: "Ubicación eliminada" });
      fetchLocations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('casa') || lower.includes('hogar')) return <Home className="w-5 h-5 text-primary" />;
    if (lower.includes('oficina') || lower.includes('trabajo')) return <Briefcase className="w-5 h-5 text-primary" />;
    return <MapPin className="w-5 h-5 text-primary" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Mis ubicaciones</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-6 space-y-4">
        {locations.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <MapPin className="w-16 h-16 text-muted mx-auto" />
            <p className="text-secondary">
              Aún no tienes ubicaciones. Agrega una para usarla en tus solicitudes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <div
                key={location.id}
                className="border border-border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {getIcon(location.label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{location.label}</p>
                    <p className="text-sm text-secondary">
                      {location.street}
                      {location.ext_number && ` #${location.ext_number}`}
                      {location.int_number && ` Int. ${location.int_number}`}
                    </p>
                    {location.neighborhood && (
                      <p className="text-sm text-secondary">{location.neighborhood}</p>
                    )}
                    <p className="text-sm text-secondary">
                      {location.city}, {location.state}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(location)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(location.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => handleOpenDialog()}
          className="w-full h-12 text-base"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar ubicación
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Editar ubicación' : 'Nueva ubicación'}
            </DialogTitle>
            <DialogDescription>
              Completa los datos de tu ubicación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="label">Etiqueta*</Label>
              <Input
                id="label"
                placeholder="Casa, Oficina, etc."
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="street">Calle*</Label>
              <Input
                id="street"
                placeholder="Nombre de la calle"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ext_number">Número exterior</Label>
                <Input
                  id="ext_number"
                  placeholder="123"
                  value={formData.ext_number}
                  onChange={(e) => setFormData({ ...formData, ext_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="int_number">Número interior</Label>
                <Input
                  id="int_number"
                  placeholder="A"
                  value={formData.int_number}
                  onChange={(e) => setFormData({ ...formData, int_number: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="neighborhood">Colonia</Label>
              <Input
                id="neighborhood"
                placeholder="Nombre de la colonia"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="city">Ciudad*</Label>
              <Input
                id="city"
                placeholder="Ciudad"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado*</Label>
              <Input
                id="state"
                placeholder="Estado"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingLocation ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
