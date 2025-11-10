import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Chat() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
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
    const parts = [
      '📋 **Cotización**\n',
      `**Precio**: ${quoteData.price_fixed ? `$${quoteData.price_fixed}` : `$${quoteData.price_min} - $${quoteData.price_max}`}`,
    ];

    if (quoteData.proposed_date) {
      parts.push(`**Disponibilidad**: ${format(new Date(quoteData.proposed_date), 'dd MMM yyyy', { locale: es })}`);
      if (quoteData.proposed_time_start) {
        parts.push(`**Horario**: ${quoteData.proposed_time_start.slice(0, 5)} - ${quoteData.proposed_time_end?.slice(0, 5) || ''}`);
      }
    }

    if (quoteData.estimated_duration_hours) {
      parts.push(`**Duración estimada**: ${quoteData.estimated_duration_hours}h`);
    }

    parts.push(`**Materiales**: ${quoteData.includes_materials ? 'Incluidos' : 'No incluidos'}`);
    if (quoteData.materials_list) {
      parts.push(`  - ${quoteData.materials_list}`);
    }

    if (quoteData.scope) {
      parts.push(`**Alcance**: ${quoteData.scope}`);
    }

    if (quoteData.exclusions) {
      parts.push(`**No incluye**: ${quoteData.exclusions}`);
    }

    if (quoteData.has_warranty) {
      parts.push(`**Garantía**: ${quoteData.warranty_days} días`);
      if (quoteData.warranty_description) {
        parts.push(`  - ${quoteData.warranty_description}`);
      }
    }

    if (quoteData.requires_visit) {
      parts.push(`**Visita previa**: Sí (${quoteData.visit_cost ? `$${quoteData.visit_cost}` : 'Sin costo'})`);
    }

    if (quoteData.additional_notes) {
      parts.push(`\n**Notas adicionales**: ${quoteData.additional_notes}`);
    }

    return parts.join('\n');
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={quote.specialist?.avatar_url} />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {quote.specialist?.user_id?.[0]?.toUpperCase() || 'E'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">
            {quote.specialist?.user_id || 'Especialista'}
          </h2>
          <p className="text-xs text-muted-foreground">En línea</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === user?.id;
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`max-w-[80%] p-3 ${
                  isOwnMessage
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {format(new Date(message.created_at), 'HH:mm')}
                </p>
              </Card>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border px-4 py-3 flex gap-2">
        <Button variant="ghost" size="icon">
          <Paperclip className="w-5 h-5" />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe un mensaje..."
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="bg-accent hover:bg-accent/90"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
