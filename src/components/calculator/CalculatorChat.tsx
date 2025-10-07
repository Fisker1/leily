import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, X, Image as ImageIcon, FileText, Scissors, Calculator, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoanCalculatorDialog } from '@/components/LoanCalculatorDialog';
import { ExternalLenderDialog } from '@/components/ExternalLenderDialog';
import ReactMarkdown from 'react-markdown';

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

interface ProcessingStatus {
  isProcessing: boolean;
  stage: 'shaving' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

interface ShavedData {
  original: string;
  shaved: string;
  timestamp: number;
}

export const CalculatorChat = ({ calculatorData, onDataUpdate, hasCredits = false }: CalculatorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hei! 👋 Jeg hjelper deg med boligfinansieringsrapporten.

**Kom i gang:**
1. **📋 Formater** - Lim inn kode fra Finn.no
2. **🧮 Lånekalkulator** - Sett opp låneinformasjon
3. **💬 Chat** - Still spørsmål eller last opp dokumenter

Alt fylles automatisk ut i rapporten! 📄`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    stage: 'shaving',
    progress: 0,
    message: ''
  });
  const [shaverDialogOpen, setShaverDialogOpen] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');
  const [shavedData, setShavedData] = useState<ShavedData | null>(null);
  const [isShaving, setIsShaving] = useState(false);
  const [loanCalcOpen, setLoanCalcOpen] = useState(false);
  const [externalLenderOpen, setExternalLenderOpen] = useState(false);
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

  const extractPropertyDataFromAdvertising = (adData: any) => {
    const targeting = adData?.config?.adServer?.gam?.targeting || [];
    const data: any = {};
    
    targeting.forEach((item: any) => {
      if (item.value && item.value.length > 0) {
        // Store all values, not just first one
        data[item.key] = item.value.length === 1 ? item.value[0] : item.value;
      }
    });
    
    // Log all keys to help debug
    console.log('📊 Available property data keys:', Object.keys(data));
    
    // Look specifically for cost-related fields
    const costKeys = Object.keys(data).filter(k => 
      k.toLowerCase().includes('cost') || 
      k.toLowerCase().includes('fee') || 
      k.toLowerCase().includes('municipal') ||
      k.toLowerCase().includes('shared') ||
      k.toLowerCase().includes('common')
    );
    console.log('💰 Cost-related keys found:', costKeys);
    costKeys.forEach(key => {
      console.log(`  - ${key}: ${data[key]}`);
    });
    
    // Translate property type from English to Norwegian
    const propertyTypeMap: Record<string, string> = {
      'FLAT': 'Leilighet',
      'APARTMENT': 'Leilighet',
      'DETACHED': 'Enebolig',
      'SEMI_DETACHED': 'Tomannsbolig',
      'TERRACED': 'Rekkehus',
      'FARM': 'Gård',
      'COTTAGE': 'Hytte'
    };
    
    // Translate ownership type from English to Norwegian
    const ownershipTypeMap: Record<string, string> = {
      'FREEHOLD': 'Selveier',
      'CONDOMINIUM': 'Eierseksjon',
      'COOPERATIVE': 'Borettslag',
      'SHARE': 'Aksjeleilighet',
      'PART_OWNERSHIP': 'Andelsleilighet'
    };
    
    // Apply translations
    if (data.property_type && propertyTypeMap[data.property_type]) {
      data.property_type = propertyTypeMap[data.property_type];
      console.log('✅ Translated property_type to:', data.property_type);
    }
    
    if (data.ownership_type && ownershipTypeMap[data.ownership_type]) {
      data.ownership_type = ownershipTypeMap[data.ownership_type];
      console.log('✅ Translated ownership_type to:', data.ownership_type);
    }
    
    return data;
  };

  const shaveHtml = (html: string): { extracted: string; preview: any; tokens: number } => {
    console.log('Starting HTML shaving, original size:', html.length);
    const result: any = {};
    
    // PRIORITET 1: advertising-initial-state (VIKTIGST!)
    const advertisingMatch = html.match(/<script[^>]*id="advertising-initial-state"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
    if (advertisingMatch) {
      try {
        const adData = JSON.parse(advertisingMatch[1]);
        result.advertising = adData;
        result.propertyData = extractPropertyDataFromAdvertising(adData);
        console.log('✅ Found advertising-initial-state with property data');
      } catch (e) {
        console.error('Failed to parse advertising-initial-state:', e);
      }
    }
    
    // PRIORITET 2: company-profile-data (meglerinformasjon)
    const companyMatch = html.match(/<script[^>]*data-company-profile-data[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
    if (companyMatch) {
      try {
        result.company = JSON.parse(companyMatch[1]);
        console.log('✅ Found company-profile-data');
      } catch (e) {
        console.error('Failed to parse company-profile-data:', e);
      }
    }
    
    // PRIORITET 3: Synlig data (fallback)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) result.title = titleMatch[1];
    
    // Extract address from object-address element
    const addressMatch = html.match(/<span[^>]*data-testid="object-address"[^>]*>(.*?)<\/span>/i);
    if (addressMatch) result.address = addressMatch[1];
    
    const finnCodeMatch = html.match(/finnkode[=:]\s*(\d+)/i);
    if (finnCodeMatch) result.finnCode = finnCodeMatch[1];
    
    // Extract energy rating (Energimerking)
    const energyRatingMatch = html.match(/<span[^>]*data-testid="energy-label-info"[^>]*>([^<]+)<\/span>/i);
    if (energyRatingMatch) {
      result.energyRating = energyRatingMatch[1].trim();
      console.log('✅ Found energy rating:', result.energyRating);
    }
    
    // Extract municipal fees (Kommunale avgifter) using data-testid
    // Format in HTML: <div data-testid="pricing-municipal-fees">...<dd>7 735 kr per år</dd></div>
    const municipalFeesPattern = /data-testid="pricing-municipal-fees"[^>]*>.*?<dd[^>]*>([\d\s&nbsp;]+)\s*kr\s*per\s*år/is;
    const municipalMatch = html.match(municipalFeesPattern);
    if (municipalMatch) {
      const yearlyAmount = parseInt(municipalMatch[1].replace(/[\s&nbsp;]+/g, ''));
      result.municipalFees = Math.round(yearlyAmount / 12);
      console.log('✅ Found municipal fees (yearly):', yearlyAmount, '-> monthly:', result.municipalFees, 'kr/month');
    } else {
      console.log('❌ Could not find municipal fees in HTML');
    }
    
    // Extract common costs (Felleskostnader) using data-testid
    // Format in HTML: <div data-testid="pricing-common-monthly-cost">...<dd>9 833 kr</dd></div>
    const commonCostsPattern = /data-testid="pricing-common-monthly-cost"[^>]*>.*?<dd[^>]*>([\d\s&nbsp;]+)\s*kr/is;
    const commonMatch = html.match(commonCostsPattern);
    if (commonMatch) {
      result.commonCosts = parseInt(commonMatch[1].replace(/[\s&nbsp;]+/g, ''));
      console.log('✅ Found common costs:', result.commonCosts, 'kr/month');
    } else {
      console.log('❌ Could not find common costs in HTML');
    }
    
    // Fallback: Try __NEXT_DATA__ if advertising-initial-state not found
    if (!result.advertising) {
      const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
      if (nextDataMatch) {
        try {
          result.nextData = JSON.parse(nextDataMatch[1]);
          console.log('✅ Found __NEXT_DATA__ as fallback');
        } catch (e) {}
      }
    }
    
    // Create preview for user
    const preview: any = {};
    if (result.propertyData) {
      preview.finnCode = result.propertyData.id;
      preview.price = result.propertyData.price;
      preview.primarySize = result.propertyData.primary_size;
      preview.bedrooms = result.propertyData.bedrooms;
      preview.rooms = result.propertyData.rooms;
      preview.propertyType = result.propertyData.property_type;
      preview.constructionYear = result.propertyData.construction_year;
      preview.plotArea = result.propertyData.plot_area;
      preview.ownershipType = result.propertyData.ownership_type;
      preview.facilities = result.propertyData.facilities;
      preview.energyRating = result.propertyData.energy_rating || result.energyRating;
      preview.sharedExpenses = result.propertyData.shared_cost || result.propertyData.common_cost || result.commonCosts;
      preview.municipalFees = result.propertyData.municipal_fee || result.propertyData.property_tax || result.municipalFees;
      preview.commonCosts = result.propertyData.common_cost || result.commonCosts;
      
      console.log('📋 Preview data created:', {
        propertyType: preview.propertyType,
        ownershipType: preview.ownershipType,
        finnCode: preview.finnCode,
        price: preview.price
      });
    } else {
      // Use fallback values if no propertyData
      preview.energyRating = result.energyRating;
      preview.commonCosts = result.commonCosts;
      preview.municipalFees = result.municipalFees;
      preview.finnCode = result.finnCode;
      preview.address = result.address;
      console.log('⚠️ No propertyData found, using fallback values');
    }
    
    const jsonString = JSON.stringify(result, null, 2);
    const estimatedTokens = Math.ceil(jsonString.length / 4);
    
    console.log('Shaving complete. Tokens:', estimatedTokens);
    
    return {
      extracted: jsonString,
      preview,
      tokens: estimatedTokens
    };
  };

  const handleShaveHtml = async () => {
    if (!htmlInput.trim()) {
      toast.error('Lim inn HTML-kode først');
      return;
    }

    if (!hasCredits) {
      toast.error('Du må ha kreditter for å bruke HTML shaveren');
      return;
    }

    setIsShaving(true);
    setProcessingStatus({
      isProcessing: true,
      stage: 'shaving',
      progress: 30,
      message: 'Analyserer HTML...'
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const result = shaveHtml(htmlInput);
      
      setProcessingStatus(prev => ({ ...prev, progress: 50, message: 'Validerer data...' }));
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (result.tokens > 25000) {
        toast.error('Data for stor (>25k tokens). Prøv å kopier kun HTML-kildekoden.');
        setProcessingStatus({ isProcessing: false, stage: 'complete', progress: 0, message: '' });
        setIsShaving(false);
        return;
      }
      
      // Show preview of found data
      const reduction = ((1 - result.extracted.length / htmlInput.length) * 100).toFixed(0);
      let previewMessage = `✅ HTML prosessert (${reduction}% reduksjon)\n\n`;
      
      if (result.preview.finnCode) {
        previewMessage += `📊 Funnet data:\n`;
        previewMessage += `• FINN-kode: ${result.preview.finnCode}\n`;
        if (result.preview.price) previewMessage += `• Pris: ${Number(result.preview.price).toLocaleString('nb-NO')} kr\n`;
        if (result.preview.primarySize) previewMessage += `• Primærrom: ${result.preview.primarySize} m²\n`;
        if (result.preview.bedrooms) previewMessage += `• Soverom: ${result.preview.bedrooms}\n`;
        if (result.preview.rooms) previewMessage += `• Rom: ${result.preview.rooms}\n`;
        if (result.preview.propertyType) previewMessage += `• Type: ${result.preview.propertyType}\n`;
        if (result.preview.constructionYear) previewMessage += `• Byggeår: ${result.preview.constructionYear}\n`;
        if (result.preview.plotArea) previewMessage += `• Tomt: ${result.preview.plotArea} m²\n`;
        if (result.preview.energyRating) previewMessage += `• Energimerking: ${result.preview.energyRating}\n`;
        if (result.preview.commonCosts) previewMessage += `• Felleskostnader: ${Number(result.preview.commonCosts).toLocaleString('nb-NO')} kr/mnd\n`;
        if (result.preview.municipalFees) previewMessage += `• Kommunale avgifter: ${Number(result.preview.municipalFees).toLocaleString('nb-NO')} kr/mnd\n`;
      }
      
      toast.success(previewMessage, { duration: 4000 });
      
      // Close dialog and reset
      setShaverDialogOpen(false);
      setHtmlInput('');
      
      setProcessingStatus({
        isProcessing: true,
        stage: 'analyzing',
        progress: 70,
        message: 'Fyller ut PDF-rapport automatisk...'
      });
      
      setIsLoading(true);

      // Auto-fill PDF fields directly with parsed data
      // Property type and ownership type are now translated to Norwegian
      if (result.preview.finnCode) onDataUpdate?.('finnCode', result.preview.finnCode);
      if (result.preview.price) onDataUpdate?.('totalPrice', result.preview.price.toString());
      if (result.preview.address) onDataUpdate?.('address', result.preview.address);
      if (result.preview.primarySize) onDataUpdate?.('livingArea', result.preview.primarySize.toString());
      if (result.preview.bedrooms) onDataUpdate?.('bedrooms', result.preview.bedrooms.toString());
      if (result.preview.rooms) onDataUpdate?.('rooms', result.preview.rooms.toString());
      if (result.preview.propertyType) onDataUpdate?.('propertyType', result.preview.propertyType); // Now in Norwegian
      if (result.preview.constructionYear) onDataUpdate?.('buildYear', result.preview.constructionYear.toString());
      if (result.preview.plotArea) onDataUpdate?.('plotArea', result.preview.plotArea.toString());
      if (result.preview.energyRating) onDataUpdate?.('energyRating', result.preview.energyRating);
      if (result.preview.commonCosts) onDataUpdate?.('commonCosts', result.preview.commonCosts.toString());
      if (result.preview.municipalFees) onDataUpdate?.('municipalFees', result.preview.municipalFees.toString());
      if (result.preview.ownershipType) onDataUpdate?.('ownershipType', result.preview.ownershipType); // Now in Norwegian

      // Estimate rent automatically in background
      let estimatedRent = null;
      try {
        setProcessingStatus(prev => ({
          ...prev,
          progress: 80,
          message: 'Estimerer leiepris...'
        }));

        const rentEstimateData = {
          postalCode: result.preview.postalCode,
          municipality: result.preview.municipality,
          propertyType: result.preview.propertyType,
          bedrooms: result.preview.bedrooms,
          primarySize: result.preview.primarySize,
          energyRating: result.preview.energyRating, // New
          buildYear: result.preview.constructionYear, // New
          balcony: result.preview.facilities?.some((f: string) => 
            f.toLowerCase().includes('balkong') || f.toLowerCase().includes('terrasse')
          ),
          elevator: result.preview.facilities?.some((f: string) => 
            f.toLowerCase().includes('heis')
          ),
          furnished: false, // Default
          parking: result.preview.facilities?.some((f: string) => f.toLowerCase().includes('parkering')),
          utilities: false // Default
        };

        const { data: rentData, error: rentError } = await supabase.functions.invoke('estimate-rent', {
          body: rentEstimateData
        });

        if (!rentError && rentData?.estimatedRent) {
          estimatedRent = rentData.estimatedRent;
          // Fill in estimated rent (monthly)
          onDataUpdate?.('monthlyRent', rentData.estimatedRent.toString());
          onDataUpdate?.('isRentAutoEstimated', true);
          
          toast.success(`✅ Estimert månedlig leie: ${rentData.estimatedRent.toLocaleString('nb-NO')} kr`, {
            duration: 5000
          });
          
          console.log('🏠 Rent estimation:', rentData);
        } else {
          console.log('Could not estimate rent:', rentError);
        }
      } catch (rentEstError) {
        console.error('Error estimating rent:', rentEstError);
        // Non-critical error, continue
      }

      // Send to AI to get detailed summary (including rent estimate)
      setProcessingStatus({
        isProcessing: true,
        stage: 'analyzing',
        progress: 90,
        message: 'Genererer oppsummering...'
      });

      try {
        // Add rent estimate to the extracted data for AI summary
        const dataWithRent = {
          ...result,
          estimatedMonthlyRent: estimatedRent
        };
        
        const { data: aiData, error: aiError } = await supabase.functions.invoke('calculator-ai-chat', {
          body: {
            message: JSON.stringify(dataWithRent),
            sessionId,
            calculatorData
          }
        });

        if (!aiError && aiData?.message) {
          setSessionId(aiData.sessionId);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: aiData.message 
          }]);
          
          // Fill out PDF fields from AI-extracted data (including propertyType and ownershipType)
          if (aiData.extractedData && onDataUpdate) {
            Object.entries(aiData.extractedData).forEach(([field, value]) => {
              if (value !== null && value !== undefined) {
                onDataUpdate(field, value);
              }
            });
          }
        }
      } catch (aiError) {
        console.error('Error generating summary:', aiError);
        // Fallback to simple confirmation if AI fails
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Data automatisk fylt inn i rapporten!'
        }]);
      }

      setProcessingStatus({
        isProcessing: false,
        stage: 'complete',
        progress: 100,
        message: 'Ferdig! ✅'
      });
      
      toast.success('✅ Data automatisk fylt inn i rapporten!');
      
    } catch (error) {
      console.error('Shaving/analysis error:', error);
      toast.error('Kunne ikke prosessere HTML');
      setProcessingStatus({ isProcessing: false, stage: 'complete', progress: 0, message: '' });
    } finally {
      setIsShaving(false);
      setIsLoading(false);
    }
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
    const currentAttachments = [...attachments];
    
    // Show progress if large HTML is detected
    if (userMessage.length > 100000) {
      setProcessingStatus({
        isProcessing: true,
        stage: 'shaving',
        progress: 30,
        message: 'Ekstraherer relevant data fra HTML...'
      });
    }
    
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

    // Update progress for analyzing stage
    if (userMessage.length > 100000) {
      setTimeout(() => {
        setProcessingStatus(prev => ({
          ...prev,
          stage: 'analyzing',
          progress: 60,
          message: 'Analyserer eiendomsdata med AI...'
        }));
      }, 500);
    }

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
        } else if (data.error.includes('too large') || data.error.includes('for lang')) {
          toast.error(data.error);
        } else {
          toast.error(data.error);
        }
        setProcessingStatus({ isProcessing: false, stage: 'complete', progress: 0, message: '' });
        return;
      }

      setSessionId(data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      // Auto-fill fields if AI extracted data
      if (data.extractedData && onDataUpdate) {
        setProcessingStatus({
          isProcessing: true,
          stage: 'complete',
          progress: 90,
          message: 'Fyller ut rapport...'
        });

        // Fill out the form with extracted data
        Object.entries(data.extractedData).forEach(([field, value]) => {
          if (value !== null && value !== undefined) {
            onDataUpdate(field, value);
          }
        });

        setTimeout(() => {
          setProcessingStatus({ isProcessing: false, stage: 'complete', progress: 100, message: '' });
          toast.success('✅ Data automatisk fylt inn i rapporten!');
        }, 500);
      } else {
        setProcessingStatus({ isProcessing: false, stage: 'complete', progress: 0, message: '' });
      }

      if (data.creditsUsed > 0) {
        toast.success(`Melding sendt (${data.creditsUsed} kreditter brukt)`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Kunne ikke sende melding');
      setMessages(prev => prev.slice(0, -1)); // Remove user message on error
      setProcessingStatus({ isProcessing: false, stage: 'complete', progress: 0, message: '' });
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
      <div className="p-4 border-b border-border/50 bg-card h-[73px]">
        <div className="flex items-center justify-between h-full">
          <div>
            <h3 className="font-semibold text-lg">AI-assistent</h3>
            <p className="text-sm text-muted-foreground">
              {hasCredits ? '0.5 kreditter per melding' : '🔒 Kjøp kreditter for å bruke AI-chat'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShaverDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 hover:border-emerald-300"
              aria-label="Formater"
              title="Formater"
            >
              <Scissors className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setLoanCalcOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 hover:border-emerald-300"
              aria-label="Lånekalkulator"
              title="Lånekalkulator"
            >
              <Calculator className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setExternalLenderOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 h-9 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300"
              aria-label="Privatlån"
              title="Privatlån"
            >
              <Wallet className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        {processingStatus.isProcessing && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{processingStatus.message}</span>
              <span className="font-medium">{processingStatus.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${processingStatus.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* HTML Shaver Dialog */}
      <Dialog open={shaverDialogOpen} onOpenChange={setShaverDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              HTML Formater - Finn.no
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3 text-sm">
                <p className="font-semibold">Slik henter du koden fra Finn.no:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Åpne eiendomsannonsen på Finn.no</li>
                  <li>Trykk <strong>Ctrl+U</strong> (Windows) eller <strong>Cmd+Option+U</strong> (Mac)</li>
                  <li>Kopier ALT (Ctrl+A, Ctrl+C)</li>
                  <li>Lim inn koden nedenfor</li>
                </ol>
                <p className="text-muted-foreground mt-3">
                  ✨ Jeg ekstraherer automatisk kun den relevante eiendomsinformasjonen!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="Lim inn HTML-kode her..."
              className="min-h-[300px] font-mono text-xs"
              disabled={isShaving}
            />
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {htmlInput.length > 0 && `${htmlInput.length.toLocaleString()} tegn`}
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShaverDialogOpen(false);
                    setHtmlInput('');
                  }}
                  variant="outline"
                  disabled={isShaving}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleShaveHtml}
                  disabled={!htmlInput.trim() || isShaving}
                  className="gap-2"
                >
                  {isShaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Prosesserer...
                    </>
                  ) : (
                    <>
                      <Scissors className="h-4 w-4" />
                      Prosesser HTML
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
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
            title="Legg ved fil"
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
      
      {/* Loan Calculator Dialog */}
      <LoanCalculatorDialog
        open={loanCalcOpen}
        onOpenChange={setLoanCalcOpen}
        hasCredits={hasCredits}
        onApply={(data) => {
          // Apply loan data to calculator
          onDataUpdate?.('equity', data.equityAmount);
          onDataUpdate?.('interestRate', data.interestRate);
          onDataUpdate?.('loanPeriod', data.loanPeriod);
          onDataUpdate?.('propertyValue', data.propertyPrice);
          onDataUpdate?.('loanAmount', data.desiredLoanAmount);
          toast.success('Låneinnstillinger anvendt på rapporten');
        }}
      />
      
      {/* External Lender Dialog */}
      <ExternalLenderDialog
        open={externalLenderOpen}
        onOpenChange={setExternalLenderOpen}
        hasCredits={hasCredits}
        onApply={(data) => {
          // Apply external lender data to calculator
          onDataUpdate?.('hasExternalLender', data.hasExternalLender);
          onDataUpdate?.('externalLenderName', data.externalLenderName);
          toast.success('Privatlån-innstillinger anvendt på rapporten');
        }}
      />
    </div>
  );
};
