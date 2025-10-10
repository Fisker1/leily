/**
 * Microsoft Exchange Email Service for Leily
 * 
 * This service provides email functionality using Microsoft Graph API
 * with SMTP fallback for sending various types of notifications.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  name: string;
  content: string; // base64 encoded
  contentType: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email template types
export type EmailType = 
  | 'account_created'
  | 'password_reset'
  | 'email_verification'
  | 'lease_agreement_ready'
  | 'lease_signed_confirmation'
  | 'welcome_tenant'
  | 'welcome_landlord'
  | 'payment_reminder'
  | 'lease_expiry_warning';

export interface EmailTemplateData {
  // Common fields
  recipientName: string;
  recipientEmail: string;
  
  // Account related
  verificationUrl?: string;
  resetPasswordUrl?: string;
  
  // Lease related
  propertyAddress?: string;
  propertyCity?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  monthlyRent?: number;
  depositAmount?: number;
  signingUrl?: string;
  landlordName?: string;
  tenantName?: string;
  
  // System
  supportEmail?: string;
  companyName?: string;
}

class MicrosoftExchangeEmailService {
  private graphApiEndpoint = 'https://graph.microsoft.com/v1.0';
  private smtpConfig = {
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: '', // Will be set from environment
      pass: ''  // Will be set from environment
    }
  };

  constructor() {
    // Initialize SMTP config from environment
    this.smtpConfig.auth.user = process.env.MICROSOFT_EMAIL_USER || '';
    this.smtpConfig.auth.pass = process.env.MICROSOFT_EMAIL_PASSWORD || '';
  }

  /**
   * Send email using Microsoft Graph API (preferred method)
   */
  async sendEmailViaGraph(
    templateType: EmailType,
    templateData: EmailTemplateData,
    options: EmailOptions
  ): Promise<EmailResult> {
    try {
      const accessToken = await this.getAccessToken();
      const template = this.generateEmailTemplate(templateType, templateData);
      
      const emailPayload = {
        message: {
          subject: template.subject,
          body: {
            contentType: 'HTML',
            content: template.html
          },
          toRecipients: options.to.map(recipient => ({
            emailAddress: {
              address: recipient.email,
              name: recipient.name || recipient.email
            }
          })),
          ccRecipients: options.cc?.map(recipient => ({
            emailAddress: {
              address: recipient.email,
              name: recipient.name || recipient.email
            }
          })) || [],
          bccRecipients: options.bcc?.map(recipient => ({
            emailAddress: {
              address: recipient.email,
              name: recipient.name || recipient.email
            }
          })) || [],
          replyTo: options.replyTo ? [{
            emailAddress: {
              address: options.replyTo
            }
          }] : [],
          attachments: options.attachments?.map(attachment => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: attachment.name,
            contentType: attachment.contentType,
            contentBytes: attachment.content
          })) || []
        },
        saveToSentItems: true
      };

      const response = await fetch(
        `${this.graphApiEndpoint}/users/${this.smtpConfig.auth.user}/sendMail`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Graph API error: ${errorData.error?.message || response.statusText}`);
      }

      return {
        success: true,
        messageId: response.headers.get('x-ms-request-id') || undefined
      };

    } catch (error) {
      console.error('Graph API email failed, falling back to SMTP:', error);
      return this.sendEmailViaSMTP(templateType, templateData, options);
    }
  }

  /**
   * Send email using SMTP (fallback method)
   */
  async sendEmailViaSMTP(
    templateType: EmailType,
    templateData: EmailTemplateData,
    options: EmailOptions
  ): Promise<EmailResult> {
    try {
      // For Deno environment (Supabase Edge Functions)
      if (typeof Deno !== 'undefined') {
        return this.sendEmailViaDenoSMTP(templateType, templateData, options);
      }

      // For Node.js environment
      const nodemailer = await import('nodemailer');
      const template = this.generateEmailTemplate(templateType, templateData);
      
      const transporter = nodemailer.createTransporter(this.smtpConfig);
      
      const mailOptions = {
        from: `"Leily" <${this.smtpConfig.auth.user}>`,
        to: options.to.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', '),
        cc: options.cc?.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', '),
        bcc: options.bcc?.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', '),
        replyTo: options.replyTo,
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments: options.attachments?.map(attachment => ({
          filename: attachment.name,
          content: Buffer.from(attachment.content, 'base64'),
          contentType: attachment.contentType
        }))
      };

      const result = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('SMTP email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMTP error'
      };
    }
  }

  /**
   * Send email using Deno's built-in SMTP (for Supabase Edge Functions)
   */
  private async sendEmailViaDenoSMTP(
    templateType: EmailType,
    templateData: EmailTemplateData,
    options: EmailOptions
  ): Promise<EmailResult> {
    try {
      const template = this.generateEmailTemplate(templateType, templateData);
      
      // Use Deno's built-in SMTP capabilities
      const smtp = await import('https://deno.land/x/smtp@v0.7.0/mod.ts');
      
      const config = {
        hostname: this.smtpConfig.host,
        port: this.smtpConfig.port,
        username: this.smtpConfig.auth.user,
        password: this.smtpConfig.auth.pass,
        from: this.smtpConfig.auth.user,
        to: options.to.map(r => r.email),
        subject: template.subject,
        content: template.html,
        html: template.html
      };

      await smtp.send(config);
      
      return {
        success: true,
        messageId: `deno-smtp-${Date.now()}`
      };

    } catch (error) {
      console.error('Deno SMTP failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deno SMTP error'
      };
    }
  }

  /**
   * Get Microsoft Graph API access token
   */
  private async getAccessToken(): Promise<string> {
    const clientId = process.env.MICROSOFT_CLIENT_ID || Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const tenantId = process.env.MICROSOFT_TENANT_ID || Deno.env.get('MICROSOFT_TENANT_ID');

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Microsoft Graph API credentials not configured');
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const tokenData = await response.json();
    return tokenData.access_token;
  }

  /**
   * Generate email template based on type and data
   */
  private generateEmailTemplate(type: EmailType, data: EmailTemplateData): EmailTemplate {
    const baseTemplate = this.getBaseTemplate();
    
    switch (type) {
      case 'account_created':
        return this.getAccountCreatedTemplate(data, baseTemplate);
      case 'password_reset':
        return this.getPasswordResetTemplate(data, baseTemplate);
      case 'email_verification':
        return this.getEmailVerificationTemplate(data, baseTemplate);
      case 'lease_agreement_ready':
        return this.getLeaseAgreementReadyTemplate(data, baseTemplate);
      case 'lease_signed_confirmation':
        return this.getLeaseSignedConfirmationTemplate(data, baseTemplate);
      case 'welcome_tenant':
        return this.getWelcomeTenantTemplate(data, baseTemplate);
      case 'welcome_landlord':
        return this.getWelcomeLandlordTemplate(data, baseTemplate);
      case 'payment_reminder':
        return this.getPaymentReminderTemplate(data, baseTemplate);
      case 'lease_expiry_warning':
        return this.getLeaseExpiryWarningTemplate(data, baseTemplate);
      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  private getBaseTemplate() {
    return {
      styles: `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .info-box { background: #f8f9fa; border-left: 4px solid #0EA5E9; padding: 15px; margin: 20px 0; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: 600; width: 140px; color: #666; }
        .info-value { color: #333; }
        .cta-button { display: inline-block; background: #0EA5E9; color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; text-align: center; }
        .cta-button:hover { background: #0284C7; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e9ecef; }
        .footer a { color: #0EA5E9; text-decoration: none; }
      `,
      footer: `
        <div class="footer">
          <p>Denne e-posten er sendt fra <a href="https://leily.no">Leily.no</a><br>
          Norges moderne plattform for utleie og eiendomsforvaltning</p>
          <p style="margin-top: 10px; font-size: 12px; color: #999;">
            E-post generert ${new Date().toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      `
    };
  }

  private getAccountCreatedTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: 'Velkommen til Leily! 🏠',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Velkommen til Leily!</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Takk for at du opprettet en konto hos Leily! Vi er glade for å ha deg med i vårt fellesskap av eiendomsforvaltere og leietakere.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">🎯 Hva kan du gjøre nå?</h3>
                <ul>
                  <li><strong>Som utleier:</strong> Legg til eiendommer, opprett leieavtaler og administrer leietakere</li>
                  <li><strong>Som leietaker:</strong> Se leieavtaler, kommuniser med utleier og administrer betalinger</li>
                  <li><strong>Begge:</strong> Bruk vår AI-drevne kalkulator for å analysere lønnsomhet</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="https://leily.no/dashboard" class="cta-button">
                  🚀 Gå til dashboard
                </a>
              </div>

              <p>Ved spørsmål, ikke nøl med å kontakte oss på <a href="mailto:${data.supportEmail || 'kontakt@leily.no'}">${data.supportEmail || 'kontakt@leily.no'}</a></p>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }

  private getPasswordResetTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: 'Tilbakestill passord - Leily',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Tilbakestill passord</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Du har bedt om å tilbakestille passordet ditt for Leily-kontoen din.</p>
              
              <div style="text-align: center;">
                <a href="${data.resetPasswordUrl}" class="cta-button">
                  🔑 Tilbakestill passord
                </a>
              </div>

              <p><strong>Denne lenken utløper om 1 time.</strong></p>
              <p>Hvis du ikke ba om å tilbakestille passordet, kan du trygt ignorere denne e-posten.</p>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }

  private getEmailVerificationTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: 'Bekreft e-postadressen din - Leily',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Bekreft e-postadressen</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Takk for at du registrerte deg hos Leily! For å fullføre registreringen, må du bekrefte e-postadressen din.</p>
              
              <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="cta-button">
                  ✅ Bekreft e-postadresse
                </a>
              </div>

              <p>Hvis du ikke opprettet en konto hos Leily, kan du trygt ignorere denne e-posten.</p>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }

  private getLeaseAgreementReadyTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: `Leieavtale klar for signering - ${data.propertyAddress}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Leieavtale klar for signering</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Du har fått tilsendt en leieavtale som er klar for signering med BankID.</p>

              <div class="info-box">
                <h3 style="margin-top: 0;">📍 Eiendomsinfo</h3>
                <div class="info-row">
                  <div class="info-label">Adresse:</div>
                  <div class="info-value">${data.propertyAddress}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Sted:</div>
                  <div class="info-value">${data.propertyCity}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Månedlig leie:</div>
                  <div class="info-value">${data.monthlyRent?.toLocaleString('no-NO')} kr</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Fra dato:</div>
                  <div class="info-value">${data.leaseStartDate}</div>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${data.signingUrl}" class="cta-button">
                  🔐 Signer med BankID
                </a>
              </div>

              <p>Ved spørsmål, kontakt ${data.landlordName} direkte eller svar på denne e-posten.</p>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }

  private getLeaseSignedConfirmationTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: `Leieavtale signert - ${data.propertyAddress}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Leieavtale signert</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Gratulerer! Leieavtalen for ${data.propertyAddress} har blitt signert og er nå juridisk bindende.</p>

              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Avtaledetaljer</h3>
                <div class="info-row">
                  <div class="info-label">Eiendom:</div>
                  <div class="info-value">${data.propertyAddress}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Leietaker:</div>
                  <div class="info-value">${data.tenantName}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Utleier:</div>
                  <div class="info-value">${data.landlordName}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Månedlig leie:</div>
                  <div class="info-value">${data.monthlyRent?.toLocaleString('no-NO')} kr</div>
                </div>
              </div>

              <p>En kopi av den signerte avtalen er vedlagt som PDF. Begge parter har nå tilgang til avtalen i Leily-dashboardet.</p>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }

  private getWelcomeTenantTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: 'Velkommen som leietaker hos Leily! 🏠',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Velkommen som leietaker!</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Velkommen som leietaker hos Leily! Vi er glade for å hjelpe deg med å administrere leieforholdet ditt.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">🎯 Hva kan du gjøre i Leily?</h3>
                <ul>
                  <li>Se og administrer leieavtaler</li>
                  <li>Kommuniser direkte med utleier</li>
                  <li>Administrer betalinger og kvitteringer</li>
                  <li>Motta viktige varsler og oppdateringer</li>
                  <li>Få tilgang til eiendomsdokumenter</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="https://leily.no/dashboard" class="cta-button">
                  🚀 Gå til dashboard
                </a>
              </div>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }

  private getWelcomeLandlordTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: 'Velkommen som utleier hos Leily! 🏢',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏢 Velkommen som utleier!</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Velkommen som utleier hos Leily! Vi er glade for å hjelpe deg med å administrere eiendommene dine effektivt.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">🎯 Hva kan du gjøre i Leily?</h3>
                <ul>
                  <li>Legg til og administrer eiendommer</li>
                  <li>Opprett og signer leieavtaler digitalt</li>
                  <li>Administrer leietakere og kommunikasjon</li>
                  <li>Bruk AI-kalkulator for lønnsomhetsanalyse</li>
                  <li>Generer rapporter og dokumenter</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="https://leily.no/dashboard" class="cta-button">
                  🚀 Gå til dashboard
                </a>
              </div>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }

  private getPaymentReminderTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: `Påminnelse om leiebetaling - ${data.propertyAddress}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Påminnelse om leiebetaling</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Dette er en vennlig påminnelse om at leiebetalingen for ${data.propertyAddress} forfaller snart.</p>

              <div class="info-box">
                <h3 style="margin-top: 0;">💳 Betalingsdetaljer</h3>
                <div class="info-row">
                  <div class="info-label">Beløp:</div>
                  <div class="info-value">${data.monthlyRent?.toLocaleString('no-NO')} kr</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Forfall:</div>
                  <div class="info-value">${data.leaseStartDate}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Kontonummer:</div>
                  <div class="info-value">[Kontonummer vil vises her]</div>
                </div>
              </div>

              <p>Vennligst sørg for at betalingen er registrert før forfallsdatoen.</p>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }

  private getLeaseExpiryWarningTemplate(data: EmailTemplateData, base: any): EmailTemplate {
    return {
      subject: `Leieavtale utløper snart - ${data.propertyAddress}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${base.styles}</style></head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Leieavtale utløper snart</h1>
            </div>
            <div class="content">
              <div class="greeting">Hei ${data.recipientName},</div>
              <p>Vi vil minne deg om at leieavtalen for ${data.propertyAddress} utløper ${data.leaseEndDate}.</p>

              <div class="info-box">
                <h3 style="margin-top: 0;">📅 Avtaledetaljer</h3>
                <div class="info-row">
                  <div class="info-label">Eiendom:</div>
                  <div class="info-value">${data.propertyAddress}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Utløpsdato:</div>
                  <div class="info-value">${data.leaseEndDate}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Dager igjen:</div>
                  <div class="info-value">[Beregnet antall dager]</div>
                </div>
              </div>

              <p>Vennligst kontakt ${data.landlordName} for å diskutere fornyelse eller utflytting.</p>
            </div>
            ${base.footer}
          </div>
        </body>
        </html>
      `
    };
  }
}

// Export singleton instance
export const emailService = new MicrosoftExchangeEmailService();

// Convenience functions for common use cases
export async function sendAccountCreatedEmail(
  recipientEmail: string,
  recipientName: string,
  supportEmail?: string
): Promise<EmailResult> {
  return emailService.sendEmailViaGraph('account_created', {
    recipientEmail,
    recipientName,
    supportEmail
  }, {
    to: [{ email: recipientEmail, name: recipientName }]
  });
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  recipientName: string,
  resetUrl: string
): Promise<EmailResult> {
  return emailService.sendEmailViaGraph('password_reset', {
    recipientEmail,
    recipientName,
    resetPasswordUrl: resetUrl
  }, {
    to: [{ email: recipientEmail, name: recipientName }]
  });
}

export async function sendLeaseAgreementEmail(
  recipientEmail: string,
  recipientName: string,
  propertyAddress: string,
  propertyCity: string,
  monthlyRent: number,
  signingUrl: string,
  landlordName: string
): Promise<EmailResult> {
  return emailService.sendEmailViaGraph('lease_agreement_ready', {
    recipientEmail,
    recipientName,
    propertyAddress,
    propertyCity,
    monthlyRent,
    signingUrl,
    landlordName
  }, {
    to: [{ email: recipientEmail, name: recipientName }]
  });
}
