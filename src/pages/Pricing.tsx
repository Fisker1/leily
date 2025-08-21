import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Pricing = () => {
  const { translations, language } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const features = {
    free: [
      "Grunnleggende boliganalyse",
      "Enkel lønnsomhetsberegning", 
      "Gratis støtte via community"
    ],
    pro: [
      "Ubegrensede avanserte kalkyler",
      "Komplett dashboard og analyser",
      "Avanserte bankrapporter", 
      "PDF-eksport av alle rapporter",
      "Prioritert kundeservice"
    ],
    rental: [
      "Inkluderer alle Pro-funksjoner",
      "Komplett leieforholdshåndtering",
      "Leietakersporing og dokumenter",
      "Leieavtaler og depositum",
      "Overleveringsprotokoller",
      "Husleieoppfølging"
    ]
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleUpgradeToPro = () => {
    // TODO: Implement Vipps payment integration
    console.log('Upgrade to Pro clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Link 
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {translations.common.backToHome}
          </Link>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {translations.pricing.choosePlan}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {translations.pricing.planDescription}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="relative shadow-medium hover:shadow-large transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                Gratis
              </CardTitle>
              <CardDescription className="text-lg">
                Kom i gang med grunnleggende analyser
              </CardDescription>
              <div className="py-4">
                <span className="text-4xl font-bold text-foreground">0 kr</span>
                <span className="text-muted-foreground">/måned</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                <Button 
                  onClick={handleGetStarted}
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  Kom i gang
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan - Kalkyler og Dashboard */}
          <Card className="relative shadow-large border-primary/20 hover:border-primary/40 transition-all">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="px-4 py-1 bg-primary text-primary-foreground">
                <Star className="w-4 h-4 mr-1" />
                Mest populær
              </Badge>
            </div>
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">
                Pro
              </CardTitle>
              <CardDescription className="text-lg">
                Kalkyler og dashboard
              </CardDescription>
              <div className="py-4">
                <span className="text-4xl font-bold text-foreground">49 kr</span>
                <span className="text-muted-foreground">/måned</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.pro.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                {profile?.subscription_tier === 'pro' ? (
                  <Button className="w-full" size="lg" disabled>
                    Nåværende plan
                  </Button>
                ) : (
                  <Button 
                    onClick={handleUpgradeToPro}
                    className="w-full" 
                    size="lg"
                  >
                    Oppgrader til Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rental Management Plan */}
          <Card className="relative border-orange-border border-2 bg-orange-muted/10 shadow-large hover:shadow-large transition-all">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="px-4 py-1 bg-orange text-orange-foreground">
                Populær for utleiere
              </Badge>
            </div>
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-orange">
                Utleieforvaltning
              </CardTitle>
              <CardDescription className="text-lg">
                Per leieforhold
              </CardDescription>
              <div className="py-4">
                <span className="text-4xl font-bold text-foreground">99 kr</span>
                <span className="text-muted-foreground">/leieforhold</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.rental.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-orange flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-orange hover:bg-orange/90 text-orange-foreground"
                  size="lg"
                >
                  Legg til leieforhold
                </Button>
              </div>

              <div className="bg-orange-muted/20 border border-orange-border/30 p-3 rounded-lg mt-4">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>Inkluderer automatisk Pro-abonnement</strong><br />
                  Betales kun når du legger til et nytt leieforhold
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            {translations.pricing.faq}
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {translations.pricing.faqQ1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {translations.pricing.faqA1}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {translations.pricing.faqQ2}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {translations.pricing.faqA2}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {translations.pricing.faqQ3}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {translations.pricing.faqA3}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;