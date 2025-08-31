import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Database, Mail, Phone, MapPin } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Personvernpolicy</h1>
        <p className="text-muted-foreground">
          Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              1. Behandlingsansvarlig
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Leily AS er behandlingsansvarlig for behandlingen av personopplysninger i forbindelse 
              med eiendomsanalysetjenestene våre.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Kontaktinformasjon:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>personvern@leily.no</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+47 123 45 678</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Leily AS, Postboks 123, 0123 Oslo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              2. Hvilke personopplysninger behandler vi?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Kontaktopplysninger:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Navn og e-postadresse</li>
                <li>Telefonnummer (valgfritt)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Eiendomsopplysninger:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Eiendomsadresse og størrelse</li>
                <li>Kjøpspris og vurderingsverdi</li>
                <li>Låneopplysninger og rente</li>
                <li>Leieinntekter og driftskostnader</li>
                <li>Bilder og dokumenter knyttet til eiendommen</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Leietakeropplysninger:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Navn og kontaktinformasjon til leietakere</li>
                <li>Fødselsnummer/organisasjonsnummer</li>
                <li>Leiekontrakter og depositum</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Tekniske opplysninger:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>IP-adresse og brukerlogg</li>
                <li>Informasjonskapsler (cookies)</li>
                <li>Enhetsinformasjon og nettleserdata</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              3. Behandlingsgrunnlag og formål
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Avtale (GDPR art. 6(1)(b)):</h4>
              <p className="text-sm">
                Behandling av personopplysninger som er nødvendig for å oppfylle våre tjenesteavtaler,
                inkludert eiendomsanalyse, porteføljeadministrasjon og utleietjenester.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Rettslig forpliktelse (GDPR art. 6(1)(c)):</h4>
              <p className="text-sm">
                Oppbevaring og rapportering i henhold til regnskapsloven, skatteregler og 
                andre juridiske krav knyttet til eiendomsforvaltning.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Berettiget interesse (GDPR art. 6(1)(f)):</h4>
              <p className="text-sm">
                Forbedring av tjenester, sikkerhet, kundesupport og markedsføring til eksisterende kunder.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Dine rettigheter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">Du har følgende rettigheter under GDPR:</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Innsyn og portabilitet</h4>
                <p className="text-xs text-muted-foreground">
                  Få kopi av dine personopplysninger og overføre dem til andre tjenester.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Retting og sletting</h4>
                <p className="text-xs text-muted-foreground">
                  Korrigere feil informasjon eller få slettet dine personopplysninger.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Begrensning</h4>
                <p className="text-xs text-muted-foreground">
                  Begrense behandling av dine personopplysninger i visse situasjoner.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Innsigelse</h4>
                <p className="text-xs text-muted-foreground">
                  Protestere mot behandling basert på berettiget interesse eller markedsføring.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Datalagring og sikkerhet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Lagringstid:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Kontoinformasjon: Så lenge kontoen er aktiv + 3 år</li>
                <li>Eiendomsdata: I henhold til regnskapsloven (5 år etter transaksjoner)</li>
                <li>Leiekontrakter: 10 år etter kontraktens utløp</li>
                <li>Tekniske logger: Maksimalt 12 måneder</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Sikkerhetstiltak:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Kryptering av data i hvile og under overføring (AES-256)</li>
                <li>Regelmessige sikkerhetskopier og disaster recovery</li>
                <li>Tilgangskontroll og autentisering</li>
                <li>Regelmessig sikkerhetstesting og oppdateringer</li>
                <li>Opplæring av ansatte i personvern og datasikkerhet</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Dataoverføring:</h4>
              <p className="text-sm">
                Dine personopplysninger lagres og behandles innenfor EU/EØS-området. 
                Vi overfører ikke personopplysninger til tredjeland uten tilstrekkelig beskyttelse.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Informasjonskapsler (Cookies)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Nødvendige cookies:</h4>
              <p className="text-sm mb-2">
                Brukes for grunnleggende funksjonalitet som innlogging og sikkerhet.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Analyse-cookies:</h4>
              <p className="text-sm mb-2">
                Hjelper oss å forstå hvordan tjenesten brukes for å forbedre brukeropplevelsen.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Du kan administrere cookie-innstillinger gjennom nettleserens innstillinger eller 
              ved å klikke på cookie-banneret på nettstedet.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Kontakt og klager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Har du spørsmål om personvern eller ønsker å utøve dine rettigheter, 
              kan du kontakte oss på personvern@leily.no.
            </p>
            <p className="text-sm">
              Du har også rett til å klage til Datatilsynet hvis du mener vi 
              ikke behandler personopplysningene dine i henhold til gjeldende regelverk.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Datatilsynet:</h4>
              <div className="space-y-1 text-sm">
                <p>Postboks 458 Sentrum, 0105 Oslo</p>
                <p>Telefon: 22 39 69 00</p>
                <p>E-post: postkasse@datatilsynet.no</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;