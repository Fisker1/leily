import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";

const PricingOverview = () => {
  return (
    <section className="py-16 bg-gradient-soft">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Velg din plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start gratis og oppgrader når du trenger mer avanserte funksjoner.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="shadow-medium hover:shadow-large transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Gratis</CardTitle>
              <div className="py-4">
                <span className="text-3xl font-bold text-foreground">0 kr</span>
                <span className="text-muted-foreground">/måned</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">Grunnleggende boliganalyse</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">Enkel lønnsomhetsberegning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">Community-støtte</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth">Kom i gang gratis</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="shadow-large border-primary/20 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="px-3 py-1 bg-primary text-primary-foreground">
                <Star className="w-3 h-3 mr-1" />
                AI-drevet
              </Badge>
            </div>
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-primary">Pro Credits</CardTitle>
              <div className="py-4">
                <span className="text-2xl font-bold text-foreground">100 kr</span>
                <span className="text-muted-foreground text-sm"> = 10 credits</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">AI-genererte bankrapporter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">Avanserte kalkyler og analyser</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">PDF-eksport av rapporter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">Credits utløper aldri</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/pricing">Kjøp Credits</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Rental Plan */}
          <Card className="shadow-medium hover:shadow-large transition-shadow border-orange-border border-2 bg-orange-muted/10">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-orange">Utleieforvaltning</CardTitle>
              <div className="py-4">
                <span className="text-3xl font-bold text-foreground">99 kr</span>
                <span className="text-muted-foreground">/måned</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange" />
                  <span className="text-sm">Uavhengig av Pro Credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange" />
                  <span className="text-sm">Leietakersporing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange" />
                  <span className="text-sm">Leieavtaler og dokumenter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange" />
                  <span className="text-sm">Statisk løsning</span>
                </li>
              </ul>
              <Button className="w-full bg-orange hover:bg-orange/90 text-orange-foreground" asChild>
                <Link to="/pricing">Se alle planer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button variant="link" asChild>
            <Link to="/pricing" className="text-primary hover:text-primary/80">
              Se detaljert prissammenligning →
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingOverview;