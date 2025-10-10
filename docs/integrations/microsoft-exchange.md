# Microsoft Exchange Integration for Leily

## Overview

This document describes how to set up and configure Microsoft Exchange integration for sending email notifications in the Leily application. The integration supports both Microsoft Graph API (preferred) and SMTP fallback methods.

## Features

- **Account Creation Confirmations**: Welcome emails for new users
- **Password Reset**: Secure password reset links
- **Email Verification**: Account verification emails
- **Lease Agreement Notifications**: Digital lease signing notifications
- **Lease Signed Confirmations**: Confirmation emails after successful signing
- **Welcome Emails**: Role-specific welcome messages (tenant/landlord)
- **Payment Reminders**: Automated rent payment reminders
- **Lease Expiry Warnings**: Notifications before lease expiration

## Setup Instructions

### 1. Microsoft Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `Leily Email Service`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank for now
5. Click **Register**

### 2. Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Application permissions**
5. Add the following permissions:
   - `Mail.Send` - Send mail as any user
   - `User.Read.All` - Read all users' profiles (if needed)
6. Click **Grant admin consent** (requires admin privileges)

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description: `Leily Email Service Secret`
4. Choose expiration (recommend 24 months)
5. Click **Add**
6. **Important**: Copy the secret value immediately (it won't be shown again)

### 4. Configure Environment Variables

Add the following environment variables to your Supabase project:

#### Supabase Edge Functions Secrets

Go to [Supabase Dashboard](https://supabase.com/dashboard/project/wdwjmapvuibsqiifslno/settings/functions) and add these secrets:

```bash
# Microsoft Graph API Configuration
MICROSOFT_CLIENT_ID=your-app-registration-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
MICROSOFT_TENANT_ID=your-tenant-id

# Microsoft Exchange SMTP Configuration (fallback)
MICROSOFT_EMAIL_USER=anderslundoy@leily.no
MICROSOFT_EMAIL_PASSWORD=your-app-password
```

#### Local Development (.env file)

```bash
# Microsoft Graph API Configuration
VITE_MICROSOFT_CLIENT_ID=your-app-registration-client-id
VITE_MICROSOFT_TENANT_ID=your-tenant-id

# Note: Never put secrets in client-side environment variables
# Client secret should only be in Supabase Edge Functions
```

### 5. Exchange Mailbox Configuration

#### Enable SMTP Authentication

1. Go to [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Navigate to **Users** → **Active users**
3. Find your mailbox (`anderslundoy@leily.no`)
4. Click on the user → **Mail** tab
5. Under **Email apps**, ensure **Authenticated SMTP** is enabled

#### Create App Password (for SMTP fallback)

1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Sign in with your Microsoft account
3. Go to **Security** → **Advanced security options**
4. Under **App passwords**, click **Create a new app password**
5. Name it: `Leily Email Service`
6. Copy the generated password (use this for `MICROSOFT_EMAIL_PASSWORD`)

## Usage Examples

### 1. Send Account Created Email

```typescript
import { useAccountCreatedEmail } from '@/hooks/useEmailService';

function SignupComponent() {
  const { sendAccountCreatedEmail, isLoading, error } = useAccountCreatedEmail();

  const handleSignup = async (userData) => {
    // ... create user account ...
    
    // Send welcome email
    const result = await sendAccountCreatedEmail(
      userData.email,
      userData.fullName,
      'kontakt@leily.no'
    );

    if (result.success) {
      console.log('Welcome email sent!');
    } else {
      console.error('Failed to send email:', result.error);
    }
  };

  return (
    // ... your signup form ...
  );
}
```

### 2. Send Password Reset Email

```typescript
import { usePasswordResetEmail } from '@/hooks/useEmailService';

function ForgotPasswordComponent() {
  const { sendPasswordResetEmail, isLoading } = usePasswordResetEmail();

  const handlePasswordReset = async (email) => {
    // Generate reset token and URL
    const resetUrl = `https://leily.no/reset-password?token=${resetToken}`;
    
    const result = await sendPasswordResetEmail(
      email,
      user.fullName,
      resetUrl
    );

    if (result.success) {
      toast.success('Password reset email sent!');
    }
  };

  return (
    // ... your forgot password form ...
  );
}
```

### 3. Send Lease Agreement Email

```typescript
import { useLeaseAgreementEmail } from '@/hooks/useEmailService';

function LeaseAgreementComponent() {
  const { sendLeaseAgreementEmail, isLoading } = useLeaseAgreementEmail();

  const handleSendLeaseAgreement = async (leaseData) => {
    const result = await sendLeaseAgreementEmail(
      leaseData.tenantEmail,
      leaseData.tenantName,
      leaseData.propertyAddress,
      leaseData.propertyCity,
      leaseData.monthlyRent,
      leaseData.signingUrl,
      leaseData.landlordName,
      leaseData.startDate,
      leaseData.depositAmount
    );

    if (result.success) {
      toast.success('Lease agreement sent for signing!');
    }
  };

  return (
    // ... your lease agreement form ...
  );
}
```

### 4. Direct Function Call (Server-side)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Send email via Edge Function
const { data, error } = await supabase.functions.invoke('send-exchange-email', {
  body: {
    emailType: 'account_created',
    templateData: {
      recipientEmail: 'user@example.com',
      recipientName: 'John Doe',
      supportEmail: 'kontakt@leily.no'
    },
    options: {
      to: [{ email: 'user@example.com', name: 'John Doe' }]
    }
  }
});
```

## Email Templates

The system includes pre-built email templates for:

1. **Account Created** - Welcome message with dashboard link
2. **Password Reset** - Secure reset link with expiration
3. **Email Verification** - Account verification link
4. **Lease Agreement Ready** - Signing notification with property details
5. **Lease Signed Confirmation** - Confirmation with PDF attachment
6. **Welcome Tenant** - Tenant-specific onboarding
7. **Welcome Landlord** - Landlord-specific onboarding
8. **Payment Reminder** - Rent payment notifications
9. **Lease Expiry Warning** - Expiration notifications

## Error Handling

The email service includes comprehensive error handling:

- **Graph API failures** automatically fall back to SMTP
- **SMTP failures** return detailed error messages
- **Network timeouts** are handled gracefully
- **Invalid credentials** provide clear error messages

## Monitoring and Logging

### Supabase Edge Function Logs

Monitor email sending in the Supabase dashboard:
1. Go to **Edge Functions** → **send-exchange-email**
2. View **Logs** tab for real-time monitoring
3. Check for errors and success rates

### Microsoft Graph API Monitoring

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your App Registration
3. Go to **Monitoring** → **Logs**
4. Filter for email-related activities

## Security Considerations

1. **Client Secret**: Never expose in client-side code
2. **App Passwords**: Use for SMTP authentication only
3. **Permissions**: Use minimal required permissions
4. **Rate Limiting**: Respect Microsoft's rate limits
5. **Data Privacy**: Ensure GDPR compliance for email content

## Troubleshooting

### Common Issues

1. **"Insufficient privileges" error**
   - Ensure admin consent is granted for API permissions
   - Check that the app has `Mail.Send` permission

2. **"Invalid client secret" error**
   - Verify the client secret is correct
   - Check if the secret has expired

3. **"SMTP authentication failed" error**
   - Ensure SMTP is enabled for the mailbox
   - Verify the app password is correct
   - Check if 2FA is properly configured

4. **"Email not delivered"**
   - Check spam folders
   - Verify sender reputation
   - Ensure proper SPF/DKIM records

### Testing

Use the test endpoint to verify configuration:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-exchange-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "emailType": "account_created",
    "templateData": {
      "recipientEmail": "test@example.com",
      "recipientName": "Test User"
    },
    "options": {
      "to": [{"email": "test@example.com", "name": "Test User"}]
    }
  }'
```

## Migration from Resend

To migrate from the existing Resend integration:

1. **Deploy the new Edge Function**: `send-exchange-email`
2. **Update environment variables** with Microsoft credentials
3. **Test email functionality** with the new service
4. **Update frontend code** to use new hooks
5. **Remove Resend dependencies** once migration is complete

## Support

For issues with Microsoft Exchange integration:

1. Check the troubleshooting section above
2. Review Supabase Edge Function logs
3. Verify Azure App Registration configuration
4. Contact technical support if issues persist
