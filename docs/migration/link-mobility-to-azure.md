# Migreringsguide: Link Mobility → Azure Communication Services (SMS)

## 📋 Oversikt

Denne guiden beskriver steg-for-steg migrering av SMS fra Link Mobility til Azure Communication Services.

**Status:** 🟡 Link Mobility er IKKE implementert ennå (kun stub)  
**Estimert tid:** 3-4 timer (inkl. testing)

---

## ⚠️ Pre-Migration Checklist

- [ ] Azure Communication Services resource opprettet
- [ ] SMS-funksjonalitet aktivert i Azure
- [ ] Norsk telefonnummer kjøpt (+47)
- [ ] `AZURE_COMMUNICATION_CONNECTION_STRING` lagt til i Supabase Secrets
- [ ] Test-SMS sendt fra Azure (se `docs/integrations/azure-communication-services.md`)
- [ ] Informer teamet om SMS-implementering

---

## 🔧 Steg 1: Aktiver SMS i Azure

### 1.1 Kjøp Telefonnummer

1. Gå til [Azure Portal](https://portal.azure.com)
2. Naviger til din Communication Services resource
3. Gå til **Telephony → Phone numbers**
4. Klikk **Get phone number**
5. Konfigurer:
   - **Country/region:** Norway
   - **Number type:** 
     - **Toll-free** (anbefalt): ~100 NOK/mnd, høyere deliverability
     - **Geographic**: ~50 NOK/mnd, lokal Oslo-nummer
   - **Calling:** Off (vi trenger kun SMS)
   - **SMS:** Send and receive
6. Velg et tilgjengelig nummer
7. Fullfør kjøp

**Resultat:** Du har nå et norsk telefonnummer, f.eks. `+4721234567`

### 1.2 Verifiser SMS-funksjonalitet

```bash
# Test SMS via Azure Portal
# Gå til: Phone numbers → [ditt nummer] → Send test SMS
# Send til din egen telefon for å verifisere
```

---

## 🔧 Steg 2: Implementer SMS i Edge Function

### 2.1 Oppdater `supabase/functions/send-lease-notification/index.ts`

**ERSTATT SMS-stub (linje 159-198) MED:**

```typescript
import { SmsClient } from "npm:@azure/communication-sms@1.1.0";

async function sendSmsNotification(req: Request) {
  const connectionString = Deno.env.get('AZURE_COMMUNICATION_CONNECTION_STRING');
  if (!connectionString) {
    throw new Error('Azure Communication Services not configured');
  }

  const smsClient = new SmsClient(connectionString);
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { signatureId, recipientType, phoneNumber } = await req.json();

  if (!signatureId || !recipientType || !phoneNumber) {
    throw new Error('signatureId, recipientType, and phoneNumber are required');
  }

  console.log(`Sending SMS for signature ${signatureId} to ${recipientType} (${phoneNumber})`);

  // Fetch signature data for SMS content
  const { data: signature, error: sigError } = await supabaseClient
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

  if (sigError || !signature) {
    throw new Error(`Signature not found: ${sigError?.message}`);
  }

  const lease = signature.lease_agreements;
  const property = lease.property;

  // Construct SMS message
  let smsBody: string;
  let signingUrl: string;

  if (recipientType === 'tenant') {
    signingUrl = signature.tenant_signing_url;
    smsBody = `Hei! Du har fått en leieavtale til signering for ${property.address}. Sjekk e-post for detaljer eller signer direkte: ${signingUrl}`;
  } else if (recipientType === 'landlord') {
    signingUrl = signature.landlord_signing_url;
    smsBody = `Leieavtalen for ${property.address} er klar for signering. Se e-post eller signer her: ${signingUrl}`;
  } else {
    throw new Error('Invalid recipientType');
  }

  // Send SMS via Azure Communication Services
  const sendResults = await smsClient.send({
    from: "+4721234567", // BYTT TIL DITT AZURE-NUMMER
    to: [phoneNumber],
    message: smsBody,
  });

  const result = sendResults[0];
  
  if (!result.successful) {
    console.error('SMS send failed:', result.errorMessage);
    throw new Error(`Failed to send SMS: ${result.errorMessage}`);
  }

  console.log(`SMS sent successfully to ${phoneNumber} (Message ID: ${result.messageId})`);

  // Log SMS sending in audit log
  await supabaseClient
    .from('audit_log')
    .insert({
      action: 'sms_sent',
      table_name: 'lease_signatures',
      details: {
        signature_id: signatureId,
        recipient_type: recipientType,
        phone_number: phoneNumber,
        message_id: result.messageId,
      },
    });

  return new Response(
    JSON.stringify({
      success: true,
      messageId: result.messageId,
      phoneNumber,
      provider: 'azure',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
```

### 2.2 Legg til SMS-nummer som Environment Variable

**I `supabase/config.toml`, legg til:**

```toml
[functions.send-lease-notification.env]
AZURE_SMS_NUMBER = "+4721234567"  # Bytt til ditt nummer
```

**Oppdater koden til å bruke env var:**

```typescript
const azureSmsNumber = Deno.env.get('AZURE_SMS_NUMBER') || "+4721234567";

const sendResults = await smsClient.send({
  from: azureSmsNumber,
  to: [phoneNumber],
  message: smsBody,
});
```

---

## 🧪 Steg 3: Testing

### 3.1 Test Edge Function (lokal test først)

```bash
# Test via curl (med gyldig signature ID fra database)
curl -X POST \
  https://wdwjmapvuibsqiifslno.supabase.co/functions/v1/send-lease-notification/sms \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "signatureId": "existing-signature-uuid",
    "recipientType": "tenant",
    "phoneNumber": "+4798765432"
  }'
```

### 3.2 Verifiser SMS

1. Sjekk at SMS mottas på telefonen (innen 5-10 sekunder)
2. Verifiser at lenken i SMS fungerer
3. Test med ulike norske mobiloperatører:
   - Telenor
   - Telia
   - Ice.net

### 3.3 Test Edge Cases

**Test disse scenarioene:**
- Ugyldig telefonnummer → Skal returnere feilmelding
- Internasjonalt nummer (ikke +47) → Skal returnere feilmelding
- Manglende signature → Skal returnere feilmelding

---

## 🚀 Steg 4: Integrasjon med Frontend

### 4.1 Oppdater `RentalAgreementDialog.tsx`

Legg til SMS-funksjonalitet når leieavtale opprettes:

```typescript
// I handleSubmit-funksjonen, etter at lease_signature er opprettet:

// Send e-post til leietaker
await supabase.functions.invoke('send-lease-notification', {
  body: {
    path: '/email',
    signatureId: newSignature.id,
    recipientType: 'tenant',
  },
});

// NYTT: Send SMS til leietaker (hvis telefonnummer finnes)
if (selectedTenant.phone) {
  try {
    await supabase.functions.invoke('send-lease-notification', {
      body: {
        path: '/sms',
        signatureId: newSignature.id,
        recipientType: 'tenant',
        phoneNumber: selectedTenant.phone,
      },
    });
    console.log('SMS sent to tenant');
  } catch (error) {
    console.error('Failed to send SMS:', error);
    // Ikke kast feil - SMS er nice-to-have, ikke critical
  }
}

toast({
  title: 'Leieavtale opprettet',
  description: 'Leietaker har fått e-post og SMS med lenke til signering',
});
```

### 4.2 Legg til SMS-toggle (valgfritt)

Hvis brukeren ønsker å kunne deaktivere SMS:

```typescript
const [sendSms, setSendSms] = useState(true);

<div className="flex items-center space-x-2">
  <Switch
    id="send-sms"
    checked={sendSms}
    onCheckedChange={setSendSms}
  />
  <Label htmlFor="send-sms">
    Send SMS-varsel til leietaker
  </Label>
</div>

// I handleSubmit:
if (sendSms && selectedTenant.phone) {
  await supabase.functions.invoke('send-lease-notification', {
    body: { path: '/sms', ... },
  });
}
```

---

## 📊 Steg 5: Overvåkning & Metrics

### 5.1 Azure Metrics

1. Gå til [Azure Portal](https://portal.azure.com) → Communication Services → Metrics
2. Overvåk:
   - **SMS Requests:** Antall SMS sendt
   - **SMS Delivery Success Rate:** Bør være >95%
   - **SMS Delivery Failure Rate:** Bør være <5%

### 5.2 Supabase Logs

```bash
# Søk i Edge Function logs etter:
# - "SMS sent successfully" (success)
# - "Failed to send SMS" (errors)
```

### 5.3 Database Audit Log

```sql
-- Se alle SMS-sendinger
SELECT * FROM audit_log
WHERE action = 'sms_sent'
ORDER BY created_at DESC
LIMIT 100;

-- Success rate
SELECT 
  COUNT(*) as total_sms,
  COUNT(CASE WHEN details->>'message_id' IS NOT NULL THEN 1 END) as successful
FROM audit_log
WHERE action = 'sms_sent'
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## 💰 Steg 6: Kostnadsovervåkning

### 6.1 Sett opp Azure Budget Alert

1. Gå til Azure Portal → Cost Management + Billing
2. Opprett et Budget for Communication Services
3. Sett alert ved 80% av budsjett

**Anbefalte budsjetter:**
- **SMS (1,000/mnd):** 500 NOK/mnd
- **SMS (5,000/mnd):** 2,500 NOK/mnd

### 6.2 Overvåk SMS-kostnad per måned

```bash
# Se kostnader i Azure Portal
# Cost Management + Billing → Cost Analysis
# Filtrer på: Service = Communication Services, Resource type = SMS
```

---

## 🧹 Steg 7: Cleanup (hvis Link Mobility var aktivert)

**NB:** Link Mobility var ALDRI implementert, så dette steget kan hoppes over.

Hvis Link Mobility hadde vært aktiv:
1. Fjern `LINK_MOBILITY_API_KEY` fra Supabase Secrets
2. Avbryt Link Mobility-abonnement
3. Oppdater `DEPENDENCIES.md`

---

## 🔙 Rollback Plan

### Umiddelbar Rollback

**Scenario:** SMS-funksjonalitet feiler kritisk

**Løsning:**
1. Deaktiver SMS-sending i frontend:
   ```typescript
   const SMS_ENABLED = false; // Hardcode til false
   if (SMS_ENABLED && selectedTenant.phone) {
     // Send SMS
   }
   ```

2. Edge Function returnerer fremdeles success selv om SMS feiler (non-critical)

### Gradvis Rollback

**Scenario:** SMS-deliverability er for lav (<80%)

**Løsning:**
1. Implementer retry-mekanisme:
   ```typescript
   let retries = 3;
   let success = false;
   
   while (retries > 0 && !success) {
     try {
       const result = await smsClient.send({ ... });
       success = result[0].successful;
     } catch (error) {
       retries--;
       await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
     }
   }
   ```

2. Kontakt Azure Support for hjelp med deliverability

---

## 📊 Success Metrics

**SMS-implementeringen anses som vellykket hvis:**

| Metric | Target | Måling |
|--------|--------|--------|
| SMS delivery rate | >95% | Azure Metrics |
| SMS delivery time | <10 sekunder | Testing |
| Edge Function error rate | <1% | Supabase Logs |
| Kostnad per SMS | <0.50 NOK | Azure Billing |
| User complaints | 0 | Support tickets |

---

## 🆘 Troubleshooting

### Problem: SMS sendes ikke

**Symptom:** Edge Function returnerer success, men SMS mottas ikke

**Løsning:**
1. Sjekk at telefonnummeret er gyldig norsk (+47)
2. Verifiser at Azure SMS-nummer er aktivt
3. Se Azure SMS Status: Portal → Phone numbers → [ditt nummer] → Usage
4. Sjekk at telefonen har mobildekning

### Problem: SMS går til spam/blokkeres

**Symptom:** SMS mottas ikke på enkelte telefoner

**Løsning:**
1. Bruk toll-free nummer (bedre deliverability)
2. Unngå spam-ord i SMS ("gratis", "vinn", "klikk her")
3. Legg til Leily-branding i SMS: "Fra Leily: ..."
4. Registrer nummer hos mobiloperatører (long-term solution)

### Problem: Høye SMS-kostnader

**Symptom:** SMS-kostnader overstiger budsjett

**Løsning:**
1. Implementer rate limiting (maks X SMS per bruker per dag)
2. Kun send SMS for viktige hendelser (signering, ikke alle notifikasjoner)
3. Legg til SMS-preferanser i brukerinnstillinger

---

## 📞 Support

### Internt Team
- **Tech Lead:** Se `DEPENDENCIES.md`
- **DevOps:** Slack #infrastructure-team

### Azure Support
- **Portal:** https://portal.azure.com → Support + troubleshooting
- **Telefon:** +47 21 93 61 90
- **E-post:** azure-support@microsoft.com

---

## 📝 Relaterte Dokumenter

- [Azure Communication Services Setup](../integrations/azure-communication-services.md)
- [Resend to Azure Migration](./resend-to-azure.md)
- [Dependencies Overview](../../DEPENDENCIES.md)
