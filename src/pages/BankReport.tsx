import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { 
  Download, 
  Printer, 
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModuleData {
  [key: string]: any;
}

const BankReport = () => {
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const reportData = location.state || {};
  const { user } = useAuth();
  const [currentPageCount, setCurrentPageCount] = useState(7); // Default page count
  
  const {
    basicData = {},
    profitabilityData = {},
    advancedData = {},
    marketData = {},
    riskData = {},
    yieldData = {},
    activatedModules: rawActivatedModules = []
  } = reportData;

  const activatedModules = Array.isArray(rawActivatedModules) ? rawActivatedModules : [];

  const enrichedBasicData = {
    ...basicData,
    propertyType: reportData.basicData?.propertyType || '',
    tomannsboligType: reportData.basicData?.tomannsboligType || '',
    equity: reportData.basicData?.equity || 0,
    interestRate: reportData.basicData?.interestRate || 0,
    loanPeriod: reportData.basicData?.loanPeriod || 0,
    municipalFees: reportData.basicData?.municipalFees || 0,
    electricityMonthly: reportData.basicData?.electricityMonthly || 0,
    insurance: reportData.basicData?.insurance || 0,
    sharedExpenses: reportData.basicData?.sharedExpenses || 0
  };

  const displayBasicData = enrichedBasicData;

  const saveReportToDatabase = async (fileName: string, fileSize: number) => {
    if (!user) return;

    try {
      const reportRecord = {
        user_id: user.id,
        report_type: 'bank_report',
        property_data: {
          propertyType: displayBasicData.propertyType,
          tomannsboligType: displayBasicData.tomannsboligType,
          propertyValue: displayBasicData.propertyValue,
          loanAmount: displayBasicData.loanAmount,
          monthlyRent: displayBasicData.monthlyRent,
          expenses: displayBasicData.expenses,
          calculatorMode: displayBasicData.calculatorMode
        },
        calculations: {
          monthlyCashFlow: displayBasicData.monthlyCashFlow,
          grossYield: displayBasicData.grossYield,
          profitabilityScore: profitabilityData.score,
          capRate: advancedData.capRate,
          activatedModules
        },
        file_name: fileName,
        file_size: fileSize
      };

      const { error } = await supabase
        .from('reports')
        .insert([reportRecord]);

      if (error) {
        console.error('Error saving report:', error);
        toast.error('Kunne ikke lagre rapport i systemet');
      } else {
        toast.success('Rapport lagret og sporet i systemet');
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      const nav = document.querySelector('nav');
      const navDisplay = nav?.style.display;
      if (nav) nav.style.display = 'none';

      const reportElement = reportRef.current;

      // Wait for layout
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 794,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: reportElement.scrollHeight
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;

      const imgData = canvas.toDataURL('image/png', 0.9);

      if (imgHeight < pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      if (nav && navDisplay) nav.style.display = navDisplay;

      const reportId = `AB-${Date.now().toString(36).toUpperCase()}`;
      const fileName = `bankrapport-${reportId}.pdf`;
      pdf.save(fileName);

      const pdfOutput = pdf.output('arraybuffer');
      const fileSize = pdfOutput.byteLength;

      await saveReportToDatabase(fileName, fileSize);
      
      toast.success('PDF generert og lastet ned!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Feil ved generering av PDF. Prøv igjen.');
    }
  };

  const currentDate = new Date().toLocaleDateString('no-NO', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      useGrouping: true
    }).format(amount).replace(/\u00A0/g, ' ');
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const reportId = `AB-${Date.now().toString(36).toUpperCase()}`;

  // Footer component
  const PageFooter = ({ pageNum }: { pageNum: number }) => (
    <div className="report-page-footer">
      <div className="flex justify-between items-center text-xs">
        <div>
          <p className="font-semibold">Leily AS - Beslutningsstøtteverktøy</p>
          <p className="text-gray-500 mt-1">
            Denne rapporten er konfidensielt og kun til finansieringsformål. 
            Forhør deg med din lokale bank og rådgiver.
          </p>
        </div>
        <div className="text-right">
          <p>Referanse: {reportId}</p>
          <p className="font-semibold">Side {pageNum}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <style>{`
        .report-page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 0 auto 24px;
          position: relative;
          padding: 15mm 12mm 30mm 12mm;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .report-page-footer {
          position: absolute;
          bottom: 10mm;
          left: 12mm;
          right: 12mm;
          padding-top: 6px;
          border-top: 1px solid #cbd5e0;
        }
        
        .report-page h3 {
          font-size: 14px;
          margin-bottom: 12px;
        }
        
        .report-page h4 {
          font-size: 11px;
          margin-bottom: 8px;
        }
        
        .report-page table {
          width: 100%;
          table-layout: fixed;
        }
        
        .report-page table td {
          padding: 4px 0;
          font-size: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .report-page table td:first-child {
          width: 60%;
        }
        
        .report-page table td:last-child {
          width: 40%;
          text-align: right;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .report-page {
            box-shadow: none;
            margin: 0;
            page-break-after: always;
          }
          
          .report-page:last-child {
            page-break-after: auto;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        @media (max-width: 768px) {
          .report-page {
            width: 100%;
            min-height: auto;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: visible;
          }
          
          .report-page-footer {
            position: relative;
            bottom: auto;
            left: auto;
            right: auto;
            margin-top: 20px;
          }
          
          .report-page table td {
            white-space: normal;
          }
        }
      `}</style>

      <div className="container mx-auto px-4 py-8">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 no-print">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            Tilbake til kalkulator
          </Link>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => window.print()} className="min-w-[120px]">
              <Printer className="h-4 w-4 mr-2" />
              Skriv ut
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90 min-w-[140px]" onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              Last ned PDF
            </Button>
          </div>
        </div>

        {/* Report Pages */}
        <div ref={reportRef}>
          {/* Page 1: Header & Key Info */}
          <div className="report-page">
            {/* Professional Header */}
            <div className="mb-8 pb-6 border-b-2 border-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-wide">LEILY AS</h1>
                  <p className="text-sm text-gray-700 mt-1">Beslutningsstøtteverktøy for eiendomsfinansiering</p>
                  <p className="text-xs text-gray-600 mt-1">Org.nr: 123 456 789</p>
                </div>
                <div className="text-right text-xs text-gray-700">
                  <p className="font-semibold">Rapport utstedt: {currentDate}</p>
                  <p>Referanse: {reportId}</p>
                  <p>Konfidensialitet: Kun til bankformål</p>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">
                  EIENDOMSANALYSE FOR FINANSIERINGSFORMÅL
                </h2>
                <p className="text-sm text-gray-700 font-medium">
                  Beslutningsstøtteverktøy - Forhør deg med din lokale bank og rådgiver for finansiering
                </p>
              </div>
            </div>

            {/* Key Property Information */}
            <section className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                1. NØKKELINFORMASJON OM EIENDOMMEN
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-gray-300 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Eiendomsopplysninger</h4>
                  <table className="w-full text-xs">
                    <tbody className="space-y-1">
                      {displayBasicData.address && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Adresse:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.address}</td>
                        </tr>
                      )}
                      {displayBasicData.finnCode && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">FINN-kode:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.finnCode}</td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Boligtype:</td>
                        <td className="py-1 text-right font-semibold">
                          {displayBasicData.propertyType ? displayBasicData.propertyType.charAt(0).toUpperCase() + displayBasicData.propertyType.slice(1) : 'Ikke spesifisert'}
                        </td>
                      </tr>
                      {displayBasicData.ownershipType && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Eierform:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.ownershipType}</td>
                        </tr>
                      )}
                      {displayBasicData.bedrooms && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Soverom:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.bedrooms}</td>
                        </tr>
                      )}
                      {displayBasicData.rooms && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Antall rom:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.rooms}</td>
                        </tr>
                      )}
                      {displayBasicData.livingArea && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Primærrom (BRA):</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.livingArea} m²</td>
                        </tr>
                      )}
                      {displayBasicData.buildYear && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Byggeår:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.buildYear}</td>
                        </tr>
                      )}
                      {displayBasicData.energyRating && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Energimerking:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.energyRating}</td>
                        </tr>
                      )}
                      {displayBasicData.plotArea && (
                        <tr>
                          <td className="py-1 text-gray-600">Tomteareal:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.plotArea} m²</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="border border-gray-300 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Priser og kostnader</h4>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Prisantydning:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.totalPrice || displayBasicData.propertyValue || 0)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Totalpris:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.propertyValue || 0)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Kommunale avgifter:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.municipalFees || 0)}/mnd</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Fellesutgifter:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.sharedExpenses || 0)}/mnd</td>
                      </tr>
                      {displayBasicData.municipality && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Kommune:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.municipality}</td>
                        </tr>
                      )}
                      {displayBasicData.county && (
                        <tr>
                          <td className="py-1 text-gray-600">Fylke:</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.county}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Facilities */}
              {displayBasicData.facilities && Array.isArray(displayBasicData.facilities) && displayBasicData.facilities.length > 0 && (
                <div className="border border-gray-300 p-4 mb-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Fasiliteter</h4>
                  <div className="flex flex-wrap gap-2">
                    {displayBasicData.facilities.map((facility: string, index: number) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-800 px-3 py-1 border border-gray-300 rounded">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <PageFooter pageNum={1} />
          </div>

          {/* Page 2: Financial Summary */}
          <div className="report-page">
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                2. SAMMENDRAG AV ANALYSE
              </h3>
              
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="border border-gray-300 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Eiendomsdata</h4>
                  <table className="w-full text-xs">
                    <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Boligtype:</td>
                          <td className="py-1 text-right font-semibold">
                            {displayBasicData.propertyType ? displayBasicData.propertyType.charAt(0).toUpperCase() + displayBasicData.propertyType.slice(1) : 'Ikke spesifisert'}
                            {displayBasicData.propertyType === 'tomannsbolig' && displayBasicData.tomannsboligType && 
                              ` (${displayBasicData.tomannsboligType === 'vertikaldelt' ? 'Vertikaldelt' : 'Horisontaldelt'})`
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Eiendomsverdi:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.propertyValue || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Lånebeløp:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.loanAmount || 0)}</td>
                        </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="border border-gray-300 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Låneinformasjon</h4>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Egenkapital:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.equity || 0)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Rente:</td>
                        <td className="py-1 text-right font-semibold">{formatPercent(displayBasicData.interestRate || 0)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Nedbetalingstid:</td>
                        <td className="py-1 text-right font-semibold">{displayBasicData.loanPeriod || 0} år</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Belåningsgrad:</td>
                        <td className="py-1 text-right font-semibold">
                          {displayBasicData.propertyValue > 0 ? formatPercent(((displayBasicData.loanAmount || 0) / displayBasicData.propertyValue) * 100) : '0.00%'}
                        </td>
                      </tr>
                      {displayBasicData.calculatorMode === 'investment' && (
                         <tr>
                           <td className="py-1 text-gray-600">Brutto avkastning:</td>
                           <td className="py-1 text-right font-semibold">
                             {formatPercent(displayBasicData.grossYield || 0)}
                           </td>
                         </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Expense Breakdown */}
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="border border-gray-300 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Månedlige utgifter (detaljer)</h4>
                  <table className="w-full text-xs">
                    <tbody className="space-y-1">
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Kommunale avgifter:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.municipalFees || 0)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Strøm (forventet):</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.electricityMonthly || 0)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Forsikring:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.insurance || 0)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Fellesutgifter:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(displayBasicData.sharedExpenses || 0)}</td>
                      </tr>
                      <tr className="border-t border-gray-400 bg-gray-50">
                        <td className="py-1 text-gray-800 font-bold">Sum utgifter:</td>
                        <td className="py-1 text-right font-bold">{formatCurrency(displayBasicData.expenses || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="border border-gray-300 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Månedlig økonomisk oversikt</h4>
                  <table className="w-full text-xs">
                    <tbody>
                      {displayBasicData.calculatorMode === 'investment' && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Forventet leie pr. mnd:</td>
                          <td className="py-1 text-right font-semibold text-green-700">
                            +{formatCurrency(displayBasicData.monthlyRent || 0)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Lånebetalinger pr. mnd:</td>
                        <td className="py-1 text-right font-semibold text-red-700">
                          -{formatCurrency(displayBasicData.monthlyLoanPayment || 0)}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Driftsutgifter pr. mnd:</td>
                        <td className="py-1 text-right font-semibold text-red-700">
                          -{formatCurrency(displayBasicData.expenses || 0)}
                        </td>
                      </tr>
                       <tr className="border-t border-gray-400 bg-gray-50">
                         <td className="py-1 text-gray-800 font-bold">Netto pengestrøm pr. mnd:</td>
                         <td className={`py-1 text-right font-bold ${(displayBasicData.monthlyCashFlow || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                           {(displayBasicData.monthlyCashFlow || 0) >= 0 ? '+' : ''}{formatCurrency(displayBasicData.monthlyCashFlow || 0)}
                         </td>
                       </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-gray-400 bg-gray-50 p-4">
                <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Anvendte analysemoduler</h4>
                <p className="text-xs text-gray-700 mb-2">
                  Rapporten baserer seg på følgende {activatedModules.length} analysemoduler:
                </p>
                <div className="flex flex-wrap gap-1">
                  {activatedModules.map((module: string) => (
                    <span key={module} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 border">
                      {module}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <PageFooter pageNum={2} />
          </div>

          {/* Page 3: Profitability Analysis */}
          {activatedModules.includes('Lønnsomhetsanalyse') && (
            <div className="report-page">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  3. LØNNSOMHETSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Lønnsomhetsresultat</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Lønnsomhetsscore:</td>
                          <td className="py-1 text-right font-semibold">{profitabilityData.score || 0}/100</td>
                        </tr>
                        {basicData.calculatorMode === 'investment' && (
                          <>
                             <tr className="border-b border-gray-200">
                               <td className="py-1 text-gray-600">Brutto avkastning:</td>
                               <td className="py-1 text-right font-semibold">{formatPercent(profitabilityData.grossYield || 0)}</td>
                             </tr>
                             <tr>
                               <td className="py-1 text-gray-600">Netto avkastning:</td>
                               <td className="py-1 text-right font-semibold">{formatPercent(profitabilityData.netYield || 0)}</td>
                             </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Månedlig økonomisk oversikt</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        {basicData.calculatorMode === 'investment' && (
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Leieinntekter:</td>
                          <td className="py-1 text-right font-semibold text-green-700">
                            +{formatCurrency(displayBasicData.monthlyRent || 0)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Driftsutgifter:</td>
                        <td className="py-1 text-right font-semibold text-red-700">
                          -{formatCurrency(displayBasicData.expenses || 0)}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Lånebetalinger:</td>
                        <td className="py-1 text-right font-semibold text-red-700">
                          -{formatCurrency(displayBasicData.monthlyLoanPayment || 0)}
                        </td>
                      </tr>
                       <tr>
                         <td className="py-1 text-gray-600 font-bold">Netto pengestrøm:</td>
                         <td className={`py-1 text-right font-bold ${(displayBasicData.monthlyCashFlow || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                           {(displayBasicData.monthlyCashFlow || 0) >= 0 ? '+' : ''}{formatCurrency(displayBasicData.monthlyCashFlow || 0)}
                         </td>
                       </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Lønnsomhetsvurdering</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {profitabilityData.cashFlowAnalysis || 'Investeringen viser balansert risiko-avkastningsforhold med tilfredsstillende lønnsomhetsprofil for bankfinansiering.'}
                  </p>
                </div>
              </section>

              <PageFooter pageNum={3} />
            </div>
          )}

          {/* Page 4: Advanced Calculations */}
          {activatedModules.includes('Avanserte beregninger') && (
            <div className="report-page">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  4. AVANSERTE BEREGNINGER
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Avkastningsnøkkeltall</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Cap Rate:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(advancedData.capRate || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Cash-on-Cash avkastning:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(advancedData.cashOnCashReturn || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Total avkastning:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(advancedData.totalReturnPercentage || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Økonomiske nøkkeltall</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">NOI (årlig):</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(advancedData.netOperatingIncome || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Årlig verdiøkning:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(advancedData.annualAppreciation || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Effektiv månedlig leie:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(advancedData.effectiveMonthlyRent || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Teknisk analyse</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    De avanserte beregningene viser en {(advancedData.capRate || 0) > 5 ? 'tilfredsstillende' : 'moderat'} kapitalisasjonsrate på {formatPercent(advancedData.capRate || 0)}. 
                    Dette indikerer {(advancedData.capRate || 0) > 5 ? 'god' : 'akseptabel'} verdsettelse relativt til forventet avkastning.
                  </p>
                </div>
              </section>

              <PageFooter pageNum={4} />
            </div>
          )}

          {/* Page 5: Market Analysis */}
          {activatedModules.includes('Markedsanalyse') && (
            <div className="report-page">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  5. MARKEDSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Prissammenligning</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Din eiendom:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(basicData.propertyValue || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Områdesnitt:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(marketData.averageAreaPrice || basicData.propertyValue * 0.95 || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Markedsvurdering:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(marketData.marketGrowth || 3.2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Leiemarkedstall</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Din leie per m²:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(marketData.averageRentPsm || 294)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Områdesnitt per m²:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(marketData.averageRentPsm || 294)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Ledighetsprosent:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(marketData.localVacancyRate || 4.1)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Markedsvurdering</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {marketData.competitiveAnalysis || 'Markedsanalysen viser at eiendommen er konkurransedyktig priset i området med god potensial for stabil leieinntekt og verdiutvikling.'}
                  </p>
                </div>
              </section>

              <PageFooter pageNum={5} />
            </div>
          )}

          {/* Page 6: Risk Evaluation */}
          {activatedModules.includes('Risikoevaluering') && (
            <div className="report-page">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  6. RISIKOEVALUERING
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Finansielle risikofaktorer</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Belåningsgrad (LTV):</td>
                          <td className="py-1 text-right font-semibold">{displayBasicData.propertyValue > 0 ? formatPercent(((displayBasicData.loanAmount || 0) / displayBasicData.propertyValue) * 100) : '0.00%'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Dekningsgrad:</td>
                          <td className="py-1 text-right font-semibold">{(riskData.debtServiceCoverage || 1.2).toFixed(1)}x</td>
                        </tr>
                         <tr>
                           <td className="py-1 text-gray-600">Pengestrøm-buffer:</td>
                           <td className={`py-1 text-right font-semibold ${(riskData.cashFlowBuffer || basicData.monthlyCashFlow || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                             {formatCurrency(riskData.cashFlowBuffer || basicData.monthlyCashFlow || 0)}
                           </td>
                         </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Markedsrisiko</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Markedsrisiko:</td>
                          <td className="py-1 text-right font-semibold">{riskData.marketRisk || 'Lav'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Likviditetsrisiko:</td>
                          <td className="py-1 text-right font-semibold">{riskData.liquidityRisk || 'Lav'}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Samlet risikoscore:</td>
                          <td className="py-1 text-right font-semibold">{riskData.riskScore || 35}/100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Risikoprofil</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Investeringen klassifiseres som {riskData.overallRisk || 'middels'} risiko basert på finansielle nøkkeltall og markedsforhold. 
                    {((basicData.loanAmount || 0) / (basicData.propertyValue || 1)) * 100 > 80 
                      ? 'Høy belåningsgrad krever særlig oppmerksomhet fra långiver.' 
                      : 'Belåningsgraden er innenfor normale bankretningslinjer.'
                    }
                  </p>
                </div>
              </section>

              <PageFooter pageNum={6} />
            </div>
          )}

          {/* Page 7: Yield Analysis */}
          {activatedModules.includes('Avkastningsanalyse') && (
            <div className="report-page">
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  7. AVKASTNINGSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Nåværende avkastning</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                         <tr className="border-b border-gray-200">
                           <td className="py-1 text-gray-600">Brutto årlig avkastning:</td>
                           <td className="py-1 text-right font-semibold">{formatPercent(yieldData.currentYield || basicData.grossYield || 0)}</td>
                         </tr>
                         <tr className="border-b border-gray-200">
                           <td className="py-1 text-gray-600">Netto årlig avkastning:</td>
                           <td className="py-1 text-right font-semibold">{formatPercent(yieldData.netYield || (basicData.grossYield * 0.7) || 0)}</td>
                         </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Månedlig netto:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(basicData.monthlyCashFlow || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Fremskrivning (10 år)</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Forventet eiendomsverdi:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(yieldData.projectedValue || (basicData.propertyValue * 1.3) || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Forventet månedlig leie:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(yieldData.projectedRent || (basicData.monthlyRent * 1.3) || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Annualisert avkastning:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(yieldData.annualizedReturn || 8.5)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Avkastningsvurdering</h4>
                   <p className="text-xs text-gray-700 leading-relaxed">
                     Avkastningsanalysen viser {(yieldData.currentYield || basicData.grossYield || 0) > 6 ? 'attraktiv' : 'moderat'} avkastning på {formatPercent(yieldData.currentYield || basicData.grossYield || 0)}. 
                     Med forventet årlig vekst på 3% er den annualiserte avkastningen på {formatPercent(yieldData.annualizedReturn || 8.5)} konkurransedyktig.
                   </p>
                </div>
              </section>

              <PageFooter pageNum={7} />
            </div>
          )}

          {/* Last page: Conclusion */}
          <div className="report-page">
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                KONKLUSJON OG ANBEFALINGER
              </h3>
              
              <div className="border border-gray-400 bg-gray-50 p-4 mb-4">
                <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Samlet vurdering</h4>
                 <p className="text-xs text-gray-800 leading-relaxed">
                   Basert på gjennomført analyse viser eiendommen {' '}
                   {(basicData.monthlyCashFlow || 0) >= 0 ? 'positiv' : 'negativ'} månedlig pengestrøm på {' '}
                   {formatCurrency(Math.abs(basicData.monthlyCashFlow || 0))}. 
                   {basicData.calculatorMode === 'investment' && ` Brutto avkastning på ${formatPercent(basicData.grossYield || 0)} 
                   indikerer ${(basicData.grossYield || 0) > 6 ? 'attraktiv' : 'moderat'} avkastning sammenlignet med markedssnitt.`}
                   {' '}Belåningsgraden på {displayBasicData.propertyValue > 0 ? formatPercent(((displayBasicData.loanAmount || 0) / displayBasicData.propertyValue) * 100) : '0.00%'} 
                   er {displayBasicData.propertyValue > 0 && ((displayBasicData.loanAmount || 0) / displayBasicData.propertyValue) * 100 < 80 ? 'innenfor' : 'over'} normale bankkrav.
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-green-400 bg-green-50 p-3">
                  <h5 className="font-bold text-green-800 mb-2 text-xs uppercase">Styrker ved investeringen:</h5>
                   <ul className="text-xs text-gray-800 space-y-1">
                     {(displayBasicData.loanToValue || (displayBasicData.propertyValue > 0 ? ((displayBasicData.loanAmount || 0) / displayBasicData.propertyValue) * 100 : 0)) < 80 && <li>• Konservativ belåningsgrad under 80%</li>}
                     {(basicData.monthlyCashFlow || 0) > 0 && <li>• Selvfinansierende investering (positiv pengestrøm)</li>}
                     {(basicData.grossYield || 0) > 6 && <li>• Avkastning over markedsgjennomsnitt</li>}
                     <li>• Omfattende analyse og dokumentasjon</li>
                     <li>• Transparent økonomisk fremstilling</li>
                   </ul>
                </div>

                <div className="border border-yellow-400 bg-yellow-50 p-3">
                  <h5 className="font-bold text-yellow-800 mb-2 text-xs uppercase">Risikomomenter å vurdere:</h5>
                  <ul className="text-xs text-gray-800 space-y-1">
                    {(displayBasicData.loanToValue || (displayBasicData.propertyValue > 0 ? ((displayBasicData.loanAmount || 0) / displayBasicData.propertyValue) * 100 : 0)) > 80 && <li>• Høy belåningsgrad - egenkapitalkrav</li>}
                    {(basicData.monthlyCashFlow || 0) < 0 && <li>• Månedlig tilskudd nødvendig</li>}
                    <li>• Rentefølsomhet ved endringer</li>
                    <li>• Markedsrisiko og konjunktursvingninger</li>
                    <li>• Leieledie og vedlikeholdskostnader</li>
                  </ul>
                </div>
              </div>

              <div className="border border-gray-400 bg-white p-4">
                <h5 className="font-bold text-gray-800 mb-2 text-xs uppercase">Bankens vurdering:</h5>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Investeringen {(displayBasicData.monthlyCashFlow || 0) >= 0 && (displayBasicData.propertyValue > 0 ? ((displayBasicData.loanAmount || 0) / displayBasicData.propertyValue) * 100 : 0) < 80 ? 
                  'fremstår som solid med god sikkerhet for utlån' : 
                  'krever nærmere vurdering av kredittrisiko'}.
                  Dokumentasjonen er omfattende og gir et godt grunnlag for lånevurdering.
                </p>
              </div>
            </section>

            <PageFooter pageNum={activatedModules.length + 2} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReport;
