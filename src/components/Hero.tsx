import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, TrendingUp, FileText, PieChart, Play, Users, Target, Building } from "lucide-react";
import { Link } from "react-router-dom";
import videoPlaceholder from "@/assets/video-placeholder.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import ProcessWalkthrough from "@/components/ProcessWalkthrough";

const Hero = () => {
  const { translations } = useLanguage();
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Din komplette eiendomsportal
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Enkelt å eie, enkelt å leie. Forenkle forvaltning og investering av eiendom med profesjonelle verktøy for kalkulasjoner, 
              utleieadministrasjon og markedsanalyse.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-medium" asChild>
                <Link to="/auth">
                  Kom i gang gratis
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="shadow-soft"
                onClick={() => setIsWalkthroughOpen(true)}
              >
                Se hvordan det virker
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Video Introduction Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Se hvordan Leily fungerer
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En kort introduksjon til hvordan du kan bruke vår plattform for å optimalisere dine eiendomsinvesteringer.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="relative overflow-hidden shadow-large">
              <div className="relative">
                <img 
                  src={videoPlaceholder} 
                  alt="Introduksjonsvideo til Leily plattformen" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-6 shadow-large">
                    <Play className="h-12 w-12 text-primary ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm">
                  Video kommer snart
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-gradient-soft">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Vår visjon
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Vi ønsker å gjøre eiendomsinvestering tilgjengelig for alle ved å tilby profesjonelle verktøy 
              som tidligere kun var tilgjengelige for store aktører. Med Leily kan du ta informerte beslutninger 
              basert på solid data og analyser.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary-soft rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Tilgjengelighet</h3>
                <p className="text-sm text-muted-foreground">
                  Profesjonelle verktøy for alle
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary-soft rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Presisjon</h3>
                <p className="text-sm text-muted-foreground">
                  Nøyaktige beregninger og analyser
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary-soft rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Vekst</h3>
                <p className="text-sm text-muted-foreground">
                  Hjelper deg å bygge din eiendomsportefølje
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProcessWalkthrough 
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />
    </>
  );
};

export default Hero;