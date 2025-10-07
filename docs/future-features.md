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

## Automatisk estimering av forsikring og strøm

### Oversikt
Utvide automatisk estimering til å inkludere forsikring og strømkostnader, på samme måte som vi gjør for leiepris. Målet er å gi brukerne komplette og nøyaktige estimater for alle driftskostnader uten at de må manuelt søke opp eller beregne disse.

### Eksisterende data fra Finn
- Fellesutgifter (allerede tilgjengelig)
- Kommunale avgifter (allerede tilgjengelig)

### Nye estimater som skal beregnes

#### 1. Strømkostnader
**Basert på samme datakilde som leieprisestimator:**
- Boligens størrelse (kvm)
- Antall rom/soverom
- Boligtype (leilighet, enebolig, rekkehus, etc.)
- Geografisk beliggenhet (postnummer/kommune)
- Byggeår (påvirker isolasjon og energieffektivitet)
- Energimerking (hvis tilgjengelig)

**Ytterligere faktorer:**
- Regionale strømpriser (prisområder NO1-NO5)
- Sesongvariasjoner (høyere forbruk vinterstid)
- Historiske forbruksdata basert på boligtype og størrelse
- Standard forbruksprofiler per boligtype

**Beregningsmetode:**
- Estimert årlig strømforbruk (kWh) basert på størrelse og type
- Multiplikasjon med gjennomsnittlig kWh-pris i området
- Divisjon på 12 for månedlig kostnad
- Inkluderer nettleie, avgifter og strømpris

#### 2. Forsikring
**Basert på samme datakilde som leieprisestimator:**
- Boligens størrelse (kvm)
- Boligtype (leilighet, enebolig, rekkehus, etc.)
- Geografisk beliggenhet (postnummer/kommune)
- Byggeår
- Boligverdi (totalpris)

**Ytterligere faktorer:**
- Risikofaktorer i området (f.eks. flomfare, innbruddsstatistikk)
- Standard innboforsikring vs. utleieforsikring
- Egenandeler og dekningsnivå

**Beregningsmetode:**
- Grunnpremie basert på boligtype og størrelse
- Justering for geografisk beliggenhet og risikofaktorer
- Skalering basert på boligverdi
- Standard dekningsnivå (kan tilpasses av bruker)

### Integrasjon med eksisterende system

#### Delt infrastruktur med leieestimator
- Samme edge function kan håndtere alle tre estimater (leie, strøm, forsikring)
- Samme datahenting fra Finn-API
- Samme geografiske data (postnummer, kommune, koordinater)
- Samme AI-modell kan brukes for å analysere og beregne

#### Edge Function struktur
```typescript
// Eksempel på utvidet edge function
const estimates = {
  monthlyRent: calculateRent(propertyData),
  electricityCost: calculateElectricity(propertyData),
  insurance: calculateInsurance(propertyData)
};
```

### Estimeringsparametere (felles for alle tre)
Kalkulatoren skal basere estimatene på:
- Boligens størrelse (kvm)
- Antall soverom/rom
- Boligtype
- Fasiliteter (balkong, garasje, etc.)
- Geografisk beliggenhet (påvirker strømpriser, forsikringspremier, leiepris)
- Byggeår
- Energimerking (hvis tilgjengelig)
- Boligverdi

### Tekniske komponenter

#### Backend (Edge Functions)
- Utvide `estimate-rent` edge function til å også returnere strøm og forsikring
  - ELLER opprette separate funksjoner: `estimate-electricity`, `estimate-insurance`
- Integrasjon med strømpris-API (f.eks. Nordpool, SSB)
- Database med forsikringspremier per område og boligtype
- Caching av estimeringer for bedre ytelse

#### Frontend (PDF/Kalkulator)
- Automatisk utfylling av strøm og forsikring ved Finn-henting
- Visuell indikator for estimerte verdier (lik som for leiepris)
- Mulighet for manuell overstyring av estimerte verdier
- Tracking av hvilke felt som er estimert vs. manuelt justert

#### Datakilder som kan brukes
- **Strøm**: 
  - SSB (Statistisk Sentralbyrå) for forbruksstatistikk
  - Nordpool for strømpriser per prisområde
  - NVE (Norges Vassdrags- og Energidirektorat) for energistatistikk
- **Forsikring**: 
  - Gjennomsnittspremier fra større forsikringsselskaper
  - Historiske data basert på boligtype og beliggenhet
  - Risikokart fra DSB (Direktoratet for samfunnssikkerhet og beredskap)

### UI/UX implementering

#### Visuell presentasjon
- Samme design som for leieestimering: "(estimert)" tekst
- Tooltips som forklarer hvordan estimatet er beregnet
- Mulighet for å se detaljert utregning
- Knapp for å godta eller justere estimat

#### Brukerfeedback
- Notifikasjon når alle tre estimater er hentet automatisk
- Sammenligning med gjennomsnitt i området
- Forslag til forbedringer (f.eks. energisparende tiltak)

### Database-skjema
Kan bruke eksisterende `finn_property_cache` tabell og utvide `estimates` objektet:

```sql
-- Eksisterende struktur (ingen endringer nødvendig)
CREATE TABLE finn_property_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finn_code text UNIQUE NOT NULL,
  property_data jsonb NOT NULL,
  extracted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- property_data.estimates vil inneholde:
-- {
--   monthlyRent: number,
--   electricityCost: number,
--   insurance: number,
--   maintenance: number
-- }
```

### Fremtidige forbedringer
- Maskinlæring for å forbedre nøyaktigheten basert på faktiske data
- Sesongbaserte justeringer for strøm (vinter/sommer)
- Personaliserte estimater basert på brukerens historikk
- Integrasjon med faktiske forsikringsselskaper for sanntids-tilbud
- API-integrasjoner med strømleverandører for nøyaktige priser

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

## Byggeplanlegger kreditt-system

### Oversikt
Et kredittbasert betalingssystem for byggeplanleggeren som gjør det mulig for brukere å jobbe både raskt og over lengre tid med fleksible kostnader.

### Kredittstruktur

#### Betalingsmodell
- **1 credit per 3 minutt** aktiv tid i byggeplanleggeren
- **Maks 10 credits per session** (30 minutters aktiv bruk)
- **Maks 30 credits per dag** (tilsvarer 1,5 timer aktiv bruk)

#### Tidtakerregler
- Tidtaker starter når brukeren åpner byggeplanleggeren
- Tidtaker stopper når brukeren forlater byggeplanleggeren eller er inaktiv
- Ved inaktivitet i **1 minutt** vises en dialogboks som forklarer systemet
- Daglig reset: Byggeplanleggeren lukkes automatisk etter 24 timer

#### Session- og prosjektregler
- Hver session har et maks på 10 credits (30 minutter aktiv bruk)
- Hvis brukeren når 30 credits på én dag, kan de fortsette uten ytterligere kostnader
- Åpning av nytt prosjekt = ny tidtaker starter
- En bruker kan jobbe med ett prosjekt hele dagen for maks 30 credits

### Bruksscenarier

#### Scenario 1: Rask bruker
- Bruker jobber effektivt i 15 minutter = 5 credits
- Ferdig for dagen

#### Scenario 2: Langsom/grundig bruker
- Bruker jobber i 1,5 timer (90 minutter) = 30 credits
- Når maks for dagen
- Kan fortsette å jobbe uten ekstra kostnader
- Kan jobbe så lenge de vil med samme prosjekt

#### Scenario 3: Flere prosjekter
- Prosjekt 1: 45 minutter = 15 credits
- Prosjekt 2 (nytt): 45 minutter = 15 credits
- Totalt: 30 credits (maks nådd)
- Videre arbeid på begge prosjekter: gratis resten av dagen

### Inaktivitetsdialog

#### Innhold i dialogboks (vises etter 1 minutts inaktivitet)
```
⏱️ Byggeplanlegger - Kredittbruk

Du bruker kreditter mens byggeplanleggeren er åpen:
• 1 credit per 3 minutter aktiv tid
• Maks 10 credits per session
• Maks 30 credits per dag

Etter 30 credits kan du fortsette gratis resten av dagen!

Hver 24. time resettes planleggeren.
Nytt prosjekt = ny tidtaker.

[Fortsett] [Lukk planlegger]
```

### Tekniske komponenter

#### Frontend
- Tidtaker-komponent for å spore aktiv tid
- Inaktivitets-detektor (1 minutt)
- Dialogboks for kredittforklaring
- Visuell indikator for forbrukte credits i session/dag
- 24-timers automatisk lukking

#### Backend
- Kreditt-trekk logikk per 3 minutt
- Session tracking (maks 10 credits)
- Daglig reset-funksjonalitet
- Prosjekt-basert tidtaker
- Database logging av kredittbruk

#### Database-skjema
```sql
CREATE TABLE building_planner_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  project_id uuid REFERENCES building_projects(id),
  session_start timestamp with time zone DEFAULT now(),
  session_end timestamp with time zone,
  active_minutes integer DEFAULT 0,
  credits_used integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE building_planner_daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  usage_date date DEFAULT current_date,
  total_credits_used integer DEFAULT 0,
  total_active_minutes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, usage_date)
);
```

### UI/UX komponenter
- Tidtaker display i planlegger-grensesnittet
- Kreditt-indikator (f.eks. "5/10 credits brukt i denne sessionen")
- Daglig kreditt-indikator (f.eks. "15/30 credits brukt i dag")
- Inaktivitets-dialogboks med forklaring
- Notifikasjon når maks daglig forbruk (30 credits) er nådd
- Automatisk logout-varsel (5 minutter før 24-timers grense)

### Filosofi
- Belønner effektiv bruk
- Tillater langsom, grundig arbeid
- Forutsigbar maksimalkostnad per dag (30 credits)
- Fleksibilitet mellom hastighet og grundighet
- Ikke straffende for de som trenger tid

## Eiendomsdata-system (Property Data Network)

### Oversikt
Et omfattende system for å samle, lagre og bruke eiendomsdata fra alle brukernes beregninger, utleie og eierskap. Målet er å bygge en stor database med reelle eiendomsdata som kontinuerlig forbedrer nøyaktigheten på alle estimater og beregninger.

### Grunnleggende konsept: Unike eiendoms-ID (US-objekter)

#### Adresse som unik identifikator
- Hver leilighet/eiendom knyttes til en **unik ID** basert på adresse + husnummer
- Samme eiendom vil alltid få samme ID i systemet
- Leilighet nummer/etasje inkluderes når relevant
- Eksempel: "Storgata 15, 0123 Oslo, Leilighet 301" = én unik ID

#### Persistens på tvers av brukere
- Når flere brukere regner på samme eiendom, lagres all data under samme ID
- Data akkumuleres og forbedres over tid
- Anonymisert historikk for hver eiendom

### Datakilder og bruksområder

#### Hvor data samles inn
1. **Husleiekalkulator** - når brukere estimerer eller registrerer faktisk leiepris
2. **Strømestimator** - når brukere registrerer strømforbruk og kostnader
3. **Forsikringskalkulator** - når brukere legger inn forsikringspremier
4. **Eiendomspriskalkulator** - når brukere registrerer kjøpspriser eller verdivurderinger
5. **Portefølje** - når brukere eier og forvalter eiendommer
6. **Utleie** - når brukere leier ut eiendommer

#### Hva som lagres per eiendom
- **Adresse og lokasjon**: Fullstendig adresse, koordinater, postnummer, kommune
- **Fysiske egenskaper**: Størrelse (kvm), antall rom, byggeår, boligtype, etasje
- **Økonomiske data**: 
  - Historiske salgspriser med dato
  - Faktiske leiepriser (anonymisert)
  - Strømkostnader per måned/år
  - Forsikringspremier
  - Felleskostnader
  - Kommunale avgifter
- **Tidsstempel**: Når data ble registrert
- **Datakilde**: Om data er estimert eller faktisk
- **Anonymisering**: Ingen personopplysninger lagres

### Hvordan data forbedrer beregninger

#### Maskinlæring basert på reelle data
- Jo flere beregninger som gjøres på en eiendom, desto mer nøyaktige estimater
- Lokale trender og prisutviklinger fanges opp automatisk
- Sesongvariasjoner i strømforbruk dokumenteres
- Faktiske forsikringspremier vs. estimater

#### Nabolagsinformasjon
- Hvis vi ikke har data på en spesifikk adresse, bruker vi data fra nabolaget
- Radius-basert søk: 100m, 500m, 1km, samme postnummer
- Vekting basert på likhet (størrelse, byggeår, type)

#### Bedre estimater over tid
- **Husleie**: "10 andre brukere har beregnet/registrert leie for denne adressen. Gjennomsnitt: 15.000 kr/mnd"
- **Strøm**: "Basert på 5 registrerte strømkostnader i denne bygningen, estimerer vi 1.200 kr/mnd"
- **Forsikring**: "3 andre eiendommer i samme gate har premie på ca. 3.500 kr/år"
- **Pris**: "Siste 3 salgene i denne oppgangen var 4.2M, 4.5M, 4.8M"

### Personvernhensyn

#### Anonymisering
- Ingen navn, kontaktinformasjon eller personidentifiserbare opplysninger lagres
- Kun aggregerte data deles mellom brukere
- Minimum antall datapunkter (f.eks. 3) før data vises til andre

#### Brukersamtykke
- Brukere samtykker til å dele anonymiserte data
- Opt-out mulighet hvis bruker ikke vil bidra
- Transparent om hvordan data brukes

#### GDPR-compliance
- Data lagres i EU (Supabase EU region)
- Rett til sletting av egen data
- Ingen videresalg av data
- Kun brukt internt for å forbedre tjenesten

### Teknisk implementering

#### Database-skjema
```sql
-- Hovedtabell for unike eiendommer
CREATE TABLE property_master_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  street_number text NOT NULL,
  apartment_number text,
  postal_code text NOT NULL,
  city text NOT NULL,
  municipality text NOT NULL,
  coordinates point,
  
  -- Fysiske egenskaper
  size_sqm integer,
  bedrooms integer,
  property_type text,
  build_year integer,
  floor integer,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  data_points_count integer DEFAULT 0,
  
  -- Unik constraint på adresse
  UNIQUE(address, street_number, apartment_number)
);

-- Historiske data per eiendom
CREATE TABLE property_data_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES property_master_data(id),
  
  -- Økonomisk data
  sale_price numeric,
  monthly_rent numeric,
  monthly_electricity_cost numeric,
  annual_insurance_premium numeric,
  common_costs numeric,
  municipal_fees numeric,
  
  -- Metadata
  data_type text NOT NULL, -- 'sale', 'rent', 'electricity', 'insurance'
  data_source text NOT NULL, -- 'user_input', 'calculator_estimate', 'actual'
  recorded_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  -- Anonymisering: Ingen user_id lagres
  contributed_by_user_count integer DEFAULT 1
);

-- Aggregerte statistikker per eiendom (for rask henting)
CREATE TABLE property_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES property_master_data(id) UNIQUE,
  
  -- Gjennomsnitt
  avg_rent numeric,
  avg_electricity numeric,
  avg_insurance numeric,
  avg_sale_price numeric,
  
  -- Min/Max
  min_rent numeric,
  max_rent numeric,
  
  -- Antall datapunkter
  rent_data_points integer DEFAULT 0,
  electricity_data_points integer DEFAULT 0,
  insurance_data_points integer DEFAULT 0,
  sale_data_points integer DEFAULT 0,
  
  -- Sist oppdatert
  last_updated timestamp with time zone DEFAULT now()
);

-- Indekser for rask søking
CREATE INDEX idx_property_master_location ON property_master_data USING GIST(coordinates);
CREATE INDEX idx_property_master_postal ON property_master_data(postal_code);
CREATE INDEX idx_property_history_type ON property_data_history(data_type, recorded_date);
```

#### API Endpoints (Edge Functions)

**1. `property-lookup`** - Finn eller opprett eiendom basert på adresse
```typescript
// Input: adresse, husnummer, leilighetsnummer
// Output: property_id + eksisterende data om eiendommen
```

**2. `property-data-contribute`** - Bidra med data til en eiendom
```typescript
// Input: property_id, data_type, value, source
// Lagrer anonymisert data i property_data_history
// Oppdaterer property_statistics
```

**3. `property-insights`** - Hent innsikt om en eiendom
```typescript
// Input: property_id eller adresse
// Output: Statistikk, gjennomsnitt, antall datapunkter
```

**4. `neighborhood-insights`** - Hent data fra nabolaget
```typescript
// Input: koordinater, radius
// Output: Aggregert data fra nærliggende eiendommer
```

#### Frontend integrasjon
- Automatisk oppslag når bruker legger inn adresse
- Vise eksisterende data: "5 andre har beregnet denne eiendommen"
- Visuell indikator for datakvalitet (f.eks. ⭐⭐⭐⭐⭐ basert på antall datapunkter)
- Tooltip med detaljer: "Basert på 8 beregninger siste 6 måneder"

### Forretningsverdi

#### For brukerne
- Stadig bedre og mer nøyaktige estimater
- Trygghet i at data er basert på reelle tall
- Markedsinnsikt fra faktiske transaksjoner
- Tidsbesparelse ved pre-filled data

#### For plattformen
- Konkurransefortrinn: Unike eiendomsdata som ingen andre har
- Nettverkseffekt: Jo flere brukere, desto bedre tjenesten blir
- Verdifull data for fremtidige funksjoner og produkter
- Potensial for B2B-salg av aggregerte markedsdata

### Fremtidige utvidelser

#### Fase 1: Grunnleggende innsamling
- Implementer property_master_data og enkelt data-oppslag
- Samle data fra kalkulatorer og portefølje
- Anonymisert lagring

#### Fase 2: Estimatforbedring
- Bruk innsamlet data til å forbedre alle estimater
- Implementer nabolags-søk
- Vis datakvalitet til brukere

#### Fase 3: Avansert analyse
- Trendanalyse over tid
- Prisutvikling per område
- Sesongvariasjon for strøm
- Prediktiv modell for fremtidige priser

#### Fase 4: Markedsinnsikt
- Offentlig tilgjengelige markedsrapporter (aggregert)
- "Hvilken leilighet er best investering?" verktøy
- Området-sammenligninger
- Investeringsanbefalinger basert på data

### Filosofi
- **Crowdsourcing av data**: Brukerne bidrar, alle får nytte
- **Transparens**: Alltid synlig hvor data kommer fra
- **Personvern først**: Streng anonymisering og GDPR-compliance
- **Datakvalitet**: Jo mer data, desto bedre estimater
- **Nettverkseffekt**: Plattformen blir bedre for alle når flere bruker den
