import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Calculator } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";

const ExtendedPropertyDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = location.state || {};

  const [propertyDetails, setPropertyDetails] = useState({
    // Basic property data from previous step
    propertyValue: initialData.propertyValue || 2500000,
    monthlyRent: initialData.monthlyRent || 18000,
    loanAmount: initialData.loanAmount || 2000000,
    interestRate: initialData.interestRate || 5.0,
    loanPeriod: initialData.loanPeriod || 25,
    
    // Extended property details
    monthlyExpenses: 4000,
    annualKpiGrowthRent: 2,
    vacancyRate: 5,
    capExPlan: [
      { year: 3, amount: 50000 },
      { year: 7, amount: 100000 }
    ],
    
    // Market analysis data
    comparativeRents: [
      { rent: 17500, sqm: 80, area: "Frogner", year: "2023" },
      { rent: 18500, sqm: 85, area: "Majorstuen", year: "2023" },
      { rent: 19000, sqm: 90, area: "St. Hanshaugen", year: "2022" }
    ],
    comparativePrices: [
      { pricePerSqm: 82000, area: "Frogner", period: "Q1 2023" },
      { pricePerSqm: 79000, area: "Majorstuen", period: "Q3 2022" }
    ],
    propertyValueEstimate: 4500000,
    macroTrends: {
      priceGrowthLast3Years: 8,
      rentGrowthLast3Years: 5,
      averageDaysOnMarket: 22
    },
    
    // Property specific details
    propertySize: 85,
    propertyArea: "Oslo sentrum",
    buildingYear: 1985,
    lastRenovation: 2018,
    energyRating: "C",
    balcony: true,
    parking: false
  });

  const handleInputChange = (field: string, value: any) => {
    setPropertyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCapExChange = (index: number, field: string, value: string) => {
    const updatedCapEx = [...propertyDetails.capExPlan];
    updatedCapEx[index] = {
      ...updatedCapEx[index],
      [field]: field === 'year' ? parseInt(value) || 0 : parseInt(value) || 0
    };
    setPropertyDetails(prev => ({
      ...prev,
      capExPlan: updatedCapEx
    }));
  };

  const calculateBreakEven = () => {
    const totalAnnualCosts = (propertyDetails.monthlyExpenses * 12) + 
      (propertyDetails.loanAmount * propertyDetails.interestRate / 100);
    const breakEvenRent = totalAnnualCosts / 12;
    const breakEvenOccupancy = (totalAnnualCosts / (propertyDetails.monthlyRent * 12)) * 100;
    const breakEvenRate = ((propertyDetails.monthlyRent * 12) / propertyDetails.loanAmount) * 100;

    return {
      rent: breakEvenRent,
      occupancy: breakEvenOccupancy,
      interestRate: breakEvenRate
    };
  };

  const breakEven = calculateBreakEven();
  const medianMarketRent = propertyDetails.comparativeRents.reduce((sum, rent) => sum + rent.rent, 0) / propertyDetails.comparativeRents.length;
  const avgPricePerSqm = propertyDetails.comparativePrices.reduce((sum, price) => sum + price.pricePerSqm, 0) / propertyDetails.comparativePrices.length;

  const handleGenerateReport = () => {
    // Generate comprehensive report with all extended data
    navigate('/bank-report', { 
      state: { 
        ...propertyDetails,
        reportType: 'extended',
        breakEvenAnalysis: breakEven,
        medianMarketRent,
        avgPricePerSqm
      }
    });
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/calculator')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til kalkulator
          </Button>
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Utvidede Eiendomsdetaljer</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Fyll inn detaljerte opplysninger for en komplett bankanalyse med avanserte beregninger
            </p>
            <Badge variant="default" className="text-sm px-4 py-2">
              Premium Analyse
            </Badge>
          </div>
        </div>

        <div className="grid gap-8 max-w-6xl mx-auto">
          {/* Basic Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Grunnleggende Finansielle Data</CardTitle>
              <CardDescription>Hovedparametere for investeringen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Kjøpesum (kr)</Label>
                  <Input
                    type="number"
                    value={propertyDetails.propertyValue}
                    onChange={(e) => handleInputChange('propertyValue', parseInt(e.target.value))}
                    placeholder="2500000"
                  />
                </div>
                <div>
                  <Label>Lånebeløp (kr)</Label>
                  <Input
                    type="number"
                    value={propertyDetails.loanAmount}
                    onChange={(e) => handleInputChange('loanAmount', parseInt(e.target.value))}
                    placeholder="2000000"
                  />
                </div>
                <div>
                  <Label>Rente (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={propertyDetails.interestRate}
                    onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value))}
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <Label>Avdragstid (år)</Label>
                  <Input
                    type="number"
                    value={propertyDetails.loanPeriod}
                    onChange={(e) => handleInputChange('loanPeriod', parseInt(e.target.value))}
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label>Månedlig leie (kr)</Label>
                  <Input
                    type="number"
                    value={propertyDetails.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', parseInt(e.target.value))}
                    placeholder="18000"
                  />
                </div>
                <div>
                  <Label>Månedlige utgifter (kr)</Label>
                  <Input
                    type="number"
                    value={propertyDetails.monthlyExpenses}
                    onChange={(e) => handleInputChange('monthlyExpenses', parseInt(e.target.value))}
                    placeholder="4000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Avanserte Parametere</CardTitle>
              <CardDescription>Detaljerte beregningsparametere for 10-års analyse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Årlig KPI-vekst leie (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={propertyDetails.annualKpiGrowthRent}
                    onChange={(e) => handleInputChange('annualKpiGrowthRent', parseFloat(e.target.value))}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label>Vacancy - leieledie (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={propertyDetails.vacancyRate}
                    onChange={(e) => handleInputChange('vacancyRate', parseFloat(e.target.value))}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label>Eiendomsstørrelse (m²)</Label>
                  <Input
                    type="number"
                    value={propertyDetails.propertySize}
                    onChange={(e) => handleInputChange('propertySize', parseInt(e.target.value))}
                    placeholder="85"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">CapEx-plan</h4>
                <div className="space-y-3">
                  {propertyDetails.capExPlan.map((capEx, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <div className="flex-1">
                        <Label>År {index + 1}</Label>
                        <Input
                          type="number"
                          value={capEx.year}
                          onChange={(e) => handleCapExChange(index, 'year', e.target.value)}
                          placeholder="3"
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Beløp (kr)</Label>
                        <Input
                          type="number"
                          value={capEx.amount}
                          onChange={(e) => handleCapExChange(index, 'amount', e.target.value)}
                          placeholder="50000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">📈 Markedsanalyse Data</CardTitle>
              <CardDescription>Komparative data for området</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Komparative leiepriser</h4>
                <div className="space-y-4">
                  {propertyDetails.comparativeRents.map((rent, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                      <div className="text-sm">
                        <span className="font-semibold">{rent.rent.toLocaleString()} kr/mnd</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rent.sqm} m²
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rent.area}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Leid ut {rent.year}
                      </div>
                    </div>
                  ))}
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="font-semibold text-primary">
                      → Median markedsleie: {medianMarketRent.toLocaleString()} kr
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Komparative salgspriser (kvm-pris)</h4>
                <div className="space-y-4">
                  {propertyDetails.comparativePrices.map((price, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div className="text-sm">
                        <span className="font-semibold">{price.pricePerSqm.toLocaleString()} kr/m²</span> - {price.area}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Solgt {price.period}
                      </div>
                    </div>
                  ))}
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="font-semibold text-primary">
                      → Kvm-pris område: ca. {avgPricePerSqm.toLocaleString()} kr/m²
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Verdiestimat objekt (kr)</Label>
                  <Input
                    type="number"
                    value={propertyDetails.propertyValueEstimate}
                    onChange={(e) => handleInputChange('propertyValueEstimate', parseInt(e.target.value))}
                    placeholder="4500000"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Makrotrender</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-card-elevated rounded-lg">
                    <p className="text-sm text-muted-foreground">Prisvekst siste 3 år</p>
                    <p className="text-xl font-bold text-primary">+{propertyDetails.macroTrends.priceGrowthLast3Years}%</p>
                  </div>
                  <div className="text-center p-4 bg-card-elevated rounded-lg">
                    <p className="text-sm text-muted-foreground">Leievekst siste 3 år</p>
                    <p className="text-xl font-bold text-accent">+{propertyDetails.macroTrends.rentGrowthLast3Years}%</p>
                  </div>
                  <div className="text-center p-4 bg-card-elevated rounded-lg">
                    <p className="text-sm text-muted-foreground">Days on market</p>
                    <p className="text-xl font-bold text-secondary">{propertyDetails.macroTrends.averageDaysOnMarket} dager</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">⚠️ Risikovurdering</CardTitle>
              <CardDescription>Enkel risikotabell</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left">Risiko</th>
                      <th className="border border-border p-3 text-left">Sannsynlighet</th>
                      <th className="border border-border p-3 text-left">Konsekvens</th>
                      <th className="border border-border p-3 text-left">Tiltak</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">Renteøkning</td>
                      <td className="border border-border p-3">
                        <Badge variant="destructive">Høy</Badge>
                      </td>
                      <td className="border border-border p-3">
                        <Badge variant="destructive">Høy</Badge>
                      </td>
                      <td className="border border-border p-3">Vurdere fastrente, bufferkonto</td>
                    </tr>
                    <tr className="bg-muted/50">
                      <td className="border border-border p-3">Leietaker frafall</td>
                      <td className="border border-border p-3">
                        <Badge variant="secondary">Middels</Badge>
                      </td>
                      <td className="border border-border p-3">
                        <Badge variant="destructive">Høy</Badge>
                      </td>
                      <td className="border border-border p-3">3 mnd depositum, forsikring</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Uforutsett vedlikehold</td>
                      <td className="border border-border p-3">
                        <Badge variant="secondary">Middels</Badge>
                      </td>
                      <td className="border border-border p-3">
                        <Badge variant="secondary">Middels</Badge>
                      </td>
                      <td className="border border-border p-3">Avsette 20 000 kr/år i reserve</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Break-even Analysis Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Break-even Analyse</CardTitle>
              <CardDescription>Kritiske terskelverdier for prosjektet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-card-elevated rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Leie (månedlig)</p>
                  <p className="text-2xl font-bold text-primary">{breakEven.rent.toLocaleString()} kr</p>
                </div>
                <div className="text-center p-4 bg-card-elevated rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Rente (maks uten negativ CF)</p>
                  <p className="text-2xl font-bold text-accent">{breakEven.interestRate.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-card-elevated rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Beleggsprosent</p>
                  <p className="text-2xl font-bold text-secondary">{(100 - breakEven.occupancy).toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Report */}
          <Card className="bg-gradient-soft border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Generer Utvidet Bankrapport
              </h3>
              <p className="text-muted-foreground mb-6">
                Rapporten vil inneholde alle detaljerte beregninger, markedsanalyse og risikovurdering
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 px-8"
                onClick={handleGenerateReport}
              >
                <FileText className="h-5 w-5 mr-2" />
                Generer Utvidet Bankrapport
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ExtendedPropertyDetails;