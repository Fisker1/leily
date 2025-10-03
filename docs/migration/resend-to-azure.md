# Migreringsguide: Resend → Azure Communication Services (E-post)

## 📋 Oversikt

Denne guiden beskriver steg-for-steg migrering av e-post fra Resend til Azure Communication Services.

**Estimert tid:** 4-6 timer (inkl. testing)

---

## ⚠️ Pre-Migration Checklist

- [ ] Azure Communication Services resource opprettet
- [ ] `leily.no` verifisert i Azure (DNS-records lagt til)
- [ ] `AZURE_COMMUNICATION_CONNECTION_STRING` hentet fra Azure Portal
- [ ] Test-e-post sendt fra Azure (se `docs/integrations/azure-communication-services.md`)
- [ ] Backup av nåværende `send-lease-notification` Edge Function
- [ ] Informer teamet om planlagt migrering

---

## 🔄 Steg 1: Legg til Azure Secret i Supabase

1. Gå til [Supabase Secrets](https://supabase.com/dashboard/project/wdwjmapvuibsqiifslno/settings/functions)
2. Klikk **Add new secret**
3. Legg til:

```
Name: AZURE_COMMUNICATION_CONNECTION_STRING
Value: endpoint=https://leily-communication-services.communication.azure.com/;accesskey=YOUR_KEY
```

4. Behold `RESEND_API_KEY` inntil videre (for rollback)

---

## 🔧 Steg 2: Oppdater Edge Function

### 2.1 Oppdater `supabase/functions/send-lease-notification/index.ts`

**ERSTATT importene (linje 1-3):**

```typescript
// GAMMEL:
import { Resend } from "npm:resend@2.0.0";

// NY:
import { EmailClient } from "npm:@azure/communication-email@1.0.0";
```

**ERSTATT email-sending logikk i `sendEmailNotification` (linje 43-131):**

```typescript
async function sendEmailNotification(req: Request) {
  // ERSTATT disse linjene:
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }
  const resend = new Resend(resendApiKey);

  // MED:
  const connectionString = Deno.env.get('AZURE_COMMUNICATION_CONNECTION_STRING');
  if (!connectionString) {
    throw new Error('AZURE_COMMUNICATION_CONNECTION_STRING not configured');
  }
  const emailClient = new EmailClient(connectionString);

  // ... resten av koden forblir den samme til linje 124 ...

  // ERSTATT email send (linje 125-131):
  const { data, error: sendError } = await resend.emails.send({
    from: 'Leily <noreply@alquiz.no>',
    to: [recipientEmail],
    subject: emailSubject,
    html: emailHtml,
  });

  // MED:
  const emailMessage = {
    senderAddress: "noreply@leily.no", // Bytt til leily.no når domenet er verifisert
    content: {
      subject: emailSubject,
      html: emailHtml,
    },
    recipients: {
      to: [{ address: recipientEmail }],
    },
  };

  const poller = await emailClient.beginSend(emailMessage);
  const result = await poller.pollUntilDone();

  if (result.status === 'Failed') {
    throw new Error(`Failed to send email: ${result.error?.message}`);
  }

  const data = { id: result.id };
  const sendError = null;

  // ... resten av koden forblir den samme ...
}
```

### 2.2 Full oppdatert funksjon (for referanse)

<details>
<summary>Klikk for å se hele den oppdaterte funksjonen</summary>

```typescript
async function sendEmailNotification(req: Request) {
  const connectionString = Deno.env.get('AZURE_COMMUNICATION_CONNECTION_STRING');
  if (!connectionString) {
    throw new Error('AZURE_COMMUNICATION_CONNECTION_STRING not configured');
  }

  const emailClient = new EmailClient(connectionString);

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { signatureId, recipientType } = await req.json();
  
  if (!signatureId || !recipientType) {
    throw new Error('signatureId and recipientType are required');
  }

  console.log(`Sending email for signature ${signatureId} to ${recipientType}`);

  // Fetch signature with related data
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
  const tenant = lease.tenant;

  // Get landlord info
  const { data: landlord } = await supabaseClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', lease.property_owner_id)
    .single();

  let recipientEmail: string;
  let recipientName: string;
  let signingUrl: string;
  let emailSubject: string;

  if (recipientType === 'tenant') {
    recipientEmail = tenant.email;
    recipientName = `${tenant.first_name} ${tenant.last_name}`;
    signingUrl = signature.tenant_signing_url;
    emailSubject = `Leieavtale klar for signering - ${property.address}`;
  } else if (recipientType === 'landlord') {
    recipientEmail = landlord?.email || '';
    recipientName = landlord?.full_name || 'Utleier';
    signingUrl = signature.landlord_signing_url;
    emailSubject = `Signer leieavtale - ${property.address}`;
  } else {
    throw new Error('Invalid recipientType');
  }

  if (!recipientEmail) {
    throw new Error('Recipient email not found');
  }

  const emailHtml = generateEmailTemplate({
    recipientName,
    recipientType,
    property,
    lease,
    tenant,
    landlordName: landlord?.full_name || 'Utleier',
    signingUrl,
  });

  // Send email via Azure Communication Services
  const emailMessage = {
    senderAddress: "noreply@leily.no",
    content: {
      subject: emailSubject,
      html: emailHtml,
    },
    recipients: {
      to: [{ address: recipientEmail }],
    },
  };

  const poller = await emailClient.beginSend(emailMessage);
  const result = await poller.pollUntilDone();

  if (result.status === 'Failed') {
    throw new Error(`Failed to send email: ${result.error?.message}`);
  }

  // Mark as notified in database
  const updateField = recipientType === 'tenant' ? 'tenant_notified' : 'landlord_notified';
  await supabaseClient
    .from('lease_signatures')
    .update({ [updateField]: true })
    .eq('id', signatureId);

  console.log(`Email sent successfully to ${recipientEmail} via Azure (ID: ${result.id})`);

  return new Response(
    JSON.stringify({
      success: true,
      emailId: result.id,
      recipientEmail,
      provider: 'azure',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
```
</details>

---

## 🧪 Steg 3: Testing i Staging

### 3.1 Deploy til Staging

```bash
# Edge Functions deployes automatisk ved git push
git add supabase/functions/send-lease-notification/index.ts
git commit -m "feat: Migrate email from Resend to Azure Communication Services"
git push
```

### 3.2 Test Edge Function

```bash
# Test via Supabase Edge Function endpoint
curl -X POST \
  https://wdwjmapvuibsqiifslno.supabase.co/functions/v1/send-lease-notification/email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "signatureId": "test-signature-id",
    "recipientType": "tenant"
  }'
```

### 3.3 Verifiser e-post

1. Sjekk at e-posten mottas i mottakers innboks
2. Verifiser at alle lenker fungerer
3. Sjekk at e-posten ser riktig ut (styling, bilder, etc.)
4. Test med ulike e-post-klienter (Gmail, Outlook, Apple Mail)

---

## 🚀 Steg 4: Produksjonsmigrering

### 4.1 Deployment

```bash
# Deploy til produksjon via Lovable/Vercel
# Edge Functions deployes automatisk med frontend
```

### 4.2 Overvåkning (første 48 timer)

**Sjekk Azure Metrics:**
1. Gå til [Azure Portal](https://portal.azure.com) → Communication Services → Metrics
2. Overvåk:
   - Email Requests (bør matche antall leieavtaler opprettet)
   - Email Delivery Success Rate (bør være >95%)
   - Email Bounce Rate (bør være <5%)

**Sjekk Supabase Logs:**
1. Gå til [Edge Function Logs](https://supabase.com/dashboard/project/wdwjmapvuibsqiifslno/functions/send-lease-notification/logs)
2. Søk etter:
   - `"Email sent successfully"` (success)
   - `"Failed to send email"` (errors)

### 4.3 Post-deployment Checklist

- [ ] Ingen kritiske feil i Edge Function logs (første time)
- [ ] Minst 10 test-e-poster sendt og mottatt
- [ ] Email delivery rate >95% (Azure Metrics)
- [ ] Ingen brukere rapporterer manglende e-poster
- [ ] Alle e-post-templates ser korrekte ut

---

## 🔄 Steg 5: Cleanup (etter 7 dager suksess)

### 5.1 Fjern Resend Secret

1. Gå til [Supabase Secrets](https://supabase.com/dashboard/project/wdwjmapvuibsqiifslno/settings/functions)
2. Slett `RESEND_API_KEY`

### 5.2 Avbryt Resend-abonnement

1. Logg inn på [Resend Dashboard](https://resend.com/dashboard)
2. Gå til Settings → Billing
3. Cancel subscription

### 5.3 Oppdater dokumentasjon

- [ ] Oppdater `DEPENDENCIES.md` (marker Resend som deprecated)
- [ ] Oppdater `docs/integrations/resend.md` (legg til "DEPRECATED" header)
- [ ] Oppdater `README.md` hvis Resend er nevnt

---

## 🔙 Rollback Plan (hvis noe går galt)

### Umiddelbar Rollback (innen 1 time)

1. **Reverter git commit:**
   ```bash
   git revert HEAD
   git push
   ```

2. **Re-enable Resend secret:**
   - Sjekk at `RESEND_API_KEY` fortsatt eksisterer i Supabase
   - Hvis slettet, legg til på nytt fra passordbehandler

3. **Verifiser:**
   - Test at e-post sendes via Resend igjen
   - Sjekk Edge Function logs

### Gradvis Rollback (hvis problemer oppdages senere)

**Oppsett for dual-mode (hybrid):**

```typescript
async function sendEmailNotification(req: Request) {
  const useAzure = Deno.env.get('USE_AZURE_EMAIL') === 'true';
  
  if (useAzure) {
    // Azure logic
    const connectionString = Deno.env.get('AZURE_COMMUNICATION_CONNECTION_STRING');
    const emailClient = new EmailClient(connectionString);
    // ...
  } else {
    // Resend logic (fallback)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resend = new Resend(resendApiKey);
    // ...
  }
}
```

**Toggle mellom providers:**
```bash
# Bytt tilbake til Resend
# I Supabase Secrets, sett:
USE_AZURE_EMAIL=false
```

---

## 📊 Success Metrics

**Migreringen anses som vellykket hvis:**

| Metric | Target | Måling |
|--------|--------|--------|
| Email delivery rate | >95% | Azure Metrics |
| Email bounce rate | <5% | Azure Metrics |
| Edge Function error rate | <1% | Supabase Logs |
| User complaints | 0 | Support tickets |
| Kostnad per e-post | <$0.0001 | Azure Billing |

---

## 🆘 Troubleshooting

### Problem: E-poster sendes ikke

**Symptom:** Edge Function returnerer success, men e-post mottas ikke

**Løsning:**
1. Sjekk Azure Email Status: Portal → Email → Sending Activity
2. Verifiser at domenet er aktivt (grønn status)
3. Sjekk spam-mappen hos mottaker
4. Se etter bounce-meldinger i Azure Logs

### Problem: Langsom e-post-levering

**Symptom:** E-poster tar >5 minutter å levere

**Løsning:**
1. Dette er normalt for nye domener (warming up period)
2. Send gradvis økende mengder e-post over 2-4 uker
3. Sjekk sender reputation: https://www.senderbase.org/lookup/?search_string=leily.no

### Problem: E-poster går til spam

**Symptom:** E-poster havner i spam-mappen

**Løsning:**
1. Verifiser SPF/DKIM-records er korrekt konfigurert
2. Legg til DMARC-record:
   ```dns
   TXT _dmarc.leily.no "v=DMARC1; p=quarantine; rua=mailto:dmarc@leily.no"
   ```
3. Overvåk sender reputation
4. Unngå spam-ord i emnelinjer ("gratis", "vinn", "klikk her")

---

## 📞 Support

### Internt Team
- **Tech Lead:** Se `DEPENDENCIES.md`
- **DevOps:** Slack #infrastructure-team

### Azure Support
- **Portal:** https://portal.azure.com → Support + troubleshooting
- **Telefon:** +47 21 93 61 90
- **E-post:** azure-support@microsoft.com

### Supabase Support
- **Portal:** https://supabase.com/dashboard/support
- **Discord:** https://discord.supabase.com/
