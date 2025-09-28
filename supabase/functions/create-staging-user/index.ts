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

    const testUsers = [
      {
        email: 'gjest@leily.no',
        password: 'blåmeis',
        full_name: 'Gjest Bruker',
        subscription_tier: 'free',
        role: 'user'
      },
      {
        email: 'pro@leily.no', 
        password: 'rødspette',
        full_name: 'Pro Bruker',
        subscription_tier: 'premium',
        role: 'user'
      },
      {
        email: 'ambassadør@leily.no',
        password: 'clinton', 
        full_name: 'Ambassadør Bruker',
        subscription_tier: 'premium',
        role: 'ambassador'
      }
    ]

    const createdUsers = []

    for (const testUser of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(user => user.email === testUser.email)
      
      if (existingUser) {
        createdUsers.push({
          ...testUser,
          user_id: existingUser.id,
          status: 'already_exists'
        })
        continue
      }

      // Create the test user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: testUser.full_name
        }
      })

      if (createError) {
        console.error('Error creating user:', testUser.email, createError)
        createdUsers.push({
          ...testUser,
          status: 'error',
          error: createError.message
        })
        continue
      }

      if (!newUser.user) {
        createdUsers.push({
          ...testUser,
          status: 'error',
          error: 'User creation returned no user data'
        })
        continue
      }

      // Update profile with subscription
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: testUser.full_name,
          subscription_tier: testUser.subscription_tier,
          subscription_end: testUser.subscription_tier === 'premium' 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
            : null
        })
        .eq('id', newUser.user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

      // Assign role if not default user
      if (testUser.role !== 'user') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: testUser.role
          })

        if (roleError) {
          console.error('Error assigning role:', roleError)
        }
      }

      // Log the creation
      await supabase
        .from('audit_log')
        .insert({
          table_name: 'auth_users',
          action: 'STAGING_TEST_USER_CREATED',
          user_id: newUser.user.id,
          details: {
            email: testUser.email,
            environment: 'staging',
            created_by_function: true,
            subscription_tier: testUser.subscription_tier,
            role: testUser.role,
            created_at: new Date().toISOString()
          }
        })

      createdUsers.push({
        ...testUser,
        user_id: newUser.user.id,
        status: 'created'
      })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Staging test users processed',
        users: createdUsers
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
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})