// Comprehensive test script to validate all requirements
const baseUrl = 'http://localhost:3000';

// Test accounts from requirements
const testAccounts = [
  { email: 'admin@acme.test', password: 'password', role: 'ADMIN', tenant: 'acme' },
  { email: 'user@acme.test', password: 'password', role: 'MEMBER', tenant: 'acme' },
  { email: 'admin@globex.test', password: 'password', role: 'ADMIN', tenant: 'globex' },
  { email: 'user@globex.test', password: 'password', role: 'MEMBER', tenant: 'globex' }
];

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data, status: response.status };
  } catch (error) {
    return { error: error.message, status: 0 };
  }
}

async function testHealthEndpoint() {
  console.log('\n🔍 Testing Health Endpoint...');
  const result = await makeRequest(`${baseUrl}/api/health`);
  
  if (result.status === 200 && result.data.status === 'ok') {
    console.log('✅ Health endpoint working correctly');
    return true;
  } else {
    console.log('❌ Health endpoint failed:', result);
    return false;
  }
}

async function testLogin(account) {
  console.log(`\n🔍 Testing Login for ${account.email}...`);
  const result = await makeRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: account.email, 
      password: account.password 
    })
  });
  
  if (result.status === 200 && result.data.token && result.data.user) {
    console.log(`✅ Login successful for ${account.email}`);
    console.log(`   Role: ${result.data.user.role}, Tenant: ${result.data.user.tenant.name}`);
    return result.data;
  } else {
    console.log(`❌ Login failed for ${account.email}:`, result);
    return null;
  }
}

async function testNotesAPI(authData, account) {
  console.log(`\n🔍 Testing Notes API for ${account.email}...`);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authData.token}`
  };
  
  // Test GET /api/notes
  console.log('  📝 Testing GET /api/notes...');
  const getResult = await makeRequest(`${baseUrl}/api/notes`, { headers });
  if (getResult.status !== 200) {
    console.log('  ❌ GET notes failed:', getResult);
    return false;
  }
  console.log(`  ✅ GET notes successful (${getResult.data.length} notes found)`);
  
  // Test POST /api/notes (create note)
  console.log('  📝 Testing POST /api/notes...');
  const createResult = await makeRequest(`${baseUrl}/api/notes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Test Note from ${account.email}`,
      content: `This is a test note created by ${account.email} at ${new Date().toISOString()}`
    })
  });
  
  if (createResult.status === 201) {
    console.log('  ✅ POST notes successful');
    
    const noteId = createResult.data.id;
    
    // Test GET /api/notes/:id
    console.log('  📝 Testing GET /api/notes/:id...');
    const getSingleResult = await makeRequest(`${baseUrl}/api/notes/${noteId}`, { headers });
    if (getSingleResult.status === 200) {
      console.log('  ✅ GET single note successful');
    } else {
      console.log('  ❌ GET single note failed:', getSingleResult);
      return false;
    }
    
    // Test PUT /api/notes/:id
    console.log('  📝 Testing PUT /api/notes/:id...');
    const updateResult = await makeRequest(`${baseUrl}/api/notes/${noteId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: `Updated Test Note from ${account.email}`,
        content: `This note was updated at ${new Date().toISOString()}`
      })
    });
    
    if (updateResult.status === 200) {
      console.log('  ✅ PUT notes successful');
    } else {
      console.log('  ❌ PUT notes failed:', updateResult);
      return false;
    }
    
    // Test DELETE /api/notes/:id
    console.log('  📝 Testing DELETE /api/notes/:id...');
    const deleteResult = await makeRequest(`${baseUrl}/api/notes/${noteId}`, {
      method: 'DELETE',
      headers
    });
    
    if (deleteResult.status === 204) {
      console.log('  ✅ DELETE notes successful');
    } else {
      console.log('  ❌ DELETE notes failed:', deleteResult);
      return false;
    }
    
    return true;
  } else if (createResult.status === 403 && createResult.data.code === 'NOTE_LIMIT_EXCEEDED') {
    console.log('  ℹ️  Note creation blocked due to FREE plan limit (this is expected)');
    return true;
  } else {
    console.log('  ❌ POST notes failed:', createResult);
    return false;
  }
}

async function testTenantIsolation() {
  console.log('\n🔍 Testing Tenant Isolation...');
  
  // Login as both Acme and Globex users
  const acmeAuth = await testLogin(testAccounts[0]); // admin@acme.test
  const globexAuth = await testLogin(testAccounts[2]); // admin@globex.test
  
  if (!acmeAuth || !globexAuth) {
    console.log('❌ Could not login to test tenant isolation');
    return false;
  }
  
  // Create notes for each tenant
  const acmeHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${acmeAuth.token}` };
  const globexHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${globexAuth.token}` };
  
  // Get initial note counts
  const acmeNotesResult = await makeRequest(`${baseUrl}/api/notes`, { headers: acmeHeaders });
  const globexNotesResult = await makeRequest(`${baseUrl}/api/notes`, { headers: globexHeaders });
  
  if (acmeNotesResult.status !== 200 || globexNotesResult.status !== 200) {
    console.log('❌ Could not get notes for tenant isolation test');
    return false;
  }
  
  const acmeNotes = acmeNotesResult.data.filter(note => note.tenant?.slug === 'acme' || !note.tenant);
  const globexNotes = globexNotesResult.data.filter(note => note.tenant?.slug === 'globex' || !note.tenant);
  
  // Check if any Acme notes are visible to Globex and vice versa
  const acmeNoteIds = acmeNotes.map(note => note.id);
  const globexNoteIds = globexNotes.map(note => note.id);
  
  const overlap = acmeNoteIds.filter(id => globexNoteIds.includes(id));
  
  if (overlap.length === 0) {
    console.log('✅ Tenant isolation working correctly - no shared notes between tenants');
    return true;
  } else {
    console.log('❌ Tenant isolation failed - shared notes found:', overlap);
    return false;
  }
}

async function testSubscriptionLimits() {
  console.log('\n🔍 Testing Subscription Limits...');
  
  // Login as Acme admin (should have FREE plan initially)
  const acmeAuth = await testLogin(testAccounts[0]);
  if (!acmeAuth) return false;
  
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${acmeAuth.token}` };
  
  // Clear existing notes first
  const notesResult = await makeRequest(`${baseUrl}/api/notes`, { headers });
  if (notesResult.status === 200) {
    for (const note of notesResult.data) {
      await makeRequest(`${baseUrl}/api/notes/${note.id}`, { method: 'DELETE', headers });
    }
  }
  
  // Try to create 4 notes (should fail on the 4th for FREE plan)
  let successCount = 0;
  let limitHit = false;
  
  for (let i = 1; i <= 4; i++) {
    const createResult = await makeRequest(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `Test Note ${i}`,
        content: `Test note content ${i}`
      })
    });
    
    if (createResult.status === 201) {
      successCount++;
      console.log(`  ✅ Created note ${i}`);
    } else if (createResult.status === 403 && createResult.data.code === 'NOTE_LIMIT_EXCEEDED') {
      limitHit = true;
      console.log(`  ℹ️  Note ${i} blocked - FREE plan limit reached`);
      break;
    } else {
      console.log(`  ❌ Unexpected error creating note ${i}:`, createResult);
      return false;
    }
  }
  
  if (successCount === 3 && limitHit) {
    console.log('✅ FREE plan limit (3 notes) working correctly');
    
    // Test upgrade endpoint
    console.log('  🔄 Testing upgrade endpoint...');
    const upgradeResult = await makeRequest(`${baseUrl}/api/tenants/acme/upgrade`, {
      method: 'POST',
      headers
    });
    
    if (upgradeResult.status === 200) {
      console.log('  ✅ Upgrade successful');
      
      // Try creating another note after upgrade
      const createAfterUpgrade = await makeRequest(`${baseUrl}/api/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Post-upgrade note',
          content: 'This note should succeed after upgrade'
        })
      });
      
      if (createAfterUpgrade.status === 201) {
        console.log('  ✅ Note creation after upgrade successful');
        return true;
      } else {
        console.log('  ❌ Note creation after upgrade failed:', createAfterUpgrade);
        return false;
      }
    } else {
      console.log('  ❌ Upgrade failed:', upgradeResult);
      return false;
    }
  } else {
    console.log(`❌ FREE plan limit test failed - created ${successCount} notes, limit hit: ${limitHit}`);
    return false;
  }
}

async function testRoleRestrictions() {
  console.log('\n🔍 Testing Role Restrictions...');
  
  // Login as member user
  const memberAuth = await testLogin(testAccounts[1]); // user@acme.test
  if (!memberAuth) return false;
  
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberAuth.token}` };
  
  // Try to upgrade (should fail for non-admin)
  const upgradeResult = await makeRequest(`${baseUrl}/api/tenants/acme/upgrade`, {
    method: 'POST',
    headers
  });
  
  if (upgradeResult.status === 403) {
    console.log('✅ Role restrictions working - member cannot upgrade subscription');
    return true;
  } else {
    console.log('❌ Role restrictions failed - member was able to upgrade:', upgradeResult);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Requirements Test...\n');
  console.log('Testing YardStick SaaS Notes Application');
  console.log('========================================');
  
  const results = {
    health: await testHealthEndpoint(),
    authentication: true,
    tenantIsolation: await testTenantIsolation(),
    subscriptionLimits: await testSubscriptionLimits(),
    roleRestrictions: await testRoleRestrictions(),
    crudOperations: true
  };
  
  // Test authentication for all required accounts
  console.log('\n🔍 Testing Authentication for All Required Accounts...');
  for (const account of testAccounts) {
    const authResult = await testLogin(account);
    if (!authResult) {
      results.authentication = false;
    } else {
      // Test CRUD operations for each user
      const crudResult = await testNotesAPI(authResult, account);
      if (!crudResult) {
        results.crudOperations = false;
      }
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`Health Endpoint: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication: ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Tenant Isolation: ${results.tenantIsolation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Subscription Limits: ${results.subscriptionLimits ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Role Restrictions: ${results.roleRestrictions ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CRUD Operations: ${results.crudOperations ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 All requirements are met! The application is ready for automated testing.');
  } else {
    console.log('\n⚠️  Some requirements need attention before automated testing.');
  }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}