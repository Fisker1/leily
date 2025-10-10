# External Service Dependencies

Denne filen dokumenterer alle eksterne tjenester og avhengigheter i Leily-prosjektet.

## 🔐 Signicat (BankID Signering)

**Formål:** Elektronisk signering av leieavtaler med norsk BankID

**Setup:**
- Developer Portal: https://developer.signicat.com/
- Dokumentasjon: https://developer.signicat.com/docs/signature/

**Secrets (Supabase Vault):**
- `SIGNICAT_CLIENT_ID` - Client ID fra Signicat
- `SIGNICAT_CLIENT_SECRET` - Client Secret fra Signicat
- `SIGNICAT_ACCOUNT_ID` - Account ID fra Signicat
- `SIGNICAT_WEBHOOK_SECRET` - Self-generated random string for webhook validation

**Brukes i:**
- `supabase/functions/signicat-signing/index.ts` - Alle Signicat API-kall
- Database: `lease_signatures` tabell

**Dokumentasjon:**
- Implementering: `docs/integrations/signicat.md` (kommer)
- API Docs: `docs/apis/supabase-functions.md`

**Kostnader:**
- Per signatur (kontakt Signicat for prising)
- Test-miljø tilgjengelig

**Slik sletter du:**
1. Slett Edge Function: `supabase/functions/signicat-signing/`
2. Fjern secrets fra Supabase Dashboard
3. Slett entries fra `supabase/config.toml`
4. Fjern `lease_signatures` tabell (kjør migration)

---

## 📧 Resend (Email) - MIDLERTIDIG LØSNING

> ⚠️ **Status:** Aktiv i test-fase med `alquiz.no`  
> 🔄 **Planlagt migrering:** Azure Communication Services (se `docs/migration/resend-to-azure.md`)

**Formål:** E-post-varsling til leietakere og utleiere (midlertidig løsning)

**Nåværende Setup:**
- Dashboard: https://resend.com/
- **Test-domene:** `alquiz.no` (verifisert)
- **Produksjons-domene:** `leily.no` (IKKE verifisert - krever oppgradering)

**Secrets (Supabase Vault):**
- `RESEND_API_KEY` - API key fra Resend dashboard

**Brukes i:**
- `supabase/functions/send-lease-notification/index.ts` - Email sending
- Nåværende `from`-adresse: `noreply@alquiz.no`

**Dokumentasjon:**
- Implementering: `docs/integrations/resend.md`
- **Migreringsplan:** `docs/migration/resend-to-azure.md`

**Kostnader:**
- Free tier: 3000 emails/måned
- Paid: $20/mnd for 50,000 emails
- **Azure alternativ:** $0.0001 per email (95% billigere!)

**Migrering til Azure:**
Se detaljert guide i `docs/migration/resend-to-azure.md`

---

## 📱 Link Mobility (SMS) - VENTER MED IMPLEMENTERING

> ⚠️ **Status:** Stub implementert, men IKKE aktiv  
> 🔄 **Planlagt løsning:** Azure Communication Services SMS (se `docs/migration/link-mobility-to-azure.md`)

**Formål:** SMS-varsling til leietakere

**Nåværende Status:**
- ❌ IKKE implementert (kun stub i kode)
- ❌ Ingen API-nøkkel satt opp
- ⏸️ Venter med implementering til Azure-migrering

**Fremtidig Løsning:**
- **Azure Communication Services SMS**
- Norsk telefonnummer (+47)
- ~0.40 NOK per SMS (20% billigere enn Link Mobility)

**Dokumentasjon:**
- **Migreringsplan:** `docs/migration/link-mobility-to-azure.md`
- Integrasjon: `docs/integrations/link-mobility.md`

**Kostnader (sammenligning):**
- Link Mobility: ~0.50 NOK per SMS
- Azure SMS: ~0.40 NOK per SMS (20% besparelse)

**Implementering:**
Se detaljert guide i `docs/migration/link-mobility-to-azure.md`

---

## 🗄️ Database Tabeller (Supabase)

**Nye tabeller for signering:**
- `lease_signatures` - Sporer BankID-signeringer
- `lease_agreements` - Oppdatert med signature_status felter

**RLS Policies:**
- Kun property owners kan se egne signaturer
- Audit logging via triggers

**Slik reverter du:**
```sql
-- Slett signatur-funksjonalitet
DROP TABLE IF EXISTS lease_signatures CASCADE;
ALTER TABLE lease_agreements 
  DROP COLUMN IF EXISTS signature_status,
  DROP COLUMN IF EXISTS signed_document_url,
  DROP COLUMN IF EXISTS signature_initiated_at,
  DROP COLUMN IF EXISTS signature_completed_at;
```

---

## 🚀 Edge Functions (Supabase)

**Nye funksjoner:**
1. `generate-lease-pdf` - Genererer PDF av leieavtale
2. `signicat-signing` - Håndterer Signicat-integrasjon
3. `send-lease-notification` - Sender e-post og SMS

**Konfigurasjon:**
- `supabase/config.toml` - JWT settings

**Slik sletter du:**
1. Slett mapper under `supabase/functions/`
2. Fjern entries fra `supabase/config.toml`
3. Deploy vil automatisk fjerne dem

---

## 🎨 Frontend Komponenter

**Nye komponenter:**
- `src/components/signing/SignatureStatusCard.tsx`
- `src/components/signing/SignatureTimeline.tsx`
- `src/components/signing/SignatureRequestDialog.tsx`
- `src/pages/LeaseSignature.tsx`

**Oppdaterte komponenter:**
- `src/components/RentalAgreementDialog.tsx` - Steg 4 for signering (må fullføres)
- `src/pages/Rental.tsx` - Signatur status badges (må fullføres)

**Slik reverter du:**
1. Slett `src/components/signing/` folder
2. Slett `src/pages/LeaseSignature.tsx`
3. Reverter endringer i RentalAgreementDialog og Rental

---

## 📧 Microsoft Graph Email Service (Implementert)

> 🎯 **Status:** ✅ IMPLEMENTERT OG TESTET  
> 📅 **Implementert:** Oktober 2025

**Formål:** Profesjonell e-postleveranse via Microsoft Graph API

**Fordeler:**
- **Høy deliverability** via Microsoft Exchange
- **Profesjonelle HTML-maler** med Leily-branding
- **Automatisk integrert** med brukerregistrering og passord-tilbakestilling
- **Skalerbar** uten volum-begrensninger
- **GDPR-compliant** (Microsoft West Europe)

**Implementert:**
1. ✅ Azure App Registration "Leily Email Service"
2. ✅ Microsoft Graph API-integrasjon
3. ✅ Supabase Edge Function `send-leily-email`
4. ✅ HTML e-postmaler med dynamisk innhold
5. ✅ Integrert med AuthContext for automatisk e-postsending

**Secrets (Supabase Vault):**
- `MICROSOFT_CLIENT_ID` - Azure App Registration Client ID
- `MICROSOFT_CLIENT_SECRET` - Azure App Registration Client Secret  
- `MICROSOFT_TENANT_ID` - Azure Tenant ID
- `MICROSOFT_EMAIL_USER` - Sender e-postadresse (anderslundoy@leily.no)

**E-posttyper:**
- Account created (velkommen)
- Password reset (tilbakestill passord)
- Lease ready (leieavtale klar)
- Payment reminder (betalingspåminnelse)

**Dokumentasjon:**
- **Setup-guide:** `docs/integrations/microsoft-exchange.md`
- **Frontend-integrasjon:** `src/hooks/useEmailService.tsx`
- **Backend-implementasjon:** `supabase/functions/send-leily-email/`

**Tidsplan:**
| Fase | Aktivitet | Tidsestimat |
|------|-----------|-------------|
| 1 | Setup Azure ACS | 1-2 timer |
| 2 | E-post migrering | 4-6 timer |
| 3 | Testing i staging | 1 uke |
| 4 | Produksjon e-post | 1 dag |
| 5 | SMS implementering | 3-4 timer |
| 6 | Cleanup | 1 time |

**BankID (Signicat):**
- ✅ Fungerer uavhengig av hosting-platform
- ✅ Ingen endringer nødvendig ved Azure-migrering

**Database (Supabase):**
- ✅ Kan fortsatt brukes med Azure hosting
- Alternativ: Migrer til Azure Database for PostgreSQL (valgfritt)

---

## 🔍 Debugging & Logging

**Edge Function Logs:**
- Supabase Dashboard: Functions → [function-name] → Logs
- Alle funksjoner logger viktige events

**Database Audit Log:**
- Tabell: `audit_log`
- Sporer alle signerings-events

**Webhook Testing:**
- Signicat sender webhooks til `/signicat-signing/webhook`
- Valider webhook signature med `SIGNICAT_WEBHOOK_SECRET`

---

## 📞 Support Kontakter

**Signicat:**
- Support: https://support.signicat.com/
- Sales: sales@signicat.com

**Resend:**
- Support: support@resend.com
- Status: https://status.resend.com/

**Link Mobility:**
- Support: https://www.linkmobility.no/kontakt/
- Sales: sales@linkmobility.no

**Supabase:**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com/

---

---

## 📚 Relaterte Dokumenter

**Integrasjoner:**
- Signicat: `docs/integrations/signicat.md`
- Resend: `docs/integrations/resend.md`
- Link Mobility: `docs/integrations/link-mobility.md`
- **Azure Communication Services:** `docs/integrations/azure-communication-services.md`

**Migreringer:**
- **Resend → Azure:** `docs/migration/resend-to-azure.md`
- **Link Mobility → Azure:** `docs/migration/link-mobility-to-azure.md`

**Workflows:**
- Lease Signing: `docs/workflows/lease-signing.md`

---

**Sist oppdatert:** 2025-01-03  
**Vedlikeholdes av:** Leily Development Team
