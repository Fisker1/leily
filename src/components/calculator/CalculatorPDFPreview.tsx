import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';

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
    insurance: data.insurance || ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onDataChange?.(field, value);
  };

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

          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Eiendomsadresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Skriv inn adresse..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalPrice">Totalpris</Label>
                <Input
                  id="totalPrice"
                  value={formData.totalPrice}
                  onChange={(e) => handleChange('totalPrice', e.target.value)}
                  placeholder="kr"
                />
              </div>
              <div>
                <Label htmlFor="equity">Egenkapital</Label>
                <Input
                  id="equity"
                  value={formData.equity}
                  onChange={(e) => handleChange('equity', e.target.value)}
                  placeholder="kr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interestRate">Rente (%)</Label>
                <Input
                  id="interestRate"
                  value={formData.interestRate}
                  onChange={(e) => handleChange('interestRate', e.target.value)}
                  placeholder="%"
                />
              </div>
              <div>
                <Label htmlFor="loanPeriod">Nedbetalingstid (år)</Label>
                <Input
                  id="loanPeriod"
                  value={formData.loanPeriod}
                  onChange={(e) => handleChange('loanPeriod', e.target.value)}
                  placeholder="år"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="monthlyRent">Månedlig leieinntekt</Label>
              <Input
                id="monthlyRent"
                value={formData.monthlyRent}
                onChange={(e) => handleChange('monthlyRent', e.target.value)}
                placeholder="kr/mnd"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Månedlige kostnader</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="commonCosts">Felleskostnader</Label>
                  <Input
                    id="commonCosts"
                    value={formData.commonCosts}
                    onChange={(e) => handleChange('commonCosts', e.target.value)}
                    placeholder="kr/mnd"
                  />
                </div>
                <div>
                  <Label htmlFor="municipalFees">Kommunale avgifter</Label>
                  <Input
                    id="municipalFees"
                    value={formData.municipalFees}
                    onChange={(e) => handleChange('municipalFees', e.target.value)}
                    placeholder="kr/mnd"
                  />
                </div>
                <div>
                  <Label htmlFor="insurance">Forsikring</Label>
                  <Input
                    id="insurance"
                    value={formData.insurance}
                    onChange={(e) => handleChange('insurance', e.target.value)}
                    placeholder="kr/mnd"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
