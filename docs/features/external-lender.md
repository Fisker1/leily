# Ekstern/Privat Lånegiver Funksjon

## Oversikt

Denne funksjonen lar brukere registrere eksterne eller private lånegivere i boligfinansieringsrapporten, samt laste opp covenant-dokumenter som vedlegg. Innstillingene kan lagres og gjenbrukes i alle rapporter.

## Lagrede Innstillinger

Brukere kan nå lagre sine privatlån-innstillinger via:
- **Wallet-knapp** over chatten (blå knapp ved siden av Lånekalkulator)
- Innstillingene lagres i databasen og fylles automatisk ut i alle fremtidige rapporter
- Kan oppdateres når som helst via samme knapp

## Funksjonalitet

### 1. Visning i Rapport
- **Plassering**: Som en sub-seksjon under "Låneinformasjon" (seksjon 2)
- **Visning**: Kun synlig når "hasExternalLender" er true
- **Styling**: Mindre og mer kompakt enn hovedseksjoner, med venstre border

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

### Database Schema

**Tabell**: `external_lender_settings`

```sql
CREATE TABLE external_lender_settings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  has_external_lender BOOLEAN NOT NULL DEFAULT false,
  external_lender_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**RLS Policies**: Brukere kan kun se og redigere sine egne innstillinger.

### Data Struktur

```typescript
interface CalculatorData {
  // ... andre felter
  hasExternalLender: boolean;
  externalLenderName: string;
  covenantFile: File | null;
  covenantFileUrl: string;
}

interface ExternalLenderSettings {
  hasExternalLender: boolean;
  externalLenderName: string;
}
```

### Komponenter

#### ExternalLenderDialog
- Dialog for å konfigurere lagrede innstillinger
- Checkbox for å aktivere/deaktivere ekstern lånegiver
- Tekstfelt for navn på lånegiver
- Lagrer innstillinger i databasen

#### CalculatorPDFPreview
- Viser ekstern lånegiver som en sub-seksjon under låneinformasjon
- Kun synlig når hasExternalLender er true
- Kompakt design med venstre border
- Fil-opplasting for covenant-dokumenter

#### CalculatorChat
- Wallet-knapp (blå) for å åpne ExternalLenderDialog
- Anvender lagrede innstillinger til rapporten

#### useExternalLenderSettings Hook
- Laster og lagrer innstillinger fra/til databasen
- Håndterer state for ekstern lånegiver

#### useCalculatorData Hook
- Lagrer state for ekstern lånegiver i rapporten
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
