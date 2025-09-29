import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Check, Star, Zap, Crown } from 'lucide-react';

interface CreditTier {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
  bestValue?: boolean;
  icon: React.ReactNode;
  features: string[];
}

const creditTiers: CreditTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    price: 50,
    pricePerCredit: 10,
    icon: <Star className="w-5 h-5" />,
    features: ['Perfekt for å teste AI-funksjoner', 'Grunnleggende bankrapporter', '5 AI-samtaler med eiendomsagent']
  },
  {
    id: 'standard',
    name: 'Standard',
    credits: 12,
    price: 100,
    pricePerCredit: 8.33,
    popular: true,
    icon: <Zap className="w-5 h-5" />,
    features: ['20% mer credits per krone', 'Avanserte bankrapporter', '12 AI-samtaler med eiendomsagent', 'PDF-eksport']
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 30,
    price: 200,
    pricePerCredit: 6.67,
    icon: <Crown className="w-5 h-5" />,
    features: ['33% mer credits per krone', 'Ubegrensede bankrapporter', '30 AI-samtaler', 'Prioritert support']
  },
  {
    id: 'business',
    name: 'Business',
    credits: 100,
    price: 500,
    pricePerCredit: 5,
    bestValue: true,
    icon: <Crown className="w-5 h-5" />,
    features: ['50% mer credits per krone', 'Ubegrensede funksjoner', '100 AI-samtaler', 'Dedikert support', 'Beta-tilgang til nye funksjoner']
  }
];

interface CreditsPurchaseProps {
  onPurchase?: (tierId: string, credits: number, price: number) => void;
}

const CreditsPurchase: React.FC<CreditsPurchaseProps> = ({ onPurchase }) => {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string>('standard');

  const handlePurchase = (tier: CreditTier) => {
    setSelectedTier(tier.id);
    
    // TODO: Implement payment integration (Stripe/Vipps)
    toast({
      title: "Kjøp initialisert",
      description: `Du valgte ${tier.name} - ${tier.credits} credits for ${tier.price} kr`,
    });

    if (onPurchase) {
      onPurchase(tier.id, tier.credits, tier.price);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Velg din credit-pakke
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Kjøp credits for å bruke AI-funksjoner. Større pakker gir bedre verdi per credit.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {creditTiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative h-full flex flex-col transition-all duration-200 cursor-pointer hover:shadow-lg ${
              tier.popular 
                ? 'border-2 border-primary shadow-lg transform scale-[1.02]' 
                : tier.bestValue
                ? 'border-2 border-orange-500 shadow-lg transform scale-[1.02]'
                : 'hover:border-primary/30 hover:transform hover:scale-[1.01]'
            }`}
            onClick={() => setSelectedTier(tier.id)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="px-3 py-1 bg-primary text-primary-foreground">
                  Mest populær
                </Badge>
              </div>
            )}
            
            {tier.bestValue && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="px-3 py-1 bg-orange-500 text-white">
                  Beste verdi
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                tier.popular 
                  ? 'bg-primary text-primary-foreground'
                  : tier.bestValue
                  ? 'bg-orange-500 text-white'
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {tier.icon}
              </div>
              
              <CardTitle className={`text-xl ${
                tier.popular 
                  ? 'text-primary' 
                  : tier.bestValue 
                  ? 'text-orange-500' 
                  : 'text-foreground'
              }`}>
                {tier.name}
              </CardTitle>
              
              <div className="space-y-1">
                <div className="text-3xl font-bold text-foreground">
                  {tier.price} kr
                </div>
                <div className="text-lg text-muted-foreground">
                  {tier.credits} credits
                </div>
                <div className={`text-sm font-medium ${
                  tier.pricePerCredit <= 6 ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {tier.pricePerCredit.toFixed(2)} kr/credit
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
              <ul className="space-y-2 flex-1">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={selectedTier === tier.id ? "default" : "outline"}
                className={`w-full mt-auto ${
                  selectedTier === tier.id
                    ? tier.popular
                      ? 'bg-primary hover:bg-primary/90'
                      : tier.bestValue
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-primary hover:bg-primary/90'
                    : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(tier);
                }}
                size="lg"
              >
                {selectedTier === tier.id ? 'Valgt' : 'Velg pakke'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Card className="inline-block p-6 bg-muted/20">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>Sikkert SSL-kryptert betaling</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>30 dagers pengene-tilbake-garanti</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreditsPurchase;