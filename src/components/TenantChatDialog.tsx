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
      // For now, we'll create some example messages since we don't have a chat table yet
      // In a real implementation, you'd fetch from a chat_messages table
      const exampleMessages: Message[] = [
        {
          id: '1',
          content: `Hei ${tenant?.first_name}! Velkommen som leietaker i ${property?.address}. Hvis du har noen spørsmål om eiendommen, bare send meg en melding her.`,
          sender_type: 'landlord',
          sender_name: 'Utleier',
          timestamp: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          id: '2',
          content: 'Takk for fin velkomst! Jeg gleder meg til å flytte inn. Har du noen tips om området?',
          sender_type: 'tenant',
          sender_name: `${tenant?.first_name} ${tenant?.last_name}`,
          timestamp: new Date(Date.now() - 43200000) // 12 hours ago
        }
      ];
      
      setMessages(exampleMessages);
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
    
    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        sender_type: 'landlord', // Always landlord since this is the property owner view
        sender_name: 'Utleier',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      setInputValue('');

      // TODO: In a real implementation, save to database
      // const { error } = await supabase
      //   .from('chat_messages')
      //   .insert({
      //     lease_id: lease.id,
      //     content: inputValue,
      //     sender_type: 'landlord',
      //     sender_id: user.id
      //   });

      toast({
        title: "Melding sendt",
        description: "Din melding er sendt til leietaker",
      });

    } catch (error) {
      console.error('Error sending message:', error);
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
            {messages.map((message) => (
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
            ))}
            
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