import { useState, useEffect, useRef } from 'react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Send, Paperclip, Clock, DollarSign, Package, FileText, Ban, Timer, Shield, Eye, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { WorkOptionsSheet } from '@/components/orders/WorkOptionsSheet';
import { CancelWorkSurvey } from '@/components/orders/CancelWorkSurvey';
import { SpecialistProblemSurvey } from '@/components/orders/SpecialistProblemSurvey';

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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showCancelSurvey, setShowCancelSurvey] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showProblemSurvey, setShowProblemSurvey] = useState(false);
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

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      if (!messagesData || messagesData.length === 0) {
        await createInitialMessage(quoteData);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading chat:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el chat'
      });
      setLoading(false);
    }
  };

  const createInitialMessage = async (quoteData: any) => {
    try {
      const messageContent = JSON.stringify({
        type: 'quote',
        data: quoteData
      });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          quote_id: quoteData.id,
          sender_id: quoteData.specialist.user_id,
          content: messageContent
        })
        .select()
        .single();

      if (error) throw error;
      setMessages([data]);
    } catch (error) {
      console.error('Error creating initial message:', error);
    }
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return 'Usuario';
    const firstName = profile.first_name || '';
    const lastNameP = profile.last_name_paterno || '';
    const lastNameM = profile.last_name_materno || '';
    return `${firstName} ${lastNameP} ${lastNameM}`.trim() || profile.display_name || 'Usuario';
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'U';
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

  const handleContratarConfirm = async () => {
    if (!quoteId) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (error) throw error;

      setShowConfirmDialog(false);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "🎉 ¡Felicidades! Encontraste a tu especialista",
        description: "La orden ha sido asignada exitosamente.",
      });

      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error: any) {
      console.error('Error hiring specialist:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo contratar al especialista'
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!quoteId) return;

    try {
      // Update quote status to rejected
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Update service request status to cancelled
      if (quote?.request_id) {
        const { error: requestError } = await supabase
          .from('service_requests')
          .update({ status: 'cancelled' })
          .eq('id', quote.request_id);

        if (requestError) throw requestError;
      }

      setShowCancelDialog(false);

      toast({
        title: "Solicitud cancelada",
        description: "La solicitud ha sido cancelada exitosamente.",
      });

      setTimeout(() => {
        navigate('/specialist/orders');
      }, 1000);
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cancelar la solicitud'
      });
    }
  };

  const handleOptionSelect = (option: 'cancel' | 'finish' | 'problem') => {
    setShowOptionsSheet(false);
    
    setTimeout(() => {
      if (option === 'cancel') {
        setShowCancelSurvey(true);
      } else if (option === 'finish') {
        setShowFinishConfirm(true);
      } else if (option === 'problem') {
        setShowProblemSurvey(true);
      }
    }, 200);
  };

  const handleCancelWork = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Save feedback
      const { error: feedbackError } = await supabase
        .from('request_cancellation_feedback')
        .insert({
          request_id: quote.request_id,
          user_id: user.id,
          main_reason: data.mainReason,
          other_reason_text: data.otherReasonText,
          improvement_text: data.improvementText
        });

      if (feedbackError) throw feedbackError;

      // Update request status
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', quote.request_id);

      if (updateError) throw updateError;

      toast({
        title: 'Servicio cancelado',
        description: 'El servicio ha sido cancelado exitosamente'
      });

      setShowCancelSurvey(false);
      navigate('/orders');
    } catch (error) {
      console.error('Error cancelling work:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cancelar el servicio'
      });
    }
  };

  const handleFinishWork = async () => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'completed' })
        .eq('id', quote.request_id);

      if (error) throw error;

      toast({
        title: 'Servicio finalizado',
        description: 'El servicio ha sido marcado como finalizado'
      });

      setShowFinishConfirm(false);
      navigate('/orders');
    } catch (error) {
      console.error('Error finishing work:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo finalizar el servicio'
      });
    }
  };

  const handleProblemSubmit = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Save problem report
      const { error: reportError } = await supabase
        .from('specialist_problem_reports')
        .insert({
          request_id: quote.request_id,
          user_id: user.id,
          quote_id: quote.id,
          specialist_id: quote.specialist_id,
          main_reason: data.mainReason,
          other_reason_text: data.otherReasonText
        });

      if (reportError) throw reportError;
      
      toast({
        title: 'Reporte enviado',
        description: 'Te recomendamos escoger a otro especialista, por el momento'
      });

      setShowProblemSurvey(false);
    } catch (error) {
      console.error('Error submitting problem:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar el reporte'
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chat no encontrado</div>
      </div>
    );
  }

  const interlocutorProfile = isSpecialistMode ? userProfile : specialistProfile;
  const interlocutorName = getDisplayName(interlocutorProfile);

  const renderQuoteMessage = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'quote') {
        const quoteData = parsed.data;
        return (
          <Card className="bg-white rounded-2xl shadow-sm p-5 space-y-3 max-w-[90%]">
            <h4 className="font-bold text-gray-900 text-base mb-3">📋 Propuesta de servicio</h4>
            
            {quoteData.scope && (
              <div className="flex gap-2 text-sm">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">¿Qué incluye? </span>
                  <span className="text-gray-700">{quoteData.scope}</span>
                </div>
              </div>
            )}

            {quoteData.exclusions && (
              <div className="flex gap-2 text-sm">
                <Ban className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">¿Qué no incluye? </span>
                  <span className="text-gray-700">{quoteData.exclusions}</span>
                </div>
              </div>
            )}

            {quoteData.proposed_date && (
              <div className="flex gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">Disponibilidad: </span>
                  <span className="text-gray-700">
                    {format(new Date(quoteData.proposed_date), 'dd MMM yyyy', { locale: es })}
                    {quoteData.proposed_time_start && ` · ${quoteData.proposed_time_start.slice(0, 5)}`}
                    {quoteData.proposed_time_end && `–${quoteData.proposed_time_end.slice(0, 5)}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900">Precio: </span>
                <span className="text-green-700 font-bold">
                  {quoteData.price_fixed ? `$${quoteData.price_fixed.toLocaleString()}` : `$${quoteData.price_min?.toLocaleString()}–$${quoteData.price_max?.toLocaleString()}`} MXN
                </span>
              </div>
            </div>

            <div className="flex gap-2 text-sm">
              <Package className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900">Materiales: </span>
                <span className="text-gray-700">
                  {quoteData.includes_materials ? 'Incluidos' : 'No incluidos'}
                  {quoteData.materials_list && ` · ${quoteData.materials_list}`}
                </span>
              </div>
            </div>

            {quoteData.estimated_duration_hours && (
              <div className="flex gap-2 text-sm">
                <Timer className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">Duración estimada: </span>
                  <span className="text-gray-700">{quoteData.estimated_duration_hours}h</span>
                </div>
              </div>
            )}

            {quoteData.requires_visit && (
              <div className="flex gap-2 text-sm">
                <Eye className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">Visita previa: </span>
                  <span className="text-gray-700">
                    Requerida {quoteData.visit_cost && `($${quoteData.visit_cost} MXN)`}
                  </span>
                </div>
              </div>
            )}

            {quoteData.has_warranty && (
              <div className="flex gap-2 text-sm">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">Garantía: </span>
                  <span className="text-gray-700">
                    {quoteData.warranty_days} días
                    {quoteData.warranty_description && ` · ${quoteData.warranty_description}`}
                  </span>
                </div>
              </div>
            )}

            {quoteData.additional_notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Detalles adicionales: </span>
                  {quoteData.additional_notes}
                </p>
              </div>
            )}

            {quoteData.attachments && quoteData.attachments.length > 0 && (
              <div className="flex gap-2 text-sm">
                <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">Adjuntos: </span>
                  <span className="text-gray-700">{quoteData.attachments.length} archivo(s)</span>
                </div>
              </div>
            )}
          </Card>
        );
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Rappi Style */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            onClick={() => {
              if (!isSpecialistMode && quote?.specialist?.id) {
                navigate(`/specialist/${quote.specialist.id}/profile`);
              } else if (isSpecialistMode && quote?.request?.user_id) {
                navigate(`/user/${quote.request.user_id}/profile`);
              }
            }}
          >
            <Avatar className="w-9 h-9 border border-gray-200">
              <AvatarImage src={interlocutorProfile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                {getInitials(interlocutorName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-sm truncate">
                {interlocutorName}
              </h2>
              <p className="text-xs text-green-600">En línea</p>
            </div>
          </button>

          {!isSpecialistMode && quote?.status === 'pending' && (
            <Button 
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
              className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white rounded-full px-4"
            >
              Contratar
            </Button>
          )}

          {!isSpecialistMode && quote?.status === 'accepted' && (quote?.request?.status === 'active' || quote?.request?.status === 'in_progress') && (
            <button 
              onClick={() => setShowOptionsSheet(true)}
              className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {isSpecialistMode && quote?.status === 'accepted' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => setShowCancelDialog(true)}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  Cancelar solicitud
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-24 max-w-2xl mx-auto w-full">
        {messages.map((message, index) => {
          const isSpecialistMessage = message.sender_id === quote.specialist?.user_id;
          const quoteContent = renderQuoteMessage(message.content);
          
          return (
            <div
              key={message.id}
              className={`flex ${isSpecialistMessage ? 'justify-start' : 'justify-end'}`}
            >
              {quoteContent ? (
                <div className="max-w-[85%]">
                  {quoteContent}
                  <p className="text-xs mt-1 px-1 text-gray-500">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              ) : (
                <div className={`max-w-[75%] ${isSpecialistMessage ? 'mr-12' : 'ml-12'}`}>
                  <Card
                    className={`px-4 py-3 shadow-sm border-0 ${
                      isSpecialistMessage
                        ? 'bg-white rounded-2xl rounded-tl-sm'
                        : 'bg-blue-600 rounded-2xl rounded-tr-sm'
                    }`}
                  >
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                      isSpecialistMessage ? 'text-gray-900' : 'text-white'
                    }`}>
                      {message.content}
                    </p>
                    <p className={`text-xs mt-1.5 ${
                      isSpecialistMessage ? 'text-gray-500' : 'text-white/80'
                    }`}>
                      {format(new Date(message.created_at), 'HH:mm')}
                    </p>
                  </Card>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 z-40">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <button
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="w-full rounded-full border-gray-200 bg-gray-50 px-4 py-2 pr-12 text-sm focus:bg-white"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              ¿Contratar a {interlocutorName}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Al confirmar, aceptas la cotización y se le asignará este trabajo al especialista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleContratarConfirm}
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog for Specialists */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">
              ¿Cancelar esta solicitud?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 leading-relaxed">
              Cancelar esta solicitud puede afectar tu perfil y tu visibilidad dentro de la app.
              <br /><br />
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">No, mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Work Options Sheet for Users */}
      <WorkOptionsSheet
        open={showOptionsSheet}
        onOpenChange={setShowOptionsSheet}
        onOptionSelect={handleOptionSelect}
      />

      {/* Cancel Work Survey */}
      <CancelWorkSurvey
        open={showCancelSurvey}
        onOpenChange={setShowCancelSurvey}
        onSubmit={handleCancelWork}
      />

      {/* Finish Work Confirmation */}
      <AlertDialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas marcar este servicio como finalizado?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinishWork}
              className="rounded-full bg-rappi-green hover:bg-rappi-green/90"
            >
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Problem Report Survey */}
      <SpecialistProblemSurvey
        open={showProblemSurvey}
        onOpenChange={setShowProblemSurvey}
        onSubmit={handleProblemSubmit}
      />
    </div>
  );
}
