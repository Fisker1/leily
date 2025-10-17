# Boligkalkyle Simulator

## Oversikt

BoligkalkyleSimulator er en ny frontend-komponent som simulerer Excel-arket "Kalkyle - 2021" for boligfinansiering i nettleseren. Denne komponenten erstatter den tidligere PDF-baserte boligfinansieringsrapporten med en interaktiv spreadsheet-løsning som nøyaktig gjenskaper Excel-filens struktur og formler.

## Funksjonalitet

### Hovedfunksjoner

- **Excel-lignende interface**: Bruker Handsontable for å gi en autentisk spreadsheet-opplevelse
- **Interaktive formler**: Støtter Excel-lignende formler med HyperFormula engine
- **Automatisk beregning**: Alle formler oppdateres automatisk når input endres
- **Redigerbare celler**: Hvite celler er redigerbare, grå celler er read-only
- **PNG-eksport**: Mulighet til å eksportere tabellen som bilde med html2canvas
- **Responsiv design**: Fungerer på både desktop og mobil

### Struktur (basert på "Kalkyle - 2021")

Komponenten er organisert i 4 hovedseksjoner som matcher Excel-filen:

1. **Hovedtabell**: Verditakst, Lånesum, Lånebelastning, Avdragsfrie år
2. **Avkastning ved boligkjøp**: Detaljert beregning av avkastning med alle kostnader og skatt
3. **Cashflow per mnd**: Månedlig kontantstrøm-beregning
4. **Nettoyield på eiendommen**: Netto avkastning på eiendommen

### Formler (fra Excel-filen)

Komponenten støtter følgende Excel-lignende formler som matcher "Kalkyle - 2021":

**Hovedtabell:**
- `=C6/B6` (Lånebelastning = Lånesum / Verditakst)

**Avkastning ved boligkjøp:**
- `=C6` (Lån (kr) - refererer til lånesum)
- `=B6-C6` (Egenkapital = Verditakst - Lånesum)
- `=C6/B6` (Lånebelastning kjøpesum)
- `=B15*0.03` (Ledighet 3% = Leieinntekt * 0.03)
- `=B15*0.05` (Vedlikehold 5% = Leieinntekt * 0.05)
- `=B15-B16-B17-B18-B19-B20` (Netto leie før skatt)
- `=B21*0.22` (Skatt 22% = Netto leie * 0.22)
- `=B21-B22` (Sum etter finans og skatt)
- `=B23*12` (Netto pr. år)
- `=B24/B13*100` (Avkastning egenkapitalen %)

**Cashflow per mnd:**
- `=PMT(B10/100/12,25*12,-B11)` (Renter og avdrag)
- `=B28-B29-B30-B31-B32-B33-B34-B35` (Cashflow per mnd)

**Nettoyield:**
- `=B15*12` (Leieinntekter årlig)
- `=(B16+B17+B18+B19+B20)*12` (Driftskostnader årlig)
- `=B39-B40` (Netto leieinntekt)
- `=B41/B42*100` (Netto yield %)

## Integrasjon

### Props

```typescript
interface BoligkalkyleSimulatorProps {
  data?: Record<string, any>;
  onDataChange?: (field: string, value: any) => void;
}
```

### Datafelter

Komponenten forventer følgende datafelter (basert på Excel-filen):

**Hoveddata:**
- `address`: Adresse og postnummer
- `totalPrice`: Verditakst
- `loanAmount`: Lånesum
- `interestOnlyYears`: Avdragsfrie år

**Avkastning:**
- `interestRate`: Rente (%)
- `monthlyRent`: Leieinntekt per mnd
- `commonCosts`: Felleskostnader pr mnd
- `municipalFees`: Kommunale avgifter
- `otherExpenses`: Strøm, forsikring, diverse

**Beregnet automatisk:**
- Egenkapital (Verditakst - Lånesum)
- Lånebelastning (Lånesum / Verditakst)
- Ledighet (3% av leieinntekt)
- Vedlikehold (5% av leieinntekt)
- Netto leie før skatt
- Skatt (22% av netto leie)
- Cashflow per mnd
- Netto yield

## Teknisk implementasjon

### Avhengigheter

- `@handsontable/react-wrapper`: React wrapper for Handsontable
- `handsontable`: Hovedbibliotek for spreadsheet-funksjonalitet
- `hyperformula`: Formel engine for Excel-lignende beregninger
- `html2canvas`: For PNG-eksport funksjonalitet

### Styling

Komponenten bruker custom CSS for å matche Excel-utseendet:

- **Main header**: Lysgrå bakgrunn, fet skrift, sentrert
- **Section headers**: Mørkere grå bakgrunn, fet skrift
- **Labels**: Hvit bakgrunn, fet skrift
- **Calculated cells**: Lysgrå bakgrunn, grå tekst, fet skrift
- **Editable cells**: Hvit bakgrunn, standard tekst

### Formel-håndtering

HyperFormula engine håndterer alle formel-beregninger lokalt i nettleseren. Formler oppdateres automatisk når avhengige celler endres.

## Bruk

Komponenten er integrert i hovedkalkulatoren og vises til høyre for chat-grensesnittet i en resizable split view. På mobil vises den som en egen tab.

### Eksempel

```tsx
<BoligkalkyleSimulator 
  data={calculatorData}
  onDataChange={(field, value) => updateField(field, value)}
/>
```

## Fordeler over PDF-løsning

1. **Interaktivitet**: Brukere kan redigere verdier direkte
2. **Sanntidsberegning**: Formler oppdateres umiddelbart
3. **Bedre brukeropplevelse**: Mer intuitivt enn statisk PDF
4. **Fleksibilitet**: Enklere å legge til nye funksjoner
5. **Responsivt**: Fungerer på alle enheter
6. **Eksport**: Kan eksporteres som PNG for deling

## Fremtidige forbedringer

- Støtte for flere formler og funksjoner
- Bedre mobil-optimalisering
- Mulighet for å lagre og laste kalkyler
- Integrasjon med eksterne datakilder
- Avanserte visualiseringer og grafer
