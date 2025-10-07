# Ny Eiendomskalkulator System

## Oversikt

Det nye kalkulatorsystemet er en AI-drevet løsning som automatisk fyller ut boligfinansieringsrapporter basert på Finn.no-data og brukerinteraksjon.

## Arkitektur

### Frontend Komponenter

#### 1. **CalculatorChat** (`src/components/calculator/CalculatorChat.tsx`)
Hovedgrensesnittet for brukerinteraksjon med tre primære funksjoner:

- **📋 HTML Shaver**: Parser Finn.no HTML og ekstraherer strukturert eiendomsdata
- **🧮 Lånekalkulator**: Dialog for å sette opp låneinformasjon
- **💬 AI Chat**: Conversational interface for spørsmål og dokumentanalyse

**Viktige funksjoner:**
- `shaveHtml()`: Klient-side HTML parsing og data ekstraksjon
- `handleSendMessage()`: Sender meldinger til AI edge function
- `handleApplyLoanCalculator()`: Fyller inn lånedata i PDF

**Data som ekstraheres:**
- Adresse og Finn-kode
- Pris
- Felleskostnader (`commonCosts`)
- Kommunale avgifter (`municipalFees`)
- Eiendomstype
- Rominfo

**Nye funksjoner (2025):**
- **Ekstern/Privat Lånegiver**: Checkbox og tekstfelt for å registrere private lånegivere
- **Covenant-opplasting**: Mulighet til å laste opp PDF-dokumenter (maks 10MB)
- **Automatisk Leiepris-estimering**: AI-drevet estimering basert på husleie.no-metode
  - Lysegrå bakgrunn = AI-estimert
  - Hvit bakgrunn = Manuelt redigert
  - Kjøres automatisk i bakgrunnen ved HTML parsing

#### 2. **CalculatorPDFPreview** (`src/components/calculator/CalculatorPDFPreview.tsx`)
Viser sanntidsforhåndsvisning av boligfinansieringsrapporten:

- Auto-oppdateres når data endres
- Viser alle beregninger (lån, kontantstrøm, avkastning)
- Kan eksporteres til PDF

#### 3. **ResizableSplitView** (`src/components/calculator/ResizableSplitView.tsx`)
Splitscreen-layout som lar brukeren:
- Justere størrelse mellom chat og PDF preview
- Samhandle med chatten mens de ser PDF-oppdateringer i sanntid

### Backend (Edge Functions)

#### **calculator-ai-chat** (`supabase/functions/calculator-ai-chat/index.ts`)
Håndterer AI-interaksjoner med OpenAI:

**Funksjoner:**
- Autentisering og kredittsjekk
- Session management for samtalehistorikk
- Strukturert data ekstraksjon via OpenAI tools
- Kreditttrekk (kun for ikke-ambassadører/test-brukere)

**Tool: `extract_property_data`**
Brukes av AI-en til å returnere strukturert JSON når brukeren ber om data:
```typescript
{
  address: string,
  price: number,
  commonCosts: number,
  municipalFees: number,
  // ... mer data
}
```

### Dataflyt

```
1. Bruker → Limer inn Finn.no HTML
2. Client → shaveHtml() parser HTML
3. Client → Ekstraherer commonCosts, municipalFees, adresse, etc.
4. Client → Fyller automatisk ut PDF-felter
5. [Hvis AI trengs] → Edge function → OpenAI → Returnerer svar
```

**VIKTIG**: HTML parsing skjer nå KUN på klientsiden. AI edge function kalles bare for chat-spørsmål, ikke for data-ekstraksjon.

## HTML Shaving Prosess

### 1. Input Validering
- Max 500,000 tegn
- Sjekker om input ser ut som HTML

### 2. Data Ekstraksjon
```typescript
// Regex patterns for å finne data
const commonCostsRegex = /(\d+[\s\d]*)\s*kr\/mnd.*?fellesutgifter/is
const municipalFeesRegex = /(\d+[\s\d]*)\s*kr\/(?:år|mnd).*?kommunale avgifter/is
```

### 3. Auto-fill PDF
Ekstraherte data fylles direkte inn i `CalculatorPDFPreview`:
- `commonCosts` → Felleskostnader
- `municipalFees` → Kommunale avgifter
- `address` → Eiendomsadresse
- `finnCode` → Finn-kode

## Brukerflyt

### Standard Arbeidsflyt
1. **Start**: Bruker åpner kalkulatoren
2. **Hent Data**: Klikk "📋 Formater" og lim inn Finn.no HTML
3. **Automatisk**: System ekstraherer og fyller ut felter
4. **Auto-estimering**: System estimerer leiepris basert på boligdata (lysegrå bakgrunn)
5. **Lån Setup**: Klikk "🧮 Lånekalkulator" for å sette lånedetaljer
6. **Juster leiepris** (Valgfritt): Endre estimert leiepris → bakgrunn blir hvit
7. **Ekstern Lånegiver** (Valgfritt): Huk av og last opp covenant hvis relevant
8. **Ferdig**: PDF-rapporten er klar til eksport

### AI Chat (Valgfritt)
- Still spørsmål om rapporten
- Last opp bilder/dokumenter for analyse
- Få AI-assistanse med beregninger

## Teknisk Stack

### Frontend
- **React** + TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** komponenter
- **React Markdown** for AI-responser

### Backend
- **Supabase Edge Functions** (Deno)
- **OpenAI API** (gpt-4o-mini)
- **Supabase Database** for session/message storage

## Database Schema

### Relevante Tabeller

#### `calculator_chat_sessions`
Lagrer AI chat-sesjoner:
- `user_id`: Eier av sesjonen
- `title`: Beskrivende tittel
- `metadata`: JSON med ekstra info

#### `calculator_chat_messages`
Lagrer individuelle meldinger:
- `session_id`: Tilhører session
- `role`: 'user' eller 'assistant'
- `content`: Meldingstekst
- `metadata`: JSON (f.eks. ekstraherte data)

## Kreditt System

- **Ikke-Pro brukere**: Betaler kreditter per AI-melding
- **Pro/Admin brukere**: Ubegrenset bruk
- **HTML Shaving**: Gratis (skjer kun på klient)
- **Lånekalkulator**: Gratis

## Feilhåndtering

### Client-side
- Validering av HTML størrelse
- Fallback hvis regex feiler
- Toast-meldinger for feil

### Server-side
- Autentisering sjekk
- Kreditt validering
- OpenAI error handling
- Logging til Supabase

## Fremtidige Forbedringer

### Planlagt
- [ ] Støtte for flere eiendomsportaler
- [ ] Historikk av kalkulasjoner
- [ ] Eksport til flere formater
- [ ] Deling av rapporter
- [ ] Lagring av covenant-dokumenter i Supabase Storage

### Under Vurdering
- [ ] Offline-modus for HTML parsing
- [ ] Batch-prosessering av flere eiendommer
- [ ] Integrasjon med bank-API for lånetilbud

## Vedlikehold

### Viktige Filer å Overvåke
1. `src/components/calculator/CalculatorChat.tsx` - Frontend logikk
2. `supabase/functions/calculator-ai-chat/index.ts` - AI backend
3. `src/components/calculator/CalculatorPDFPreview.tsx` - PDF generering

### Logging
- Client logs: `console.log` i browser console
- Edge function logs: Supabase dashboard → Functions → calculator-ai-chat → Logs

### Testing
- Test HTML shaving med forskjellige Finn.no URLer
- Verifiser at commonCosts og municipalFees ekstraheres korrekt
- Sjekk at PDF oppdateres i sanntid

## Feilsøking

### "Kunne ikke prosessere HTML"
- **Årsak**: HTML er for stort eller mangler nødvendige data
- **Løsning**: Sjekk at HTML inneholder `data-testid` attributter

### "Ingen kreditter igjen"
- **Årsak**: Bruker har brukt opp kreditter
- **Løsning**: Oppgrader til Pro eller kjøp flere kreditter

### Felter fylles ikke ut automatisk
- **Årsak**: Regex patterns matcher ikke HTML strukturen
- **Løsning**: Sjekk console logs for ekstraherte data, oppdater regex patterns om nødvendig

## Relatert Dokumentasjon

- [useCalculatorData Hook](../hooks/useCalculatorData.md)
- [Loan Calculator](./loan-calculator.md)
- [Automatisk Leiepris-estimering](./auto-rent-estimation.md)
- [Ekstern/Privat Lånegiver](./external-lender.md)
- [Supabase Edge Functions](../apis/supabase-functions.md)
