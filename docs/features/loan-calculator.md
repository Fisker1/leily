# Lånekalkulator

Lånekalkulatoren er en Pro-funksjon som hjelper brukere med å administrere egenkapital og planlegge lånescenarier for fremtidige eiendomskjøp.

## Funksjonalitet

### Egenkapitaladministrasjon
- Bruker legger inn sin totale egenkapital én gang
- Systemet beregner automatisk tilgjengelig kapital basert på bundne lånescenarier
- Oversikt over hvor mye kapital som er "bundet opp" i hver enkelt eiendom

### Lånekalkulatorverktøy
- Slider-basert interface for lett beregning av ulike lånescenarier
- Mulighet til å fordele og "binde opp" kapital i forskjellige boliger
- Oversikt over:
  - Kapital bundet i hver bolig
  - Tilgjengelig egenkapital
  - Lånebeløp og månedsrater
  - Belåningsgrad (LTV)
  - Totale rentekostnader

### Validering og kontroll
- Dersom bruker overskrider tilgjengelig egenkapital må hen legge inn ekstra begrunnelse
- Spesifisere hvor de ekstra pengene kommer fra (arv, gave, salg av andre aktiva, osv.)

## Teknisk implementering

### Database
- `equity_management` tabell for lagring av brukerens totale egenkapital
- `loan_scenarios` tabell for lagring av lånescenarier
- `get_available_equity()` funksjon for beregning av tilgjengelig kapital

### Hook: `useLoanCalculator`
Administrerer all logikk for lånekalkulator:
- Hente og lagre egenkapitaldata
- Hente og lagre lånescenarier
- Beregne tilgjengelig egenkapital
- Validere egenkapital-allokering
- Beregne lånetermer (månedsrate, totale rentekostnader, etc.)

### Komponent: `LoanCalculator`
UI-komponent med tre faner:
1. **Oversikt** - Viser totaloversikt over egenkapital og scenarier
2. **Egenkapital** - Administrasjon av total egenkapital
3. **Scenarier** - Opprett og administrer lånescenarier

## Bruk

### Opprett egenkapital
1. Gå til "Egenkapital"-fanen
2. Legg inn total egenkapital
3. Valgfritt: Legg til notater
4. Klikk "Lagre Egenkapital"

### Opprett lånescenario
1. Gå til "Scenarier"-fanen
2. Klikk "Nytt Scenario"
3. Fyll inn:
   - Scenarionavn
   - Eiendomsadresse
   - Boligverdi
   - Egenkapital som skal allokeres
   - Rente og nedbetalingstid (via slider)
4. Hvis egenkapital overskrides:
   - Legg inn ekstra finansieringsbeløp
   - Spesifiser kilde for ekstra midler
5. Klikk "Lagre Scenario"

## Fremtidige forbedringer
- Integrasjon med eiendomskalkulator for auto-fill av data
- Automatisk verdioppdatering av eiendommer
- Refinansieringsmuligheter-oversikt
- Eksport av scenarier til PDF
- Sammenligning av flere scenarier side-ved-side

## Tilgangskontroll
- Kun tilgjengelig for Pro-brukere
- Krever autentisering
- RLS policies sikrer at brukere kun ser egne data
