import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: { name: string; type: string; url: string }[];
}

interface CalculatorChatProps {
  calculatorData?: Record<string, any>;
  onDataUpdate?: (field: string, value: any) => void;
  hasCredits?: boolean;
}

export const CalculatorChat = ({ calculatorData, onDataUpdate, hasCredits = false }: CalculatorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hei! 👋 Jeg hjelper deg med å fylle ut boligfinansieringsrapporten.\n\n**Slik analyserer du en eiendom fra Finn.no:**\n1. Åpne annonsen på Finn.no\n2. Trykk **Ctrl+U** (Windows) eller **Cmd+Option+U** (Mac)\n3. Søk etter `<script id="__NEXT_DATA__"` (Ctrl+F)\n4. Kopier **KUN** denne `<script>` seksjonen (fra `<script` til `</script>`)\n5. Lim inn her\n\n⚠️ **VIKTIG:** Ikke kopier hele HTML-siden - kun `__NEXT_DATA__` scriptet!\n\nDu kan også laste opp dokumenter (bilder/PDF) så analyserer jeg dem.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isUnder10MB = file.size < 10 * 1024 * 1024;
      
      if (!isImage && !isPdf) {
        toast.error(`${file.name}: Kun bilder og PDF er støttet`);
        return false;
      }
      if (!isUnder10MB) {
        toast.error(`${file.name}: Filen er for stor (maks 10MB)`);
        return false;
      }
      return true;
    });
    
    if (attachments.length + validFiles.length > 3) {
      toast.error('Du kan maksimalt laste opp 3 filer om gangen');
      return;
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || !hasCredits) return;

    const userMessage = input.trim();
    
    // Check message size (rough token estimate: ~4 chars per token)
    const estimatedTokens = userMessage.length / 4;
    if (estimatedTokens > 25000) {
      toast.error('Meldingen er for lang (maks ~100,000 tegn). Hvis du limte HTML, kopier KUN <script id="__NEXT_DATA__"> seksjonen.');
      return;
    }
    
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    
    // Convert attachments to base64 for display
    const attachmentData = await Promise.all(
      currentAttachments.map(async (file) => ({
        name: file.name,
        type: file.type,
        url: await convertFileToBase64(file)
      }))
    );
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage || '📎 Sendt dokument(er)',
      attachments: attachmentData
    }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('calculator-ai-chat', {
        body: {
          message: userMessage,
          sessionId,
          calculatorData,
          attachments: attachmentData
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Insufficient credits')) {
          toast.error('Du har ikke nok kreditter. Trenger 0.5 kreditter per melding.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      setSessionId(data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      // Auto-fill fields if AI extracted data
      if (data.extractedData) {
        Object.entries(data.extractedData).forEach(([field, value]) => {
          onDataUpdate?.(field, value);
        });
        toast.success('Data automatisk fylt inn fra dokument');
      }

      if (data.creditsUsed > 0) {
        toast.success(`Melding sendt (${data.creditsUsed} kreditter brukt)`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Kunne ikke sende melding');
      setMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border/50 bg-card">
        <h3 className="font-semibold text-lg">AI-assistent</h3>
        <p className="text-sm text-muted-foreground">
          {hasCredits ? '0.5 kreditter per melding' : '🔒 Kjøp kreditter for å bruke AI-chat'}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4 bg-background" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-lg'
                    : 'bg-muted rounded-lg'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs opacity-80">
                        {att.type.startsWith('image/') ? (
                          <>
                            <ImageIcon className="h-3 w-3" />
                            <img src={att.url} alt={att.name} className="max-w-full rounded mt-1" />
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3" />
                            <span>{att.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-card">
        {!hasCredits && (
          <div className="mb-3 p-3 bg-muted rounded text-center">
            <p className="text-sm font-medium mb-2">Kjøp kreditter for å bruke AI-chat</p>
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/credits-purchase'}
              className="w-full"
            >
              Kjøp kreditter
            </Button>
          </div>
        )}
        
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-muted rounded px-3 py-2 text-sm">
                {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf"
            multiple
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !hasCredits || attachments.length >= 3}
            size="icon"
            variant="outline"
            className="h-[60px] w-[60px] flex-shrink-0 rounded"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasCredits ? "Skriv en melding..." : "Du må kjøpe kreditter for å bruke chatten"}
            className="min-h-[60px] max-h-[120px] rounded"
            disabled={isLoading || !hasCredits}
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading || !hasCredits}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0 rounded"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
