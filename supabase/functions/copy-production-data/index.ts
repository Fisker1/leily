import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Copying production data to current environment...');
    
    const prodClient = createClient(
      Deno.env.get('PROD_SUPABASE_URL') || '',
      Deno.env.get('PROD_SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Target database client (current environment)
    const stagingClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Define tables to copy in dependency order
    const tablesToCopy = [
      'profiles',
      'user_roles', 
      'properties',
      'tenants',
      'lease_agreements',
      'deposit_accounts',
      'transfer_protocols',
      'property_valuations',
      'property_documents',
      'calculation_history',
      'payment_records',
      'reports',
      'audit_log'
    ];

    const copiedTables = [];
    let totalRecords = 0;

    // Copy each table
    for (const table of tablesToCopy) {
      console.log(`Copying table: ${table}`);
      
      // Fetch data from production
      const { data: prodData, error: fetchError } = await prodClient
        .from(table)
        .select('*');

      if (fetchError) {
        console.error(`Error fetching ${table}:`, fetchError);
        continue;
      }

      if (!prodData || prodData.length === 0) {
        console.log(`No data in ${table}, skipping...`);
        continue;
      }

      console.log(`Found ${prodData.length} records in ${table}`);

      // Clear existing data in staging (if any)
      const { error: deleteError } = await stagingClient
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.log(`Note: Could not clear ${table} (may be empty):`, deleteError.message);
      }

      // Insert production data into staging
      const { error: insertError } = await stagingClient
        .from(table)
        .insert(prodData);

      if (insertError) {
        console.error(`Error inserting into ${table}:`, insertError);
        continue;
      }

      copiedTables.push(table);
      totalRecords += prodData.length;
      console.log(`Successfully copied ${prodData.length} records to ${table}`);
    }

    const result = {
      success: true,
      message: 'Production data successfully copied to staging',
      copiedTables,
      totalRecords,
      timestamp: new Date().toISOString()
    };

    console.log('Data copy completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error copying production data:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});