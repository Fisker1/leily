import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SIGNICAT_BASE_URL = 'https://api.signicat.com/signature/v2';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/signicat-signing', '');

  try {
    // Route requests
    if (path === '/create-signature-request' && req.method === 'POST') {
      return await createSignatureRequest(req);
    } else if (path === '/webhook' && req.method === 'POST') {
      return await handleWebhook(req);
    } else if (path.startsWith('/status/') && req.method === 'GET') {
      return await getSignatureStatus(req, path);
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error in signicat-signing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createSignatureRequest(req: Request) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { leaseId } = await req.json();
  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  console.log(`Creating signature request for lease ${leaseId}`);

  // Fetch lease with related data
  const { data: lease, error: leaseError } = await supabaseClient
    .from('lease_agreements')
    .select(`
      *,
      property:properties(*),
      tenant:tenants(*)
    `)
    .eq('id', leaseId)
    .eq('property_owner_id', user.id)
    .single();

  if (leaseError || !lease) {
    throw new Error(`Lease not found: ${leaseError?.message}`);
  }

  // Get landlord profile
  const { data: landlordProfile } = await supabaseClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  // Generate PDF data (call generate-lease-pdf function)
  const pdfResponse = await supabaseClient.functions.invoke('generate-lease-pdf', {
    body: { leaseId }
  });

  if (pdfResponse.error) {
    throw new Error(`Failed to generate PDF: ${pdfResponse.error.message}`);
  }

  const { htmlTemplate, fileName } = pdfResponse.data;

  // Get Signicat access token
  const accessToken = await getSignicatAccessToken();

  // Create document in Signicat
  const documentData = {
    title: `Leieavtale - ${lease.property.address}`,
    description: `Leieavtale for ${lease.property.address}, ${lease.property.city}`,
    externalId: leaseId,
    dataToSign: {
      base64Content: btoa(htmlTemplate), // Convert HTML to base64
      fileName: fileName,
    },
    advanced: {
      requiredSignatures: 2,
      timezone: 'Europe/Oslo',
    },
  };

  const createDocResponse = await fetch(`${SIGNICAT_BASE_URL}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentData),
  });

  if (!createDocResponse.ok) {
    const error = await createDocResponse.text();
    throw new Error(`Failed to create document in Signicat: ${error}`);
  }

  const document = await createDocResponse.json();
  const documentId = document.documentId;

  console.log(`Created Signicat document ${documentId}`);

  // Add signers (landlord and tenant)
  const signers = [
    {
      externalSignerId: user.id,
      order: 1,
      signerInfo: {
        firstName: landlordProfile?.full_name?.split(' ')[0] || 'Utleier',
        lastName: landlordProfile?.full_name?.split(' ').slice(1).join(' ') || '',
        email: landlordProfile?.email || user.email,
        mobile: {
          countryCode: '+47',
        },
      },
      signatureType: {
        mechanism: 'bankid_no',
        signatureMethod: 'bankid_no',
      },
      ui: {
        language: 'NO',
      },
    },
    {
      externalSignerId: lease.tenant.id,
      order: 2,
      signerInfo: {
        firstName: lease.tenant.first_name,
        lastName: lease.tenant.last_name,
        email: lease.tenant.email,
        mobile: {
          countryCode: '+47',
          number: lease.tenant.phone?.replace(/\s/g, ''),
        },
      },
      signatureType: {
        mechanism: 'bankid_no',
        signatureMethod: 'bankid_no',
      },
      ui: {
        language: 'NO',
      },
    },
  ];

  for (const signer of signers) {
    const addSignerResponse = await fetch(
      `${SIGNICAT_BASE_URL}/documents/${documentId}/signers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signer),
      }
    );

    if (!addSignerResponse.ok) {
      const error = await addSignerResponse.text();
      throw new Error(`Failed to add signer: ${error}`);
    }
  }

  console.log(`Added signers to document ${documentId}`);

  // Activate document for signing
  const activateResponse = await fetch(
    `${SIGNICAT_BASE_URL}/documents/${documentId}/activate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!activateResponse.ok) {
    const error = await activateResponse.text();
    throw new Error(`Failed to activate document: ${error}`);
  }

  const activatedDoc = await activateResponse.json();

  // Get signing URLs
  const landlordUrl = activatedDoc.signers.find((s: any) => s.externalSignerId === user.id)?.url || '';
  const tenantUrl = activatedDoc.signers.find((s: any) => s.externalSignerId === lease.tenant.id)?.url || '';

  // Store in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  const { data: signature, error: insertError } = await supabaseClient
    .from('lease_signatures')
    .insert({
      lease_id: leaseId,
      signicat_document_id: documentId,
      signicat_status: 'active',
      status: 'pending',
      landlord_signing_url: landlordUrl,
      tenant_signing_url: tenantUrl,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to store signature: ${insertError.message}`);
  }

  // Update lease status
  await supabaseClient
    .from('lease_agreements')
    .update({
      signature_status: 'pending',
      signature_initiated_at: new Date().toISOString(),
    })
    .eq('id', leaseId);

  console.log(`Signature request created successfully`);

  return new Response(
    JSON.stringify({
      success: true,
      signatureId: signature.id,
      documentId: documentId,
      landlordSigningUrl: landlordUrl,
      tenantSigningUrl: tenantUrl,
      expiresAt: signature.expires_at,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleWebhook(req: Request) {
  // Validate webhook signature
  const webhookSecret = Deno.env.get('SIGNICAT_WEBHOOK_SECRET');
  const signature = req.headers.get('x-signicat-signature');
  
  // TODO: Implement proper signature validation
  
  const payload = await req.json();
  console.log('Received Signicat webhook:', payload);

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { documentId, event, signers } = payload;

  // Find signature record
  const { data: signature } = await supabaseClient
    .from('lease_signatures')
    .select('*, lease_agreements(*)')
    .eq('signicat_document_id', documentId)
    .single();

  if (!signature) {
    console.error(`Signature not found for document ${documentId}`);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Update signature status based on event
  const updates: any = {
    signicat_status: event,
  };

  // Check which signers have signed
  if (signers) {
    for (const signer of signers) {
      if (signer.status === 'signed') {
        if (signer.order === 1) {
          updates.landlord_signed = true;
          updates.landlord_signed_at = new Date().toISOString();
        } else if (signer.order === 2) {
          updates.tenant_signed = true;
          updates.tenant_signed_at = new Date().toISOString();
        }
      }
    }
  }

  // Update overall status
  if (updates.landlord_signed && updates.tenant_signed) {
    updates.status = 'completed';
    
    // Download signed PDF
    const accessToken = await getSignicatAccessToken();
    const pdfResponse = await fetch(
      `${SIGNICAT_BASE_URL}/documents/${documentId}/files/signed`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (pdfResponse.ok) {
      const pdfBlob = await pdfResponse.blob();
      // TODO: Upload to Supabase Storage
      updates.signed_pdf_url = `signed_documents/${documentId}.pdf`;
    }

    // Update lease agreement
    await supabaseClient
      .from('lease_agreements')
      .update({
        signature_status: 'fully_signed',
        signature_completed_at: new Date().toISOString(),
        signed_document_url: updates.signed_pdf_url,
        status: 'active',
      })
      .eq('id', signature.lease_id);

  } else if (updates.landlord_signed || updates.tenant_signed) {
    updates.status = updates.landlord_signed ? 'landlord_signed' : 'tenant_signed';
    
    await supabaseClient
      .from('lease_agreements')
      .update({
        signature_status: 'partially_signed',
      })
      .eq('id', signature.lease_id);
  }

  // Update signature record
  await supabaseClient
    .from('lease_signatures')
    .update(updates)
    .eq('id', signature.id);

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSignatureStatus(req: Request, path: string) {
  const leaseId = path.split('/').pop();
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: signature, error } = await supabaseClient
    .from('lease_signatures')
    .select(`
      *,
      lease_agreements!inner(property_owner_id)
    `)
    .eq('lease_id', leaseId)
    .eq('lease_agreements.property_owner_id', user.id)
    .single();

  if (error || !signature) {
    throw new Error('Signature not found');
  }

  return new Response(
    JSON.stringify({
      success: true,
      signature,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function getSignicatAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SIGNICAT_CLIENT_ID');
  const clientSecret = Deno.env.get('SIGNICAT_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Signicat credentials not configured');
  }

  const tokenResponse = await fetch('https://api.signicat.com/oauth/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'signature:documents',
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get Signicat access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}
