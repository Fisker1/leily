import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SigningNotificationRequest {
  document_id: string
  notification_type: 'document_created' | 'document_sent' | 'document_signed' | 'document_completed' | 'document_expired'
  recipient_email: string
  recipient_name: string
  custom_message?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { document_id, notification_type, recipient_email, recipient_name, custom_message }: SigningNotificationRequest = await req.json()

    if (!document_id || !notification_type || !recipient_email || !recipient_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get document details
    const { data: document, error: docError } = await supabaseClient
      .from('signing_documents')
      .select(`
        *,
        lease_agreement:lease_agreements(
          *,
          property:properties(address, city),
          tenant:tenants(first_name, last_name, email)
        )
      `)
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate email content based on notification type
    const emailContent = generateEmailContent(notification_type, document, recipient_name, custom_message)

    // Send email using existing email service
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-leily-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipient_email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      })
    })

    if (!emailResponse.ok) {
      throw new Error('Failed to send email')
    }

    // Log notification
    await supabaseClient
      .from('audit_log')
      .insert({
        action: 'signing_notification_sent',
        table_name: 'signing_documents',
        details: {
          document_id,
          notification_type,
          recipient_email,
          recipient_name
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Signing notification error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateEmailContent(
  notificationType: string, 
  document: any, 
  recipientName: string, 
  customMessage?: string
) {
  const propertyAddress = document.lease_agreement?.property?.address || 'Eiendommen'
  const leaseData = document.lease_agreement

  switch (notificationType) {
    case 'document_created':
      return {
        subject: `Signeringsdokument opprettet - ${propertyAddress}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Leily</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Elektronisk signering</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Hei ${recipientName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Et signeringsdokument for leieavtalen til <strong>${propertyAddress}</strong> har blitt opprettet.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Dokumentdetaljer</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Eiendom:</strong> ${propertyAddress}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> Klar for signering</p>
                <p style="margin: 5px 0; color: #666;"><strong>Utløper:</strong> ${new Date(document.expires_at).toLocaleDateString('nb-NO')}</p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Du vil motta en e-post med signeringslenke så snart dokumentet er sendt for signering.
              </p>
              
              ${customMessage ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #1976d2; font-style: italic;">"${customMessage}"</p>
                </div>
              ` : ''}
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                Dette er en automatisk melding fra Leily. Vennligst ikke svar på denne e-posten.
              </p>
            </div>
          </div>
        `,
        text: `
          Hei ${recipientName}!
          
          Et signeringsdokument for leieavtalen til ${propertyAddress} har blitt opprettet.
          
          Dokumentdetaljer:
          - Eiendom: ${propertyAddress}
          - Status: Klar for signering
          - Utløper: ${new Date(document.expires_at).toLocaleDateString('nb-NO')}
          
          Du vil motta en e-post med signeringslenke så snart dokumentet er sendt for signering.
          
          ${customMessage ? `\nMelding: "${customMessage}"` : ''}
          
          Med vennlig hilsen,
          Leily Team
        `
      }

    case 'document_sent':
      return {
        subject: `Leieavtale klar for signering - ${propertyAddress}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Leily</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Elektronisk signering</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Hei ${recipientName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Leieavtalen for <strong>${propertyAddress}</strong> er klar for signering.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Signeringsdetaljer</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Eiendom:</strong> ${propertyAddress}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Månedlig husleie:</strong> ${leaseData?.monthly_rent?.toLocaleString('nb-NO')} kr</p>
                <p style="margin: 5px 0; color: #666;"><strong>Leieperiode:</strong> ${new Date(leaseData?.start_date).toLocaleDateString('nb-NO')} - ${leaseData?.end_date ? new Date(leaseData.end_date).toLocaleDateString('nb-NO') : 'Løpende'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Utløper:</strong> ${new Date(document.expires_at).toLocaleDateString('nb-NO')}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://app.scrive.com/sign/${document.scrive_document_id}" 
                   style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Signer leieavtalen
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                <strong>Viktig:</strong> Signeringslenken utløper ${new Date(document.expires_at).toLocaleDateString('nb-NO')}. 
                Du kan signere med BankID eller annen elektronisk signatur.
              </p>
              
              ${customMessage ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #1976d2; font-style: italic;">"${customMessage}"</p>
                </div>
              ` : ''}
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                Dette er en automatisk melding fra Leily. Vennligst ikke svar på denne e-posten.
              </p>
            </div>
          </div>
        `,
        text: `
          Hei ${recipientName}!
          
          Leieavtalen for ${propertyAddress} er klar for signering.
          
          Signeringsdetaljer:
          - Eiendom: ${propertyAddress}
          - Månedlig husleie: ${leaseData?.monthly_rent?.toLocaleString('nb-NO')} kr
          - Leieperiode: ${new Date(leaseData?.start_date).toLocaleDateString('nb-NO')} - ${leaseData?.end_date ? new Date(leaseData.end_date).toLocaleDateString('nb-NO') : 'Løpende'}
          - Utløper: ${new Date(document.expires_at).toLocaleDateString('nb-NO')}
          
          Signer leieavtalen: https://app.scrive.com/sign/${document.scrive_document_id}
          
          Viktig: Signeringslenken utløper ${new Date(document.expires_at).toLocaleDateString('nb-NO')}. 
          Du kan signere med BankID eller annen elektronisk signatur.
          
          ${customMessage ? `\nMelding: "${customMessage}"` : ''}
          
          Med vennlig hilsen,
          Leily Team
        `
      }

    case 'document_signed':
      return {
        subject: `Leieavtale signert - ${propertyAddress}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Leily</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Signering fullført</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Hei ${recipientName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>Gratulerer!</strong> Leieavtalen for ${propertyAddress} har blitt signert.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Signert dokument</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Eiendom:</strong> ${propertyAddress}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Signert av:</strong> ${recipientName}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Signert:</strong> ${new Date().toLocaleDateString('nb-NO')}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> Juridisk bindende</p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Leieavtalen er nå juridisk bindende. En kopi av det signerte dokumentet er tilgjengelig i din Leily-konto.
              </p>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                Dette er en automatisk melding fra Leily. Vennligst ikke svar på denne e-posten.
              </p>
            </div>
          </div>
        `,
        text: `
          Hei ${recipientName}!
          
          Gratulerer! Leieavtalen for ${propertyAddress} har blitt signert.
          
          Signert dokument:
          - Eiendom: ${propertyAddress}
          - Signert av: ${recipientName}
          - Signert: ${new Date().toLocaleDateString('nb-NO')}
          - Status: Juridisk bindende
          
          Leieavtalen er nå juridisk bindende. En kopi av det signerte dokumentet er tilgjengelig i din Leily-konto.
          
          Med vennlig hilsen,
          Leily Team
        `
      }

    case 'document_completed':
      return {
        subject: `Leieavtale fullført - ${propertyAddress}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Leily</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Signeringsprosess fullført</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Hei ${recipientName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>Perfekt!</strong> Alle parter har signert leieavtalen for ${propertyAddress}.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Fullført leieavtale</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Eiendom:</strong> ${propertyAddress}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Fullført:</strong> ${new Date().toLocaleDateString('nb-NO')}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> Aktiv leieavtale</p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Leieavtalen er nå aktiv og juridisk bindende. Du kan finne alle dokumenter og detaljer i din Leily-konto.
              </p>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                Dette er en automatisk melding fra Leily. Vennligst ikke svar på denne e-posten.
              </p>
            </div>
          </div>
        `,
        text: `
          Hei ${recipientName}!
          
          Perfekt! Alle parter har signert leieavtalen for ${propertyAddress}.
          
          Fullført leieavtale:
          - Eiendom: ${propertyAddress}
          - Fullført: ${new Date().toLocaleDateString('nb-NO')}
          - Status: Aktiv leieavtale
          
          Leieavtalen er nå aktiv og juridisk bindende. Du kan finne alle dokumenter og detaljer i din Leily-konto.
          
          Med vennlig hilsen,
          Leily Team
        `
      }

    case 'document_expired':
      return {
        subject: `Signeringsdokument utløpt - ${propertyAddress}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Leily</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Signeringsdokument utløpt</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Hei ${recipientName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Signeringsdokumentet for leieavtalen til <strong>${propertyAddress}</strong> har utløpt.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Utløpt dokument</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Eiendom:</strong> ${propertyAddress}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Utløpt:</strong> ${new Date().toLocaleDateString('nb-NO')}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> Ikke signert</p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Kontakt utleier for å få et nytt signeringsdokument sendt.
              </p>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                Dette er en automatisk melding fra Leily. Vennligst ikke svar på denne e-posten.
              </p>
            </div>
          </div>
        `,
        text: `
          Hei ${recipientName}!
          
          Signeringsdokumentet for leieavtalen til ${propertyAddress} har utløpt.
          
          Utløpt dokument:
          - Eiendom: ${propertyAddress}
          - Utløpt: ${new Date().toLocaleDateString('nb-NO')}
          - Status: Ikke signert
          
          Kontakt utleier for å få et nytt signeringsdokument sendt.
          
          Med vennlig hilsen,
          Leily Team
        `
      }

    default:
      throw new Error(`Unknown notification type: ${notificationType}`)
  }
}






