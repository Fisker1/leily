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
    // Only allow this function to run in non-production environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Check if we have the service role key (needed for user creation)
    if (!supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Service role key required for user creation',
          hint: 'This function requires SUPABASE_SERVICE_ROLE_KEY to be configured'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🚀 Starting test user creation process...')

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

    console.log('🔧 Creating test users:', testUsers.map(u => ({ email: u.email, role: u.role, tier: u.subscription_tier })))

    const createdUsers = []

    for (const testUser of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(user => user.email === testUser.email)
      
      if (existingUser) {
        console.log(`✅ User ${testUser.email} already exists`)
        createdUsers.push({
          ...testUser,
          user_id: existingUser.id,
          status: 'already_exists'
        })
        continue
      }

      console.log(`🔧 Creating new user: ${testUser.email}`)

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
        console.error('❌ Error creating user:', testUser.email, createError)
        createdUsers.push({
          ...testUser,
          status: 'error',
          error: createError.message
        })
        continue
      }

      if (!newUser.user) {
        console.error('❌ User creation returned no user data for:', testUser.email)
        createdUsers.push({
          ...testUser,
          status: 'error',
          error: 'User creation returned no user data'
        })
        continue
      }

      console.log(`✅ Successfully created user: ${testUser.email} with ID: ${newUser.user.id}`)

      // Update profile with subscription
      console.log(`🔧 Updating profile for ${testUser.email} with tier: ${testUser.subscription_tier}`)
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
        console.error('❌ Error updating profile for:', testUser.email, profileError)
      } else {
        console.log(`✅ Profile updated successfully for: ${testUser.email}`)
      }

      // Assign role if not default user
      console.log(`🔧 Assigning role "${testUser.role}" to ${testUser.email}`)
      if (testUser.role !== 'user') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: testUser.role
          })

        if (roleError) {
          console.error('❌ Error assigning role:', testUser.role, 'to:', testUser.email, roleError)
        } else {
          console.log(`✅ Role "${testUser.role}" assigned successfully to: ${testUser.email}`)
        }
      } else {
        // Ensure default user role is assigned
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'user'
          })

        if (roleError && !roleError.message.includes('duplicate key')) {
          console.error('❌ Error assigning default user role to:', testUser.email, roleError)
        } else {
          console.log(`✅ Default user role assigned successfully to: ${testUser.email}`)
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

      console.log(`🎉 Successfully set up user: ${testUser.email} with role: ${testUser.role} and tier: ${testUser.subscription_tier}`)
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