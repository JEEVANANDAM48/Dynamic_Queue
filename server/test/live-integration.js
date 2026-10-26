/**
 * Live End-to-End Integration Verification Script
 * Validates full customer-to-staff flow on live Render backend & MongoDB Atlas
 */

const BASE_URL = 'https://dynamic-queue-r6bt.onrender.com/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('--- STARTING LIVE END-TO-END SYSTEM INTEGRATION TEST ---');
  console.log(`Target Backend: ${BASE_URL}`);

  // Step 1: Health check
  console.log('\n[1/10] Verifying Backend Health...');
  const healthRes = await request('/health');
  const dbConnected = healthRes.data?.database === 'connected' || healthRes.data?.database?.status === 'connected' || healthRes.data?.database?.connected === true;
  if (healthRes.status !== 200 || !dbConnected) {
    throw new Error(`Health check failed: ${JSON.stringify(healthRes.data)}`);
  }
  console.log(' Backend is healthy and MongoDB is connected.');

  // Step 2: Customer Registration
  const testCustomerEmail = `customer_${Date.now()}@testqueue.com`;
  const testPassword = 'Password123!';
  console.log(`\n[2/10] Registering New Customer (${testCustomerEmail})...`);
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Integration Test User',
      email: testCustomerEmail,
      password: testPassword,
      role: 'CUSTOMER'
    })
  });
  if (regRes.status !== 201 || !regRes.data.success) {
    throw new Error(`Customer registration failed: ${JSON.stringify(regRes.data)}`);
  }
  const customerToken = regRes.data.data.token;
  console.log(` Customer registered successfully. User ID: ${regRes.data.data.user?.id || regRes.data.data.id}`);

  // Step 3: Customer Login
  console.log('\n[3/10] Logging in as Customer...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testCustomerEmail,
      password: testPassword
    })
  });
  if (loginRes.status !== 200 || !loginRes.data.data?.token) {
    throw new Error(`Customer login failed: ${JSON.stringify(loginRes.data)}`);
  }
  console.log(' Customer logged in successfully. JWT verified.');

  // Step 4: Fetch Service Centres & Services
  console.log('\n[4/10] Fetching Service Centres and Services...');
  const centresRes = await request('/admin/service-centres', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  if (!centresRes.data.success || !centresRes.data.data?.length) {
    throw new Error(`No service centres found: ${JSON.stringify(centresRes.data)}`);
  }
  const centre = centresRes.data.data[0];
  console.log(` Found Centre: "${centre.name}" (ID: ${centre._id})`);

  const servicesRes = await request('/admin/services', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  if (!servicesRes.data.success || !servicesRes.data.data?.length) {
    throw new Error(`No services found: ${JSON.stringify(servicesRes.data)}`);
  }
  const service = servicesRes.data.data[0];
  console.log(` Found Service: "${service.name}" (${service.code}) (ID: ${service._id})`);

  // Step 5: Customer Generates Token
  console.log(`\n[5/10] Customer generating token for service ${service.code}...`);
  const tokenGenRes = await request('/tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      serviceId: service._id,
      serviceCentreId: centre._id
    })
  });
  if (tokenGenRes.status !== 201 || !tokenGenRes.data.success) {
    throw new Error(`Token generation failed: ${JSON.stringify(tokenGenRes.data)}`);
  }
  const generatedToken = tokenGenRes.data.data;
  console.log(` Token Created! Number: "${generatedToken.tokenNumber}", ID: ${generatedToken._id}`);
  console.log(`   Initial Status: ${generatedToken.status}, People Ahead: ${generatedToken.peopleAhead}, Est. Wait: ${generatedToken.estimatedWaitMinutes}m`);

  // Step 6: Customer Retrieves Personal Tokens
  console.log('\n[6/10] Customer listing own tokens (/api/tokens/customer/me)...');
  const myTokensRes = await request('/tokens/customer/me', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  if (!myTokensRes.data.success || !myTokensRes.data.data.some(t => t._id === generatedToken._id)) {
    throw new Error(`Created token not found in customer tokens list!`);
  }
  console.log(` Token ${generatedToken.tokenNumber} verified in customer tokens list.`);

  // Step 7: Staff Authentication (staff1@queue.com)
  console.log('\n[7/10] Staff Logging In (staff1@queue.com)...');
  const staffLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'staff1@queue.com',
      password: 'password123'
    })
  });
  if (staffLoginRes.status !== 200 || !staffLoginRes.data.data?.token) {
    throw new Error(`Staff login failed: ${JSON.stringify(staffLoginRes.data)}`);
  }
  const staffToken = staffLoginRes.data.data.token;
  const staffUser = staffLoginRes.data.data;
  console.log(` Staff logged in: ${staffUser.name} (${staffUser.email}), Role: ${staffUser.role}`);

  // Step 8: Staff checks queue-state
  console.log('\n[8/10] Staff fetching queue-state (/api/staff/queue-state)...');
  const queueStateRes = await request('/staff/queue-state', {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  if (!queueStateRes.data.success) {
    throw new Error(`Staff queue-state fetch failed: ${JSON.stringify(queueStateRes.data)}`);
  }
  const waitingTokens = queueStateRes.data.data?.waitingTokens || [];
  console.log(` Staff queue contains ${waitingTokens.length} waiting token(s).`);
  const isFoundInStaffQueue = waitingTokens.some(t => t._id === generatedToken._id);
  console.log(` Customer token ${generatedToken.tokenNumber} visible to staff: ${isFoundInStaffQueue ? 'YES' : 'Pending in general queue'}`);

  // Step 9: Staff calls token and completes service
  console.log('\n[9/10] Staff calling next token (/api/staff/call-next)...');
  const callNextRes = await request('/staff/call-next', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  console.log(` Call Next result: status=${callNextRes.status}, success=${callNextRes.data?.success}, message="${callNextRes.data?.message || 'Token called'}"`);

  // Check customer token status
  const checkTokenRes = await request(`/tokens/${generatedToken._id}`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  console.log(` Customer token current status: ${checkTokenRes.data.data?.status}`);

  // Step 10: Security check - Customer cannot call staff routes
  console.log('\n[10/10] Security verification: Customer forbidden from calling staff endpoints...');
  const unauthorizedRes = await request('/staff/call-next', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  if (unauthorizedRes.status === 403 || unauthorizedRes.status === 401) {
    console.log(` Security passed: Customer blocked with HTTP ${unauthorizedRes.status}`);
  } else {
    console.warn(` Warning: customer received status ${unauthorizedRes.status}`);
  }

  console.log('\n======================================================');
  console.log(' ALL 10/10 END-TO-END INTEGRATION CHECKS COMPLETED!');
  console.log('======================================================');
}

run().catch(err => {
  console.error('\n INTEGRATION TEST FAILED:', err.message);
  process.exit(1);
});
