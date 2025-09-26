import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow this function to run in staging environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Basic staging environment check
    if (!supabaseUrl.includes('staging') && !supabaseUrl.includes('test')) {
      return new Response(
        JSON.stringify({ 
          error: 'This function only runs in staging environment',
          environment: supabaseUrl 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key (can manage auth)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const testEmail = 'anderslundoy@protonmail.com'
    const testPassword = 'blåmeis'

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail(testEmail)
    
    if (existingUser && existingUser.user) {
      return new Response(
        JSON.stringify({ 
          message: 'Test user already exists',
          user_id: existingUser.user.id,
          email: testEmail
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the test user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Stager Test User'
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user',
          details: createError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'User creation returned no user data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update profile with premium subscription
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: 'Stager Test User',
        subscription_tier: 'premium',
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      })
      .eq('id', newUser.user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'admin'
      })

    if (roleError) {
      console.error('Error assigning admin role:', roleError)
    }

    // Log the creation
    await supabase
      .from('audit_log')
      .insert({
        table_name: 'auth_users',
        action: 'STAGING_TEST_USER_CREATED',
        user_id: newUser.user.id,
        details: {
          email: testEmail,
          environment: 'staging',
          created_by_function: true,
          subscription_tier: 'premium',
          role: 'admin',
          created_at: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({ 
        message: 'Staging test user created successfully',
        user_id: newUser.user.id,
        email: testEmail,
        password_hint: 'blåmeis',
        subscription_tier: 'premium',
        role: 'admin'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
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