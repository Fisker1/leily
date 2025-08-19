import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import { 
  FileText, 
  Download, 
  Printer, 
  Building2,
  Calendar,
  TrendingUp,
  Shield,
  BarChart3,
  DollarSign,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface ModuleData {
  [key: string]: any;
}

const BankReport = () => {
  const location = useLocation();
  const reportData = location.state || {};
  
  const {
    basicData = {},
    profitabilityData = {},
    advancedData = {},
    marketData = {},
    riskData = {},
    yieldData = {},
    activatedModules = []
  } = reportData;

  const currentDate = new Date().toLocaleDateString('no-NO', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            Tilbake til kalkulator
          </Link>
          <div className="flex gap-4">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Skriv ut
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Download className="h-4 w-4 mr-2" />
              Last ned PDF
            </Button>
          </div>
        </div>

        {/* Report Container */}
        <div className="max-w-4xl mx-auto bg-white text-black shadow-large rounded-lg overflow-hidden relative">
          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-5">
            <div className="text-6xl font-bold transform rotate-45 text-primary">
              APROPOS BOLIG
            </div>
          </div>

          {/* Report Content */}
          <div className="relative z-20 p-12">
            {/* Header */}
            <div className="text-center mb-12 border-b-2 border-primary pb-8">
              <div className="flex justify-between items-start mb-6">
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-primary mb-2">APROPOS BOLIG</h1>
                  <p className="text-sm text-gray-600">Eiendomsanalyse & Investeringsrådgivning</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Rapport generert: {currentDate}</p>
                  <p>Rapport ID: #AB-{Date.now().toString(36).toUpperCase()}</p>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                EIENDOMSINVESTERINGSRAPPORT
              </h2>
              <p className="text-lg text-gray-700">
                Profesjonell analyse for finansieringsformål
              </p>
            </div>

            {/* Executive Summary */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                SAMMENDRAG
              </h3>
              
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Eiendomsdetaljer</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Eiendomsverdi:</span>
                        <span className="font-medium">{formatCurrency(basicData.propertyValue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lånebeløp:</span>
                        <span className="font-medium">{formatCurrency(basicData.loanAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Egenkapital:</span>
                        <span className="font-medium">{formatCurrency((basicData.propertyValue || 0) - (basicData.loanAmount || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Nøkkeltall</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Belåningsgrad:</span>
                        <span className="font-medium">
                          {formatPercent(((basicData.loanAmount || 0) / (basicData.propertyValue || 1)) * 100)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Månedlig cashflow:</span>
                        <span className={`font-medium ${(basicData.monthlyCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(basicData.monthlyCashFlow || 0)}
                        </span>
                      </div>
                      {basicData.calculatorMode === 'investment' && (
                        <div className="flex justify-between">
                          <span>Brutto yield:</span>
                          <span className="font-medium text-primary">
                            {formatPercent(basicData.grossYield || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">Analyseoversikt</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Denne rapporten inkluderer {activatedModules.length} detaljerte analysemoduler:
                </p>
                <div className="flex flex-wrap gap-2">
                  {activatedModules.map((module: string) => (
                    <Badge key={module} variant="default" className="text-xs">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            </section>

            {/* Profitability Analysis */}
            {activatedModules.includes('Lønnsomhetsanalyse') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  LØNNSOMHETSANALYSE
                </h3>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-primary/5 rounded-lg border">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {profitabilityData.score || 0}/100
                    </div>
                    <div className="text-sm text-gray-600">Lønnsomhetscore</div>
                  </div>
                  
                  {basicData.calculatorMode === 'investment' && (
                    <>
                      <div className="text-center p-4 bg-green-50 rounded-lg border">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {formatPercent(profitabilityData.grossYield || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Brutto yield</div>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {formatPercent(profitabilityData.netYield || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Netto yield</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-4">Månedlig økonomisk oversikt</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      {basicData.calculatorMode === 'investment' && (
                        <div className="flex justify-between">
                          <span>Leieinntekter:</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(basicData.monthlyRent || 0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Driftsutgifter:</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(basicData.expenses || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lånebetalinger:</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(basicData.monthlyLoanPayment || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="border-l pl-8">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Netto månedlig cashflow:</span>
                        <span className={`${(basicData.monthlyCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(basicData.monthlyCashFlow || 0) >= 0 ? '+' : ''}{formatCurrency(basicData.monthlyCashFlow || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Advanced Calculations */}
            {activatedModules.includes('Avanserte beregninger') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  AVANSERTE BEREGNINGER
                </h3>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Avkastningsmål</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Cap Rate:</span>
                        <span className="font-medium">{formatPercent(advancedData.capRate || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash-on-Cash avkastning:</span>
                        <span className="font-medium">{formatPercent(advancedData.cashOnCashReturn || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total avkastning:</span>
                        <span className="font-medium">{formatPercent(advancedData.totalReturnPercentage || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Økonomiske nøkkeltall</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>NOI (årlig):</span>
                        <span className="font-medium">{formatCurrency(advancedData.netOperatingIncome || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Årlig verdiøkning:</span>
                        <span className="font-medium">{formatCurrency(advancedData.annualAppreciation || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Effektiv månedlig leie:</span>
                        <span className="font-medium">{formatCurrency(advancedData.effectiveMonthlyRent || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Market Analysis */}
            {activatedModules.includes('Markedsanalyse') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  MARKEDSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">Prissammenligning</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Din eiendom:</span>
                        <span className="font-medium">{formatCurrency(marketData.propertyValue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Områdesnitt:</span>
                        <span className="font-medium">{formatCurrency(marketData.averageAreaPrice || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avvik:</span>
                        <span className={`font-medium ${(marketData.priceComparison || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {(marketData.priceComparison || 0) >= 0 ? '+' : ''}{formatPercent(marketData.priceComparison || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">Leiesammenligning</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Din leie:</span>
                        <span className="font-medium">{formatCurrency(marketData.monthlyRent || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Områdesnitt:</span>
                        <span className="font-medium">{formatCurrency(marketData.averageAreaRent || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avvik:</span>
                        <span className={`font-medium ${(marketData.rentComparison || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(marketData.rentComparison || 0) >= 0 ? '+' : ''}{formatPercent(marketData.rentComparison || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {formatPercent(marketData.rentYield || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Din brutto yield</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700 mb-1">
                        {formatPercent(marketData.marketRentYield || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Markedets yield</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Risk Evaluation */}
            {activatedModules.includes('Risikoevaluering') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  RISIKOEVALUERING
                </h3>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className="text-xl font-bold text-gray-700 mb-1">
                      {formatPercent(riskData.loanToValue || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Belåningsgrad (LTV)</div>
                    <Badge 
                      variant={(riskData.loanToValue || 0) > 80 ? "destructive" : "default"} 
                      className="mt-2 text-xs"
                    >
                      {(riskData.loanToValue || 0) > 80 ? "Høy risiko" : "Akseptabel"}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className="text-xl font-bold text-gray-700 mb-1">
                      {(riskData.debtServiceCoverage || 0).toFixed(1)}x
                    </div>
                    <div className="text-xs text-gray-600">Dekningsgrad</div>
                    <Badge 
                      variant={(riskData.debtServiceCoverage || 0) > 1.3 ? "default" : "destructive"} 
                      className="mt-2 text-xs"
                    >
                      {(riskData.debtServiceCoverage || 0) > 1.3 ? "Trygg" : "Risiko"}
                    </Badge>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className={`text-xl font-bold mb-1 ${(riskData.cashFlowBuffer || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(riskData.cashFlowBuffer || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Cashflow-buffer</div>
                  </div>
                </div>

                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-4">Risikoscenarier</h4>
                  <div className="space-y-3 text-sm">
                    {riskData.scenarios && riskData.scenarios.map((scenario: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{scenario.title}:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${scenario.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {scenario.impact >= 0 ? '+' : ''}{formatCurrency(scenario.impact)}
                          </span>
                          <Badge 
                            variant={scenario.severity === 'Høy' ? 'destructive' : scenario.severity === 'Moderat' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {scenario.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Yield Analysis */}
            {activatedModules.includes('Avkastningsanalyse') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  AVKASTNINGSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">Nåværende avkastning</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Brutto årlig yield:</span>
                        <span className="font-medium">{formatPercent(yieldData.grossYield || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Netto årlig yield:</span>
                        <span className="font-medium">{formatPercent(yieldData.netYield || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Månedlig netto:</span>
                        <span className="font-medium">{formatCurrency(yieldData.monthlyNet || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">Fremskrivning ({yieldData.projectionYears || 10} år)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Forventet eiendomsverdi:</span>
                        <span className="font-medium">{formatCurrency(yieldData.projectedValue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Forventet månedlig leie:</span>
                        <span className="font-medium">{formatCurrency(yieldData.projectedRent || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annualisert avkastning:</span>
                        <span className="font-medium text-primary">{formatPercent(yieldData.annualizedReturn || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Conclusion */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-gray-900 mb-6">KONKLUSJON OG ANBEFALINGER</h3>
              
              <div className="p-6 bg-primary/10 rounded-lg border border-primary/20 mb-6">
                <h4 className="font-semibold text-primary mb-3">Finansieringsvurdering</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Basert på den gjennomførte analysen viser eiendommen {' '}
                  {(basicData.monthlyCashFlow || 0) >= 0 ? 'positiv' : 'negativ'} månedlig cashflow på {' '}
                  {formatCurrency(Math.abs(basicData.monthlyCashFlow || 0))}. 
                  {basicData.calculatorMode === 'investment' && ` Brutto yield på ${formatPercent(basicData.grossYield || 0)} 
                  indikerer ${(basicData.grossYield || 0) > 6 ? 'attraktiv' : 'moderat'} avkastning.`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-semibold text-green-800 mb-2">Positive faktorer:</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {(basicData.loanToValue || 0) < 80 && <li>• Konservativ belåningsgrad</li>}
                    {(basicData.monthlyCashFlow || 0) > 0 && <li>• Positiv månedlig cashflow</li>}
                    {(basicData.grossYield || 0) > 6 && <li>• Høy avkastning</li>}
                    <li>• Grundig analyse gjennomført</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h5 className="font-semibold text-yellow-800 mb-2">Vurderingspunkter:</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {(basicData.loanToValue || 0) > 80 && <li>• Høy belåningsgrad</li>}
                    {(basicData.monthlyCashFlow || 0) < 0 && <li>• Negativ månedlig cashflow</li>}
                    <li>• Markedsrisiko bør overvåkes</li>
                    <li>• Rentefølsomhet</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t-2 border-primary pt-6 mt-12">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-bold text-primary text-lg">APROPOS BOLIG</h4>
                  <p className="text-sm text-gray-600">Profesjonell eiendomsanalyse</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Denne rapporten er generert av Apropos Bolig sine analyseverktøy og er ment som beslutningsgrunnlag for finansiering.
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Side 1 av 1</p>
                  <p>Rapport ID: #AB-{Date.now().toString(36).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReport;