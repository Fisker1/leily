# Ekstern/Privat Lånegiver Funksjon

## Oversikt

Denne funksjonen lar brukere registrere eksterne eller private lånegivere i boligfinansieringsrapporten, samt laste opp covenant-dokumenter som vedlegg.

## Funksjonalitet

### 1. Checkbox for Ekstern Lånegiver
- **Plassering**: Under "Låneinformasjon" (seksjon 2.1)
- **Funksjon**: Aktiverer/deaktiverer felter for ekstern lånegiver
- **Label**: "Jeg har en ekstern eller privat lånegiver"

### 2. Navn på Lånegiver
- **Type**: Tekstfelt
- **Placeholder**: "F.eks. Familie, Venner, Privat investor..."
- **Visning**: Kun når checkbox er huket av
- **Vises i PDF**: Ja

### 3. Covenant Opplasting
- **Filtype**: Kun PDF
- **Maks størrelse**: 10MB
- **Funksjon**: Last opp låneavtaler eller covenant-dokumenter
- **Visning**: Kun i edit-modus (skjules i PDF print-modus)
- **Status indikator**: Viser filnavn når lastet opp

## Teknisk Implementering

### Data Struktur

```typescript
interface CalculatorData {
  // ... andre felter
  hasExternalLender: boolean;
  externalLenderName: string;
  covenantFile: File | null;
  covenantFileUrl: string;
}
```

### Komponenter

#### CalculatorPDFPreview
- Håndterer UI for checkbox, tekstfelt og fil-opplasting
- Validerer fil-type og størrelse
- Viser/skjuler felt basert på checkbox-status

#### useCalculatorData Hook
- Lagrer state for ekstern lånegiver
- Håndterer data-oppdateringer

## Bruksscenarioer

### Scenario 1: Privat Lån fra Familie
1. Bruker huker av "Jeg har en ekstern eller privat lånegiver"
2. Fyller inn "Familie" i navnet
3. Laster opp PDF med låneavtale
4. Informasjonen inkluderes i PDF-rapporten

### Scenario 2: Kombinasjon Bank + Privat
1. Bruker fyller ut normal låneinformasjon (bank)
2. Huker av for ekstern lånegiver
3. Legger til informasjon om tilleggslån
4. Rapporten viser begge finansieringskilder

### Scenario 3: Kun Dokumentasjon
1. Bruker huker av for ekstern lånegiver
2. Fyller inn navn uten å laste opp dokument
3. Rapporten viser lånegiveren uten vedlegg

## Fil Validering

### Tillatte Filtyper
- **PDF**: `application/pdf`

### Størrelsesbegrensninger
- **Maksimum**: 10MB (10,485,760 bytes)

### Feilmeldinger
- "Kun PDF-filer er tillatt" - Hvis annen filtype
- "Filen er for stor (maks 10MB)" - Hvis fil > 10MB

## UI/UX Detaljer

### Normal Modus
- Checkbox alltid synlig
- Navn-felt skjules når checkbox er avhuket
- Fil-opplasting knapp med "Upload" ikon
- Grønn indikator når fil er lastet opp

### Print/PDF Modus
- Checkbox-status vises som tekst
- Navn på lånegiver vises
- Fil-opplasting knapp skjules
- Vedlagt fil vises som badge: "📄 Covenant vedlagt: [filnavn]"

## Fremtidige Forbedringer

### Planlagt
- [ ] Mulighet for flere lånegivere
- [ ] Automatisk parsing av covenant-dokumenter
- [ ] Integrasjon med digitale signaturer
- [ ] Lagring av filer i Supabase Storage

### Under Vurdering
- [ ] Støtte for flere filtyper (Word, Excel)
- [ ] Forhåndsvisning av opplastet PDF
- [ ] Historikk over endringer i låneavtaler
- [ ] Varslinger om fornyelse av covenants

## Sikkerhet

### Klient-side Validering
- Filtype sjekk før opplasting
- Størrelse validering
- Kun PDF aksepteres

### Fremtidig Server-side (når Supabase Storage implementeres)
- Anti-virus scanning
- Metadata stripping
- Kryptert lagring
- Tilgangskontroll via RLS

## Relatert Dokumentasjon

- [Ny Kalkulator System](./new-calculator-system.md)
- [Calculator PDF Preview](../../src/components/calculator/CalculatorPDFPreview.tsx)
- [useCalculatorData Hook](../hooks/useCalculatorData.md)
