import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScriveDocumentRequest {
  lease_agreement_id: string
  landlord_email: string
  landlord_name: string
  tenant_email: string
  tenant_name: string
  property_address: string
  document_pdf_url?: string
}

interface ScriveSigner {
  email: string
  name: string
  role: 'landlord' | 'tenant'
}

interface ScriveDocument {
  title: string
  message: string
  expiresInDays: number
  signers: ScriveSigner[]
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

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // Get Scrive API credentials from environment
    const SCRIVE_API_KEY = Deno.env.get('SCRIVE_API_KEY')
    const SCRIVE_BASE_URL = Deno.env.get('SCRIVE_BASE_URL') || 'https://api.scrive.com/v2'

    if (!SCRIVE_API_KEY) {
      throw new Error('Scrive API key not configured')
    }

    switch (method) {
      case 'POST':
        if (action === 'create-document') {
          return await createScriveDocument(req, supabaseClient, user.id, SCRIVE_API_KEY, SCRIVE_BASE_URL)
        } else if (action === 'send-document') {
          return await sendScriveDocument(req, supabaseClient, user.id, SCRIVE_API_KEY, SCRIVE_BASE_URL)
        } else if (action === 'upload-file') {
          return await uploadFileToScrive(req, supabaseClient, user.id, SCRIVE_API_KEY, SCRIVE_BASE_URL)
        }
        break

      case 'GET':
        if (action === 'document-status') {
          return await getDocumentStatus(req, supabaseClient, user.id, SCRIVE_API_KEY, SCRIVE_BASE_URL)
        } else if (action === 'document-list') {
          return await getDocumentList(req, supabaseClient, user.id, SCRIVE_API_KEY, SCRIVE_BASE_URL)
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Scrive signing error:', error)
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

async function createScriveDocument(
  req: Request, 
  supabaseClient: any, 
  userId: string, 
  apiKey: string, 
  baseUrl: string
) {
  const body: ScriveDocumentRequest = await req.json()

  // Validate required fields
  if (!body.lease_agreement_id || !body.landlord_email || !body.tenant_email) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Get lease agreement details
    const { data: leaseAgreement, error: leaseError } = await supabaseClient
      .from('lease_agreements')
      .select(`
        *,
        property:properties(address, city),
        tenant:tenants(first_name, last_name, email)
      `)
      .eq('id', body.lease_agreement_id)
      .eq('property_owner_id', userId)
      .single()

    if (leaseError || !leaseAgreement) {
      return new Response(
        JSON.stringify({ error: 'Lease agreement not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Scrive document
    const scriveDocument: ScriveDocument = {
      title: `Leieavtale - ${leaseAgreement.property?.address || 'Eiendom'}`,
      message: `Vennligst signer leieavtalen for ${leaseAgreement.property?.address || 'eiendommen'}.`,
      expiresInDays: 30,
      signers: [
        {
          email: body.landlord_email,
          name: body.landlord_name,
          role: 'landlord'
        },
        {
          email: body.tenant_email,
          name: body.tenant_name,
          role: 'tenant'
        }
      ]
    }

    // Call Scrive API to create document
    const scriveResponse = await fetch(`${baseUrl}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scriveDocument)
    })

    if (!scriveResponse.ok) {
      const errorText = await scriveResponse.text()
      throw new Error(`Scrive API error: ${scriveResponse.status} - ${errorText}`)
    }

    const scriveData = await scriveResponse.json()

    // Save document to database
    const { data: signingDocument, error: dbError } = await supabaseClient
      .from('signing_documents')
      .insert({
        lease_agreement_id: body.lease_agreement_id,
        scrive_document_id: scriveData.id,
        document_type: 'lease_agreement',
        status: 'draft',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Create signer records
    const signerRecords = scriveDocument.signers.map(signer => ({
      document_id: signingDocument.id,
      signer_email: signer.email,
      signer_name: signer.name,
      signer_role: signer.role,
      status: 'pending'
    }))

    const { error: signersError } = await supabaseClient
      .from('document_signers')
      .insert(signerRecords)

    if (signersError) {
      console.error('Error creating signer records:', signersError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: signingDocument,
        scrive_document_id: scriveData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating Scrive document:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create document', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function uploadFileToScrive(
  req: Request, 
  supabaseClient: any, 
  userId: string, 
  apiKey: string, 
  baseUrl: string
) {
  const formData = await req.formData()
  const documentId = formData.get('document_id') as string
  const file = formData.get('file') as File

  if (!documentId || !file) {
    return new Response(
      JSON.stringify({ error: 'Missing document_id or file' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Get Scrive document ID from database
    const { data: signingDocument, error: docError } = await supabaseClient
      .from('signing_documents')
      .select('scrive_document_id')
      .eq('id', documentId)
      .eq('lease_agreement_id', (await supabaseClient
        .from('lease_agreements')
        .select('property_owner_id')
        .eq('id', (await supabaseClient
          .from('signing_documents')
          .select('lease_agreement_id')
          .eq('id', documentId)
          .single()
        ).data?.lease_agreement_id)
        .single()
      ).data?.property_owner_id)
      .single()

    if (docError || !signingDocument) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Upload file to Scrive
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    const scriveResponse = await fetch(`${baseUrl}/documents/${signingDocument.scrive_document_id}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: uploadFormData
    })

    if (!scriveResponse.ok) {
      const errorText = await scriveResponse.text()
      throw new Error(`Scrive upload error: ${scriveResponse.status} - ${errorText}`)
    }

    const uploadData = await scriveResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        file_id: uploadData.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error uploading file to Scrive:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to upload file', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function sendScriveDocument(
  req: Request, 
  supabaseClient: any, 
  userId: string, 
  apiKey: string, 
  baseUrl: string
) {
  const { document_id, message } = await req.json()

  if (!document_id) {
    return new Response(
      JSON.stringify({ error: 'Missing document_id' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Get Scrive document ID from database
    const { data: signingDocument, error: docError } = await supabaseClient
      .from('signing_documents')
      .select('scrive_document_id')
      .eq('id', document_id)
      .single()

    if (docError || !signingDocument) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send document via Scrive API
    const scriveResponse = await fetch(`${baseUrl}/documents/${signingDocument.scrive_document_id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message || 'Leieavtale klar for signering'
      })
    })

    if (!scriveResponse.ok) {
      const errorText = await scriveResponse.text()
      throw new Error(`Scrive send error: ${scriveResponse.status} - ${errorText}`)
    }

    // Update document status in database
    const { error: updateError } = await supabaseClient
      .from('signing_documents')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('Error updating document status:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document sent for signing' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending Scrive document:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send document', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getDocumentStatus(
  req: Request, 
  supabaseClient: any, 
  userId: string, 
  apiKey: string, 
  baseUrl: string
) {
  const url = new URL(req.url)
  const documentId = url.searchParams.get('document_id')

  if (!documentId) {
    return new Response(
      JSON.stringify({ error: 'Missing document_id' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Get Scrive document ID from database
    const { data: signingDocument, error: docError } = await supabaseClient
      .from('signing_documents')
      .select('scrive_document_id, status')
      .eq('id', documentId)
      .single()

    if (docError || !signingDocument) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get status from Scrive API
    const scriveResponse = await fetch(`${baseUrl}/documents/${signingDocument.scrive_document_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })

    if (!scriveResponse.ok) {
      const errorText = await scriveResponse.text()
      throw new Error(`Scrive API error: ${scriveResponse.status} - ${errorText}`)
    }

    const scriveData = await scriveResponse.json()

    // Update local status if needed
    if (scriveData.status !== signingDocument.status) {
      await supabaseClient
        .from('signing_documents')
        .update({ 
          status: scriveData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: scriveData.status,
        document: scriveData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error getting document status:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get document status', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getDocumentList(
  req: Request, 
  supabaseClient: any, 
  userId: string, 
  apiKey: string, 
  baseUrl: string
) {
  try {
    // Get user's signing documents
    const { data: documents, error } = await supabaseClient
      .from('signing_documents')
      .select(`
        *,
        lease_agreement:lease_agreements(
          *,
          property:properties(address, city),
          tenant:tenants(first_name, last_name, email)
        ),
        signers:document_signers(*)
      `)
      .eq('lease_agreement.property_owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        documents 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error getting document list:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get document list', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}






