# E-post Levering Problem - Microsoft Exchange

## 🚨 Problem
Microsoft Exchange blokkerer e-poster til eksterne domener (Gmail, ProtonMail) med feilkode:
```
550 5.7.708 Service unavailable. Access denied, traffic not accepted from this IP.
```

## 🔧 Løsning
Dette må fikses i Microsoft 365 Admin Center:

### 1. Gå til Microsoft 365 Admin Center
- Logg inn på [admin.microsoft.com](https://admin.microsoft.com)
- Gå til **Exchange admin center**

### 2. Konfigurer Mail Flow Rules
- Gå til **Mail flow** → **Rules**
- Klikk **+** for å lage ny regel
- Navn: "Allow external email delivery"
- **Conditions**: 
  - "The sender is" → "anderslundoy@leily.no"
- **Actions**:
  - "Modify the message properties" → "Set a message header"
  - Header name: "X-MS-Exchange-Organization-SkipSafeAttachmentProcessing"
  - Header value: "1"

### 3. Alternativ: Connector Configuration
- Gå til **Mail flow** → **Connectors**
- Opprett ny connector for "From: Office 365, To: Partner organization"
- Tillat e-poster til alle eksterne domener

### 4. Test E-post Levering
Etter konfigurasjon, test med:
```bash
node test-external-delivery.js
```

## 📧 Midlertidig Løsning
Inntil dette er fikset, kan vi:
1. **Bare sende til Leily-domener** (fungerer alltid)
2. **Bruke SMTP fallback** (hvis implementert)
3. **Manuell testing** via Outlook web interface

## 🔍 Verifisering
Sjekk at e-poster kommer frem til:
- ✅ `anderslundoy@leily.no` (fungerer)
- ❌ `anderslundoy@gmail.com` (blokkert)
- ❌ `anderslundoy@protonmail.com` (blokkert)

## 📞 Support
Hvis problemet vedvarer, kontakt Microsoft 365 support eller sjekk:
- [Microsoft Exchange Online Protection](https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/exchange-online-protection-overview)
- [Mail flow rules in Exchange Online](https://docs.microsoft.com/en-us/exchange/security-and-compliance/mail-flow-rules/mail-flow-rules)
