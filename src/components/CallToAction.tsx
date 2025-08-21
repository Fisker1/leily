import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Download, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from 'jspdf';

const CallToAction = () => {
  const { translations } = useLanguage();
  
  const handleDownloadExampleReport = () => {
    const doc = new jsPDF();
    
    // Add content to the PDF
    doc.setFontSize(20);
    doc.text('Eiendomsinvestering - Eksempel Rapport', 20, 30);
    
    doc.setFontSize(14);
    doc.text('Eiendom: Storgata 15, 0155 Oslo', 20, 50);
    
    doc.setFontSize(12);
    doc.text('Kjøpesum: 4 500 000 kr', 20, 70);
    doc.text('Månedlig leieinntekt: 25 000 kr', 20, 80);
    doc.text('Årlig leieinntekt: 300 000 kr', 20, 90);
    
    doc.text('Kalkulerte nøkkeltall:', 20, 110);
    doc.text('• Brutto yield: 6.7%', 30, 125);
    doc.text('• Netto yield: 4.8%', 30, 135);
    doc.text('• Månedlig cashflow: +2 200 kr', 30, 145);
    doc.text('• Årlig cashflow: +26 400 kr', 30, 155);
    
    doc.text('Månedlige utgifter:', 20, 175);
    doc.text('• Strøm: 800 kr', 30, 190);
    doc.text('• Nettleie: 400 kr', 30, 200);
    doc.text('• Fellesutgifter: 3 500 kr', 30, 210);
    doc.text('• Kommunale avgifter: 1 200 kr', 30, 220);
    doc.text('• Forsikring: 600 kr', 30, 230);
    doc.text('• Totalt: 6 500 kr', 30, 240);
    
    doc.text('Lånekalkulator (3 600 000 kr lån):', 20, 260);
    doc.text('• Rente: 4.5%', 30, 275);
    doc.text('• Nedbetalingstid: 25 år', 30, 285);
    doc.text('• Månedlig betaling: 20 045 kr', 30, 295);
    
    // Save the PDF
    doc.save('eksempel-eiendomsrapport.pdf');
  };
  
  return (
    <section className="py-20 lg:py-32 bg-gradient-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 lg:p-12 shadow-large border-0 bg-card-elevated">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {translations.cta.title}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {translations.cta.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-medium" asChild>
                <Link to="/auth">
                  <Calculator className="mr-2 h-5 w-5" />
                  {translations.cta.button}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="shadow-soft"
                onClick={handleDownloadExampleReport}
              >
                <Download className="mr-2 h-5 w-5" />
                Last ned eksempel rapport
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Ikke behov for kredittkort
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Øyeblikkelige beregninger
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Profesjonelle PDF rapporter
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;