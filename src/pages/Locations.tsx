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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

export default function Locations() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
    if (!authLoading) {
      if (user) {
        fetchLocations();
      } else {
        navigate('/auth');
      }
    }
  }, [user, authLoading, navigate]);

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
        toast({ title: "Ubicación guardada" });
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
    if (label.toLowerCase().includes('casa') || label.toLowerCase().includes('hogar')) {
      return Home;
    }
    if (label.toLowerCase().includes('trabajo') || label.toLowerCase().includes('oficina')) {
      return Briefcase;
    }
    return MapPin;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Mis ubicaciones</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {locations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border-0 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-foreground font-semibold mb-2">No tienes ubicaciones guardadas</p>
            <p className="text-sm text-muted-foreground mb-6">
              Agrega tus direcciones favoritas para solicitar servicios más rápido
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => {
              const Icon = getIcon(location.label);
              return (
                <div
                  key={location.id}
                  className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground mb-1">{location.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {location.street}
                          {location.ext_number && ` ${location.ext_number}`}
                          {location.int_number && ` Int. ${location.int_number}`}
                        </p>
                        {location.neighborhood && (
                          <p className="text-sm text-muted-foreground">{location.neighborhood}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {location.city}, {location.state}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(location)}
                      className="flex-1 text-foreground hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(location.id)}
                      className="flex-1 text-destructive hover:bg-red-50 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Location Button */}
        <Button
          onClick={() => handleOpenDialog()}
          className="w-full bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full h-12 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar ubicación
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Editar ubicación' : 'Nueva ubicación'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation 
                ? 'Modifica los datos de tu ubicación' 
                : 'Completa los datos de tu nueva ubicación'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Etiqueta *</Label>
              <Input
                id="label"
                placeholder="Ej: Casa, Trabajo, Casa de mamá"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Calle *</Label>
              <Input
                id="street"
                placeholder="Nombre de la calle"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ext_number">No. Exterior</Label>
                <Input
                  id="ext_number"
                  placeholder="123"
                  value={formData.ext_number}
                  onChange={(e) => setFormData({ ...formData, ext_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="int_number">No. Interior</Label>
                <Input
                  id="int_number"
                  placeholder="4B"
                  value={formData.int_number}
                  onChange={(e) => setFormData({ ...formData, int_number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Colonia</Label>
              <Input
                id="neighborhood"
                placeholder="Nombre de la colonia"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                placeholder="Nombre de la ciudad"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {MEXICAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-rappi-green hover:bg-rappi-green/90 text-white rounded-full"
            >
              {editingLocation ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La ubicación se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-full"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
