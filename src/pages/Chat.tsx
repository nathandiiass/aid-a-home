import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Send, Paperclip, Clock, DollarSign, Package, FileText, Ban, Timer, Shield, Eye, Paperclip as AttachIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import confetti from 'canvas-confetti';

export default function Chat() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?returnTo=orders');
    } else if (user) {
      loadChatData();
    }
  }, [user, authLoading, quoteId]);

  const loadChatData = async () => {
    try {
      // Load quote details
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          specialist:specialist_profiles(*),
          request:service_requests(*)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;
      setQuote(quoteData);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // If no messages, create initial quote message
      if (!messagesData || messagesData.length === 0) {
        await createInitialMessage(quoteData);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el chat'
      });
    } finally {
      setLoading(false);
    }
  };

  const createInitialMessage = async (quoteData: any) => {
    const initialMessage = formatQuoteMessage(quoteData);
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        quote_id: quoteId,
        sender_id: quoteData.specialist.user_id,
        content: initialMessage
      })
      .select()
      .single();

    if (!error && data) {
      setMessages([data]);
    }
  };

  const formatQuoteMessage = (quoteData: any) => {
    return JSON.stringify({
      type: 'quote',
      data: quoteData
    });
  };

  const handleContratarConfirm = async () => {
    // TODO: Implement actual hiring logic with database update
    setShowConfirmDialog(false);
    
    // Show confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    toast({
      title: "🎉 ¡Felicidades! Encontraste a tu especialista",
      description: "La orden ha sido asignada exitosamente.",
    });

    // TODO: Navigate to chat or order view
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'E';
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          quote_id: quoteId,
          sender_id: user.id,
          content: newMessage.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setMessages([...messages, data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar el mensaje'
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Chat no encontrado</div>
      </div>
    );
  }

  const renderQuoteMessage = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'quote') {
        const quoteData = parsed.data;
        return (
          <Card className="bg-background border-secondary/30 p-4 space-y-3 shadow-subtle">
            <h4 className="font-bold text-foreground text-base mb-3">📋 Propuesta de servicio</h4>
            
            {quoteData.proposed_date && (
              <div className="flex gap-2 text-sm">
                <Clock className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Disponibilidad: </span>
                  <span className="text-secondary">
                    {quoteData.proposed_date ? format(new Date(quoteData.proposed_date), 'dd MMM yyyy', { locale: es }) : 'Sí'}
                    {quoteData.proposed_time_start && ` · ${quoteData.proposed_time_start.slice(0, 5)}`}
                    {quoteData.proposed_time_end && `–${quoteData.proposed_time_end.slice(0, 5)}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Precio: </span>
                <span className="text-foreground font-bold">
                  {quoteData.price_fixed ? `$${quoteData.price_fixed}` : `$${quoteData.price_min}–$${quoteData.price_max}`} MXN
                </span>
              </div>
            </div>

            <div className="flex gap-2 text-sm">
              <Package className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Materiales: </span>
                <span className="text-secondary">
                  {quoteData.includes_materials ? 'Incluidos' : 'No incluidos'}
                  {quoteData.materials_list && ` · ${quoteData.materials_list}`}
                </span>
              </div>
            </div>

            {quoteData.scope && (
              <div className="flex gap-2 text-sm">
                <FileText className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Alcance: </span>
                  <span className="text-secondary">{quoteData.scope}</span>
                </div>
              </div>
            )}

            {quoteData.exclusions && (
              <div className="flex gap-2 text-sm">
                <Ban className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">No incluye: </span>
                  <span className="text-secondary">{quoteData.exclusions}</span>
                </div>
              </div>
            )}

            {quoteData.estimated_duration_hours && (
              <div className="flex gap-2 text-sm">
                <Timer className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Duración: </span>
                  <span className="text-secondary">{quoteData.estimated_duration_hours}h</span>
                </div>
              </div>
            )}

            {quoteData.has_warranty && (
              <div className="flex gap-2 text-sm">
                <Shield className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Garantía: </span>
                  <span className="text-secondary">
                    {quoteData.warranty_days} días
                    {quoteData.warranty_description && ` · ${quoteData.warranty_description}`}
                  </span>
                </div>
              </div>
            )}

            {quoteData.requires_visit && (
              <div className="flex gap-2 text-sm">
                <Eye className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Visita previa: </span>
                  <span className="text-secondary">
                    Sí {quoteData.visit_cost ? `($${quoteData.visit_cost})` : '(sin costo)'}
                  </span>
                </div>
              </div>
            )}

            {quoteData.additional_notes && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm text-secondary">
                  <span className="font-semibold text-foreground">Notas: </span>
                  {quoteData.additional_notes}
                </p>
              </div>
            )}

            {quoteData.attachments && quoteData.attachments.length > 0 && (
              <div className="flex gap-2 text-sm">
                <AttachIcon className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Adjuntos: </span>
                  <span className="text-secondary">{quoteData.attachments.length} archivo(s)</span>
                </div>
              </div>
            )}
          </Card>
        );
      }
    } catch (e) {
      // Not a quote message, return plain text
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-12 h-12">
          <AvatarImage src={quote.specialist?.avatar_url} />
          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
            {getInitials(quote.specialist?.user_id || 'Especialista')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground truncate">
            {quote.specialist?.user_id || 'Especialista'}
          </h2>
          <p className="text-xs text-secondary">En línea</p>
        </div>
        <Button 
          size="sm"
          onClick={() => setShowConfirmDialog(true)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Contratar
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === user?.id;
          const quoteContent = renderQuoteMessage(message.content);
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              {quoteContent ? (
                <div className="max-w-[85%]">
                  {quoteContent}
                  <p className="text-xs text-secondary mt-1 px-1">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              ) : (
                <Card
                  className={`max-w-[80%] px-4 py-3 shadow-sm ${
                    isOwnMessage
                      ? 'bg-accent text-accent-foreground rounded-tr-sm'
                      : 'bg-background border-secondary/20 text-foreground rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1.5 ${isOwnMessage ? 'text-accent-foreground/70' : 'text-secondary'}`}>
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </Card>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border px-4 py-3 flex gap-2 shadow-sm">
        <Button variant="ghost" size="icon" className="text-secondary hover:text-foreground">
          <Paperclip className="w-5 h-5" />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe un mensaje..."
          className="flex-1 border-input/50 focus-visible:ring-secondary"
        />
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-secondary">
              Aceptas los términos y condiciones del especialista y continuar con la contratación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">
              No, cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleContratarConfirm}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Sí, contratar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
