# Migrering til Ny Kalkulator (2025)

## Hva har endret seg?

### Gammel Arkitektur (før 2025)
- Manuell datainntasting i skjemaer
- Separate komponenter for hver beregning
- Ingen AI-integrasjon
- Statisk PDF-generering

### Ny Arkitektur (2025)
- **AI-drevet**: Automatisk dataekstraksjon fra Finn.no
- **Strømlinjeformet**: Chat + PDF preview i splitscreen
- **Sanntid**: Auto-oppdatering av beregninger
- **Effektiv**: Færre klikk, raskere arbeidsflyt

## Komponenter som er Fjernet/Erstattet

### ❌ Fjernet
- `ProfitabilityCalculator` (standalone komponent) - Erstattet av CalculatorPDFPreview
- `CalculatorModules` - Funksjonalitet nå integrert i CalculatorChat
- `FinnPropertyFetcher` - Erstattet av HTML shaving i CalculatorChat
- Direkte import av `LoanCalculator` i Calculator.tsx - Erstattet av LoanCalculatorDialog
- `ElectricityEstimator` standalone - Nå integrert i beregninger

### ✅ Nye Komponenter
- `CalculatorChat` - Hovedgrensesnitt for brukerinteraksjon
- `CalculatorPDFPreview` - Sanntids PDF preview med alle beregninger
- `ResizableSplitView` - Justerbar split-screen layout
- `LoanCalculatorDialog` - Dialog-basert lånekalkulator

## Dataflyt: Før vs Etter

### Gammel Flyt
```
1. Bruker → Fyller ut skjema felt for felt
2. Bruker → Klikker "Beregn"
3. System → Viser resultater
4. Bruker → Klikker "Generer PDF"
5. System → Lager statisk PDF
```

### Ny Flyt
```
1. Bruker → Limer inn Finn.no HTML
2. System → Parser og ekstraherer data automatisk
3. System → Fyller ut PDF i sanntid
4. [Valgfritt] Bruker → Chattar med AI for justering
5. Bruker → Eksporterer ferdig PDF
```

## Breaking Changes

### For Utviklere

#### Import Changes
```typescript
// ❌ GAMMEL
import ProfitabilityCalculator from '@/features/calculator/components/ProfitabilityCalculator';
import CalculatorModules from '@/features/calculator/components/CalculatorModules';
import { LoanCalculator } from '@/features/calculator/components/LoanCalculator';

// ✅ NYE
import { CalculatorChat } from '@/features/calculator/components/CalculatorChat';
import { CalculatorPDFPreview } from '@/features/calculator/components/CalculatorPDFPreview';
import { ResizableSplitView } from '@/features/calculator/components/ResizableSplitView';
```

#### Data Structure Changes
```typescript
// ❌ GAMMEL - Data spredt over flere states
const [propertyValue, setPropertyValue] = useState(0);
const [loanAmount, setLoanAmount] = useState(0);
const [interestRate, setInterestRate] = useState(0);
// ... mange flere states

// ✅ NYE - Sentralisert via useCalculatorData
const { data, updateField } = useCalculatorData();
// All data i ett objekt, enklere håndtering
```

### For Sluttbrukere

#### Arbeidsflyt Endringer
- **Før**: Manuell inntasting av alle felter
- **Etter**: Paste HTML fra Finn.no → Alt fylles automatisk

#### Nye Funksjoner
- AI-assistanse via chat
- Automatisk ekstraksjon av felleskostnader og kommunale avgifter
- Sanntids PDF preview mens du jobber
- Dokumentopplasting for analyse

## Database Endringer

### Nye Tabeller
```sql
-- Chat sessions
calculator_chat_sessions (
  id, user_id, title, calculator_data, created_at, updated_at
)

-- Chat messages
calculator_chat_messages (
  id, session_id, role, content, metadata, created_at
)
```

## Edge Function Endringer

### Nye Edge Functions
- `calculator-ai-chat` - Håndterer AI-interaksjoner med OpenAI

### Oppdaterte Edge Functions
Ingen eksisterende edge functions er påvirket.

## Migreringsstrategi

### Fase 1: Testing (Ferdig ✅)
- Ny kalkulator deployert og testet
- HTML shaving fungerer
- PDF-generering fungerer

### Fase 2: Dokumentasjon (Ferdig ✅)
- Komplett dokumentasjon skrevet
- Arkitektur-diagrammer laget
- Developer guide oppdatert

### Fase 3: Cleanup (Ferdig ✅)
- Ubrukte imports fjernet
- Gamle komponenter beholdt for eventuell gjenbruk
- Code paths ryddet opp

### Fase 4: Produksjon (Aktuell)
- Systemet er klart for produksjon
- Overvåk logs for issues
- Samle feedback fra brukere

## Feilsøking

### Problem: "Kunne ikke prosessere HTML"
**Løsning**: Sjekk at HTML inneholder nødvendige `data-testid` attributter fra Finn.no

### Problem: Felter ikke auto-fyllt
**Løsning**: Verifiser at regex patterns i `shaveHtml()` matcher HTML-strukturen

### Problem: AI svarer ikke
**Løsning**: Sjekk kreditter og edge function logs i Supabase dashboard

## Rulletilbake Plan

Hvis du trenger å rulle tilbake til gammel versjon:

1. **Gjenopprett gamle imports** i `Calculator.tsx`
2. **Re-enable gamle komponenter** i JSX
3. **Deploy forrige commit** fra git history

Men dette skal **IKKE** være nødvendig da vi har testet grundig.

## Fremover

### Neste Steg
- Overvåk brukeranalytics
- Samle feedback
- Optimaliser ytelse
- Forbedre regex patterns basert på real-world data

### Planlagte Forbedringer
- Support for flere eiendomsportaler (ikke bare Finn.no)
- Flere AI-modeller (Gemini, Claude)
- Bulk-prosessering av flere eiendommer
- Eksport til flere formater (Word, Excel)

## Spørsmål?

Se [ny-calculator-system.md](features/new-calculator-system.md) for full dokumentasjon eller kontakt utviklingsteamet.
