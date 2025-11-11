import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, FileText, Download, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CredentialDialog } from './CredentialDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Credential {
  id: string;
  type: 'degree' | 'cert' | 'course';
  title: string;
  issuer: string;
  start_year?: number;
  end_year?: number;
  issued_at?: string;
  expires_at?: string;
  description?: string;
  attachment_url?: string;
}

interface CredentialsTabProps {
  specialistId: string;
}

export function CredentialsTab({ specialistId }: CredentialsTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
  }, [specialistId]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('specialist_credentials')
        .select('*')
        .eq('specialist_id', specialistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials((data || []) as Credential[]);
    } catch (error: any) {
      console.error('Error loading credentials:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las credenciales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCredential(null);
    setDialogOpen(true);
  };

  const handleEdit = (credential: Credential) => {
    setEditingCredential(credential);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCredentialToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!credentialToDelete) return;

    try {
      const { error } = await supabase
        .from('specialist_credentials')
        .delete()
        .eq('id', credentialToDelete);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Credencial eliminada correctamente',
      });
      
      await loadCredentials();
    } catch (error: any) {
      console.error('Error deleting credential:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la credencial',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCredentialToDelete(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      degree: 'Estudio',
      cert: 'Certificación',
      course: 'Curso',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      degree: 'bg-primary/10 text-primary border-primary/20',
      cert: 'bg-accent/10 text-accent border-accent/20',
      course: 'bg-secondary/10 text-secondary border-secondary/20',
    };
    return colors[type] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Estudios y Certificaciones</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega tus títulos, certificaciones y cursos relevantes
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {credentials.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay credenciales registradas
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Agrega tus estudios y certificaciones para mejorar tu perfil
          </p>
          <Button onClick={handleAdd} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Agregar credencial
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {credentials.map((credential) => (
            <Card key={credential.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground">
                      {credential.title}
                    </h3>
                    <Badge variant="outline" className={getTypeColor(credential.type)}>
                      {getTypeLabel(credential.type)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm font-medium text-muted-foreground">
                    {credential.issuer}
                  </p>

                  {(credential.start_year || credential.end_year) && (
                    <p className="text-sm text-muted-foreground">
                      {credential.start_year && credential.end_year
                        ? `${credential.start_year} - ${credential.end_year}`
                        : credential.start_year || credential.end_year}
                    </p>
                  )}

                  {(credential.issued_at || credential.expires_at) && (
                    <p className="text-sm text-muted-foreground">
                      {credential.issued_at && `Emitido: ${new Date(credential.issued_at).toLocaleDateString('es-MX')}`}
                      {credential.expires_at && ` • Expira: ${new Date(credential.expires_at).toLocaleDateString('es-MX')}`}
                    </p>
                  )}

                  {credential.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {credential.description}
                    </p>
                  )}

                  {credential.attachment_url && (
                    <a
                      href={credential.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-accent hover:underline mt-2"
                    >
                      <Download className="w-4 h-4" />
                      Ver adjunto
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(credential)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(credential.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CredentialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        specialistId={specialistId}
        credential={editingCredential}
        onSuccess={() => {
          setDialogOpen(false);
          loadCredentials();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar credencial?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La credencial será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}