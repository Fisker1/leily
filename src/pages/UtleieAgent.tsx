import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Settings, CreditCard, ArrowLeft, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  actionExecuted?: string | null;
}

const UtleieAgent = () => {
  const { user } = useAuth();
  const { credits, hasCredits, useCredit, isAmbassador } = useCredits();
  const { isAdmin, isAmbassador: roleIsAmbassador, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const isActualAmbassador = roleIsAmbassador || isAmbassador;
  
  // General agent state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hei! Jeg er din personlige eiendomsrådgiver og utleieekspert. Jeg kombinerer kunnskap fra senior bankinvestorer, eiendomsmeglere og advokater for å gi deg de beste rådene om eiendomsinvestering og utleieforvaltning. Hvordan kan jeg hjelpe deg i dag?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Agent 007 state
  const [agent007Messages, setAgent007Messages] = useState<Message[]>([
    {
      id: '007-1',
      content: 'Hei! Jeg er Agent 007 - din avanserte utleieforvaltningsagent. Jeg har tilgang til tidligere samtaler og kan hjelpe deg med spesifikke oppgaver basert på din historie. Hver interaksjon koster 1 credit. Hvordan kan jeg assistere deg?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [agent007InputValue, setAgent007InputValue] = useState('');
  const [agent007IsLoading, setAgent007IsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agent007Messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('utleie-agent-chat', {
        body: { 
          message: inputValue,
          customPrompt: customPrompt 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data.error) {
        if (data.needsAccess) {
          toast({
            title: "Ingen tilgang",
            description: "Du trenger credits eller et aktivt leieabonnement for å bruke Utleie Agent",
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
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende meldingen. Prøv igjen.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleAgent007SendMessage = async () => {
    if (!agent007InputValue.trim()) return;
    
    if (!hasCredits && !isActualAmbassador) {
      toast({
        title: "Ingen credits igjen",
        description: "Du må kjøpe Pro Credits for å bruke Agent 007",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: agent007InputValue,
      role: 'user',
      timestamp: new Date()
    };

    setAgent007Messages(prev => [...prev, userMessage]);
    setAgent007InputValue('');
    setAgent007IsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('agent-007', {
        body: { 
          message: agent007InputValue,
          conversationHistory: messages,
          action: null
        }
      });

      if (error) {
        console.error('Agent 007 edge function error:', error);
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
      
      setAgent007Messages(prev => [...prev, aiMessage]);
      
      if (!isActualAmbassador) {
        useCredit();
      }
      
      setAgent007IsLoading(false);

    } catch (error) {
      console.error('Error sending message to Agent 007:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende meldingen til Agent 007. Prøv igjen.",
        variant: "destructive"
      });
      setAgent007IsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAgent007KeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAgent007SendMessage();
    }
  };

  // Don't render until roles are loaded
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Laster...</h2>
            <p className="text-muted-foreground mb-4">
              Kontrollerer tilganger...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderMessages = (messagesArray: Message[], loadingState: boolean, agentType: 'general' | '007' = 'general') => (
    <div className="space-y-4 mb-6">
      {messagesArray.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              agentType === '007' 
                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                : 'bg-gradient-primary'
            }`}>
              {agentType === '007' ? (
                <Shield className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
          )}
          
          <div
            className={`max-w-[80%] rounded-lg px-4 py-3 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border shadow-sm'
            }`}
          >
            <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
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
      
      {loadingState && (
        <div className="flex gap-3 justify-start">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
            agentType === '007' 
              ? 'bg-gradient-to-r from-red-500 to-orange-500' 
              : 'bg-gradient-primary'
          }`}>
            {agentType === '007' ? (
              <Shield className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="bg-background border shadow-sm rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  agentType === '007' ? 'bg-orange-500' : 'bg-primary'
                }`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  agentType === '007' ? 'bg-orange-500' : 'bg-primary'
                }`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  agentType === '007' ? 'bg-orange-500' : 'bg-primary'
                }`} style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-muted-foreground">
                {agentType === '007' ? 'Agent 007 arbeider...' : 'Agenten tenker...'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );

  return (
    <div className="h-screen bg-gradient-soft flex flex-col">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Tilbake
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Utleie Agent</h1>
                  <p className="text-sm text-muted-foreground">Din personlige eiendomsrådgiver</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {isActualAmbassador ? '∞ Ambassador' : `${credits} credits`}
              </Badge>
              {(isActualAmbassador || isAdmin) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Innstillinger
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel - Only for Admin/Ambassador */}
      {showSettings && (isActualAmbassador || isAdmin) && (
        <div className="bg-background border-b p-4 flex-shrink-0">
          <div className="container mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Innstillinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tilpass agentens ekspertise (valgfritt)
                    </label>
                    <Textarea
                      placeholder="F.eks: Jeg er spesielt interessert i kommersielle eiendommer i Oslo, fokuser på skatteoptimalisering og finansieringsstrategier..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Skriv inn spesifikke områder eller fokusområder du ønsker agenten skal prioritere
                    </p>
                  </div>
                  <Button size="sm">
                    Lagre innstillinger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Content - Flexible height container */}
      <div className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {(isActualAmbassador || isAdmin) ? (
            <Tabs defaultValue="general" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Utleie Agent
                </TabsTrigger>
                <TabsTrigger value="007" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Agent 007
                  <Zap className="w-3 h-3 text-orange-500" />
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="flex-1 mt-4 overflow-y-auto">
                <div className="h-full">
                  {renderMessages(messages, isLoading, 'general')}
                </div>
              </TabsContent>
              
              <TabsContent value="007" className="flex-1 mt-4 overflow-y-auto">
                <div className="h-full">
                  {renderMessages(agent007Messages, agent007IsLoading, '007')}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-full flex flex-col">
              <div className="text-center p-4 bg-muted/50 rounded-lg mb-4 flex-shrink-0">
                <p className="text-sm text-muted-foreground">
                  Agent 007 er kun tilgjengelig for ambassadører og administratorer
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {renderMessages(messages, isLoading, 'general')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-background/95 backdrop-blur border-t flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {(isActualAmbassador || isAdmin) ? (
              <Tabs defaultValue="general" className="w-full">
                <TabsContent value="general">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Skriv din spørsmål om eiendomsinvestering eller utleieforvaltning..."
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
                </TabsContent>
                
                <TabsContent value="007">
                  {!hasCredits && !isActualAmbassador ? (
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
                          value={agent007InputValue}
                          onChange={(e) => setAgent007InputValue(e.target.value)}
                          onKeyPress={handleAgent007KeyPress}
                          disabled={agent007IsLoading}
                          className="resize-none"
                        />
                      </div>
                      <Button
                        onClick={handleAgent007SendMessage}
                        disabled={!agent007InputValue.trim() || agent007IsLoading}
                        className="flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    placeholder="Skriv din spørsmål om eiendomsinvestering eller utleieforvaltning..."
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

export default UtleieAgent;