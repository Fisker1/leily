import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Calculator, TrendingUp, AlertCircle, CheckCircle, Home, PiggyBank, Wallet, Upload, File, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatNumberWithSpaces } from '@/shared/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/shared/hooks/use-mobile';

interface CalculatorPDFPreviewProps {
  data?: Record<string, unknown>;
  onDataChange?: (field: string, value: unknown) => void;
  onSave?: () => void;
}

export const CalculatorPDFPreview = ({ data = {}, onDataChange, onSave }: CalculatorPDFPreviewProps) => {
  const toStringSafe = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
  const toNumberSafe = (v: unknown): number => {
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
    return isNaN(n) ? 0 : n;
  };

  const [isPrintMode, setIsPrintMode] = useState(false);
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    address: toStringSafe(data.address),
    finnCode: toStringSafe(data.finnCode),
    totalPrice: toStringSafe(data.totalPrice),
    propertyType: toStringSafe(data.propertyType),
    ownershipType: toStringSafe(data.ownershipType),
    livingArea: toStringSafe(data.livingArea),
    bedrooms: toStringSafe(data.bedrooms),
    rooms: toStringSafe(data.rooms),
    buildYear: toStringSafe(data.buildYear),
    energyRating: toStringSafe(data.energyRating),
    plotArea: toStringSafe(data.plotArea),
    municipality: toStringSafe(data.municipality),
    county: toStringSafe(data.county),
    facilities: Array.isArray(data.facilities) ? data.facilities : [],
    equity: toStringSafe(data.equity),
    interestRate: toStringSafe(data.interestRate),
    loanPeriod: toStringSafe(data.loanPeriod),
    monthlyRent: toStringSafe(data.monthlyRent),
    commonCosts: toStringSafe(data.commonCosts),
    municipalFees: toStringSafe(data.municipalFees),
    insurance: toStringSafe(data.insurance),
    electricityMonthly: toStringSafe(data.electricityMonthly),
    sharedExpenses: toStringSafe(data.sharedExpenses),
    hasExternalLender: data.hasExternalLender || false,
    externalLenderName: toStringSafe(data.externalLenderName),
    covenantFileUrl: toStringSafe(data.covenantFileUrl),
    isRentAutoEstimated: data.isRentAutoEstimated || false
  });
  
  const [covenantFile, setCovenantFile] = useState<File | null>(null);
  const [rentManuallyEdited, setRentManuallyEdited] = useState(false);

  // Update form when data prop changes (from AI)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...Object.keys(data).reduce((acc, key) => {
        const v = (data as Record<string, unknown>)[key];
        acc[key] = Array.isArray(v) ? v : toStringSafe(v);
        return acc;
      }, {} as Record<string, unknown>)
    }));
  }, [data]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onDataChange?.(field, value);
    
    // Track if rent is manually edited
    if (field === 'monthlyRent' && typeof value === 'string') {
      setRentManuallyEdited(true);
      onDataChange?.('isRentAutoEstimated', false);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        alert('Kun PDF-filer er tillatt');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Filen er for stor (maks 10MB)');
        return;
      }
      
      setCovenantFile(file);
      
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);
      handleChange('covenantFileUrl', fileUrl);
      onDataChange?.('covenantFile', file);
    }
  };

  // Helper component to render input or text based on print mode
  const PrintableInput = ({ 
    value, 
    onChange, 
    placeholder, 
    label, 
    id,
    isAutoEstimated = false 
  }: { 
    value: string; 
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    placeholder?: string;
    label?: string;
    id?: string;
    isAutoEstimated?: boolean;
  }) => {
    if (isPrintMode && value) {
      return (
        <div className="mt-1 py-2 text-sm font-medium text-gray-900">
          {value}
        </div>
      );
    }
    
    if (isPrintMode && !value) {
      return null; // Don't show empty fields in print mode
    }
    
    // Special styling for auto-estimated rent (light gray background)
    const inputClassName = isAutoEstimated && !rentManuallyEdited
      ? "mt-1 rounded-none h-8 bg-gray-100 border-gray-300"
      : "mt-1 rounded-none h-8";
    
    return (
      <Input
        id={id}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClassName}
        readOnly={!onChange}
      />
    );
  };

  // Calculate totals
  const loanAmount = formData.totalPrice && formData.equity 
    ? toNumberSafe(formData.totalPrice) - toNumberSafe(formData.equity)
    : 0;
  
  const monthlyLoanPayment = loanAmount > 0 && formData.interestRate && formData.loanPeriod
    ? loanAmount * (toNumberSafe(formData.interestRate) / 100 / 12) / (1 - Math.pow(1 + toNumberSafe(formData.interestRate) / 100 / 12, -(toNumberSafe(formData.loanPeriod) * 12)))
    : 0;

  const totalMonthlyExpenses = toNumberSafe(formData.commonCosts) + 
    toNumberSafe(formData.municipalFees) + 
    toNumberSafe(formData.insurance) + 
    toNumberSafe(formData.electricityMonthly) +
    toNumberSafe(formData.sharedExpenses);

  const monthlyCashFlow = toNumberSafe(formData.monthlyRent) - totalMonthlyExpenses - monthlyLoanPayment;
  
  const annualRent = toNumberSafe(formData.monthlyRent) * 12;
  const grossYield = formData.totalPrice && annualRent > 0
    ? (annualRent / parseFloat(formData.totalPrice)) * 100
    : 0;
  
  const annualCashFlow = monthlyCashFlow * 12;
  const netYield = formData.totalPrice && annualCashFlow > 0
    ? (annualCashFlow / parseFloat(formData.totalPrice)) * 100
    : 0;
  
  const loanToValue = formData.totalPrice && loanAmount > 0
    ? (loanAmount / parseFloat(formData.totalPrice)) * 100
    : 0;

  const totalInterestPaid = monthlyLoanPayment > 0 && formData.loanPeriod
    ? (monthlyLoanPayment * parseFloat(formData.loanPeriod) * 12) - loanAmount
    : 0;

  const handleDownload = async () => {
    try {
      // Enable print mode
      setIsPrintMode(true);
      
      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // Get all PDF pages
      const pages = document.querySelectorAll('.pdf-page');
      
      if (!pages.length) {
        console.error('PDF pages not found');
        setIsPrintMode(false);
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Capture each page
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) {
          pdf.addPage();
        }
        
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
      
      // Disable print mode
      setIsPrintMode(false);
      
      // Download the PDF
      const fileName = formData.address 
        ? `Boligfinansieringsrapport-${formData.address.replace(/[^a-z0-9]/gi, '_')}.pdf`
        : 'Boligfinansieringsrapport.pdf';
      
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsPrintMode(false);
    }
  };

  // Footer component
  const PageFooter = ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => (
    <div className="mt-auto px-10 py-4 bg-gray-50 border-t-2 border-gray-200">
      <div className="flex justify-between items-center text-xs text-gray-600">
        <p>Dette er kun et verktøy. Oppsøk bankrådgiver for godkjenning av lån.</p>
        <p className="font-semibold">Side {pageNumber} / {totalPages}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {!isMobile && (
        <div className="p-4 border-b border-border/50 bg-card flex items-center justify-between h-[73px]">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="font-semibold text-lg">Boligfinansieringsrapport</span>
          </div>
          <div className="flex items-center gap-2">
            {onSave && (
              <Button onClick={onSave} size="sm" variant="outline" className="gap-2 rounded h-9">
                <Save className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleDownload} size="sm" className="gap-2 rounded h-9">
              <Download className="h-4 w-4" />
              Last ned PDF
            </Button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-auto flex items-start justify-center ${
        isMobile ? 'p-0 bg-white' : 'p-8 bg-gray-100'
      }`}>
        
        {isMobile ? (
          /* Mobile: Simple form layout */
          <div className="w-full px-4 py-4 space-y-6 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
              <h1 className="text-base font-bold text-primary text-center">
                Boligfinansieringsrapport
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {onSave && (
                <Button 
                  onClick={onSave}
                  className="flex-1"
                  variant="outline"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Lagre
                </Button>
              )}
              <Button 
                onClick={handleDownload}
                className="flex-1"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Last ned PDF
              </Button>
            </div>

            {/* 1. Nøkkelinformasjon */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-2">1. Nøkkelinformasjon</h3>
              
              <div className="space-y-2">
                <Label htmlFor="mobile-address" className="text-xs">Eiendomsadresse</Label>
                <Input
                  id="mobile-address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Skriv inn adresse..."
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-finnCode" className="text-xs">FINN-kode</Label>
                <Input
                  id="mobile-finnCode"
                  value={formData.finnCode}
                  onChange={(e) => handleChange('finnCode', e.target.value)}
                  placeholder="Skriv inn FINN-kode"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-propertyType" className="text-xs">Boligtype</Label>
                <Input
                  id="mobile-propertyType"
                  value={formData.propertyType}
                  onChange={(e) => handleChange('propertyType', e.target.value)}
                  placeholder="Enebolig, Leilighet..."
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-ownershipType" className="text-xs">Eierform</Label>
                <Input
                  id="mobile-ownershipType"
                  value={formData.ownershipType}
                  onChange={(e) => handleChange('ownershipType', e.target.value)}
                  placeholder="Selveier, Borettslag..."
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="mobile-livingArea" className="text-xs">Primærrom (m²)</Label>
                  <Input
                    id="mobile-livingArea"
                    value={formData.livingArea}
                    onChange={(e) => handleChange('livingArea', e.target.value)}
                    placeholder="m²"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile-bedrooms" className="text-xs">Soverom</Label>
                  <Input
                    id="mobile-bedrooms"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    placeholder="Antall"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="mobile-rooms" className="text-xs">Rom totalt</Label>
                  <Input
                    id="mobile-rooms"
                    value={formData.rooms}
                    onChange={(e) => handleChange('rooms', e.target.value)}
                    placeholder="Antall"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile-buildYear" className="text-xs">Byggeår</Label>
                  <Input
                    id="mobile-buildYear"
                    value={formData.buildYear}
                    onChange={(e) => handleChange('buildYear', e.target.value)}
                    placeholder="År"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="mobile-energyRating" className="text-xs">Energimerking</Label>
                  <Input
                    id="mobile-energyRating"
                    value={formData.energyRating}
                    onChange={(e) => handleChange('energyRating', e.target.value)}
                    placeholder="A-G"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile-plotArea" className="text-xs">Tomteareal (m²)</Label>
                  <Input
                    id="mobile-plotArea"
                    value={formData.plotArea}
                    onChange={(e) => handleChange('plotArea', e.target.value)}
                    placeholder="m²"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-totalPrice" className="text-xs">Prisantydning</Label>
                <Input
                  id="mobile-totalPrice"
                  value={formData.totalPrice}
                  onChange={(e) => handleChange('totalPrice', e.target.value)}
                  placeholder="kr"
                  className="h-9"
                />
              </div>
            </div>

            {/* 2. Låneinformasjon */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-2">2. Låneinformasjon</h3>
              
              <div className="space-y-2">
                <Label htmlFor="mobile-equity" className="text-xs">Egenkapital</Label>
                <Input
                  id="mobile-equity"
                  value={formData.equity}
                  onChange={(e) => handleChange('equity', e.target.value)}
                  placeholder="kr"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="mobile-interestRate" className="text-xs">Rente (%)</Label>
                  <Input
                    id="mobile-interestRate"
                    value={formData.interestRate}
                    onChange={(e) => handleChange('interestRate', e.target.value)}
                    placeholder="%"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile-loanPeriod" className="text-xs">Nedbetalingstid (år)</Label>
                  <Input
                    id="mobile-loanPeriod"
                    value={formData.loanPeriod}
                    onChange={(e) => handleChange('loanPeriod', e.target.value)}
                    placeholder="år"
                    className="h-9"
                  />
                </div>
              </div>

              {loanAmount > 0 && (
                <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Lånebeløp:</span>
                    <span className="font-semibold">{formatNumberWithSpaces(Math.round(loanAmount))} kr</span>
                  </div>
                  {monthlyLoanPayment > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Månedlig avdrag:</span>
                      <span className="font-semibold">{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr</span>
                    </div>
                  )}
                  {loanToValue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Belåningsgrad (LTV):</span>
                      <span className="font-semibold">{loanToValue.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Inntekter */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-2">3. Inntekter</h3>
              
              <div className="space-y-2">
                <Label htmlFor="mobile-monthlyRent" className="text-xs">
                  Månedlig leieinntekt
                  {formData.isRentAutoEstimated && !rentManuallyEdited && (
                    <span className="ml-1 text-xs text-muted-foreground font-normal">(estimert)</span>
                  )}
                </Label>
                <Input
                  id="mobile-monthlyRent"
                  value={formData.monthlyRent}
                  onChange={(e) => handleChange('monthlyRent', e.target.value)}
                  placeholder="kr/mnd"
                  className="h-9"
                />
              </div>

              {annualRent > 0 && (
                <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Årlig leieinntekt:</span>
                    <span className="font-semibold">{formatNumberWithSpaces(Math.round(annualRent))} kr</span>
                  </div>
                  {grossYield > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Bruttoavkastning:</span>
                      <span className="font-semibold">{grossYield.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Månedlige utgifter */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-2">4. Månedlige utgifter</h3>
              
              <div className="space-y-2">
                <Label htmlFor="mobile-commonCosts" className="text-xs">Felleskostnader</Label>
                <Input
                  id="mobile-commonCosts"
                  value={formData.commonCosts}
                  onChange={(e) => handleChange('commonCosts', e.target.value)}
                  placeholder="kr/mnd"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-municipalFees" className="text-xs">Kommunale avgifter</Label>
                <Input
                  id="mobile-municipalFees"
                  value={formData.municipalFees}
                  onChange={(e) => handleChange('municipalFees', e.target.value)}
                  placeholder="kr/mnd"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-insurance" className="text-xs">Forsikring</Label>
                <Input
                  id="mobile-insurance"
                  value={formData.insurance}
                  onChange={(e) => handleChange('insurance', e.target.value)}
                  placeholder="kr/mnd"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-electricityMonthly" className="text-xs">Strøm</Label>
                <Input
                  id="mobile-electricityMonthly"
                  value={formData.electricityMonthly}
                  onChange={(e) => handleChange('electricityMonthly', e.target.value)}
                  placeholder="kr/mnd"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-sharedExpenses" className="text-xs">Andre utgifter</Label>
                <Input
                  id="mobile-sharedExpenses"
                  value={formData.sharedExpenses}
                  onChange={(e) => handleChange('sharedExpenses', e.target.value)}
                  placeholder="kr/mnd"
                  className="h-9"
                />
              </div>
            </div>

            {/* 5. Økonomisk analyse */}
            {formData.totalPrice && formData.equity && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-2">5. Økonomisk analyse</h3>
                
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="divide-y divide-border">
                    {formData.monthlyRent && parseFloat(formData.monthlyRent) > 0 && (
                      <div className="flex justify-between p-3 bg-background">
                        <span className="text-xs text-muted-foreground">Leieinntekt</span>
                        <span className="text-sm font-semibold">
                          {formatNumberWithSpaces(Math.round(parseFloat(formData.monthlyRent)))} kr
                        </span>
                      </div>
                    )}
                    {monthlyLoanPayment > 0 && (
                      <div className="flex justify-between p-3 bg-background">
                        <span className="text-xs text-muted-foreground">Lånekostnad</span>
                        <span className="text-sm font-semibold">
                          -{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr
                        </span>
                      </div>
                    )}
                    {totalMonthlyExpenses > 0 && (
                      <div className="flex justify-between p-3 bg-background">
                        <span className="text-xs text-muted-foreground">Driftskostnader</span>
                        <span className="text-sm font-semibold">
                          -{formatNumberWithSpaces(Math.round(totalMonthlyExpenses))} kr
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between p-3 bg-muted/50">
                      <span className="text-sm font-bold">Netto kontantstrøm</span>
                      <span className="text-sm font-bold">
                        {monthlyCashFlow >= 0 ? '+' : ''}{formatNumberWithSpaces(Math.round(monthlyCashFlow))} kr
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-border rounded-lg p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Årlig kontantstrøm</p>
                    <p className="text-sm font-bold">{formatNumberWithSpaces(Math.round(annualCashFlow))} kr</p>
                  </div>
                  {grossYield > 0 && (
                    <div className="border border-border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Bruttoavkastning</p>
                      <p className="text-sm font-bold">{grossYield.toFixed(2)}%</p>
                    </div>
                  )}
                  {netYield > 0 && (
                    <div className="border border-border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Nettoavkastning</p>
                      <p className="text-sm font-bold">{netYield.toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: PDF layout */
          <div className="w-full max-w-[850px] space-y-6">
          
          {/* Page 1 - Scales proportionally with A4 aspect ratio */}
          <div className={`pdf-page bg-white w-full ${isMobile ? 'shadow-none' : 'shadow-xl'}`} style={{ aspectRatio: '210/297' }}>
            <div className="h-full flex flex-col">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20 px-10 py-8">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Boligfinansieringsrapport</h1>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>Generert av Leily</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 px-10 py-6 space-y-6 overflow-hidden">
                {/* Property Information */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                    1. Nøkkelinformasjon
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <Label className="text-gray-700 font-semibold text-xs">Eiendomsadresse</Label>
                      <PrintableInput
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Skriv inn adresse..."
                      />
                    </div>
                    
                    {formData.finnCode && (
                      <div>
                        <Label className="text-gray-700 font-semibold text-xs">FINN-kode</Label>
                        <PrintableInput value={formData.finnCode} placeholder="" />
                      </div>
                    )}
                    
                    <div className={formData.finnCode ? '' : 'col-span-2'}>
                      <Label className="text-gray-700 font-semibold text-xs">Boligtype</Label>
                      <PrintableInput
                        value={formData.propertyType}
                        onChange={(e) => handleChange('propertyType', e.target.value)}
                        placeholder="Enebolig, Leilighet..."
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold text-xs">Eierform</Label>
                      <PrintableInput
                        value={formData.ownershipType}
                        onChange={(e) => handleChange('ownershipType', e.target.value)}
                        placeholder="Selveier, Borettslag..."
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold text-xs">Primærrom (m²)</Label>
                      <PrintableInput
                        value={formData.livingArea}
                        onChange={(e) => handleChange('livingArea', e.target.value)}
                        placeholder="m²"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold text-xs">Soverom</Label>
                      <PrintableInput
                        value={formData.bedrooms}
                        onChange={(e) => handleChange('bedrooms', e.target.value)}
                        placeholder="Antall"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold text-xs">Rom totalt</Label>
                      <PrintableInput
                        value={formData.rooms}
                        onChange={(e) => handleChange('rooms', e.target.value)}
                        placeholder="Antall"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold text-xs">Byggeår</Label>
                      <PrintableInput
                        value={formData.buildYear}
                        onChange={(e) => handleChange('buildYear', e.target.value)}
                        placeholder="År"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold text-xs">Energimerking</Label>
                      <PrintableInput
                        value={formData.energyRating}
                        onChange={(e) => handleChange('energyRating', e.target.value)}
                        placeholder="A-G"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold text-xs">Tomteareal (m²)</Label>
                      <PrintableInput
                        value={formData.plotArea}
                        onChange={(e) => handleChange('plotArea', e.target.value)}
                        placeholder="m²"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-gray-700 font-semibold text-xs">Prisantydning</Label>
                      <PrintableInput
                        value={formData.totalPrice}
                        onChange={(e) => handleChange('totalPrice', e.target.value)}
                        placeholder="kr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <PageFooter pageNumber={1} totalPages={2} />
            </div>
          </div>

          {/* Page 2 - Scales proportionally with A4 aspect ratio */}
          <div className={`pdf-page bg-white w-full ${isMobile ? 'shadow-none' : 'shadow-xl'}`} style={{ aspectRatio: '210/297' }}>
            <div className="h-full flex flex-col">
              {/* Content */}
              <div className="flex-1 px-10 py-8 space-y-6 overflow-hidden">
                {/* Loan Information */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                    2. Låneinformasjon
                  </h2>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label htmlFor="equity" className="text-gray-700 font-semibold text-xs">Egenkapital</Label>
                      <PrintableInput
                        id="equity"
                        value={formData.equity}
                        onChange={(e) => handleChange('equity', e.target.value)}
                        placeholder="kr"
                      />
                    </div>
                    <div>
                      <Label htmlFor="interestRate" className="text-gray-700 font-semibold text-xs">Rente (%)</Label>
                      <PrintableInput
                        id="interestRate"
                        value={formData.interestRate}
                        onChange={(e) => handleChange('interestRate', e.target.value)}
                        placeholder="%"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loanPeriod" className="text-gray-700 font-semibold text-xs">Nedbetalingstid (år)</Label>
                      <PrintableInput
                        id="loanPeriod"
                        value={formData.loanPeriod}
                        onChange={(e) => handleChange('loanPeriod', e.target.value)}
                        placeholder="år"
                      />
                    </div>
                  </div>

                  {loanAmount > 0 && (
                    <div className="mt-3 p-3 border-2 border-gray-300 bg-white">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Lånebeløp</p>
                          <p className="text-base font-bold text-gray-900">{formatNumberWithSpaces(Math.round(loanAmount))} kr</p>
                        </div>
                        {monthlyLoanPayment > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Månedlig avdrag</p>
                            <p className="text-base font-bold text-gray-900">{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr</p>
                          </div>
                        )}
                        {loanToValue > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Belåningsgrad (LTV)</p>
                            <p className="text-base font-bold text-gray-900">{loanToValue.toFixed(1)}%</p>
                          </div>
                        )}
                        {totalInterestPaid > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Total rente over {formData.loanPeriod} år</p>
                            <p className="text-base font-bold text-gray-900">{formatNumberWithSpaces(Math.round(totalInterestPaid))} kr</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* External/Private Lender Sub-section */}
                  {formData.hasExternalLender && (
                    <div className="mt-4 pl-4 border-l-2 border-primary/30 space-y-2">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Ekstern/Privat Lånegiver
                      </h3>
                      
                      <div>
                        <Label className="text-gray-600 text-xs">Navn på lånegiver</Label>
                        <PrintableInput
                          value={formData.externalLenderName}
                          onChange={(e) => handleChange('externalLenderName', e.target.value)}
                          placeholder="F.eks. Familie, Venner..."
                        />
                      </div>
                      
                      {!isPrintMode && (
                        <div>
                          <Label className="text-gray-600 text-xs mb-2 block">
                            Covenant (valgfritt)
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('covenant-upload')?.click()}
                              className="flex items-center gap-2 h-8 text-xs"
                            >
                              <Upload className="h-3 w-3" />
                              Last opp PDF
                            </Button>
                            <input
                              id="covenant-upload"
                              type="file"
                              accept=".pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            {(covenantFile || formData.covenantFileUrl) && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <File className="h-3 w-3" />
                                <span>{covenantFile?.name || 'Lastet opp'}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Maks 10MB, kun PDF
                          </p>
                        </div>
                      )}
                      
                      {isPrintMode && (covenantFile || formData.covenantFileUrl) && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                          <File className="h-3 w-3 text-gray-600" />
                          <span className="font-medium">
                            Covenant: {covenantFile?.name || 'covenant.pdf'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Income */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                    3. Inntekter
                  </h2>
                  
                  <div>
                    <Label htmlFor="monthlyRent" className="text-gray-700 font-semibold text-xs">
                      Månedlig leieinntekt
                      {formData.isRentAutoEstimated && !rentManuallyEdited && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">(estimert)</span>
                      )}
                    </Label>
                    <PrintableInput
                      id="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={(e) => handleChange('monthlyRent', e.target.value)}
                      placeholder="kr/mnd"
                      isAutoEstimated={formData.isRentAutoEstimated && !rentManuallyEdited}
                    />
                  </div>

                  {annualRent > 0 && (
                    <div className="mt-3 p-3 border-2 border-gray-300 bg-white text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Årlig leieinntekt</p>
                          <p className="text-base font-bold text-gray-900">{formatNumberWithSpaces(Math.round(annualRent))} kr</p>
                        </div>
                        {grossYield > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Bruttoavkastning</p>
                            <p className="text-base font-bold text-gray-900">{grossYield.toFixed(2)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>


                {/* Expenses */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                    4. Månedlige utgifter
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label htmlFor="commonCosts" className="text-gray-700 font-semibold text-xs">Felleskostnader</Label>
                      <PrintableInput
                        id="commonCosts"
                        value={formData.commonCosts}
                        onChange={(e) => handleChange('commonCosts', e.target.value)}
                        placeholder="kr/mnd"
                      />
                    </div>
                    <div>
                      <Label htmlFor="municipalFees" className="text-gray-700 font-semibold text-xs">Kommunale avgifter</Label>
                      <PrintableInput
                        id="municipalFees"
                        value={formData.municipalFees}
                        onChange={(e) => handleChange('municipalFees', e.target.value)}
                        placeholder="kr/mnd"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance" className="text-gray-700 font-semibold text-xs">Forsikring</Label>
                      <PrintableInput
                        id="insurance"
                        value={formData.insurance}
                        onChange={(e) => handleChange('insurance', e.target.value)}
                        placeholder="kr/mnd"
                      />
                    </div>
                    <div>
                      <Label htmlFor="electricityMonthly" className="text-gray-700 font-semibold text-xs">Strøm</Label>
                      <PrintableInput
                        id="electricityMonthly"
                        value={formData.electricityMonthly}
                        onChange={(e) => handleChange('electricityMonthly', e.target.value)}
                        placeholder="kr/mnd"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sharedExpenses" className="text-gray-700 font-semibold text-xs">Andre utgifter</Label>
                      <PrintableInput
                        id="sharedExpenses"
                        value={formData.sharedExpenses}
                        onChange={(e) => handleChange('sharedExpenses', e.target.value)}
                        placeholder="kr/mnd"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Financial Analysis */}
                {formData.totalPrice && formData.equity && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                      5. Økonomisk analyse
                    </h2>
                    
                    <div className="border-2 border-gray-300 bg-white">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left px-4 py-2 text-gray-700 font-semibold bg-gray-50">Post</th>
                            <th className="text-right px-4 py-2 text-gray-700 font-semibold bg-gray-50">Beløp per måned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.monthlyRent && parseFloat(formData.monthlyRent) > 0 && (
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 text-gray-600">Leieinntekt</td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                {formatNumberWithSpaces(Math.round(parseFloat(formData.monthlyRent)))} kr
                              </td>
                            </tr>
                          )}
                          {monthlyLoanPayment > 0 && (
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 text-gray-600">Lånekostnad (renter + avdrag)</td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                -{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr
                              </td>
                            </tr>
                          )}
                          {totalMonthlyExpenses > 0 && (
                            <tr className="border-b border-gray-200">
                              <td className="px-4 py-2 text-gray-600">Driftskostnader (totalt)</td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                -{formatNumberWithSpaces(Math.round(totalMonthlyExpenses))} kr
                              </td>
                            </tr>
                          )}
                          <tr className="border-t-2 border-gray-400 bg-gray-50">
                            <td className="px-4 py-3 font-bold text-gray-900">Netto kontantstrøm</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">
                              {monthlyCashFlow >= 0 ? '+' : ''}{formatNumberWithSpaces(Math.round(monthlyCashFlow))} kr
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Additional metrics */}
                    <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                      <div className="border-2 border-gray-300 bg-white p-3">
                        <p className="text-xs text-gray-600 mb-1">Årlig kontantstrøm</p>
                        <p className="text-base font-bold text-gray-900">{formatNumberWithSpaces(Math.round(annualCashFlow))} kr</p>
                      </div>
                      {grossYield > 0 && (
                        <div className="border-2 border-gray-300 bg-white p-3">
                          <p className="text-xs text-gray-600 mb-1">Bruttoavkastning</p>
                          <p className="text-base font-bold text-gray-900">{grossYield.toFixed(2)}%</p>
                        </div>
                      )}
                      {netYield > 0 && (
                        <div className="border-2 border-gray-300 bg-white p-3">
                          <p className="text-xs text-gray-600 mb-1">Nettoavkastning</p>
                          <p className="text-base font-bold text-gray-900">{netYield.toFixed(2)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <PageFooter pageNumber={2} totalPages={2} />
            </div>

          </div>
          </div>
        )}
      </div>
    </div>
  );
};
