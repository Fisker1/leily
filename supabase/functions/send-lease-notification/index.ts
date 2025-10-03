import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/send-lease-notification', '');

  try {
    if (path === '/email' && req.method === 'POST') {
      return await sendEmailNotification(req);
    } else if (path === '/sms' && req.method === 'POST') {
      return await sendSmsNotification(req);
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function sendEmailNotification(req: Request) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const resend = new Resend(resendApiKey);

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

  // Send email via Resend
  const { data, error: sendError } = await resend.emails.send({
    from: 'Leily <noreply@alquiz.no>',
    to: [recipientEmail],
    subject: emailSubject,
    html: emailHtml,
  });

  if (sendError) {
    throw new Error(`Failed to send email: ${sendError.message}`);
  }

  // Mark as notified in database
  const updateField = recipientType === 'tenant' ? 'tenant_notified' : 'landlord_notified';
  await supabaseClient
    .from('lease_signatures')
    .update({ [updateField]: true })
    .eq('id', signatureId);

  console.log(`Email sent successfully to ${recipientEmail}`);

  return new Response(
    JSON.stringify({
      success: true,
      emailId: data?.id,
      recipientEmail,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function sendSmsNotification(req: Request) {
  // Link Mobility SMS implementation - stub for now
  const linkMobilityApiKey = Deno.env.get('LINK_MOBILITY_API_KEY');
  
  if (!linkMobilityApiKey) {
    console.log('Link Mobility not configured yet - SMS notification skipped');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS notification skipped - Link Mobility not configured',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { signatureId, recipientType, phoneNumber } = await req.json();

  // TODO: Implement Link Mobility SMS API
  // const smsBody = {
  //   source: 'Leily',
  //   destination: phoneNumber,
  //   userData: 'Du har en leieavtale å signere. Se e-post for detaljer.',
  // };

  console.log(`SMS would be sent to ${phoneNumber} for signature ${signatureId}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'SMS feature coming soon',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

interface EmailTemplateData {
  recipientName: string;
  recipientType: string;
  property: any;
  lease: any;
  tenant: any;
  landlordName: string;
  signingUrl: string;
}

function generateEmailTemplate(data: EmailTemplateData): string {
  const {
    recipientName,
    recipientType,
    property,
    lease,
    tenant,
    landlordName,
    signingUrl,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px 20px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #0EA5E9;
          padding: 15px;
          margin: 20px 0;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: 600;
          width: 140px;
          color: #666;
        }
        .info-value {
          color: #333;
        }
        .cta-button {
          display: inline-block;
          background: #0EA5E9;
          color: white !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .cta-button:hover {
          background: #0284C7;
        }
        .bankid-info {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .bankid-info h3 {
          margin: 0 0 10px 0;
          color: #856404;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
          border-top: 1px solid #e9ecef;
        }
        .footer a {
          color: #0EA5E9;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Leieavtale klar for signering</h1>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hei ${recipientName},
          </div>
          
          <p>
            ${recipientType === 'tenant' 
              ? `Du har fått tilsendt en leieavtale fra ${landlordName} som er klar for signering med BankID.`
              : 'Leieavtalen er nå klar for signering. Vennligst signer avtalen med BankID for å sende den videre til leietaker.'}
          </p>

          <div class="info-box">
            <h3 style="margin-top: 0;">📍 Eiendomsinfo</h3>
            <div class="info-row">
              <div class="info-label">Adresse:</div>
              <div class="info-value">${property.address}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Sted:</div>
              <div class="info-value">${property.postal_code} ${property.city}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Størrelse:</div>
              <div class="info-value">${property.size_sqm} m²</div>
            </div>
            <div class="info-row">
              <div class="info-label">Type:</div>
              <div class="info-value">${property.property_type || 'Leilighet'}</div>
            </div>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">💰 Leieforhold</h3>
            <div class="info-row">
              <div class="info-label">Månedlig leie:</div>
              <div class="info-value">${Number(lease.monthly_rent).toLocaleString('no-NO')} kr</div>
            </div>
            <div class="info-row">
              <div class="info-label">Depositum:</div>
              <div class="info-value">${lease.deposit_amount ? Number(lease.deposit_amount).toLocaleString('no-NO') + ' kr' : 'Ikke avtalt'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Fra dato:</div>
              <div class="info-value">${new Date(lease.start_date).toLocaleDateString('no-NO')}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Til dato:</div>
              <div class="info-value">${lease.end_date ? new Date(lease.end_date).toLocaleDateString('no-NO') : 'Tidsubestemt'}</div>
            </div>
          </div>

          <div class="bankid-info">
            <h3>🔐 Hvordan signere med BankID</h3>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Klikk på "Signer med BankID"-knappen nedenfor</li>
              <li>Du vil bli dirigert til BankID-løsningen</li>
              <li>Logg inn med din vanlige BankID (mobil eller kodebrikke)</li>
              <li>Bekreft signeringen</li>
              <li>Avtalen er juridisk bindende når begge parter har signert</li>
            </ol>
          </div>

          <div style="text-align: center;">
            <a href="${signingUrl}" class="cta-button">
              🔐 Signer med BankID
            </a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            ${recipientType === 'tenant'
              ? `Ved spørsmål, kontakt ${landlordName} direkte eller svar på denne e-posten.`
              : 'Når du har signert, vil leietaker automatisk få tilsendt en e-post med lenke for å signere.'}
          </p>

          ${recipientType === 'tenant' ? `
          <p style="font-size: 14px; color: #666;">
            <strong>Kontaktinfo leietaker:</strong><br>
            ${tenant.first_name} ${tenant.last_name}<br>
            ${tenant.email || ''}<br>
            ${tenant.phone || ''}
          </p>
          ` : ''}
        </div>

        <div class="footer">
          <p>
            Denne e-posten er sendt fra <a href="https://leily.no">Leily.no</a><br>
            Norges moderne plattform for utleie og eiendomsforvaltning
          </p>
          <p style="margin-top: 10px; font-size: 12px; color: #999;">
            Leieavtalen er generert ${new Date().toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
