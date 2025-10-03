# AI Strømestimator

AI-basert strømkostnadsestimator som bruker OpenAI (GPT-5 Mini) til å estimere månedlige strømkostnader basert på boligegenskaper.

## Funksjonalitet

### Automatisk estimering
- Aktiveres med en switch i utgifts-seksjonen
- Bruker AI til å estimere basert på:
  - Kvadratmeter (størrelse)
  - Antall soverom
  - Boligtype
  - Lokasjon
- Tar hensyn til norske strømpriser 2025 (ca 1,20-1,50 kr/kWh)
- Returnerer årlig gjennomsnitt

### Fallback-logikk
- Hvis AI-estimering feiler, bruker systemet en enkel formel:
  - `(størrelse * 15 + soverom * 200) / 100 * 100`
- Sikrer at brukeren alltid får et estimat

### Pro-funksjon
- Kun tilgjengelig for Pro-brukere
- Krever autentisering
- Integrert i eiendomskalkulatoren

## Teknisk implementering

### Edge Function: `estimate-electricity`
- Mottar: `size_sqm`, `bedrooms`, `property_type`, `location`
- Kaller OpenAI API med gpt-5-mini-2025-08-07
- Returnerer: `estimated_monthly_cost`, `method`, `note`

### Komponent: `ElectricityEstimator`
Props:
- `size_sqm?: number` - Boligens størrelse
- `bedrooms?: number` - Antall soverom
- `property_type?: string` - Type bolig
- `location?: string` - Lokasjon
- `onEstimateComplete?: (cost: number) => void` - Callback når estimat er klart
- `disabled?: boolean` - Deaktiver komponenten

### Feilhåndtering
- 429 (Rate limit): "For mange forespørsler"
- 402 (Payment required): "Betalingspåkrevd"
- Andre feil: Fallback til formel

## Bruk i kalkulatoren

Strømestimatoren vises automatisk i utgifts-seksjonen for Pro-brukere:
1. Bruker aktiverer switch
2. AI estimerer strømkostnad
3. Resultatet fylles automatisk inn i "Forventet strømbruk"-feltet
4. Bruker kan manuelt justere verdien

## Integrering med Finn-data

Når data hentes fra Finn.no:
- Størrelse og soverom hentes automatisk
- Strømestimatoren aktiveres automatisk hvis pro-bruker
- Estimatet fylles inn uten brukerinteraksjon

## Kostnader

- Bruker OpenAI GPT-5 Mini modell
- Koster per forespørsel basert på OpenAI prising
- Se OpenAI pricing for detaljer

## Fremtidige forbedringer
- Sesongbaserte estimater (vinter vs sommer)
- Historiske strømpriser per region
- Integrasjon med strømpris-API for sanntidsdata
- Lagring av estimathistorikk
