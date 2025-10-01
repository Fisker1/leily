import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Star, Calculator, Bot, Building2, CreditCard, Users, FileText, ChartBar } from "lucide-react";
import { Link } from "react-router-dom";
const PricingOverview = () => {
  return <section id="pricing" className="py-16 bg-gradient-soft">
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
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Gratis</CardTitle>
              <div className="py-4">
                <span className="text-3xl font-bold text-foreground">0 kr</span>
                <span className="text-muted-foreground">/måned</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">Grunnleggende boliganalyse</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">Enkel lønnsomhetsberegning</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">Community-støtte</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
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
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl text-primary">Pro Credits</CardTitle>
              <div className="py-4 px-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Credits</span>
                  <span className="text-sm font-bold text-foreground">80/100</span>
                </div>
                <Progress value={80} className="h-2" />
                
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ChartBar className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">AI-genererte bankrapporter</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">Eiendomsagent-rådgivning</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">Avanserte kalkyler</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/credits">Kjøp Credits</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Rental Plan */}
          <Card className="shadow-medium hover:shadow-large transition-shadow border-orange-border border-2 bg-orange-muted/10">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-orange" />
              </div>
              <CardTitle className="text-xl text-orange">Utleieforvaltning</CardTitle>
              <div className="py-4">
                <span className="text-3xl font-bold text-foreground">99 kr</span>
                <span className="text-muted-foreground">/måned</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange/10 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-3 h-3 text-orange" />
                  </div>
                  <span className="text-sm">Uavhengig av Pro Credits</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3 h-3 text-orange" />
                  </div>
                  <span className="text-sm">Leietakersporing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3 h-3 text-orange" />
                  </div>
                  <span className="text-sm">Leieavtaler og dokumenter</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-orange" />
                  </div>
                  <span className="text-sm">Statisk løsning</span>
                </li>
              </ul>
              <Button className="w-full bg-orange hover:bg-orange/90 text-orange-foreground" disabled>
                Kommer snart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};
export default PricingOverview;