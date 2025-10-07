import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatNumberWithSpaces } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface CalculatorPDFPreviewProps {
  data?: Record<string, any>;
  onDataChange?: (field: string, value: any) => void;
}

export const CalculatorPDFPreview = ({ data = {}, onDataChange }: CalculatorPDFPreviewProps) => {
  const [formData, setFormData] = useState({
    address: data.address || '',
    totalPrice: data.totalPrice || '',
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

  const handleDownload = () => {
    // Placeholder for PDF generation
    console.log('Generating PDF with data:', formData);
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="font-semibold">Boligfinansieringsrapport</h3>
        </div>
        <Button onClick={handleDownload} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Last ned PDF
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6 bg-white p-8 rounded-lg shadow-sm">
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Boligfinansieringsrapport</h1>
            <p className="text-sm text-gray-500 mt-2">Generert av Leily</p>
          </div>

          <div className="space-y-6">
            {/* Property Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Eiendomsinformasjon
              </h2>
              
              <div>
                <Label htmlFor="address" className="text-gray-700">Eiendomsadresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Skriv inn adresse..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPrice" className="text-gray-700">Totalpris</Label>
                  <Input
                    id="totalPrice"
                    value={formData.totalPrice}
                    onChange={(e) => handleChange('totalPrice', e.target.value)}
                    placeholder="kr"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="equity" className="text-gray-700">Egenkapital</Label>
                  <Input
                    id="equity"
                    value={formData.equity}
                    onChange={(e) => handleChange('equity', e.target.value)}
                    placeholder="kr"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Loan Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Låneinformasjon
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestRate" className="text-gray-700">Rente (%)</Label>
                  <Input
                    id="interestRate"
                    value={formData.interestRate}
                    onChange={(e) => handleChange('interestRate', e.target.value)}
                    placeholder="%"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="loanPeriod" className="text-gray-700">Nedbetalingstid (år)</Label>
                  <Input
                    id="loanPeriod"
                    value={formData.loanPeriod}
                    onChange={(e) => handleChange('loanPeriod', e.target.value)}
                    placeholder="år"
                    className="mt-1"
                  />
                </div>
              </div>

              {loanAmount > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Lånebeløp:</span>
                    <span className="text-lg font-bold text-blue-700">{formatNumberWithSpaces(loanAmount)} kr</span>
                  </div>
                  {monthlyLoanPayment > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Månedlig avdrag:</span>
                      <span className="text-lg font-bold text-blue-700">{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Monthly Income */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Månedlig inntekt</h2>
              
              <div>
                <Label htmlFor="monthlyRent" className="text-gray-700">Leieinntekt</Label>
                <Input
                  id="monthlyRent"
                  value={formData.monthlyRent}
                  onChange={(e) => handleChange('monthlyRent', e.target.value)}
                  placeholder="kr/mnd"
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Monthly Expenses */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Månedlige kostnader</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commonCosts" className="text-gray-700">Felleskostnader</Label>
                  <Input
                    id="commonCosts"
                    value={formData.commonCosts}
                    onChange={(e) => handleChange('commonCosts', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="municipalFees" className="text-gray-700">Kommunale avgifter</Label>
                  <Input
                    id="municipalFees"
                    value={formData.municipalFees}
                    onChange={(e) => handleChange('municipalFees', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="insurance" className="text-gray-700">Forsikring</Label>
                  <Input
                    id="insurance"
                    value={formData.insurance}
                    onChange={(e) => handleChange('insurance', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="electricityMonthly" className="text-gray-700">Strøm</Label>
                  <Input
                    id="electricityMonthly"
                    value={formData.electricityMonthly}
                    onChange={(e) => handleChange('electricityMonthly', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sharedExpenses" className="text-gray-700">Andre utgifter</Label>
                  <Input
                    id="sharedExpenses"
                    value={formData.sharedExpenses}
                    onChange={(e) => handleChange('sharedExpenses', e.target.value)}
                    placeholder="kr/mnd"
                    className="mt-1"
                  />
                </div>
              </div>

              {totalMonthlyExpenses > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Totale utgifter:</span>
                    <span className="text-lg font-bold text-orange-700">{formatNumberWithSpaces(Math.round(totalMonthlyExpenses))} kr/mnd</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Summary */}
            {formData.totalPrice && formData.equity && (
              <div className="space-y-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <h2 className="text-lg font-semibold text-gray-900">Sammendrag</h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Månedlig inntekt:</span>
                    <span className="font-semibold text-green-700">
                      +{formatNumberWithSpaces(Math.round(parseFloat(formData.monthlyRent) || 0))} kr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Månedlig lånekostnad:</span>
                    <span className="font-semibold text-red-700">
                      -{formatNumberWithSpaces(Math.round(monthlyLoanPayment))} kr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Månedlige utgifter:</span>
                    <span className="font-semibold text-red-700">
                      -{formatNumberWithSpaces(Math.round(totalMonthlyExpenses))} kr
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold text-gray-900">Netto kontantstrøm:</span>
                    <span className={`text-xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {monthlyCashFlow >= 0 ? '+' : ''}{formatNumberWithSpaces(Math.round(monthlyCashFlow))} kr/mnd
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
