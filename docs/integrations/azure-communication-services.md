# Azure Communication Services Integration

## Oversikt

Azure Communication Services (ACS) er en samlet plattform for e-post og SMS-kommunikasjon som Leily vil bruke i fremtiden for å erstatte Resend (e-post) og Link Mobility (SMS).

---

## 🎯 Hvorfor Azure Communication Services?

| Funksjon | Resend | Link Mobility | Azure ACS |
|----------|--------|---------------|-----------|
| **E-post** | ✅ $20/mnd (50k) | ❌ | ✅ $0.0001 per email |
| **SMS** | ❌ | ✅ ~0.50 NOK/SMS | ✅ ~0.40 NOK/SMS |
| **Én plattform** | ❌ | ❌ | ✅ |
| **GDPR EU** | ✅ | ✅ | ✅ West Europe |
| **Skalerbarhet** | 50k/mnd | Ubegrenset | Ubegrenset |

**Estimert årlig besparelse:** ~95% på e-post, ~20% på SMS

---

## 📋 Azure Setup Guide

### Steg 1: Opprett Azure Communication Services Resource

1. Logg inn på [Azure Portal](https://portal.azure.com)
2. Klikk **Create a resource** → Søk etter **Communication Services**
3. Fyll ut:
   - **Subscription:** Din Azure-abonnement
   - **Resource group:** `leily-production` (opprett ny om nødvendig)
   - **Resource name:** `leily-communication-services`
   - **Data location:** `Europe` (for GDPR-compliance)
   - **Region:** `West Europe` (nærmest Norge)
4. Klikk **Review + create** → **Create**

### Steg 2: Konfigurer E-post Domain

1. I ACS-ressursen, gå til **Email → Domains**
2. Klikk **Add domain** → **Azure managed domain** (gratis test) ELLER **Custom domain**
3. For custom domain `leily.no`:
   - Legg inn domenet: `leily.no`
   - Azure vil generere DNS-records (MailFrom, DomainKeys, SPF, DKIM)
4. Legg til DNS-records hos domene-leverandør:

```dns
# Eksempel DNS-records (disse vil være unike for ditt domene)
TXT  @                  v=spf1 include:spf.protection.azure.com ~all
CNAME selector1._domainkey  selector1-leily-no._domainkey.azure-com
CNAME selector2._domainkey  selector2-leily-no._domainkey.azure-com
MX   @                  0 leily-no.norway.mail.protection.azure.com
```

5. Klikk **Verify** (kan ta opptil 24 timer)

### Steg 3: Konfigurer SMS (valgfritt)

1. I ACS-ressursen, gå til **Telephony → Phone numbers**
2. Klikk **Get phone number**
3. Velg:
   - **Country/region:** Norway
   - **Number type:** Toll-free (anbefalt) eller Geographic
   - **Calling:** Off
   - **SMS:** Send and receive
4. Fullfør kjøp (ca. 50 NOK/måned + 0.40 NOK per SMS)

### Steg 4: Hent Connection String

1. Gå til **Settings → Keys**
2. Kopier **Primary connection string**
3. Dette er din `AZURE_COMMUNICATION_CONNECTION_STRING`

---

## 🔐 Secrets Management

### Legg til i Supabase Secrets

1. Gå til [Supabase Dashboard](https://supabase.com/dashboard/project/wdwjmapvuibsqiifslno/settings/functions)
2. Under **Edge Functions secrets**, klikk **Add new secret**
3. Legg til:

```
Name: AZURE_COMMUNICATION_CONNECTION_STRING
Value: endpoint=https://leily-communication-services.communication.azure.com/;accesskey=YOUR_ACCESS_KEY
```

### Fjern gamle secrets (etter migrering)

```
❌ RESEND_API_KEY (kan slettes etter produksjonsmigering)
❌ LINK_MOBILITY_API_KEY (kan slettes etter SMS-implementering)
```

---

## 📊 Pricing & Limits

### E-post
- **Gratis tier:** Første 500 e-poster/måned
- **Betalt:** $0.0001 per e-post (10 kr per 100,000 e-poster!)
- **Daglig limit:** 100,000 e-poster (kan økes på forespørsel)

### SMS (Norge)
- **Pris:** ~0.40 NOK per SMS (variabler etter operatør)
- **Ingen månedlig minimum**
- **Long codes:** ~50 NOK/måned
- **Toll-free:** ~100 NOK/måned

### Sammenligning med nåværende løsning

**E-post (10,000 e-poster/måned):**
- Resend: $20/måned = **240 NOK/måned**
- Azure ACS: $1/måned = **10 NOK/måned**
- **Besparelse: 96%**

**SMS (1,000 SMS/måned):**
- Link Mobility: 500 NOK/måned
- Azure ACS: 400 NOK/måned
- **Besparelse: 20%**

---

## 🧪 Testing

### Test E-post (lokalt med Deno)

```typescript
import { EmailClient } from "npm:@azure/communication-email@1.0.0";

const connectionString = Deno.env.get('AZURE_COMMUNICATION_CONNECTION_STRING');
const emailClient = new EmailClient(connectionString);

const message = {
  senderAddress: "noreply@alquiz.no", // Bytt til leily.no etter verifisering
  content: {
    subject: "Test e-post fra Azure",
    html: "<h1>Hei!</h1><p>Dette er en test e-post.</p>",
  },
  recipients: {
    to: [{ address: "test@example.com" }],
  },
};

const poller = await emailClient.beginSend(message);
const result = await poller.pollUntilDone();
console.log("E-post sendt!", result);
```

### Test SMS (lokalt med Deno)

```typescript
import { SmsClient } from "npm:@azure/communication-sms@1.1.0";

const connectionString = Deno.env.get('AZURE_COMMUNICATION_CONNECTION_STRING');
const smsClient = new SmsClient(connectionString);

const sendResults = await smsClient.send({
  from: "+47XXXXXXXX", // Ditt Azure SMS-nummer
  to: ["+4798765432"],
  message: "Test SMS fra Leily via Azure",
});

console.log("SMS sendt!", sendResults);
```

---

## 📈 Monitoring & Logging

### Azure Portal Monitoring

1. Gå til ACS-ressursen → **Monitoring → Metrics**
2. Viktige metrics:
   - Email Requests
   - Email Delivery Success Rate
   - SMS Requests
   - SMS Delivery Success Rate

### Supabase Edge Function Logs

```bash
# Se logger for send-lease-notification
# Gå til: https://supabase.com/dashboard/project/wdwjmapvuibsqiifslno/functions/send-lease-notification/logs
```

### Azure Logs

1. Gå til ACS → **Monitoring → Logs**
2. Kjør query:

```kql
ACSEmailSendOperational
| where TimeGenerated > ago(24h)
| project TimeGenerated, MessageId, Recipient, Result
| order by TimeGenerated desc
```

---

## 🔧 Troubleshooting

### E-post blir ikke levert

**Problem:** E-poster sendes men mottas ikke

**Løsninger:**
1. Sjekk at domenet er verifisert (grønn hake i Azure Portal)
2. Sjekk spam-mappen hos mottaker
3. Verifiser at SPF/DKIM-records er riktig konfigurert
4. Sjekk Azure logs for feilmeldinger
5. "Varm opp" domenet: Send gradvis økende mengder e-post over 2-4 uker

### SMS blir ikke sendt

**Problem:** SMS-funksjon returnerer feil

**Løsninger:**
1. Sjekk at telefonnummeret er kjøpt og aktivert
2. Verifiser at nummeret støtter SMS (ikke bare tale)
3. Sjekk at mottakers nummer er gyldig norsk nummer (+47)
4. Se Azure logs for rate limiting eller quota-problemer

### Connection string ugyldig

**Problem:** `AuthenticationFailed` error

**Løsninger:**
1. Generer ny connection string i Azure Portal → Keys
2. Oppdater Supabase secret `AZURE_COMMUNICATION_CONNECTION_STRING`
3. Redeploy Edge Functions (skjer automatisk ved neste deploy)

---

## 🔗 Nyttige Lenker

- [Azure Communication Services Docs](https://learn.microsoft.com/en-us/azure/communication-services/)
- [Email SDK for JavaScript](https://learn.microsoft.com/en-us/javascript/api/overview/azure/communication-email-readme)
- [SMS SDK for JavaScript](https://learn.microsoft.com/en-us/javascript/api/overview/azure/communication-sms-readme)
- [Azure Portal - Leily ACS](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Communication%2FcommunicationServices)
- [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/details/communication-services/)

---

## 📞 Support

### Azure Support
- Portal: https://portal.azure.com → Support + troubleshooting
- E-post: azure-support@microsoft.com
- Telefon: +47 21 93 61 90 (Norge)

### Intern Kontakt
- Tech Lead: se `DEPENDENCIES.md` for kontaktinfo
- DevOps: Se Slack #infrastructure-team
