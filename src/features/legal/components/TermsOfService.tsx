import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, CreditCard, Users, Gavel, AlertCircle, Mail } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Vilkår for bruk av Leily</h1>
        <p className="text-muted-foreground">Sist oppdatert: 1. januar 2025 | Versjon 1.0</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Aksept av vilkår
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Ved å opprette en konto og bruke Leily sine tjenester, aksepterer du disse vilkårene i sin helhet. 
            Hvis du ikke aksepterer vilkårene, må du ikke bruke tjenesten.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Definisjoner:</h4>
            <ul className="space-y-1 text-sm">
              <li><strong>"Tjenesten"</strong> - Leily-plattformen og alle relaterte funksjoner</li>
              <li><strong>"Bruker"</strong> - Enhver person som oppretter en konto hos Leily</li>
              <li><strong>"Credits"</strong> - Virtuell valuta brukt til å betale for tjenester</li>
              <li><strong>"Eiendom"</strong> - Bolig- eller næringseiendom registrert i systemet</li>
              <li><strong>"Leieforhold"</strong> - Utleieavtaler administrert gjennom Leily</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            2. Beskrivelse av tjenester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">2.1 Investeringskalkulator</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Beregning av lønnsomhet for eiendomsinvesteringer</li>
              <li>Integrering med Finn.no for eiendomsdata</li>
              <li>Markedsanalyse og risikoevaluering</li>
              <li>Beregning av avkastning og kontantstrøm</li>
              <li>Verdivurdering basert på offentlige data</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2.2 Porteføljeadministrasjon</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Administrering av eiendomsportefølje</li>
              <li>Oversikt over eiendommer og deres lønnsomhet</li>
              <li>Historikk og dokumentasjon</li>
              <li>Økonomisk rapportering</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2.3 Utleietjenester</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li><strong>Agent 007:</strong> AI-assistent for juridisk og praktisk utleieveiledning</li>
              <li><strong>Utleie Agent:</strong> Chat-basert assistent for daglig utleiehjelp</li>
              <li>Administrasjon av leieforhold og leiekontrakter</li>
              <li>Dokumenthåndtering for utleie</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2.4 Credits-system</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Kjøp av credits for å betale for tjenester</li>
              <li>Credits brukes til kalkulasjoner, AI-tjenester og utvidet funksjonalitet</li>
              <li>Credits har ingen utløpsdato</li>
              <li>Credits er ikke-refunderbare etter kjøp</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            3. AI-tjenester og databehandling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              3.1 AI-leverandører
            </h4>
            <p className="text-sm mb-3">
              Leily benytter kunstig intelligens (AI) fra <strong>OpenAI</strong>, levert gjennom <strong>Microsoft Azure</strong>. 
              Denne løsningen sikrer:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span><strong>GDPR-compliance:</strong> Full samsvar med EUs personvernforordning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span><strong>Europeisk datalagring:</strong> Data lagres på servere i EU/EØS-området</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span><strong>Norsk lovverk:</strong> Følger norsk personvernlovgivning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span><strong>Enterprise-sikkerhet:</strong> Microsoft Azure enterprise-sikkerhetsstandarder</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span><strong>Ingen treningsdata:</strong> Dine data brukes ikke til å trene AI-modeller</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3.2 Databehandling</h4>
            <p className="text-sm mb-2">Når du bruker AI-tjenester i Leily:</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Spørsmål og kontekst sendes til OpenAI via Microsoft Azure</li>
              <li>Data behandles i henhold til GDPR og norsk personvernlov</li>
              <li>Data lagres ikke permanent hos OpenAI</li>
              <li>Leily logger interaksjoner for kvalitetssikring og support</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              3.3 Ansvar for AI-generert innhold
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>AI-genererte råd og anbefalinger er veiledende</li>
              <li>Brukeren er ansvarlig for å verifisere AI-generert informasjon</li>
              <li>Leily er ikke ansvarlig for beslutninger tatt basert på AI-råd</li>
              <li>Ved juridiske eller økonomiske spørsmål anbefales konsultasjon med eksperter</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            4. Betalingsvilkår og Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">4.1 Credits-kjøp</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Credits kjøpes via sikre betalingsmetoder</li>
              <li>Priser er oppgitt i norske kroner (NOK) inkludert MVA</li>
              <li>Credits har ingen utløpsdato</li>
              <li>Credits er ikke-refunderbare etter kjøp (med unntak av lovpålagt angrerett)</li>
            </ul>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">4.2 Angrerett</h4>
            <p className="text-sm mb-2">I henhold til norsk forbrukerkjøpslov:</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>14 dagers angrerett fra kjøpstidspunkt</li>
              <li>Angreretten gjelder ikke dersom credits er brukt</li>
              <li>Kontakt kontakt@leily.no for å benytte angreretten</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4.3 Prisendringer</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Leily forbeholder seg retten til å endre priser</li>
              <li>Eksisterende kunder varsles minimum 30 dager før prisendring</li>
              <li>Prisendringer gjelder ikke allerede kjøpte credits</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            5. Ansvarsbegrensning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">5.1 "Som det er"-basis</h4>
            <p className="text-sm mb-2">Tjenesten leveres "som det er" uten garantier for:</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Nøyaktighet av beregninger og vurderinger</li>
              <li>Uavbrutt tilgang til tjenesten</li>
              <li>Feilfri funksjonalitet</li>
              <li>Egnethet for et bestemt formål</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">5.2 Leily er ikke ansvarlig for:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Økonomiske tap som følge av bruk av tjenesten</li>
              <li>Investeringsbeslutninger basert på kalkulasjoner</li>
              <li>Tap av data eller innhold</li>
              <li>Konsekvenser av AI-genererte råd</li>
              <li>Nedetid eller tekniske problemer</li>
              <li>Tredjepartstjenester og deres nøyaktighet</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">5.3 Ditt ansvar:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Verifisere informasjon før økonomiske beslutninger</li>
              <li>Konsultere kvalifiserte rådgivere (meglere, advokater, regnskapsførere)</li>
              <li>Sikre at din bruk av tjenesten er lovlig</li>
              <li>Ta backup av dine data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            6. Tredjepartstjenester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Leily integrerer med flere eksterne tjenester:</p>
          
          <div className="grid gap-3">
            <div className="border border-border p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">Finn.no</h4>
              <p className="text-xs text-muted-foreground">Eiendomsdata og markedsinformasjon</p>
            </div>
            <div className="border border-border p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">OpenAI via Microsoft Azure</h4>
              <p className="text-xs text-muted-foreground">AI-tjenester (GDPR-compliant, EU/EØS datalagring)</p>
            </div>
            <div className="border border-border p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">Mapbox</h4>
              <p className="text-xs text-muted-foreground">Karttjenester og geografisk data</p>
            </div>
            <div className="border border-border p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">Kartverket</h4>
              <p className="text-xs text-muted-foreground">Offentlige eiendomsdata</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Leily er ikke ansvarlig for feil, nedetid eller endringer hos tredjeparter. 
            Brukeren må selv verifisere kritisk informasjon.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            7. Juridisk jurisdiksjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">7.1 Gjeldende lov</h4>
            <p className="text-sm">Disse vilkårene er underlagt norsk lov.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">7.2 Tvisteløsning</h4>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Tvister søkes først løst gjennom dialog med Leily</li>
              <li>Ved uenighet kan saken bringes inn for Forbrukerrådet</li>
              <li>Norske domstoler har jurisdiksjon (Oslo tingrett)</li>
            </ul>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">7.3 Forbrukerrettigheter</h4>
            <p className="text-sm">
              Disse vilkårene begrenser ikke dine rettigheter under forbrukerkjøpsloven, 
              personopplysningsloven eller annen tvingend norsk forbrukervernlovgivning.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Kontaktinformasjon
          </CardTitle>
          <CardDescription>
            For spørsmål om vilkår og tjenesten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold">Leily AS</p>
            <p className="text-sm text-muted-foreground">Organisasjonsnummer: [Settes inn]</p>
          </div>
          
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="text-muted-foreground">Generell henvendelse:</span>
              <a href="mailto:kontakt@leily.no" className="text-primary hover:underline">kontakt@leily.no</a>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="text-muted-foreground">Personvern:</span>
              <a href="mailto:personvern@leily.no" className="text-primary hover:underline">personvern@leily.no</a>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic mt-4">
            Ved å bruke Leily bekrefter du at du har lest, forstått og akseptert disse vilkårene.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
