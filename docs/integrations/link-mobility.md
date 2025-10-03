# Link Mobility SMS Integration

## Status: 🚧 KOMMER SNART

Link Mobility SMS-integrasjonen er forberedt, men venter på API-nøkkel og prising.

## Oversikt
Link Mobility brukes for å sende SMS-varslinger til leietakere når leieavtaler er klare for signering.

## Setup (Når aktivert)

### 1. Opprett Link Mobility Konto
1. Gå til https://www.linkmobility.no/
2. Registrer deg for en konto
3. Kontakt salg for SMS-tjeneste

### 2. Bestill SMS-tjeneste
1. Bestill SMS Gateway API
2. Få tildelt API-nøkkel
3. Sett opp avsendernavn (f.eks. "Leily")

### 3. Legg til API-nøkkel
1. Gå til Supabase Dashboard → Settings → Functions
2. Legg til secret: `LINK_MOBILITY_API_KEY`
3. Lim inn API-nøkkelen

## Implementering

### Current Status
En stub-implementasjon er på plass i:
```typescript
// supabase/functions/send-lease-notification/index.ts
async function sendSmsNotification(req: Request) {
  const linkMobilityApiKey = Deno.env.get('LINK_MOBILITY_API_KEY');
  
  if (!linkMobilityApiKey) {
    console.log('Link Mobility not configured yet - SMS notification skipped');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS notification skipped - Link Mobility not configured',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // TODO: Implement actual SMS sending
}
```

### Future Implementation
Når API-nøkkelen er tilgjengelig:

```typescript
async function sendSmsNotification(req: Request) {
  const apiKey = Deno.env.get('LINK_MOBILITY_API_KEY');
  const { signatureId, recipientType, phoneNumber } = await req.json();

  // Fetch signature and lease data
  const { data: signature } = await supabaseClient
    .from('lease_signatures')
    .select(`
      *,
      lease_agreements(
        *,
        property:properties(*),
        tenant:tenants(*)
      )
    `)
    .eq('id', signatureId)
    .single();

  const lease = signature.lease_agreements;
  const property = lease.property;

  // Construct SMS message
  const message = recipientType === 'tenant'
    ? `Hei! Du har en leieavtale å signere for ${property.address}. Sjekk e-posten din for lenke. - Leily`
    : `Din leieavtale for ${property.address} er klar for signering. Sjekk e-posten din. - Leily`;

  // Send SMS via Link Mobility API
  const response = await fetch('https://wsx.sp247.net/sms/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'Leily',
      destination: phoneNumber,
      userData: message,
      platformId: 'YOUR_PLATFORM_ID',
      platformPartnerId: 'YOUR_PARTNER_ID',
    }),
  });

  if (!response.ok) {
    throw new Error(`SMS sending failed: ${await response.text()}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'SMS sent successfully',
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

## SMS Meldinger

### Leietaker Signering
```
Hei! Du har en leieavtale å signere for [adresse]. Sjekk e-posten din for lenke og detaljer. - Leily
```

### Signering Fullført (Utleier)
```
Leieavtalen for [adresse] er nå signert av begge parter. Gratulerer! - Leily
```

## API Dokumentasjon
- Link Mobility Docs: https://www.linkmobility.com/developers/
- SMS Gateway API: https://www.linkmobility.com/products/sms-gateway/

## Kostnader
**Må avklares med Link Mobility:**
- Pris per SMS (typisk 0.30 - 0.50 kr per SMS i Norge)
- Månedlig abonnement (hvis relevant)
- Oppsettkostnader

**Anslått bruk for Leily:**
- 2 SMS per leieavtale (leietaker + bekreftelse)
- 100 leieavtaler/måned = 200 SMS = ~60-100 kr/måned
- Free tier: Sjekk om det finnes

## Testing

### Test SMS (Når aktivert)
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/send-lease-notification/sms \
  -H "Authorization: Bearer [service-role-key]" \
  -d '{
    "signatureId": "test-id",
    "recipientType": "tenant",
    "phoneNumber": "+4712345678"
  }'
```

### Verifisering
1. Send test SMS til ditt eget nummer
2. Sjekk leveringsstatus i Link Mobility Dashboard
3. Verifiser at lenker fungerer
4. Test med internasjonale numre (hvis relevant)

## Sikkerhet

### Telefonnummer Validering
```typescript
function validateNorwegianPhoneNumber(phone: string): boolean {
  // Remove spaces and validate Norwegian format
  const cleaned = phone.replace(/\s/g, '');
  const norwayPattern = /^(\+47|0047|47)?[2-9]\d{7}$/;
  return norwayPattern.test(cleaned);
}
```

### Rate Limiting
- Maks 5 SMS per bruker per time
- Maks 10 SMS per telefonnummer per dag
- Implementert i Edge Function

## Feilsøking

### SMS Kommer Ikke Frem
1. Verifiser telefonnummer-format (+47xxxxxxxx)
2. Sjekk Link Mobility Dashboard for feilmeldinger
3. Verifiser at avsendernavn er godkjent
4. Sjekk Edge Function logs

### Rate Limits
- Link Mobility har rate limits
- Implementer retry med exponential backoff
- Cache sendte SMS for å unngå duplikater

## Alternativer

### Twilio SMS (Alternativ)
Hvis Link Mobility ikke fungerer:
```typescript
import { Twilio } from "npm:twilio@4.x";

const client = new Twilio(
  Deno.env.get('TWILIO_ACCOUNT_SID'),
  Deno.env.get('TWILIO_AUTH_TOKEN')
);

await client.messages.create({
  body: message,
  from: '+47xxxxxxxx', // Twilio number
  to: phoneNumber,
});
```

### Azure Communication Services (Fremtid)
```typescript
import { SmsClient } from "@azure/communication-sms";

const client = new SmsClient(connectionString);

await client.send({
  from: "+47xxxxxxxx",
  to: [phoneNumber],
  message: message,
});
```

## Neste Steg
- [ ] Kontakt Link Mobility for pris og API-tilgang
- [ ] Få API-nøkkel og legg den til i Supabase
- [ ] Test SMS-utsending i staging
- [ ] Implementer full SMS-funksjonalitet
- [ ] Oppdater dokumentasjon med faktiske API-detaljer

---

**Sist oppdatert:** 2025-01-03  
**Status:** Venter på API-nøkkel fra Link Mobility  
**Vedlikeholdes av:** Leily Development Team
