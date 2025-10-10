# Scrive API Integrasjon - Elektronisk Signering

## 📋 Oversikt

Scrive er en norsk leverandør av elektronisk signering som tilbyr en gratis API for testing og utvikling. Dette dokumentet beskriver planene for å integrere Scrive API i Leily-plattformen for å automatisere signeringsprosessen for leieavtaler.

## 🎯 Mål

- Automatisere signeringsprosessen for leieavtaler
- Redusere papirarbeid og manuelle prosesser
- Forbedre brukeropplevelsen for både utleiere og leietakere
- Sikre juridisk compliance med norsk lov
- Integrere sømløst med eksisterende leieavtale-system

## 🔧 Teknisk Arkitektur

### API Integrasjon
```
Leily Frontend (React)
    ↓
Supabase Edge Function (send-scrive-document)
    ↓
Scrive API
    ↓
E-post Notifikasjoner (Microsoft Graph)
```

### Database Schema
```sql
-- Signeringsdokumenter
CREATE TABLE signing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_agreement_id UUID REFERENCES lease_agreements(id),
  scrive_document_id VARCHAR(255) UNIQUE,
  document_type VARCHAR(50), -- 'lease_agreement', 'addendum', 'termination'
  status VARCHAR(50), -- 'draft', 'sent', 'signed', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Signeringsstatus
CREATE TABLE document_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES signing_documents(id),
  user_id UUID REFERENCES users(id),
  signer_email VARCHAR(255),
  signer_name VARCHAR(255),
  signer_role VARCHAR(50), -- 'landlord', 'tenant', 'witness'
  status VARCHAR(50), -- 'pending', 'sent', 'signed', 'declined'
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📡 Scrive API Endepunkter

### 1. Opprett Dokument
```http
POST https://api.scrive.com/v2/documents
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "title": "Leieavtale - {{property_address}}",
  "message": "Vennligst signer leieavtalen for {{property_address}}",
  "expiresInDays": 30,
  "signers": [
    {
      "email": "{{landlord_email}}",
      "name": "{{landlord_name}}",
      "role": "landlord"
    },
    {
      "email": "{{tenant_email}}",
      "name": "{{tenant_name}}",
      "role": "tenant"
    }
  ]
}
```

### 2. Last opp PDF
```http
POST https://api.scrive.com/v2/documents/{document_id}/files
Authorization: Bearer {api_key}
Content-Type: multipart/form-data

file: [PDF binary data]
```

### 3. Send for Signering
```http
POST https://api.scrive.com/v2/documents/{document_id}/send
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "message": "Leieavtale klar for signering"
}
```

### 4. Hent Status
```http
GET https://api.scrive.com/v2/documents/{document_id}
Authorization: Bearer {api_key}
```

## 🚀 Implementasjonsplan

### Fase 1: API Testing og Utvikling (Q3 2025)
- [ ] Scrive API konto oppsett
- [ ] Grunnleggende API testing
- [ ] Supabase Edge Function for Scrive integrasjon
- [ ] Database schema implementasjon

### Fase 2: Grunnleggende Funksjonalitet (Q3 2025)
- [ ] PDF generering for leieavtaler
- [ ] Dokument opprettelse via Scrive API
- [ ] E-post notifikasjoner for signering
- [ ] Grunnleggende status tracking

### Fase 3: Avansert Workflow (Q4 2025)
- [ ] React komponenter for signeringsprosess
- [ ] Real-time status oppdateringer
- [ ] Automatisk dokument arkivering
- [ ] Feilhåndtering og retry logikk

### Fase 4: Integrasjon og Testing (Q4 2025)
- [ ] Integrasjon med eksisterende leieavtale-system
- [ ] End-to-end testing
- [ ] Brukertesting og feedback
- [ ] Produksjons deploy

## 💡 Brukstilfeller

### 1. Leieavtale Signering
```
1. Utleier oppretter leieavtale i Leily
2. System genererer PDF med leieavtale
3. Scrive API oppretter signeringsdokument
4. E-post sendes til leietaker for signering
5. Begge parter signerer elektronisk
6. Signert dokument arkiveres automatisk
```

### 2. Tilleggsavtaler
```
1. Utleier oppretter tilleggsavtale
2. PDF genereres med tilleggsinformasjon
3. Eksisterende signeringsprosess kjøres
4. Signert tilleggsavtale legges til leieavtale
```

### 3. Oppsigelsesdokumenter
```
1. Oppsigelse registreres i systemet
2. Oppsigelsesdokument genereres
3. Signeringsprosess for oppsigelse
4. Automatisk arkivering og notifikasjoner
```

## 🔐 Sikkerhet og Compliance

### Juridisk Compliance
- Scrive er sertifisert for elektronisk signering i Norge
- Signaturer er juridisk gyldige i henhold til norsk lov
- Audit trail for alle signeringsprosesser
- GDPR compliance for personopplysninger

### Sikkerhet
- API nøkler lagres sikkert i Supabase secrets
- HTTPS for all kommunikasjon
- Dokument kryptering
- Tilgangskontroll og autentisering

## 📊 Monitoring og Analytics

### Metrics
- Signeringsrater
- Tidsbruk for signering
- Feilrater og retry statistikk
- Brukeradopsjon

### Logging
- API kall logging
- Feilhåndtering og debugging
- Brukerinteraksjoner
- System ytelse

## 🛠️ Utviklingsmiljø

### Test Data
- Test Scrive API konto
- Mock data for utvikling
- Test e-post adresser
- Sample PDF dokumenter

### Testing
- Unit tests for API integrasjon
- Integration tests for end-to-end flow
- User acceptance testing
- Performance testing

## 📚 Ressurser

### Scrive Dokumentasjon
- [Scrive API Documentation](https://docs.scrive.com/)
- [Scrive Developer Portal](https://developer.scrive.com/)
- [Scrive SDK](https://github.com/scrive/sdk)

### Juridisk Informasjon
- [Elektronisk signering i Norge](https://lovdata.no/dokument/NL/lov/2001-05-18-31)
- [GDPR compliance](https://gdpr.eu/)

## 🎯 Suksesskriterier

### Tekniske Kriterier
- [ ] 99.9% API tilgjengelighet
- [ ] < 5 sekunder response time
- [ ] 100% signeringssuksess rate
- [ ] Automatisk feilhåndtering

### Forretningskriterier
- [ ] 50% reduksjon i papirarbeid
- [ ] 80% brukeradopsjon
- [ ] 90% brukertilfredshet
- [ ] Juridisk compliance 100%

---

*Dokument oppdatert: {{current_date}}*
*Neste gjennomgang: Q3 2025*
