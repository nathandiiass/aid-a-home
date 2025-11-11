import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useSpecialistMode } from '@/hooks/use-specialist-mode';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ArrowLeft, Send, Paperclip, Clock, DollarSign, Package, FileText, Ban, Timer, Shield, Eye, Camera, Image as ImageIcon, File } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import confetti from 'canvas-confetti';

export default function Chat() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSpecialistMode } = useSpecialistMode();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [specialistProfile, setSpecialistProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Load specialist profile
      if (quoteData.specialist?.user_id) {
        const { data: specialistProfileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', quoteData.specialist.user_id)
          .single();
        
        if (specialistProfileData) {
          setSpecialistProfile(specialistProfileData);
        }
      }

      // Load user profile
      if (quoteData.request?.user_id) {
        const { data: userProfileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', quoteData.request.user_id)
          .single();
        
        if (userProfileData) {
          setUserProfile(userProfileData);
        }
      }

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
    try {
      // Update quote status to accepted
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (error) throw error;

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

      // Reload quote data to reflect new status
      loadChatData();
    } catch (error: any) {
      console.error('Error hiring specialist:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo contratar al especialista'
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'E';
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Usuario';
    
    const firstName = profile.first_name || '';
    const lastNamePaterno = profile.last_name_paterno || '';
    const lastNameMaterno = profile.last_name_materno || '';
    
    // Capitalize first letter of each word
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    
    // Try: Nombre + Apellido Paterno
    if (firstName && lastNamePaterno) {
      return `${capitalize(firstName)} ${capitalize(lastNamePaterno)}`;
    }
    
    // Fallback: Nombre + Apellido Materno
    if (firstName && lastNameMaterno) {
      return `${capitalize(firstName)} ${capitalize(lastNameMaterno)}`;
    }
    
    // Fallback: display_name
    if (profile.display_name) {
      return profile.display_name;
    }
    
    // Fallback: just first name
    if (firstName) {
      return capitalize(firstName);
    }
    
    return 'Usuario';
  };

  // Determine who the interlocutor is based on mode
  const interlocutorProfile = isSpecialistMode ? userProfile : specialistProfile;
  const interlocutorName = getDisplayName(interlocutorProfile);

  const handleFileSelect = (type: 'camera' | 'gallery' | 'document') => {
    setShowAttachMenu(false);
    
    if (!fileInputRef.current) return;
    
    // Set accept attribute based on type
    if (type === 'camera') {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment' as any;
    } else if (type === 'gallery') {
      fileInputRef.current.accept = 'image/*,video/*';
      fileInputRef.current.removeAttribute('capture');
    } else {
      fileInputRef.current.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
      fileInputRef.current.removeAttribute('capture');
    }
    
    fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // TODO: Implement actual file upload to storage
    toast({
      title: 'Archivo seleccionado',
      description: `${files.length} archivo(s) listo(s) para enviar.`
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
                <Paperclip className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed App Bar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage src={interlocutorProfile?.avatar_url} />
          <AvatarFallback style={{ backgroundColor: '#669BBC', color: '#FFFFFF' }} className="font-semibold">
            {getInitials(interlocutorName)}
          </AvatarFallback>
        </Avatar>
        <button 
          className="flex-1 min-w-0 text-left"
          onClick={() => {
            if (!isSpecialistMode && quote?.specialist?.id) {
              navigate(`/specialist/${quote.specialist.id}/profile?quoteId=${quoteId}`);
            } else if (isSpecialistMode && quote?.request?.user_id) {
              navigate(`/user/${quote.request.user_id}/profile?quoteId=${quoteId}`);
            }
          }}
        >
          <h2 className="font-bold truncate" style={{ color: '#003049' }}>
            {interlocutorName}
          </h2>
          <p className="text-xs" style={{ color: '#669BBC' }}>En línea</p>
        </button>
        {!isSpecialistMode && (
          <Button 
            size="sm"
            onClick={() => setShowConfirmDialog(true)}
            className="flex-shrink-0"
            style={{ backgroundColor: '#C1121F', color: '#FFFFFF' }}
          >
            Contratar
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-24">
        {messages.map((message, index) => {
          // Determine if message is from specialist
          const isSpecialistMessage = message.sender_id === quote.specialist?.user_id;
          const quoteContent = renderQuoteMessage(message.content);
          
          return (
            <div
              key={message.id}
              className={`flex ${isSpecialistMessage ? 'justify-start' : 'justify-end'} animate-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {quoteContent ? (
                <div className="max-w-[85%]">
                  {quoteContent}
                  <p className="text-xs mt-1 px-1" style={{ color: '#669BBC' }}>
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              ) : (
                <div className={`relative max-w-[80%] ${isSpecialistMessage ? 'mr-12' : 'ml-12'}`}>
                  <Card
                    className={`px-4 py-3 shadow-sm border ${
                      isSpecialistMessage
                        ? 'rounded-2xl rounded-tl-sm'
                        : 'rounded-2xl rounded-tr-sm'
                    }`}
                    style={isSpecialistMessage ? {
                      backgroundColor: '#FFFFFF',
                      color: '#003049',
                      borderColor: '#669BBC'
                    } : {
                      backgroundColor: '#003049',
                      color: '#FFFFFF',
                      borderColor: '#003049'
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className="text-xs mt-1.5 opacity-70">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </p>
                  </Card>
                  {/* WhatsApp-style tail */}
                  <div 
                    className={`absolute bottom-0 ${isSpecialistMessage ? 'left-0 -ml-2' : 'right-0 -mr-2'}`}
                    style={{
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      ...(isSpecialistMessage ? {
                        borderWidth: '0 12px 12px 0',
                        borderColor: `transparent #FFFFFF transparent transparent`,
                        filter: 'drop-shadow(-1px 0px 0px #669BBC)'
                      } : {
                        borderWidth: '0 0 12px 12px',
                        borderColor: `transparent transparent #003049 transparent`
                      })
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start animate-fade-in mr-12">
            <div className="relative">
              <Card className="px-4 py-3 shadow-sm border rounded-2xl rounded-tl-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#669BBC' }}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#669BBC', animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#669BBC', animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#669BBC', animationDelay: '300ms' }}></span>
                </div>
              </Card>
              {/* Tail for typing indicator */}
              <div 
                className="absolute bottom-0 left-0 -ml-2"
                style={{
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: '0 12px 12px 0',
                  borderColor: 'transparent #FFFFFF transparent transparent',
                  filter: 'drop-shadow(-1px 0px 0px #669BBC)'
                }}
              />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Composition Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 shadow-lg z-40">
        <div className="flex gap-2 items-end max-w-screen-lg mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowAttachMenu(true)}
            className="flex-shrink-0"
            style={{ color: '#669BBC' }}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 rounded-full px-4 py-2 border" style={{ backgroundColor: '#FDF0D5', borderColor: '#669BBC' }}>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto resize-none"
              style={{ color: '#003049' }}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="flex-shrink-0"
            style={{ backgroundColor: '#003049', color: '#FFFFFF' }}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Attach Menu Sheet */}
      <Sheet open={showAttachMenu} onOpenChange={setShowAttachMenu}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Adjuntar archivo</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 py-6">
            <Button
              variant="outline"
              className="h-14 justify-start gap-3"
              onClick={() => handleFileSelect('camera')}
            >
              <Camera className="w-5 h-5" style={{ color: '#669BBC' }} />
              <span>Cámara</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 justify-start gap-3"
              onClick={() => handleFileSelect('gallery')}
            >
              <ImageIcon className="w-5 h-5" style={{ color: '#669BBC' }} />
              <span>Galería</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 justify-start gap-3"
              onClick={() => handleFileSelect('document')}
            >
              <File className="w-5 h-5" style={{ color: '#669BBC' }} />
              <span>Documento</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: '#003049' }}>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: '#669BBC' }}>
              Aceptas los términos y condiciones del especialista y continuar con la contratación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: '#003049' }}>
              No, cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleContratarConfirm}
              style={{ backgroundColor: '#003049', color: '#FFFFFF' }}
            >
              Sí, contratar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
