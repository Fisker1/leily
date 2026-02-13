import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Cookie, Shield, BarChart3 } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const minimal = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem("cookie-consent", JSON.stringify(minimal));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border shadow-lg">
        {!showDetails ? (
          <>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Vi bruker informasjonskapsler</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowBanner(false)}
                  className="h-auto p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-muted-foreground">
                Vi bruker informasjonskapsler for å forbedre din opplevelse på nettstedet vårt. 
                Nødvendige cookies er påkrevd for grunnleggende funksjonalitet, mens andre hjelper 
                oss med å analysere bruken og forbedre tjenestene våre.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
                Godta alle
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDetails(true)}
                className="w-full sm:w-auto"
              >
                Tilpass innstillinger
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleRejectAll}
                className="w-full sm:w-auto"
              >
                Avvis ikke-nødvendige
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">Cookie-innstillinger</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="h-auto p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Nødvendige cookies</h3>
                      <Badge variant="secondary">Påkrevd</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Disse cookies er nødvendige for at nettstedet skal fungere og kan ikke deaktiveres.
                    </p>
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Analyse-cookies</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hjelper oss å forstå hvordan besøkende bruker nettstedet gjennom anonyme statistikker.
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, analytics: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Cookie className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Markedsføring-cookies</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Brukes til å vise deg relevante annonser og markedsføringsinnhold.
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, marketing: checked }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={handleAcceptSelected} className="flex-1">
                Lagre innstillinger
              </Button>
              <Button variant="outline" onClick={() => setShowDetails(false)} className="flex-1">
                Avbryt
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};

export default CookieConsent;