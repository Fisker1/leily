# Legal Documents Management - Workflow

## Oversikt

Admin Legal Documents-systemet lar deg administrere alle kritiske og lovpålagte dokumenter i Leily med versjonskontroll, mulighet til å eksportere til advokat, og importere reviderte versjoner tilbake.

---

## 📋 Dokumenttyper i Systemet

| Dokumenttype | Filnavn | Plassering | Status |
|--------------|---------|------------|--------|
| **Personvernpolicy** | `privacy_policy` | `src/components/legal/PrivacyPolicy.tsx` | ✅ Aktiv |
| **Vilkår for bruk** | `terms_of_service` | `src/components/legal/TermsOfService.tsx` | ✅ Aktiv |
| **Standard Leieavtale** | `lease_agreement_template` | `supabase/functions/generate-lease-pdf/index.ts` | ✅ Aktiv |
| **Cookie Policy** | `cookie_policy` | `src/components/legal/CookieConsent.tsx` | 🔄 Planlagt |

---

## 🔄 Arbeidsflyt: Fra Eksport til Aktivering

### **Steg 1: Eksportere Dokumenter til Advokat**

1. **Logg inn som Admin**
   - Gå til `/admin`
   - Sikre at du har `admin`-rolle i `user_roles`-tabellen

2. **Naviger til Legal Documents**
   - Klikk på "Juridiske Dokumenter"-tab
   - Du vil se oversikt over alle dokumenter med versjon og status

3. **Eksporter Aktive Dokumenter**
   ```
   For hvert dokument:
   1. Klikk "👁️ Preview" for å se innholdet
   2. Klikk "📥 Download" for å laste ned
      - Markdown-format: `.md`-fil
      - HTML-format: `.html`-fil
   ```

4. **Send til Advokat**
   ```
   E-post eksempel:
   
   Til: advokat@firma.no
   Emne: Juridisk Revidering - Leily Dokumenter v1.0
   
   Vedlagt:
   - privacy_policy_v1.0.md
   - terms_of_service_v1.0.md
   - lease_agreement_template_v1.0.html
   
   Vennligst revider dokumentene i henhold til norsk lov.
   Returner i samme format med merknader.
   ```

---

### **Steg 2: Motta Reviderte Dokumenter fra Advokat**

**Forventet retur fra advokat:**
- Samme filformat (Markdown eller HTML)
- Inneholder alle lovpålagte endringer
- Inkluderer merknader om endringer
- Ny versjonsnummer (f.eks. v2.0)

**Eksempel på advokats returnotat:**
```
REVIDERING: Personvernpolicy v2.0

ENDRINGER:
1. Lagt til GDPR Artikkel 15 (rett til innsyn)
2. Oppdatert informasjon om databehandleravtaler
3. Tydeliggjort sletteprosess for persondata
4. Lagt til kontaktinfo for Datatilsynet

STATUS: Godkjent for bruk
DATO: 2025-01-15
ADVOKAT: [Navn], [Firma]
```

---

### **Steg 3: Last opp Revidert Dokument**

1. **Åpne Upload Dialog**
   - Klikk "📤 Last opp Revidert Versjon"

2. **Fyll ut Skjema**
   ```
   Dokumenttype: [Velg fra dropdown]
   Versjon: 2.0
   Tittel: [Samme som original]
   Format: Markdown / HTML
   Innhold: [Lim inn fra advokat]
   Notater: [Merknader fra advokat]
   ```

3. **Last opp**
   - Klikk "Last opp"
   - Dokument får status: `under_review` 🟡

---

### **Steg 4: Godkjenning og Aktivering**

**Status-flow:**
```
draft → under_review → approved → active → (archived)
```

1. **Review Stage (under_review)**
   - Dokument vises i tabellen med gul badge 🟡
   - Admin kan preview innholdet
   - Sammenligne med tidligere versjon

2. **Godkjenn (approved)**
   - Klikk "Godkjenn"-knappen
   - Status endres til `approved` ✅
   - Dokumentet er klart for aktivering

3. **Aktiver (active)**
   - Klikk "Aktiver"-knappen
   - Status endres til `active` 🟢
   - `effective_date` settes til nå
   - Dokumentet er nå i bruk på nettsiden

---

## 🔒 Sikkerhet og Tilgangskontroll

### Row Level Security (RLS) Policies

**Admins:**
```sql
-- Admins kan gjøre alt
CREATE POLICY "Admins can manage legal documents"
ON public.legal_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

**Offentlig:**
```sql
-- Alle kan se aktive dokumenter
CREATE POLICY "Everyone can view active legal documents"
ON public.legal_documents
FOR SELECT
USING (status = 'active');
```

### Audit Logging

Alle endringer logges automatisk:
```sql
-- I audit_log-tabellen
{
  "action": "legal_document_status_changed",
  "document_id": "uuid",
  "old_status": "approved",
  "new_status": "active",
  "version": "2.0"
}
```

---

## 📊 Database Schema

### legal_documents tabell

```sql
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY,
  document_type TEXT NOT NULL,  -- 'privacy_policy', 'terms_of_service', etc.
  version TEXT NOT NULL,         -- '1.0', '2.0', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,         -- Full innhold
  content_format TEXT NOT NULL,  -- 'markdown' eller 'html'
  status TEXT NOT NULL,          -- 'draft', 'under_review', 'approved', 'active', 'archived'
  reviewed_by UUID,              -- Admin som reviewet
  approved_by UUID,              -- Admin som godkjente
  uploaded_by UUID,              -- Admin som lastet opp
  effective_date TIMESTAMP,      -- Når dokumentet ble aktivt
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  notes TEXT,                    -- Merknader fra advokat
  UNIQUE(document_type, version)
);
```

---

## 🔄 Synkronisering med Kode

### Når et Dokument Aktiveres

**Manuelt steg (etter aktivering):**

1. **For Frontend-komponenter** (`privacy_policy`, `terms_of_service`):
   ```typescript
   // Oppdater src/components/legal/PrivacyPolicy.tsx
   // Kopier innhold fra aktivert dokument
   // Deploy til produksjon
   ```

2. **For Edge Function-templates** (`lease_agreement_template`):
   ```typescript
   // Oppdater supabase/functions/generate-lease-pdf/index.ts
   // Erstatt HTML-template med nytt innhold
   // Deploy Edge Function
   ```

**Automatisk synkronisering (fremtidig):**
- Planlagt: Automatisk oppdatering av komponenter ved aktivering
- Planlagt: API-endpoint for å hente aktiv versjon dynamisk

---

## 📝 Eksempel: Full Workflow

### Scenario: Oppdatere Personvernpolicy

**Dag 1: Eksport**
```bash
1. Admin logger inn på /admin
2. Går til "Juridiske Dokumenter"
3. Finner "Personvernpolicy v1.0" (status: active)
4. Klikker Download → privacy_policy_v1.0.md
5. Sender til advokat@firma.no
```

**Dag 5: Advokat returnerer**
```
Mottatt:
- privacy_policy_v2.0.md
- Merknader: "Lagt til GDPR Artikkel 13, 14, 15"
```

**Dag 6: Upload og Godkjenning**
```bash
1. Admin klikker "Last opp Revidert Versjon"
2. Fyller ut:
   - Dokumenttype: privacy_policy
   - Versjon: 2.0
   - Innhold: [limer inn fra .md-fil]
   - Notater: "GDPR Artikkel 13, 14, 15 lagt til"
3. Klikker "Last opp"
   → Status: under_review

4. Admin reviewer innholdet
5. Klikker "Godkjenn"
   → Status: approved

6. Admin klikker "Aktiver"
   → Status: active
   → effective_date: 2025-01-11
```

**Dag 7: Oppdater Frontend**
```typescript
// src/components/legal/PrivacyPolicy.tsx
// Erstatt gammelt innhold med nytt
// Deploy til produksjon
```

---

## 🛠️ Teknisk Implementering

### Export-funksjonalitet

```typescript
const handleExportMarkdown = (doc: LegalDocument) => {
  const blob = new Blob([doc.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.document_type}_v${doc.version}.md`;
  a.click();
};
```

### Upload-funksjonalitet

```typescript
const handleUploadRevised = async () => {
  const { error } = await supabase
    .from('legal_documents')
    .insert({
      document_type: uploadForm.document_type,
      version: uploadForm.version,
      content: uploadForm.content,
      status: 'under_review',
      uploaded_by: user.id,
    });
};
```

### Status-endring

```typescript
const handleStatusChange = async (docId: string, newStatus: string) => {
  const updateData: any = { status: newStatus };
  
  if (newStatus === 'active') {
    updateData.effective_date = new Date().toISOString();
    updateData.approved_by = user.id;
  }

  await supabase
    .from('legal_documents')
    .update(updateData)
    .eq('id', docId);
};
```

---

## ⚠️ Viktige Merknader

### Før du Aktiverer et Nytt Dokument:

1. ✅ **Les nøye gjennom advokats merknader**
2. ✅ **Sammenlign med forrige versjon**
3. ✅ **Verifiser alle lovpålagte elementer er inkludert**
4. ✅ **Test at formateringen er korrekt (preview)**
5. ✅ **Lag backup av gammelt dokument før aktivering**

### Etter Aktivering:

1. ⚠️ **Oppdater frontend-komponenter manuelt**
2. ⚠️ **Deploy til produksjon**
3. ⚠️ **Informer teamet om endringene**
4. ⚠️ **Arkiver gammel versjon (sett status: archived)**

---

## 📞 Support og Ressurser

### Interne Ressurser
- **Dokumentasjon:** `docs/legal/standard-leieavtale.md`
- **Admin Guide:** `docs/admin/legal-documents-workflow.md`
- **Database Schema:** `docs/database/legal_documents.md`

### Eksterne Ressurser
- **Datatilsynet:** https://www.datatilsynet.no/
- **Lovdata (Husleieloven):** https://lovdata.no/dokument/NL/lov/1999-03-26-17
- **Forbrukerrådet (Leieavtaler):** https://www.forbrukerradet.no/

### Juridisk Support
- **Advokat Kontakt:** [Legg til kontaktinfo]
- **Juridisk Rådgiver:** [Legg til kontaktinfo]

---

## 🔄 Versjonskontroll Best Practices

### Versjonsnummerering

```
v1.0 → Initial versjon
v1.1 → Minor endringer (typos, formatering)
v2.0 → Major endringer (nye lovpålagte elementer)
v2.1 → Patch (små justeringer)
```

### Arkivering av Gamle Versjoner

```sql
-- Aldri slett gamle versjoner!
-- Arkiver i stedet:
UPDATE legal_documents
SET status = 'archived'
WHERE document_type = 'privacy_policy'
  AND version = '1.0';
```

### Historikk og Sporing

```sql
-- Se alle versjoner av et dokument
SELECT version, status, effective_date, notes
FROM legal_documents
WHERE document_type = 'privacy_policy'
ORDER BY created_at DESC;
```

---

**Sist oppdatert:** 2025-01-03  
**Vedlikeholdes av:** Leily Admin Team
