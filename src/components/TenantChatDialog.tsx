import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender_type: 'landlord' | 'tenant';
  sender_name: string;
  timestamp: Date;
}

interface TenantChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: any;
  lease: any;
  tenant: any;
}

const TenantChatDialog = ({ open, onOpenChange, property, lease, tenant }: TenantChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open && lease?.id) {
      fetchMessages();
    }
  }, [open, lease?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!lease?.id) return;

    try {
      const { data: chatMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lease_id', lease.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste samtale",
          variant: "destructive",
        });
        return;
      }

      const formattedMessages: Message[] = (chatMessages || []).map(msg => ({
        id: msg.id,
        content: msg.message_content,
        sender_type: msg.sender_type as 'landlord' | 'tenant',
        sender_name: msg.sender_type === 'landlord' ? 'Utleier' : `${tenant?.first_name} ${tenant?.last_name}`,
        timestamp: new Date(msg.created_at)
      }));
      
      setMessages(formattedMessages);
      
      // If there are any messages in the database, hide the welcome message
      if (formattedMessages.length > 0) {
        setShowWelcomeMessage(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste samtale",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    setLoading(true);
    const messageContent = inputValue;
    setInputValue(''); // Clear input immediately for better UX
    
    try {
      const isFirstMessage = messages.length === 0 && showWelcomeMessage;
      
      // If this is the first message ever, add a welcome message first
      if (isFirstMessage) {
        const welcomeMessage = {
          lease_id: lease.id,
          message_content: `Hei ${tenant?.first_name}! Velkommen som leietaker i ${property?.address}. Hvis du har noen spørsmål om eiendommen eller området, bare send meg en melding her. Jeg håper du trives!`,
          sender_type: 'landlord',
          sender_id: user.id
        };

        const { error: welcomeError } = await supabase
          .from('chat_messages')
          .insert(welcomeMessage);

        if (welcomeError) {
          console.error('Error saving welcome message:', welcomeError);
          setInputValue(messageContent); // Restore input on error
          toast({
            title: "Feil",
            description: "Kunne ikke sende velkomstmelding",
            variant: "destructive",
          });
          return;
        }

        // Add welcome message to local state
        const welcomeMessageLocal: Message = {
          id: 'welcome-' + Date.now(),
          content: welcomeMessage.message_content,
          sender_type: 'landlord',
          sender_name: 'Utleier',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, welcomeMessageLocal]);
        setShowWelcomeMessage(false); // Hide the welcome message display after first real message
      }

      // Save the actual user message to database
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          lease_id: lease.id,
          message_content: messageContent,
          sender_type: 'landlord',
          sender_id: user.id
        });

      if (error) {
        console.error('Error saving message:', error);
        setInputValue(messageContent); // Restore input on error
        toast({
          title: "Feil",
          description: "Kunne ikke sende melding",
          variant: "destructive",
        });
        return;
      }

      // Add user message to local state for immediate UI update
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        sender_type: 'landlord',
        sender_name: 'Utleier',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);

      toast({
        title: "Melding sendt",
        description: isFirstMessage ? "Velkomstmelding og din melding er sendt til leietaker" : "Din melding er sendt til leietaker",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setInputValue(messageContent); // Restore input on error
      toast({
        title: "Feil",
        description: "Kunne ikke sende melding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <div>
              <span>Leiechat - {property?.address}</span>
              <div className="text-sm font-normal text-muted-foreground mt-1">
                Med {tenant?.first_name} {tenant?.last_name}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-muted/10">
          <div className="space-y-4">
            {/* Welcome message - shown only when no messages exist yet */}
            {showWelcomeMessage && messages.length === 0 && (
              <div className="flex gap-3 justify-end">
                <div className="max-w-[70%] rounded-lg px-4 py-3 bg-primary/10 border border-primary/20">
                  <p className="text-sm leading-relaxed text-primary">
                    Hei {tenant?.first_name}! Velkommen som leietaker i {property?.address}. 
                    Hvis du har noen spørsmål om eiendommen eller området, bare send meg en melding her. 
                    Jeg håper du trives!
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70 text-primary">
                      Velkomstmelding fra utleier
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            )}

            {messages.length === 0 && !showWelcomeMessage ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Ingen meldinger ennå</p>
                <p className="text-xs mt-1">Start en samtale med leietakeren din</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender_type === 'landlord' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender_type === 'tenant' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      message.sender_type === 'landlord'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleString('no-NO', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {message.sender_type === 'landlord' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                placeholder="Skriv en melding til leietaker..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || loading}
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-3 text-center">
            <Badge variant="outline" className="text-xs">
              <Bot className="w-3 h-3 mr-1" />
              Agent 007 kan få innsyn i denne samtalen for rådgivning
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TenantChatDialog;