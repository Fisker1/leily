# Leieavtale Signering - Komplett Arbeidsflyt

## Oversikt
Dette dokumentet beskriver hele signeringsflyten for leieavtaler med BankID via Signicat.

## Nødvendige Secrets
Før du starter, sørg for at disse er konfigurert i Supabase:
- `SIGNICAT_CLIENT_ID`
- `SIGNICAT_CLIENT_SECRET`
- `SIGNICAT_ACCOUNT_ID`
- `SIGNICAT_WEBHOOK_SECRET`
- `RESEND_API_KEY`

## Arbeidsflyt

### 1. Opprett Leieavtale (Utleier)
- Gå til `/utleie` (Rental page)
- Klikk "Ny leieavtale"
- Fyll ut Steg 1-3 i RentalAgreementDialog
- **TODO: Legg til Steg 4 for signering**

### 2. Send til Signering
- Klikk "Send til BankID-signering" i Steg 4
- SignatureRequestDialog åpnes
- Bekreft informasjon er korrekt
- Edge Function `signicat-signing/create-signature-request` kalles
- PDF genereres via `generate-lease-pdf`
- Dokument opprettes i Signicat
- Signaturer legges til (utleier + leietaker)
- Dokument aktiveres

### 3. Utleier Signerer
- Utleier redirectes til BankID
- Signerer med BankID (mobil/kodebrikke)
- Webhook mottar event → oppdaterer `landlord_signed = true`
- Status: `landlord_signed`

### 4. Leietaker Varsles
- E-post sendes via `send-lease-notification/email`
- SMS sendes (når Link Mobility er konfigurert)
- Leietaker får lenke til signeringsside

### 5. Leietaker Signerer
- Leietaker klikker lenke i e-post
- Går til `/lease/:leaseId/signature`
- Ser leieavtale-detaljer
- Klikker "Signer med BankID"
- Signerer med BankID
- Webhook mottar event → oppdaterer `tenant_signed = true`
- Status: `completed`

### 6. Avtale Fullført
- Signert PDF lastes ned fra Signicat
- Lagres i database (TODO: Supabase Storage)
- `lease_agreements.signature_status = 'fully_signed'`
- `lease_agreements.status = 'active'`
- Begge parter får e-post med bekreftelse

## Database Oppdateringer

### lease_signatures
```
pending → landlord_signed → tenant_signed → completed
```

### lease_agreements
```
signature_status: unsigned → pending → partially_signed → fully_signed
```

## Feilhåndtering
- Timeout: Signeringsforespørsel utløper etter 30 dager
- Cancelled: Kan kanselleres manuelt
- Failed: Retry logic i Edge Functions

## Testing
1. Test-miljø: Bruk Signicat sandbox
2. Mock-signering for lokal utvikling
3. Sjekk webhook logs i Supabase Dashboard

## Neste Steg (TODO)
- [ ] Fullføre Steg 4 i RentalAgreementDialog
- [ ] Legg til signatur badges i Rental.tsx
- [ ] Implementer PDF download fra Supabase Storage
- [ ] Sett opp Link Mobility SMS
- [ ] Testing i staging-miljø
