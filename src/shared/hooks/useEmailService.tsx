import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface EmailTemplateData {
  recipientName: string;
  recipientEmail: string;
  propertyAddress?: string;
  propertyCity?: string;
  monthlyRent?: number;
  depositAmount?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  signingUrl?: string;
  landlordName?: string;
  tenantName?: string;
  verificationUrl?: string;
  resetPasswordUrl?: string;
  supportEmail?: string;
}

interface EmailOptions {
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  replyTo?: string;
  attachments?: Array<{
    name: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
}

type EmailType = 
  | 'account_created'
  | 'password_reset'
  | 'email_verification'
  | 'lease_agreement_ready'
  | 'lease_signed_confirmation'
  | 'welcome_tenant'
  | 'welcome_landlord'
  | 'payment_reminder'
  | 'lease_expiry_warning';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface UseEmailServiceReturn {
  sendEmail: (
    emailType: EmailType,
    templateData: EmailTemplateData,
    options: EmailOptions
  ) => Promise<EmailResult>;
  isLoading: boolean;
  error: string | null;
}

export function useEmailService(): UseEmailServiceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(async (
    emailType: EmailType,
    templateData: EmailTemplateData,
    options: EmailOptions
  ): Promise<EmailResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data, error: functionError } = await supabase.functions.invoke('send-leily-email', {
        body: {
          emailType,
          templateData: {
            ...templateData,
            name: templateData.recipientName,
            email: templateData.recipientEmail
          },
          to: options.to[0].email
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendEmail,
    isLoading,
    error
  };
}

// Convenience hooks for specific email types
export function useAccountCreatedEmail() {
  const { sendEmail, isLoading, error } = useEmailService();

  const sendAccountCreatedEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string,
    supportEmail?: string
  ) => {
    return sendEmail('account_created', {
      recipientEmail,
      recipientName,
      supportEmail
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  return {
    sendAccountCreatedEmail,
    isLoading,
    error
  };
}

export function usePasswordResetEmail() {
  const { sendEmail, isLoading, error } = useEmailService();

  const sendPasswordResetEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string,
    resetUrl: string
  ) => {
    return sendEmail('password_reset', {
      recipientEmail,
      recipientName,
      resetPasswordUrl: resetUrl
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  return {
    sendPasswordResetEmail,
    isLoading,
    error
  };
}

export function useEmailVerificationEmail() {
  const { sendEmail, isLoading, error } = useEmailService();

  const sendEmailVerificationEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string,
    verificationUrl: string
  ) => {
    return sendEmail('email_verification', {
      recipientEmail,
      recipientName,
      verificationUrl
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  return {
    sendEmailVerificationEmail,
    isLoading,
    error
  };
}

export function useLeaseAgreementEmail() {
  const { sendEmail, isLoading, error } = useEmailService();

  const sendLeaseAgreementEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string,
    propertyAddress: string,
    propertyCity: string,
    monthlyRent: number,
    signingUrl: string,
    landlordName: string,
    leaseStartDate?: string,
    depositAmount?: number
  ) => {
    return sendEmail('lease_agreement_ready', {
      recipientEmail,
      recipientName,
      propertyAddress,
      propertyCity,
      monthlyRent,
      signingUrl,
      landlordName,
      leaseStartDate,
      depositAmount
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  return {
    sendLeaseAgreementEmail,
    isLoading,
    error
  };
}

export function useLeaseSignedConfirmationEmail() {
  const { sendEmail, isLoading, error } = useEmailService();

  const sendLeaseSignedConfirmationEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string,
    propertyAddress: string,
    tenantName: string,
    landlordName: string,
    monthlyRent: number
  ) => {
    return sendEmail('lease_signed_confirmation', {
      recipientEmail,
      recipientName,
      propertyAddress,
      tenantName,
      landlordName,
      monthlyRent
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  return {
    sendLeaseSignedConfirmationEmail,
    isLoading,
    error
  };
}

export function useWelcomeEmail() {
  const { sendEmail, isLoading, error } = useEmailService();

  const sendWelcomeTenantEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string
  ) => {
    return sendEmail('welcome_tenant', {
      recipientEmail,
      recipientName
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  const sendWelcomeLandlordEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string
  ) => {
    return sendEmail('welcome_landlord', {
      recipientEmail,
      recipientName
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  return {
    sendWelcomeTenantEmail,
    sendWelcomeLandlordEmail,
    isLoading,
    error
  };
}

export function usePaymentReminderEmail() {
  const { sendEmail, isLoading, error } = useEmailService();

  const sendPaymentReminderEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string,
    propertyAddress: string,
    monthlyRent: number,
    dueDate: string
  ) => {
    return sendEmail('payment_reminder', {
      recipientEmail,
      recipientName,
      propertyAddress,
      monthlyRent,
      leaseStartDate: dueDate
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  return {
    sendPaymentReminderEmail,
    isLoading,
    error
  };
}

export function useLeaseExpiryWarningEmail() {
  const { sendEmail, isLoading, error } = useEmailService();

  const sendLeaseExpiryWarningEmail = useCallback(async (
    recipientEmail: string,
    recipientName: string,
    propertyAddress: string,
    leaseEndDate: string,
    landlordName: string
  ) => {
    return sendEmail('lease_expiry_warning', {
      recipientEmail,
      recipientName,
      propertyAddress,
      leaseEndDate,
      landlordName
    }, {
      to: [{ email: recipientEmail, name: recipientName }]
    });
  }, [sendEmail]);

  return {
    sendLeaseExpiryWarningEmail,
    isLoading,
    error
  };
}
