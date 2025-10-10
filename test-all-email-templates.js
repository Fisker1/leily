// Test script to send all email templates to your addresses
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const testEmails = [
  'anderslundoy@leily.no',
  'kontakt@leily.no', 
  'admin@leily.no',
  'info@leily.no',
  'anderslundoy@protonmail.com',
  'anderslundoy@gmail.com'
];

const emailTemplates = [
  {
    type: 'account_created',
    name: 'Anders Lundøy',
    data: {
      name: 'Anders Lundøy',
      email: 'anderslundoy@leily.no'
    }
  },
  {
    type: 'password_reset',
    name: 'Anders Lundøy',
    data: {
      name: 'Anders Lundøy',
      email: 'anderslundoy@leily.no',
      reset_link: 'https://leily.no/reset-password?token=test123'
    }
  },
  {
    type: 'lease_ready',
    name: 'Anders Lundøy',
    data: {
      name: 'Anders Lundøy',
      email: 'anderslundoy@leily.no',
      property_address: 'Storgata 123',
      property_city: 'Oslo',
      monthly_rent: 15000,
      deposit_amount: 30000,
      lease_start_date: '2025-02-01',
      lease_end_date: '2026-01-31',
      landlord_name: 'Erik Hansen',
      signing_url: 'https://leily.no/sign-lease?token=test123'
    }
  },
  {
    type: 'lease_signed',
    name: 'Anders Lundøy',
    data: {
      name: 'Anders Lundøy',
      email: 'anderslundoy@leily.no',
      property_address: 'Storgata 123',
      property_city: 'Oslo',
      monthly_rent: 15000,
      lease_start_date: '2025-02-01',
      lease_end_date: '2026-01-31',
      landlord_name: 'Erik Hansen',
      current_date: new Date().toLocaleDateString('no-NO')
    }
  },
  {
    type: 'account_deleted',
    name: 'Anders Lundøy',
    data: {
      name: 'Anders Lundøy',
      email: 'anderslundoy@leily.no'
    }
  }
];

async function testEmailTemplate(template, recipientEmail) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-leily-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        emailType: template.type,
        templateData: template.data,
        options: {
          to: [{ email: recipientEmail, name: template.name }]
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${template.type} sent to ${recipientEmail}`);
    } else {
      console.log(`❌ ${template.type} failed to ${recipientEmail}: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ ${template.type} error to ${recipientEmail}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAllTemplates() {
  console.log('🚀 Starting email template tests...\n');
  
  for (const template of emailTemplates) {
    console.log(`\n📧 Testing ${template.type} template:`);
    
    for (const email of testEmails) {
      await testEmailTemplate(template, email);
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n✨ All email tests completed!');
}

// Run the tests
testAllTemplates().catch(console.error);
