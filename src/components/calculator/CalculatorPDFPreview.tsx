import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Calculator, TrendingUp, AlertCircle, CheckCircle, Home, PiggyBank, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatNumberWithSpaces } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CalculatorPDFPreviewProps {
  data?: Record<string, any>;
  onDataChange?: (field: string, value: any) => void;
}

export const CalculatorPDFPreview = ({ data = {}, onDataChange }: CalculatorPDFPreviewProps) => {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [formData, setFormData] = useState({
    address: data.address || '',
    finnCode: data.finnCode || '',
    totalPrice: data.totalPrice || '',
    propertyType: data.propertyType || '',
    ownershipType: data.ownershipType || '',
    livingArea: data.livingArea || '',
    bedrooms: data.bedrooms || '',
    rooms: data.rooms || '',
    buildYear: data.buildYear || '',
    energyRating: data.energyRating || '',
    plotArea: data.plotArea || '',
    municipality: data.municipality || '',
    county: data.county || '',
    facilities: data.facilities || [],
    equity: data.equity || '',
    interestRate: data.interestRate || '',
    loanPeriod: data.loanPeriod || '',
    monthlyRent: data.monthlyRent || '',
    commonCosts: data.commonCosts || '',
    municipalFees: data.municipalFees || '',
    insurance: data.insurance || '',
    electricityMonthly: data.electricityMonthly || '',
    sharedExpenses: data.sharedExpenses || ''
  });

  // Update form when data prop changes (from AI)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...Object.keys(data).reduce((acc, key) => {
        if (data[key]) acc[key] = data[key];
        return acc;
      }, {} as any)
    }));
  }, [data]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onDataChange?.(field, value);
  };

  // Helper component to render input or text based on print mode
  const PrintableInput = ({ value, onChange, placeholder, label, id }: { 
    value: string; 
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    placeholder?: string;
    label?: string;
    id?: string;
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
    
    return (
      <Input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 rounded-none h-8"
      />
    );
  };

  // Calculate totals
  const loanAmount = formData.totalPrice && formData.equity 
    ? parseFloat(formData.totalPrice) - parseFloat(formData.equity)
    : 0;
  
  const monthlyLoanPayment = loanAmount > 0 && formData.interestRate && formData.loanPeriod
    ? loanAmount * (parseFloat(formData.interestRate) / 100 / 12) / (1 - Math.pow(1 + parseFloat(formData.interestRate) / 100 / 12, -(parseFloat(formData.loanPeriod) * 12)))
    : 0;

  const totalMonthlyExpenses = (parseFloat(formData.commonCosts) || 0) + 
    (parseFloat(formData.municipalFees) || 0) + 
    (parseFloat(formData.insurance) || 0) + 
    (parseFloat(formData.electricityMonthly) || 0) +
    (parseFloat(formData.sharedExpenses) || 0);

  const monthlyCashFlow = (parseFloat(formData.monthlyRent) || 0) - totalMonthlyExpenses - monthlyLoanPayment;
  
  const annualRent = (parseFloat(formData.monthlyRent) || 0) * 12;
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
        <p>Dette dokumentet er generert automatisk av Leily og er ment som et verktøy for finansiell planlegging.</p>
        <p className="font-semibold">Side {pageNumber} / {totalPages}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <div className="p-4 border-b border-border/50 bg-card flex items-center justify-between h-[73px]">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="font-semibold text-lg">Boligfinansieringsrapport</span>
        </div>
        <Button onClick={handleDownload} size="sm" className="gap-2 rounded h-9">
          <Download className="h-4 w-4" />
          Last ned PDF
        </Button>
      </div>

      <div className="flex-1 p-8 overflow-auto bg-gray-100">
        
        {/* PDF Pages Container - Adobe-style viewer */}
        <div className="max-w-[850px] mx-auto space-y-6">
          
          {/* Page 1 */}
          <div className="pdf-page bg-white shadow-xl" style={{ aspectRatio: '210/297' }}>
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
                {/* Executive Summary */}
                {formData.totalPrice && formData.equity && (
                  <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">
                      Oppsummering
                    </h2>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Totalpris</p>
                        <p className="text-xl font-bold text-gray-900">{formatNumberWithSpaces(Math.round(parseFloat(formData.totalPrice)))} kr</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Egenkapital</p>
                        <p className="text-xl font-bold text-blue-700">{formatNumberWithSpaces(Math.round(parseFloat(formData.equity)))} kr</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Lånebeløp</p>
                        <p className="text-xl font-bold text-orange-700">{formatNumberWithSpaces(Math.round(loanAmount))} kr</p>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Netto kontantstrøm (mnd)</p>
                        <p className={`text-xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {monthlyCashFlow >= 0 ? '+' : ''}{formatNumberWithSpaces(Math.round(monthlyCashFlow))} kr
                        </p>
                      </div>
                      {grossYield > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">Bruttoavkastning</p>
                          <p className="text-xl font-bold text-primary">{grossYield.toFixed(2)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

          {/* Page 2 */}
          <div className="pdf-page bg-white shadow-xl" style={{ aspectRatio: '210/297' }}>
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
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Lånebeløp</p>
                            <p className="text-lg font-bold text-blue-700">{formatNumberWithSpaces(Math.round(loanAmount))} kr</p>
                          </div>
                          {monthlyLoanPayment > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Månedlig avdrag</p>
                              <p className="text-lg font-bold text-blue-700">{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr</p>
                            </div>
                          )}
                        </div>
                      </div>
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
                    <Label htmlFor="monthlyRent" className="text-gray-700 font-semibold text-xs">Månedlig leieinntekt</Label>
                    <PrintableInput
                      id="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={(e) => handleChange('monthlyRent', e.target.value)}
                      placeholder="kr/mnd"
                    />
                  </div>

                  {annualRent > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-sm text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Årlig leieinntekt</p>
                          <p className="text-lg font-bold text-green-700">{formatNumberWithSpaces(Math.round(annualRent))} kr</p>
                        </div>
                        {grossYield > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Bruttoavkastning</p>
                            <p className="text-lg font-bold text-green-700">{grossYield.toFixed(2)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

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

                {/* Final Summary */}
                {formData.totalPrice && formData.equity && (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">
                      5. Økonomisk analyse
                    </h2>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2 text-sm">Månedlig oversikt</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Leieinntekt:</span>
                            <span className="font-semibold text-green-700">+{formatNumberWithSpaces(Math.round(parseFloat(formData.monthlyRent) || 0))} kr</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Lånekostnad:</span>
                            <span className="font-semibold text-red-700">-{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-gray-600">Driftskostnader:</span>
                            <span className="font-semibold text-red-700">-{formatNumberWithSpaces(Math.round(totalMonthlyExpenses))} kr</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center py-2 bg-white px-2 rounded">
                            <span className="font-bold text-gray-900">Netto kontantstrøm:</span>
                            <span className={`text-lg font-bold ${monthlyCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {monthlyCashFlow >= 0 ? '+' : ''}{formatNumberWithSpaces(Math.round(monthlyCashFlow))} kr/mnd
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <PageFooter pageNumber={2} totalPages={2} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
