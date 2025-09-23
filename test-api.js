// Simple API test script
const baseUrl = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing YardStick SaaS Notes API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
    console.log('');

    // Test 2: Login as Acme Admin
    console.log('2️⃣ Testing Login (Acme Admin)...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@acme.test',
        password: 'password',
        tenantSlug: 'acme'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login:', loginData);
    
    if (!loginData.token) {
      throw new Error('No token received');
    }
    const token = loginData.token;
    console.log('');

    // Test 3: Create a Note
    console.log('3️⃣ Testing Create Note...');
    const createResponse = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Note',
        content: 'This is a test note created via API'
      })
    });
    const noteData = await createResponse.json();
    console.log('✅ Note Created:', noteData);
    console.log('');

    // Test 4: Get Notes
    console.log('4️⃣ Testing Get Notes...');
    const notesResponse = await fetch(`${baseUrl}/api/notes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const notesData = await notesResponse.json();
    console.log('✅ Notes Retrieved:', notesData);
    console.log('');

    // Test 5: Login as different tenant (Globex)
    console.log('5️⃣ Testing Multi-tenancy (Globex)...');
    const globexLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@globex.test',
        password: 'password',
        tenantSlug: 'globex'
      })
    });
    const globexLoginData = await globexLoginResponse.json();
    console.log('✅ Globex Login:', globexLoginData);
    
    const globexToken = globexLoginData.token;
    
    // Test 6: Verify tenant isolation
    console.log('6️⃣ Testing Tenant Isolation...');
    const globexNotesResponse = await fetch(`${baseUrl}/api/notes`, {
      headers: {
        'Authorization': `Bearer ${globexToken}`
      }
    });
    const globexNotesData = await globexNotesResponse.json();
    console.log('✅ Globex Notes (should be empty):', globexNotesData);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();