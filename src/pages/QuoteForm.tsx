import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { BottomNavSpecialist } from '@/components/BottomNavSpecialist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const quoteSchema = z.object({
  scope: z.string().min(10, 'Describe qué incluye el servicio (mínimo 10 caracteres)'),
  exclusions: z.string().optional(),
  canMakeIt: z.enum(['yes', 'no']),
  proposedDate: z.string().optional(),
  proposedTimeStart: z.string().optional(),
  proposedTimeEnd: z.string().optional(),
  priceType: z.enum(['fixed', 'range']),
  priceFixed: z.number().positive().optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  includesMaterials: z.enum(['yes', 'no']),
  materialsList: z.string().optional(),
  durationRange: z.string(),
  requiresVisit: z.enum(['yes', 'no']),
  visitCost: z.number().min(0).optional(),
  additionalNotes: z.string().optional(),
}).refine((data) => {
  if (data.priceType === 'fixed') {
    return !!data.priceFixed;
  }
  return !!data.priceMin && !!data.priceMax && data.priceMin <= data.priceMax;
}, {
  message: 'Precio inválido',
  path: ['priceFixed']
});

export default function QuoteForm() {
  const { id: requestId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    scope: '',
    exclusions: '',
    canMakeIt: 'yes',
    proposedDate: '',
    proposedTimeStart: '',
    proposedTimeEnd: '',
    priceType: 'fixed',
    priceFixed: '',
    priceMin: '',
    priceMax: '',
    includesMaterials: 'no',
    materialsList: '',
    durationRange: '1-2',
    requiresVisit: 'no',
    visitCost: '',
    additionalNotes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?returnTo=/specialist');
      return;
    }

    if (user) {
      loadSpecialistProfile();
    }
  }, [user, authLoading, navigate]);

  const loadSpecialistProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSpecialistId(data.id);
    } catch (error: any) {
      console.error('Error loading specialist profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!specialistId || !requestId) {
      toast({
        title: 'Error',
        description: 'Faltan datos necesarios',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Validate form data
      const validatedData = quoteSchema.parse({
        scope: formData.scope,
        exclusions: formData.exclusions || undefined,
        canMakeIt: formData.canMakeIt,
        proposedDate: formData.proposedDate || undefined,
        proposedTimeStart: formData.proposedTimeStart || undefined,
        proposedTimeEnd: formData.proposedTimeEnd || undefined,
        priceType: formData.priceType,
        priceFixed: formData.priceFixed ? parseFloat(formData.priceFixed) : undefined,
        priceMin: formData.priceMin ? parseFloat(formData.priceMin) : undefined,
        priceMax: formData.priceMax ? parseFloat(formData.priceMax) : undefined,
        includesMaterials: formData.includesMaterials,
        materialsList: formData.materialsList || undefined,
        durationRange: formData.durationRange,
        requiresVisit: formData.requiresVisit,
        visitCost: formData.visitCost ? parseFloat(formData.visitCost) : undefined,
        additionalNotes: formData.additionalNotes || undefined,
      });

      // Parse duration range
      const [durationMin, durationMax] = validatedData.durationRange.split('-');

      const quoteData = {
        request_id: requestId,
        specialist_id: specialistId,
        scope: validatedData.scope,
        exclusions: validatedData.exclusions || null,
        price_fixed: validatedData.priceType === 'fixed' ? validatedData.priceFixed : null,
        price_min: validatedData.priceType === 'range' ? validatedData.priceMin : null,
        price_max: validatedData.priceType === 'range' ? validatedData.priceMax : null,
        proposed_date: validatedData.canMakeIt === 'no' && validatedData.proposedDate ? validatedData.proposedDate : null,
        proposed_time_start: validatedData.proposedTimeStart || null,
        proposed_time_end: validatedData.proposedTimeEnd || null,
        estimated_duration_hours: parseFloat(durationMax || durationMin),
        includes_materials: validatedData.includesMaterials === 'yes',
        materials_list: validatedData.materialsList || null,
        requires_visit: validatedData.requiresVisit === 'yes',
        visit_cost: validatedData.visitCost || null,
        additional_notes: validatedData.additionalNotes || null,
        status: 'pending' as const,
      };

      const { error } = await supabase
        .from('quotes')
        .insert([quoteData]);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Cotización enviada correctamente',
      });

      navigate('/specialist/orders?tab=enviadas');
    } catch (error: any) {
      console.error('Error submitting quote:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al enviar la cotización',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Enviar cotización</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. ¿Qué incluye el servicio? */}
          <Card className="p-4 space-y-3">
            <Label htmlFor="scope" className="text-base font-semibold">¿Qué incluye el servicio? *</Label>
            <Textarea
              id="scope"
              placeholder="Ej: Corte de pasto, recolección y embolsado, limpieza de área de trabajo..."
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="bg-muted/30 min-h-[100px]"
              required
            />
            <p className="text-xs text-muted-foreground">Describe detalladamente qué incluye tu servicio (mínimo 10 caracteres)</p>
          </Card>

          {/* 2. ¿Qué no incluye? */}
          <Card className="p-4 space-y-3">
            <Label htmlFor="exclusions" className="text-base font-semibold">¿Qué no incluye el servicio? (opcional)</Label>
            <Textarea
              id="exclusions"
              placeholder="Ej: No incluye fertilización ni retiro de basura fuera de la propiedad..."
              value={formData.exclusions}
              onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
              className="bg-muted/30"
            />
          </Card>

          {/* 3. ¿Puedes en la fecha y hora solicitada? */}
          <Card className="p-4 space-y-3">
            <Label className="text-base font-semibold">¿Puedes en la fecha y hora solicitada? *</Label>
            <RadioGroup
              value={formData.canMakeIt}
              onValueChange={(value) => setFormData({ ...formData, canMakeIt: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No, propongo otra fecha</Label>
              </div>
            </RadioGroup>

            {formData.canMakeIt === 'no' && (
              <div className="space-y-3 mt-3">
                <div>
                  <Label htmlFor="proposedDate">Fecha propuesta</Label>
                  <Input
                    id="proposedDate"
                    type="date"
                    value={formData.proposedDate}
                    onChange={(e) => setFormData({ ...formData, proposedDate: e.target.value })}
                    className="bg-muted/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="proposedTimeStart">Hora inicio</Label>
                    <Input
                      id="proposedTimeStart"
                      type="time"
                      value={formData.proposedTimeStart}
                      onChange={(e) => setFormData({ ...formData, proposedTimeStart: e.target.value })}
                      className="bg-muted/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposedTimeEnd">Hora fin</Label>
                    <Input
                      id="proposedTimeEnd"
                      type="time"
                      value={formData.proposedTimeEnd}
                      onChange={(e) => setFormData({ ...formData, proposedTimeEnd: e.target.value })}
                      className="bg-muted/30"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* 4. Precio */}
          <Card className="p-4 space-y-3">
            <Label className="text-base font-semibold">Precio *</Label>
            <RadioGroup
              value={formData.priceType}
              onValueChange={(value) => setFormData({ ...formData, priceType: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Precio fijo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range">Rango de precios</Label>
              </div>
            </RadioGroup>

            {formData.priceType === 'fixed' ? (
              <div>
                <Label htmlFor="priceFixed">Monto</Label>
                <Input
                  id="priceFixed"
                  type="number"
                  placeholder="$"
                  value={formData.priceFixed}
                  onChange={(e) => setFormData({ ...formData, priceFixed: e.target.value })}
                  className="bg-muted/30"
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="priceMin">Mínimo</Label>
                  <Input
                    id="priceMin"
                    type="number"
                    placeholder="$"
                    value={formData.priceMin}
                    onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                    className="bg-muted/30"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="priceMax">Máximo</Label>
                  <Input
                    id="priceMax"
                    type="number"
                    placeholder="$"
                    value={formData.priceMax}
                    onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                    className="bg-muted/30"
                    required
                  />
                </div>
              </div>
            )}
          </Card>

          {/* 5. ¿Incluye materiales? */}
          <Card className="p-4 space-y-3">
            <Label className="text-base font-semibold">¿Incluye materiales? *</Label>
            <RadioGroup
              value={formData.includesMaterials}
              onValueChange={(value) => setFormData({ ...formData, includesMaterials: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="mat-yes" />
                <Label htmlFor="mat-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="mat-no" />
                <Label htmlFor="mat-no">No</Label>
              </div>
            </RadioGroup>

            {formData.includesMaterials === 'yes' && (
              <div>
                <Label htmlFor="materialsList">¿Qué materiales incluye? (opcional)</Label>
                <Textarea
                  id="materialsList"
                  placeholder="Ej: Pintura, brochas, lija..."
                  value={formData.materialsList}
                  onChange={(e) => setFormData({ ...formData, materialsList: e.target.value })}
                  className="bg-muted/30"
                />
              </div>
            )}
          </Card>

          {/* 6. Duración estimada */}
          <Card className="p-4 space-y-3">
            <Label htmlFor="durationRange" className="text-base font-semibold">Duración estimada *</Label>
            <select
              id="durationRange"
              value={formData.durationRange}
              onChange={(e) => setFormData({ ...formData, durationRange: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm"
            >
              <option value="0-0.5">0-30 min</option>
              <option value="0.5-1">30-60 min</option>
              <option value="1-2">1-2 h</option>
              <option value="2-3">2-3 h</option>
              <option value="3-4">3-4 h</option>
              <option value="4-8">4 h o más</option>
            </select>
          </Card>

          {/* 7. ¿Requiere visita previa? */}
          <Card className="p-4 space-y-3">
            <Label className="text-base font-semibold">¿Requiere visita previa? *</Label>
            <RadioGroup
              value={formData.requiresVisit}
              onValueChange={(value) => setFormData({ ...formData, requiresVisit: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="visit-yes" />
                <Label htmlFor="visit-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="visit-no" />
                <Label htmlFor="visit-no">No</Label>
              </div>
            </RadioGroup>

            {formData.requiresVisit === 'yes' && (
              <div>
                <Label htmlFor="visitCost">Costo de la visita (opcional, puede ser 0)</Label>
                <Input
                  id="visitCost"
                  type="number"
                  placeholder="$"
                  value={formData.visitCost}
                  onChange={(e) => setFormData({ ...formData, visitCost: e.target.value })}
                  className="bg-muted/30"
                  min="0"
                />
              </div>
            )}
          </Card>

          {/* 8. Detalles adicionales */}
          <Card className="p-4 space-y-3">
            <Label htmlFor="additionalNotes" className="text-base font-semibold">Detalles adicionales (opcional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Ej: Prefiero pago en efectivo, tengo experiencia en jardines residenciales..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="bg-muted/30"
            />
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white text-base"
          >
            {loading ? 'Enviando...' : 'Enviar cotización'}
          </Button>
        </form>
      </div>

      <BottomNavSpecialist />
    </div>
  );
}
