# Leily Changelog 2025

## Oktober 2025

### Forbedringer av kalkulasjonslagring og leierkart (7. oktober 2025)

#### Nye funksjoner
- **Rask lagring fra kalkulator**: Lagt til disk-ikon ved siden av "Last ned PDF" for å lagre kalkulasjoner direkte
- **Automatisk navngiving**: Kalkulasjoner navngis automatisk basert på eiendomsadresse (fallback til dato hvis ingen adresse)
- **Automatisk geocoding**: Adresser geocodes automatisk ved lagring slik at kalkulasjoner vises på leiekartet
- **Sømløs navigering**: Når du laster inn en kalkulasjon fra biblioteket, navigeres du automatisk til kalkulatoren med alle data lastet

#### Forbedringer
- Fjernet lagringsdialog for raskere arbeidsflyt
- Kalkulasjoner vises nå som oransje markører på leiekartet (hvis de har en gyldig norsk adresse)
- Adresse-felt i kalkulatoren synkroniseres nå korrekt med Finn-henting og manuell inntasting
- Finn-kode fylles automatisk ut hvis tilgjengelig
- Navigasjonsalternativer justert for bedre visuell balanse

#### Tekniske endringer
- Oppdatert `useCalculationHistory` hook med geocoding via OpenStreetMap Nominatim API
- Lagt til `coordinates` felt i `CalculationHistoryItem` interface
- Lagt til `address` felt i `CalculatorData` interface for bedre type-sikkerhet
- Forbedret dataflyt mellom kalkulator og lagringssystem
- Automatisk koordinat-lagring for bedre kartvisning
- Rate limiting på geocoding API-kall (1 sekund mellom requests)

#### Bugfixes
- Fikset TypeScript error ved bruk av `address` field i calculator data
- Fikset synkronisering av adresse mellom PDF-forhåndsvisning og lagringssystem
- Fikset automatisk tab-bytte ved lasting av kalkulasjoner

### AI-drevet leiepris- og kostnadsestimering (oppdatert)

#### Leieestimator
- Estimert leiepris vises nå som "(estimert)" i stedet for "(AI-estimert)" eller "(Leily-estimert)"
- Samme terminologi brukes konsekvent i hele applikasjonen

#### Fremtidige forbedringer (planlagt)
- Automatisk estimering av forsikringskostnader basert på boligdata
- Automatisk estimering av strømkostnader basert på boligstørrelse og beliggenhet
- Gjenbruk av samme datakilde og infrastruktur som leieestimatoren
- Se `docs/future-features.md` for full dokumentasjon

---

# Leily Changelog 2025

## Januar 2025 - Ny Kalkulator System 🚀

### Hoved-features

#### ✨ Automatisk Leiepris-estimering (NY)
- **Bakgrunnsberegning**: Estimerer automatisk månedlig leiepris basert på Finn.no data
- **Husleie.no-metode**: Bruker samme beregningsmetode som husleie.no
- **AI-indikator**: Lysegrå bakgrunn + "(estimert)" label for auto-estimerte verdier
- **Manuell overstyring**: Bruker kan endre verdien → bakgrunn blir hvit
- **Bankvisualisering**: Tydelig distinksjon mellom Leily-estimat og bruker-input
- **Edge function**: `estimate-rent` for server-side beregning
- **Parametere**: Lokasjon, boligtype, størrelse, soverom, fasiliter

#### ✨ Ekstern/Privat Lånegiver (NY)
- **Checkbox for eksterne lånegivere**: Enkelt å markere om man har privat finansiering
- **Navn på lånegiver**: Tekstfelt for å spesifisere hvem lånegiveren er
- **Covenant-opplasting**: Last opp PDF-dokumenter (maks 10MB)
- **Validering**: Automatisk filtype og størrelsessjekk
- **PDF-integrering**: Vises profesjonelt i eksportert rapport

#### ✨ AI-Drevet Eiendomskalkulator
- **CalculatorChat**: Nytt chat-grensesnitt med tre hovedfunksjoner:
  - 📋 HTML Shaver: Parser Finn.no HTML automatisk
  - 🧮 Lånekalkulator: Sett opp låneinformasjon
  - 💬 AI Chat: Conversational interface
  
- **Automatisk Data-ekstraksjon**: 
  - Felleskostnader (`commonCosts`)
  - Kommunale avgifter (`municipalFees`)
  - Adresse og Finn-kode
  - Pris og eiendomstype
  
- **Sanntids PDF Preview**: Se rapporten oppdateres mens du jobber

#### 🎨 UX Forbedringer
- **Splitscreen Layout**: Justerbar ResizableSplitView
- **Drag & Drop**: Last opp dokumenter og bilder
- **Toast Notifications**: Bedre feedback til brukere
- **Kreditt-visning**: Se tilgjengelige kreditter i UI

### Tekniske Forbedringer

#### Backend
- Ny edge function: `calculator-ai-chat`
- OpenAI integrasjon (gpt-4o-mini)
- Session management for chat-historikk
- Strukturert data-ekstraksjon via OpenAI tools

#### Database
- Ny tabell: `calculator_chat_sessions`
- Ny tabell: `calculator_chat_messages`
- RLS policies for sikker data-tilgang

#### Frontend
- Refaktorert `Calculator.tsx`:
  - Fjernet ubrukte imports
  - Strømlinjeformet component-struktur
  - Bedre state management
- Ny hook: `useCalculatorData` (forbedret)
- Markdown-støtte for AI-responser

### Fjerning/Deprecation

#### Fjernet Komponenter (fra Calculator.tsx imports)
- ❌ `ProfitabilityCalculator` (standalone)
- ❌ `CalculatorModules`
- ❌ `FinnPropertyFetcher`
- ❌ Direkte `LoanCalculator` import
- ❌ `ElectricityEstimator` standalone

**Merk**: Disse komponentene eksisterer fortsatt i codebase for eventuell gjenbruk, men brukes ikke lenger i hovedkalkulatoren.

### Dokumentasjon

#### Nye Dokumenter
- `docs/features/new-calculator-system.md` - Komplett guide
- `docs/MIGRATION_TO_NEW_CALCULATOR.md` - Migreringsguide
- `docs/CHANGELOG_2025.md` - Denne filen
- `docs/features/auto-rent-estimation.md` - **NY**: Automatisk leiepris-estimering

#### Oppdaterte Dokumenter
- `docs/index.md` - Inkluderer ny kalkulator
- `docs/README.md` - Refererer til ny dokumentasjon
- `docs/features/external-lender.md` - **NY**: Dokumentasjon for eksterne lånegivere

### Prestasjons-forbedringer

#### Før (Gammel Kalkulator)
- Manuell inntasting: ~5-10 minutter per eiendom
- Mange klikk og skjemafelt
- Ingen AI-assistanse
- Statisk PDF-generering

#### Etter (Ny Kalkulator)
- HTML paste → Auto-fill: ~30 sekunder
- Minimal bruker-input nødvendig
- AI-assistanse tilgjengelig
- Sanntids PDF preview

### Sikkerhet

- ✅ RLS policies på alle nye tabeller
- ✅ Kreditt-validering før AI-kall
- ✅ Rate limiting på edge functions
- ✅ Input validering (max HTML størrelse)

### Kjente Issues

#### Løst ✅
- ~~ HTML for stort (>100k tokens) ~~
  - **Løsning**: Klient-side HTML shaving
- ~~ OpenAI timeout på store requests ~~
  - **Løsning**: Skip OpenAI for ren data-ekstraksjon
- ~~ Kreditter ikke trukket riktig ~~
  - **Løsning**: Server-side kreditt-håndtering

#### Under Overvåking 👀
- Regex patterns kan feile på nye Finn.no layouts
- Edge function cold starts kan være trege
- PDF rendering på mobile enheter

### Breaking Changes

#### For Utviklere
- `Calculator.tsx` imports endret (se MIGRATION_TO_NEW_CALCULATOR.md)
- Ny data-struktur for kalkulator-state
- Edge function auth header-krav

#### For Sluttbrukere
- Ingen breaking changes - ny flyt er mer intuitiv

### Migreringsguide

Se [MIGRATION_TO_NEW_CALCULATOR.md](MIGRATION_TO_NEW_CALCULATOR.md) for detaljer.

### Fremtidige Planer

#### Q1 2025
- [ ] Support for Hybel.no og Tise
- [ ] Batch-prosessering av flere eiendommer
- [ ] PDF templates/branding
- [ ] Integrasjon med husleie.no API for bedre leiepris-estimering

#### Q2 2025
- [ ] AI-genererte markedsanalyser
- [ ] Integrasjon med bank-API
- [ ] Mobile app (React Native)

### Credits & Takk

- OpenAI for GPT-4 API
- Supabase for infrastruktur
- Finn.no for eiendomsdata
- Alle beta-testere 🙏

---

**Versjon**: 2.0.0  
**Dato**: Januar 2025  
**Status**: ✅ Produksjonsklar
