# Fremtidige Funksjoner

Dette dokumentet inneholder planlagte funksjoner som skal implementeres i fremtiden.

## Leiekort (Rental Card)

### Oversikt
Et "leiekort" skal legges til på "Min side" som viser brukerens leie-ID og vervekode.

### Vervesystem (Referral System)

#### Vervekode
- Hver bruker får en unik vervekode
- Vervekoden kan deles med andre som skal opprette en konto

#### Belønningsstruktur

**Når en vervet person kjøper credits:**
- Du får 50% av de kjøpte creditsene som bonus til din konto

**Når en vervet person oppretter et leieforhold:**
- Du får 1 måned gratis på ditt første aktive leieforhold
- Hvis du har 3 aktive utleieavtaler, får du 1 måned gratis totalt (ikke per avtale)

#### Fleksibel bruk av gratis måneder
- Brukeren kan velge hvilken leilighet den gratis måneden skal gjelde for
- Brukeren kan velge når på året den gratis måneden skal "invoces"
- Gratis måneder akkumuleres: Hvis du har vervet 5 personer og ikke brukt kodene, får du 5 måneder gratis
- Disse 5 månedene kan fordeles fritt mellom dine leiligheter og tidspunkter

### Tekniske komponenter som må implementeres
- Leiekort UI-komponent på Min side
- Unik vervekode-generering for hver bruker
- System for å spore vervede brukere
- Kredittbonus-logikk (50% av vervet brukers kjøp)
- Gratis måneder-akkumulering og allokering
- UI for å velge hvilken leilighet og måned som skal være gratis
- Database-tabeller for å spore:
  - Vervekoder per bruker
  - Vervede brukere og deres status
  - Akkumulerte gratis måneder
  - Historikk over brukte gratis måneder

### Database-skjema (forslag)
```sql
-- Vervekoder
CREATE TABLE referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Vervede brukere
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id),
  referred_user_id uuid REFERENCES auth.users(id),
  referral_code text,
  credits_bonus_given boolean DEFAULT false,
  free_month_given boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Gratis måneder
CREATE TABLE free_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  earned_from_referral_id uuid REFERENCES referrals(id),
  lease_id uuid REFERENCES lease_agreements(id) NULL,
  month_applied date NULL,
  is_used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  used_at timestamp with time zone NULL
);
```

### UI/UX komponenter
- Leiekort-widget på Min side
- Vervekode-display med "kopier"-funksjonalitet
- Oversikt over vervede brukere
- Oversikt over akkumulerte gratis måneder
- Interface for å velge og aktivere gratis måneder på spesifikke leieforhold

## Lånekalkulator

### Oversikt
En lånekalkulator som hjelper brukeren med å holde oversikt over egenkapital, bundne midler i eiendommer, og lånekapasitet.

### Funksjonalitet

#### Egenkapitaladministrasjon
- Bruker legger inn sin totale egenkapital én gang
- Systemet beregner automatisk tilgjengelig kapital basert på: `boligverdi - lån = tilgjengelig egenkapital`
- Oversikt over hvor mye kapital som er "bundet opp" i hver enkelt eiendom

#### Lånekalkulatorverktøy
- Slider-basert interface (lignende bankenes lånekalkulatorer)
- Lett anvendelig for å kalkulere ulike lånescenarier
- Mulighet til å fordele og "binde opp" kapital i forskjellige boliger
- Oversikt over:
  - Kapital bundet i bolig 1, 2, 3, osv.
  - Tilgjengelig egenkapital
  - Refinansieringsmuligheter

#### Automatisk verdioppdatering
- Etterhvert som eiendommer stiger i verdi oppdateres tilgjengelig egenkapital automatisk
- Dynamisk beregning av lånekapasitet

#### Integrasjon med eiendomskalkulator
- Status vises på eiendomskalkulator-siden
- Viser hvor mye bruker kan låne
- Automatisk utfylling av data:
  - Rente
  - Egenkapital
  - Lånevilkår
- Bruker trenger kun å hente eiendomsinformasjon (resten er forhåndsutfylt)

#### Validering og kontroll
- Dersom bruker overskrider tilgjengelig egenkapital må hen legge inn ekstra begrunnelse
- Spesifisere hvor de ekstra pengene kommer fra (arv, gave, salg av andre aktiva, osv.)

### Tekniske komponenter
- Egenkapital-database for lagring av brukerens økonomiske situasjon
- Beregningsmotor for lånekapasitet
- Integrasjon med eksisterende eiendomsdata
- Auto-fill funksjonalitet for kalkulator-siden
- Validerings-logikk for kapitaloverskridelse

## Utgiftsestimering

### Oversikt
Automatisk estimering av utgifter som ikke er oppgitt i Finn-annonsen, basert på boligens karakteristikker.

### Eksisterende data fra Finn
- Fellesutgifter (allerede tilgjengelig)
- Kommunale avgifter (allerede tilgjengelig)

### Nye estimater som skal beregnes
- Strømkostnader
- Andre driftsutgifter

### Estimeringsparametere
Kalkulatoren skal basere estimatene på:
- Boligens størrelse (kvm)
- Antall soverom
- Fasiliteter (balkong, garasje, etc.)
- Geografisk beliggenhet (påvirker strømpriser)

### Tekniske komponenter
- Estimeringsalgoritme for strøm basert på boligstørrelse
- Database med regionale strømpriser
- Utgiftsprofiler basert på boligtype og størrelse
- Integrasjon med eksisterende kalkulator

## Forbedring av prisestimator (boligverdi)

### Nåværende problemer
- Prisestimatoren baserer seg på gammel data
- Priser er langt unna dagens reelle prisantydninger
- Mangler historisk logging av automatiske verdivurderinger

### Løsning: Dual-graf system

#### Graf 1: Manuell prishistorikk (standard/gratis)
- Brukeren legger inn egne verdivurderinger manuelt
- Fungerer som i dag
- Tilgjengelig for alle brukere
- Bruker har full kontroll over dataene

#### Graf 2: Automatisk prishistorikk (Pro-funksjon)
- Kan aktiveres av bruker med Pro-abonnement
- Oppdateres automatisk hver uke
- Bruker forbedret prismodell med oppdaterte data
- Logger tidspunkt for når automatisk verdi ble hentet
- Erstatter manuell graf når aktivert

### Logging og historikk
- System må logge DATO for hver automatiske verdivurdering
- Historiske data lagres og reflekteres i analysegrafen
- Automatisk graf oppdateres ukentlig for Pro-brukere

### Håndtering av abonnementsendringer
**Scenario: Bruker avslutter Pro-abonnement**
- Bruker har brukt automatisk graf i f.eks. 1 år
- Ved avslutning av Pro:
  - Systemet bytter tilbake til manuell graf
  - Manuelle data fra før Pro-perioden vises
  - Det mangler data for Pro-perioden (1 år i dette eksempelet)
  - Bruker må manuelt fylle inn nåværende prisverdi for å få komplett oversikt igjen

### Plattformfilosofi
- Alt skal kunne gjøres gratis (manuelt)
- Pro-abonnement gir automatisering og tidsbesparelse
- Ikke "låse inn" bruker - de kan alltid gå tilbake til gratis manuell versjon

### Tekniske komponenter
- Ny prismodell med oppdaterte datakilder
- Ukentlig automatisk oppdateringsjobb (cron)
- Logging-system for automatiske verdivurderinger
- Dual-graf visning med toggle mellom manuell/automatisk
- Migreringslogikk ved abonnementsendring
- Database-skjema for å skille mellom manuelle og automatiske verdivurderinger

```sql
-- Forslag til tabell for boligverdier
CREATE TABLE property_value_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id),
  value numeric NOT NULL,
  valuation_date date NOT NULL,
  source text NOT NULL, -- 'manual' eller 'automatic'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```
