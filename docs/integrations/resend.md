# Resend Email Integration

## Oversikt
Resend brukes for å sende transaksjonelle e-poster til leietakere og utleiere i Leily-systemet.

## Setup

### 1. Opprett Resend Konto
1. Gå til https://resend.com/ og registrer deg
2. Verifiser e-postadressen din

### 2. Legg til Domene
1. Gå til https://resend.com/domains
2. Klikk "Add Domain"
3. Legg til `leily.no`
4. Følg instruksjonene for å verifisere domenet:
   - Legg til DNS-records (MX, TXT, CNAME)
   - Vent på verifikasjon (kan ta opp til 48 timer)

### 3. Opprett API-nøkkel
1. Gå til https://resend.com/api-keys
2. Klikk "Create API Key"
3. Navn: `Leily Production`
4. Permission: `Sending access`
5. Kopier API-nøkkelen

### 4. Legg til i Supabase
1. Gå til Supabase Dashboard → Settings → Functions
2. Legg til secret: `RESEND_API_KEY`
3. Lim inn API-nøkkelen

## Bruk i Prosjektet

### Edge Function
```typescript
// supabase/functions/send-lease-notification/index.ts
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

await resend.emails.send({
  from: 'Leily <noreply@leily.no>',
  to: [recipientEmail],
  subject: 'Leieavtale klar for signering',
  html: emailHtml,
});
```

### E-post Maler
Alle e-post-maler er definert i `send-lease-notification/index.ts`:

**Leietaker Notification:**
- Sendes når leieavtale sendes til signering
- Inneholder eiendomsinfo, leiedetaljer, signeringslenke
- HTML-formatert med styling

**Utleier Notification:**
- Sendes når utleier må signere
- Viser leietaker-info og signeringslenke

## Testing

### Test i Development
```bash
# Send test e-post via Edge Function
curl -X POST https://[project-ref].supabase.co/functions/v1/send-lease-notification/email \
  -H "Authorization: Bearer [anon-key]" \
  -d '{"signatureId": "test-id", "recipientType": "tenant"}'
```

### Sjekk Status
- Dashboard: https://resend.com/emails
- Se sent, delivered, opened, clicked

## E-post Typer

### 1. Leieavtale til Signering (Leietaker)
**Trigger:** Når utleier sender leieavtale til signering  
**Recipient:** Leietaker e-post  
**Innhold:**
- Velkommen-melding
- Eiendomsinfo (adresse, størrelse, type)
- Leiedetaljer (pris, depositum, datoer)
- BankID-instruksjoner
- Signeringslenke (stor knapp)
- Kontaktinfo utleier

### 2. Signer Leieavtale (Utleier)
**Trigger:** Når leieavtale opprettes  
**Recipient:** Utleier e-post  
**Innhold:**
- Eiendomsinfo
- Leietaker-info
- Signeringslenke
- Informasjon om neste steg

### 3. Signering Fullført
**Trigger:** Når begge har signert  
**Recipient:** Både utleier og leietaker  
**Innhold:**
- Bekreftelse på fullført signering
- Lenke til signert dokument
- Neste steg (f.eks. innflytting)

## Kostnader

**Free Tier:**
- 3,000 emails/måned
- 100 emails/dag

**Paid Plans:**
- $20/måned for 50,000 emails
- $80/måned for 200,000 emails

For Leily:
- Anslått 100-500 emails/måned (avhengig av antall nye leieavtaler)
- Free tier bør være tilstrekkelig i starten

## Feilsøking

### E-post kommer ikke frem
1. Sjekk at domenet er verifisert i Resend Dashboard
2. Sjekk spam-folder
3. Verifiser at `from`-adressen er korrekt (må være @leily.no)
4. Se Edge Function logs i Supabase

### Rate Limiting
- Resend har rate limits: 10 requests/sekund
- Implementert retry-logic i Edge Function

### Bounce/Complaint
- Se Resend Dashboard for bounces
- Fjern ugyldige e-poster fra database

## Bytte til Azure Communication Services (Fremtid)

Når dere flytter til Azure:

```typescript
// Erstatt Resend med Azure Communication Services
import { EmailClient } from "@azure/communication-email";

const client = new EmailClient(connectionString);

await client.beginSend({
  senderAddress: "noreply@leily.no",
  content: {
    subject: "Leieavtale klar for signering",
    html: emailHtml,
  },
  recipients: {
    to: [{ address: recipientEmail }],
  },
});
```

## Lenker

- Dashboard: https://resend.com/
- Docs: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference
- Status: https://status.resend.com/
- Support: support@resend.com

---

**Sist oppdatert:** 2025-01-03  
**Vedlikeholdes av:** Leily Development Team
