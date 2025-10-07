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
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // Get the PDF content element
      const pdfElement = document.querySelector('.max-w-4xl.mx-auto.bg-white') as HTMLElement;
      
      if (!pdfElement) {
        console.error('PDF element not found');
        return;
      }
      
      // Create canvas from the HTML element
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add image to PDF, split into pages if needed
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }
      
      // Download the PDF
      const fileName = formData.address 
        ? `Boligfinansieringsrapport-${formData.address.replace(/[^a-z0-9]/gi, '_')}.pdf`
        : 'Boligfinansieringsrapport.pdf';
      
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

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

      <div className="flex-1 p-8 overflow-auto">
        {/* Paper Effect Container with Shadow */}
        <div className="max-w-4xl mx-auto bg-white shadow-2xl border border-gray-200 rounded animate-fade-in">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20 px-10 py-8 rounded-t">
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
          <div className="px-10 py-8 space-y-8">
            {/* Executive Summary */}
            {formData.totalPrice && formData.equity && (
              <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Oppsummering
                </h2>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Totalpris</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumberWithSpaces(Math.round(parseFloat(formData.totalPrice)))} kr</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Egenkapital</p>
                    <p className="text-2xl font-bold text-blue-700">{formatNumberWithSpaces(Math.round(parseFloat(formData.equity)))} kr</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Lånebeløp</p>
                    <p className="text-2xl font-bold text-orange-700">{formatNumberWithSpaces(Math.round(loanAmount))} kr</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Netto kontantstrøm (mnd)</p>
                    <p className={`text-2xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {monthlyCashFlow >= 0 ? '+' : ''}{formatNumberWithSpaces(Math.round(monthlyCashFlow))} kr
                    </p>
                  </div>
                  {grossYield > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Bruttoavkastning</p>
                      <p className="text-2xl font-bold text-primary">{grossYield.toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Property Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                1. Nøkkelinformasjon
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-gray-700 font-semibold">Eiendomsadresse</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Skriv inn adresse..."
                    className="mt-1 rounded-none"
                  />
                </div>
                
                {formData.finnCode && (
                  <div>
                    <Label className="text-gray-700 font-semibold">FINN-kode</Label>
                    <Input value={formData.finnCode} disabled className="mt-1 rounded-none bg-gray-50" />
                  </div>
                )}
                
                <div className={formData.finnCode ? '' : 'col-span-2'}>
                  <Label className="text-gray-700 font-semibold">Boligtype</Label>
                  <Input
                    value={formData.propertyType}
                    onChange={(e) => handleChange('propertyType', e.target.value)}
                    placeholder="Enebolig, Leilighet..."
                    className="mt-1 rounded-none"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-700 font-semibold">Eierform</Label>
                  <Input
                    value={formData.ownershipType}
                    onChange={(e) => handleChange('ownershipType', e.target.value)}
                    placeholder="Selveier, Borettslag..."
                    className="mt-1 rounded-none"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-700 font-semibold">Primærrom (m²)</Label>
                  <Input
                    value={formData.livingArea}
                    onChange={(e) => handleChange('livingArea', e.target.value)}
                    placeholder="m²"
                    className="mt-1 rounded-none"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-700 font-semibold">Soverom</Label>
                  <Input
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    placeholder="Antall"
                    className="mt-1 rounded-none"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-700 font-semibold">Rom totalt</Label>
                  <Input
                    value={formData.rooms}
                    onChange={(e) => handleChange('rooms', e.target.value)}
                    placeholder="Antall"
                    className="mt-1 rounded-none"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-700 font-semibold">Byggeår</Label>
                  <Input
                    value={formData.buildYear}
                    onChange={(e) => handleChange('buildYear', e.target.value)}
                    placeholder="År"
                    className="mt-1 rounded-none"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-700 font-semibold">Energimerking</Label>
                  <Input
                    value={formData.energyRating}
                    onChange={(e) => handleChange('energyRating', e.target.value)}
                    placeholder="A-G"
                    className="mt-1 rounded-none"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-700 font-semibold">Tomteareal (m²)</Label>
                  <Input
                    value={formData.plotArea}
                    onChange={(e) => handleChange('plotArea', e.target.value)}
                    placeholder="m²"
                    className="mt-1 rounded-none"
                  />
                </div>
              </div>

              {formData.facilities && Array.isArray(formData.facilities) && formData.facilities.length > 0 && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm">
                  <Label className="text-gray-700 font-semibold mb-2 block">Fasiliteter</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.facilities.map((facility: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{facility}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-gray-700 font-semibold">Prisantydning</Label>
                  <Input
                    value={formData.totalPrice}
                    onChange={(e) => handleChange('totalPrice', e.target.value)}
                    placeholder="kr"
                    className="mt-1 rounded-none"
                  />
                </div>
              </div>

              {loanToValue > 0 && (
                <Alert className={loanToValue > 85 ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50'}>
                  {loanToValue > 85 ? <AlertCircle className="h-4 w-4 text-orange-700" /> : <CheckCircle className="h-4 w-4 text-green-700" />}
                  <AlertDescription className={loanToValue > 85 ? 'text-orange-800' : 'text-green-800'}>
                    Belåningsgrad: {loanToValue.toFixed(1)}%
                    {loanToValue > 85 ? ' (Høy - kan kreve ekstra sikkerhet)' : ' (God - innenfor normalt krav)'}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator className="my-6" />

            {/* Loan Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                2. Låneinformasjon
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equity" className="text-gray-700 font-semibold">Egenkapital</Label>
                  <Input
                    id="equity"
                    value={formData.equity}
                    onChange={(e) => handleChange('equity', e.target.value)}
                    placeholder="kr"
                    className="mt-1 rounded-none"
                  />
                </div>
                <div>
                  <Label htmlFor="interestRate" className="text-gray-700 font-semibold">Rente (%)</Label>
                  <Input
                    id="interestRate"
                    value={formData.interestRate}
                    onChange={(e) => handleChange('interestRate', e.target.value)}
                    placeholder="%"
                    className="mt-1 rounded-none"
                  />
                </div>
                <div>
                  <Label htmlFor="loanPeriod" className="text-gray-700 font-semibold">Nedbetalingstid (år)</Label>
                  <Input
                    id="loanPeriod"
                    value={formData.loanPeriod}
                    onChange={(e) => handleChange('loanPeriod', e.target.value)}
                    placeholder="år"
                    className="mt-1 rounded-none"
                  />
                </div>
              </div>

              {loanAmount > 0 && (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Lånebeløp</p>
                        <p className="text-2xl font-bold text-blue-700">{formatNumberWithSpaces(Math.round(loanAmount))} kr</p>
                      </div>
                      {monthlyLoanPayment > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Månedlig avdrag</p>
                          <p className="text-2xl font-bold text-blue-700">{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {totalInterestPaid > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Total rentekostnad over {formData.loanPeriod} år:</strong> {formatNumberWithSpaces(Math.round(totalInterestPaid))} kr
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Income */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                3. Inntekter
              </h2>
              
              <div>
                <Label htmlFor="monthlyRent" className="text-gray-700 font-semibold">Månedlig leieinntekt</Label>
                <Input
                  id="monthlyRent"
                  value={formData.monthlyRent}
                  onChange={(e) => handleChange('monthlyRent', e.target.value)}
                  placeholder="kr/mnd"
                  className="mt-1 rounded-none"
                />
              </div>

              {annualRent > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Årlig leieinntekt</p>
                      <p className="text-xl font-bold text-green-700">{formatNumberWithSpaces(Math.round(annualRent))} kr</p>
                    </div>
                    {grossYield > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Bruttoavkastning</p>
                        <p className="text-xl font-bold text-green-700">{grossYield.toFixed(2)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Expenses */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 pb-2 border-b-2 border-gray-200">
                4. Månedlige utgifter
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commonCosts" className="text-gray-700 font-semibold">Felleskostnader</Label>
                  <Input
                    id="commonCosts"
                    value={formData.commonCosts}
                    onChange={(e) => handleChange('commonCosts', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1 rounded-none"
                  />
                </div>
                <div>
                  <Label htmlFor="municipalFees" className="text-gray-700 font-semibold">Kommunale avgifter</Label>
                  <Input
                    id="municipalFees"
                    value={formData.municipalFees}
                    onChange={(e) => handleChange('municipalFees', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1 rounded-none"
                  />
                </div>
                <div>
                  <Label htmlFor="insurance" className="text-gray-700 font-semibold">Forsikring</Label>
                  <Input
                    id="insurance"
                    value={formData.insurance}
                    onChange={(e) => handleChange('insurance', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1 rounded-none"
                  />
                </div>
                <div>
                  <Label htmlFor="electricityMonthly" className="text-gray-700 font-semibold">Strøm</Label>
                  <Input
                    id="electricityMonthly"
                    value={formData.electricityMonthly}
                    onChange={(e) => handleChange('electricityMonthly', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1 rounded-none"
                  />
                </div>
                <div>
                  <Label htmlFor="sharedExpenses" className="text-gray-700 font-semibold">Andre utgifter</Label>
                  <Input
                    id="sharedExpenses"
                    value={formData.sharedExpenses}
                    onChange={(e) => handleChange('sharedExpenses', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1 rounded-none"
                  />
                </div>
              </div>

              {totalMonthlyExpenses > 0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Totale månedlige utgifter:</span>
                    <span className="text-2xl font-bold text-orange-700">{formatNumberWithSpaces(Math.round(totalMonthlyExpenses))} kr</span>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Final Summary */}
            {formData.totalPrice && formData.equity && (
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  5. Økonomisk analyse
                </h2>
                
                <div className="space-y-4">
                  {/* Monthly */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Månedlig oversikt</h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Leieinntekt:</span>
                        <span className="font-semibold text-green-700">+{formatNumberWithSpaces(Math.round(parseFloat(formData.monthlyRent) || 0))} kr</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Lånekostnad:</span>
                        <span className="font-semibold text-red-700">-{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Driftskostnader:</span>
                        <span className="font-semibold text-red-700">-{formatNumberWithSpaces(Math.round(totalMonthlyExpenses))} kr</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center py-2 bg-white px-3 rounded">
                        <span className="font-bold text-gray-900">Netto kontantstrøm:</span>
                        <span className={`text-2xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {monthlyCashFlow >= 0 ? '+' : ''}{formatNumberWithSpaces(Math.round(monthlyCashFlow))} kr/mnd
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Yearly */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Årlig oversikt</h3>
                    <div className="space-y-2 pl-4">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Årlig kontantstrøm:</span>
                        <span className={`font-semibold ${annualCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {annualCashFlow >= 0 ? '+' : ''}{formatNumberWithSpaces(Math.round(annualCashFlow))} kr
                        </span>
                      </div>
                      {netYield > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600">Nettoavkastning:</span>
                          <span className="font-semibold text-primary">{netYield.toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Nøkkeltall</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Belåningsgrad (LTV)</p>
                        <p className="text-lg font-bold text-gray-900">{loanToValue.toFixed(1)}%</p>
                      </div>
                      {grossYield > 0 && (
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Bruttoavkastning</p>
                          <p className="text-lg font-bold text-primary">{grossYield.toFixed(2)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-gray-50 border-t-2 border-gray-200 text-center text-sm text-gray-600">
            <p>Dette dokumentet er generert automatisk av Leily og er ment som et verktøy for finansiell planlegging.</p>
            <p className="mt-1">For offisiell vurdering, vennligst kontakt din bankrådgiver.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
