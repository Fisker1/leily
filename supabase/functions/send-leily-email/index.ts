/**
 * Leily Email Service - Microsoft Graph Integration
 * Handles sending templated emails via Microsoft Graph API with SMTP fallback
 */

import { renderTemplate, EmailTemplateData } from './utils/renderTemplate.ts';

// Environment variables
const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET');
const MICROSOFT_TENANT_ID = Deno.env.get('MICROSOFT_TENANT_ID');
const MICROSOFT_EMAIL_USER = Deno.env.get('MICROSOFT_EMAIL_USER');

// SMTP Configuration (not used in current implementation)
const SMTP_USER = MICROSOFT_EMAIL_USER;

interface EmailRequest {
  emailType: string;
  templateData: EmailTemplateData;
  to: string;
  from?: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
  method?: string;
  error?: string;
}

/**
 * Get Microsoft Graph access token using client credentials
 */
async function getAccessToken(): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID!,
    client_secret: MICROSOFT_CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Send email via Microsoft Graph API
 */
async function sendViaGraphAPI(
  to: string,
  subject: string,
  htmlContent: string,
  from: string = MICROSOFT_EMAIL_USER!
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    
    const message = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: htmlContent
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      },
      saveToSentItems: true
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${from}/sendMail`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Graph API error:', error);
    return false;
  }
}

/**
 * Send email via SMTP (fallback method) - Simplified for Supabase
 */
async function sendViaSMTP(
  to: string,
  subject: string,
  htmlContent: string,
  from: string = SMTP_USER!
): Promise<boolean> {
  try {
    // For now, just return false to use Graph API only
    // SMTP implementation would require additional setup in Supabase
    console.log('SMTP fallback not implemented, using Graph API only');
    return false;
  } catch (error) {
    console.error('SMTP error:', error);
    return false;
  }
}

/**
 * Main handler for the Edge Function
 */
Deno.serve(async (req: Request): Promise<Response> => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Method not allowed' 
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: EmailRequest = await req.json();
    const { emailType, templateData, to, from } = body;

    // Validate required fields
    if (!emailType || !templateData || !to) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields: emailType, templateData, to' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the email being sent
    console.log(`📧 Sending ${emailType} email to ${to}`);

    // Render email template
    const { html, subject } = await renderTemplate(emailType, templateData);

    // Send via Microsoft Graph API
    const success = await sendViaGraphAPI(to, subject, html, from);
    const method = 'Microsoft Graph API';

    if (success) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Email sent successfully via ${method}`,
        method: method
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Failed to send email via Microsoft Graph API',
        error: 'Graph API delivery failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
