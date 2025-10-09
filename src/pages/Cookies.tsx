import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Cookie, Shield, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Cookies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("cookie-consent");
    return saved ? JSON.parse(saved) : {
      necessary: true,
      analytics: false,
      marketing: false,
    };
  });

  const handleSave = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    toast({
      title: "Innstillinger lagret",
      description: "Dine cookie-preferanser har blitt oppdatert.",
    });
    
    // Reload to apply changes
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cookie-policy</h1>
            <p className="text-muted-foreground">
              Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hva er informasjonskapsler?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                Informasjonskapsler (cookies) er små tekstfiler som lagres på enheten din når du besøker 
                et nettsted. De brukes til å huske dine preferanser, forbedre brukeropplevelsen og gi oss 
                viktig innsikt i hvordan tjenesten vår brukes.
              </p>
              <p>
                I samsvar med GDPR og ePrivacy-direktivet krever vi ditt samtykke før vi lagrer 
                ikke-nødvendige cookies på enheten din.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administrer dine preferanser</CardTitle>
              <CardDescription>
                Velg hvilke typer cookies du vil tillate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Nødvendige cookies</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Påkrevd</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Disse cookies er nødvendige for at nettstedet skal fungere og kan ikke deaktiveres. 
                      De brukes til autentisering, sikkerhet og grunnleggende funksjonalitet.
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
                      Hjelper oss å forstå hvordan besøkende bruker nettstedet gjennom anonyme statistikker 
                      fra Vercel Analytics. Ingen personlig identifiserbar informasjon samles inn.
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
                      Brukes til å vise deg relevante annonser og markedsføringsinnhold basert på 
                      dine interesser. For øyeblikket bruker vi ikke markedsføring-cookies.
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

              <Button onClick={handleSave} className="w-full">
                Lagre innstillinger
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies vi bruker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Nødvendige cookies</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>cookie-consent</strong>: Lagrer dine cookie-preferanser (Varighet: 1 år)</li>
                  <li><strong>sb-*</strong>: Supabase autentisering og sesjonshåndtering (Varighet: Sesjon)</li>
                  <li><strong>leily-theme</strong>: Lagrer tema-preferanse (lys/mørk) (Varighet: Permanent)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Analyse-cookies (valgfritt)</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Vercel Analytics</strong>: Anonyme brukerstatistikker og ytelsesmålinger (Varighet: Varierer)</li>
                  <li><strong>Vercel Speed Insights</strong>: Anonyme ytelsesmålinger (Varighet: Varierer)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dine rettigheter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                Under GDPR har du følgende rettigheter når det gjelder cookies og persondata:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Rett til å trekke tilbake samtykke når som helst</li>
                <li>Rett til tilgang til dine data</li>
                <li>Rett til sletting av dine data</li>
                <li>Rett til å begrense behandling</li>
                <li>Rett til dataportabilitet</li>
              </ul>
              <p className="mt-4">
                For å utøve dine rettigheter, besøk <a href="/min-side" className="text-primary hover:underline">Min side</a> eller 
                kontakt oss på <a href="mailto:privacy@leily.no" className="text-primary hover:underline">privacy@leily.no</a>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tredjepartsleverandører</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>Vi bruker følgende tredjepartsleverandører som kan lagre cookies:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Supabase</strong> (Dublin, Irland): Database og autentisering. 
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                    Personvernserklæring
                  </a>
                </li>
                <li>
                  <strong>Vercel</strong> (San Francisco, USA): Hosting og analyse. GDPR-kompatibel DPA signert.
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                    Personvernserklæring
                  </a>
                </li>
                <li>
                  <strong>OpenAI via Microsoft Azure</strong> (EU): AI-tjenester. Data lagres i Europa.
                  <a href="https://privacy.microsoft.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                    Personvernserklæring
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hvordan slette cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>Du kan når som helst slette cookies gjennom nettleserens innstillinger:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Chrome</strong>: Innstillinger → Personvern og sikkerhet → Cookies og andre nettstedsdata</li>
                <li><strong>Firefox</strong>: Innstillinger → Personvern og sikkerhet → Cookies og nettstedsdata</li>
                <li><strong>Safari</strong>: Innstillinger → Personvern → Administrer nettstedsdata</li>
                <li><strong>Edge</strong>: Innstillinger → Personvern, søk og tjenester → Cookies og nettstedsdata</li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                Vær oppmerksom på at sletting av nødvendige cookies kan påvirke funksjonaliteten til nettstedet.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Hvis du har spørsmål om vår bruk av cookies, kan du kontakte oss:</p>
              <div className="mt-4 space-y-1 text-muted-foreground">
                <p><strong>Leily AS</strong></p>
                <p>E-post: <a href="mailto:privacy@leily.no" className="text-primary hover:underline">privacy@leily.no</a></p>
                <p>Nettside: <a href="https://leily.no" className="text-primary hover:underline">https://leily.no</a></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
