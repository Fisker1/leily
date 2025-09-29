import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreditsPurchase from '@/components/CreditsPurchase';

const CreditsPurchasePage = () => {
  const handlePurchase = (tierId: string, credits: number, price: number) => {
    // TODO: Implement payment flow
    console.log('Purchase initiated:', { tierId, credits, price });
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Tilbake til priser
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Kjøp Pro Credits</h1>
              <p className="text-sm text-muted-foreground">Velg den pakken som passer best for deg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credits Purchase */}
      <div className="container mx-auto px-4 py-8">
        <CreditsPurchase onPurchase={handlePurchase} />
        
        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Ofte stilte spørsmål om Credits
          </h2>
          <div className="space-y-6">
            <div className="bg-background border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">
                Hvordan fungerer credits-systemet?
              </h3>
              <p className="text-muted-foreground">
                Hver AI-interaksjon (bankrapport, eiendomsagent-samtale) koster 1 credit. 
                Credits utløper aldri og kan brukes når du vil. Større pakker gir bedre verdi per credit.
              </p>
            </div>
            
            <div className="bg-background border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">
                Kan jeg oppgradere senere?
              </h3>
              <p className="text-muted-foreground">
                Ja, du kan kjøpe flere credits når som helst. Credits legges til din eksisterende saldo 
                og utløper aldri.
              </p>
            </div>
            
            <div className="bg-background border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">
                Hva om jeg ikke er fornøyd?
              </h3>
              <p className="text-muted-foreground">
                Vi tilbyr 30 dagers pengene-tilbake-garanti på alle credit-kjøp. 
                Kontakt oss hvis du ikke er fornøyd med tjenesten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsPurchasePage;