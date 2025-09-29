import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { Send, Shield, User, CreditCard, ArrowLeft, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  actionExecuted?: string | null;
}

const Agent007 = () => {
  const { user } = useAuth();
  const { credits, hasCredits, useCredit, isAmbassador } = useCredits();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hei! Jeg er Agent 007 - din avanserte utleieforvaltningsagent. Jeg kan hjelpe deg med konkrete utleieoppgaver som å sende SMS/e-post til leietakere, administrere leieforhold, og automatisere prosesser. Hver interaksjon koster 1 credit. Hvordan kan jeg assistere deg i dag?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const cancelRequest = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    setLoadingStatus('');
    toast({
      title: "Forespørsel avbrutt",
      description: "Agent 007 forespørselen ble stoppet",
      variant: "default"
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    if (!hasCredits && !isAmbassador) {
      toast({
        title: "Ingen credits igjen",
        description: "Du må kjøpe Pro Credits for å bruke Agent 007",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setLoadingStatus('🔍 Analyserer forespørsel...');

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Set up a timeout to detect if the request is stuck
    const timeoutId = setTimeout(() => {
      setLoadingStatus('⚠️ Tar lengre tid enn forventet...');
    }, 10000); // 10 seconds

    const finalTimeoutId = setTimeout(() => {
      setLoadingStatus('❌ Forespørselen ser ut til å være stuck. Prøv igjen.');
      setTimeout(() => {
        setIsLoading(false);
        setLoadingStatus('');
      }, 3000);
    }, 30000); // 30 seconds

    try {
      // Simulate different loading phases with status updates
      const statusTimer1 = setTimeout(() => setLoadingStatus('📊 Henter utleiedata...'), 500);
      const statusTimer2 = setTimeout(() => setLoadingStatus('🤖 Agent 007 tenker...'), 1500);
      const statusTimer3 = setTimeout(() => setLoadingStatus('📝 Forbereder svar...'), 3000);

      // Call Supabase Edge Function for Agent 007
      const { data, error } = await supabase.functions.invoke('agent-007', {
        body: { 
          message: inputValue,
          action: null // For future use when implementing specific actions
        },
        signal: controller.signal
      });

      // Clear all timers when we get a response
      clearTimeout(timeoutId);
      clearTimeout(finalTimeoutId);
      clearTimeout(statusTimer1);
      clearTimeout(statusTimer2);
      clearTimeout(statusTimer3);

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to get Agent 007 response');
      }

      if (data.error) {
        if (data.needsCredits) {
          toast({
            title: "Ingen credits igjen",
            description: "Du må kjøpe Pro Credits for å fortsette med Agent 007",
            variant: "destructive"
          });
          return;
        }
        throw new Error(data.error);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        actionExecuted: data.actionExecuted
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Use credits if not ambassador
      if (!isAmbassador) {
        useCredit();
      }

    } catch (error) {
      console.error('Error sending message to Agent 007:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende meldingen til Agent 007. Prøv igjen.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
      setAbortController(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Logg inn påkrevd</h2>
            <p className="text-muted-foreground mb-4">
              Du må være logget inn for å bruke Agent 007
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Logg inn</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/rental" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Tilbake til Utleie
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    Agent 007
                    <Zap className="w-4 h-4 text-orange-500" />
                  </h1>
                  <p className="text-sm text-muted-foreground">Avansert utleieforvaltningsagent</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {isAmbassador ? '∞ Ambassador' : `${credits} credits`}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                1 credit per melding
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4 mb-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.actionExecuted && (
                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded text-xs">
                      <span className="font-medium text-orange-700 dark:text-orange-400">
                        Handling utført: {message.actionExecuted}
                      </span>
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString('no-NO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="bg-background border shadow-sm rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">
                          {loadingStatus || 'Agent 007 arbeider...'}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={cancelRequest}
                      className="text-xs px-2 py-1 h-7 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      Stopp
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {!hasCredits && !isAmbassador ? (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-destructive mb-3">
                    Du har ingen credits igjen. Kjøp Pro Credits for å fortsette med Agent 007.
                  </p>
                  <Button asChild size="sm">
                    <Link to="/credits">Kjøp Credits</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    placeholder="Beskriv hva du ønsker hjelp med i utleieforvaltningen..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="resize-none"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agent007;