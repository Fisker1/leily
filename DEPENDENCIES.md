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

## 📧 Resend (Email)

**Formål:** E-post-varsling til leietakere og utleiere

**Setup:**
- Dashboard: https://resend.com/
- Legg til domene: https://resend.com/domains
- Verifiser `leily.no` domenet

**Secrets (Supabase Vault):**
- `RESEND_API_KEY` - API key fra Resend dashboard

**Brukes i:**
- `supabase/functions/send-lease-notification/index.ts` - Email sending

**Dokumentasjon:**
- Implementering: `docs/integrations/resend.md` (kommer)

**Kostnader:**
- Free tier: 3000 emails/måned
- Paid: $20/mnd for 50,000 emails

**Slik sletter du:**
1. Slett/kommenter ut email-koden i `send-lease-notification`
2. Fjern `RESEND_API_KEY` secret
3. Oppdater `SignatureRequestDialog.tsx` til å ikke sende email

---

## 📱 Link Mobility (SMS) - KOMMER SNART

**Formål:** SMS-varsling til leietakere

**Setup:**
- Hjemmeside: https://www.linkmobility.no/
- Registrer konto og bestill SMS-tjeneste

**Secrets (Supabase Vault):**
- `LINK_MOBILITY_API_KEY` - Kommer når tjenesten aktiveres

**Brukes i:**
- `supabase/functions/send-lease-notification/index.ts` - SMS sending (stub implementert)

**Status:** 
- ⚠️ Stub-implementasjon på plass
- Venter på API-nøkkel og prising

**Kostnader:**
- Per SMS (norske priser)
- Kontakt Link Mobility for avtale

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

## 📊 Migrering til Azure (Fremtid)

**Når du skal flytte til Azure:**

**E-post:**
- Bytt fra Resend til Azure Communication Services Email
- Oppdater `send-lease-notification` Edge Function
- Ny secret: `AZURE_COMMUNICATION_CONNECTION_STRING`

**SMS:**
- Bytt fra Link Mobility til Azure Communication Services SMS
- Samme Edge Function som email
- Bruk samme Azure connection string

**BankID:**
- Signicat fungerer uavhengig av hosting-platform
- Ingen endringer nødvendig

**Database:**
- Supabase kan fortsatt brukes
- Eller migrer til Azure Database for PostgreSQL

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

**Sist oppdatert:** 2025-01-03
**Vedlikeholdes av:** Leily Development Team
