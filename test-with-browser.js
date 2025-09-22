#!/usr/bin/env node

/**
 * Browser-based test script that:
 * 1. Opens the login page
 * 2. Creates a test user 
 * 3. Logs in to set cookies
 * 4. Makes authenticated API calls
 * 5. Tests report generation
 * 
 * This simulates real browser behavior with proper cookie authentication.
 */

const https = require('https');
const http = require('http');
require('dotenv').config();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Generate a unique test user
const TEST_USER = {
  email: `test-user-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  full_name: 'Test User for Report Generation'
};

console.log('🔧 Browser-Based Test Configuration:');
console.log('====================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test User Email: ${TEST_USER.email}`);
console.log(`Test User Password: ${TEST_USER.password}`);
console.log('');

// Sample transcript segments for a realistic sales call
const SAMPLE_TRANSCRIPTS = [
  {
    speaker: "Sales Rep",
    content_enc: "Hi, good morning! This is Sarah from TechCorp Solutions. I understand you're interested in learning more about our AutoCAD training program?",
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    speaker: "Prospect", 
    content_enc: "Yes, hello. I've been looking into CAD software training for our engineering team. Can you tell me more about your program?",
    timestamp: new Date(Date.now() - 280000).toISOString()
  },
  {
    speaker: "Sales Rep",
    content_enc: "Absolutely! Before I dive into the details, could you tell me a bit about your current team size and what specific outcomes you're hoping to achieve with AutoCAD training?",
    timestamp: new Date(Date.now() - 260000).toISOString()
  },
  {
    speaker: "Prospect",
    content_enc: "We have about 12 engineers, and we're looking to improve our 3D modeling capabilities. We're currently using older software and need to modernize our workflow.",
    timestamp: new Date(Date.now() - 240000).toISOString()
  },
  {
    speaker: "Sales Rep",
    content_enc: "That's exactly what we specialize in! Our comprehensive AutoCAD program covers both 2D drafting and advanced 3D modeling. We typically see a 40% improvement in design efficiency within the first 3 months. What's your timeline for implementation?",
    timestamp: new Date(Date.now() - 220000).toISOString()
  },
  {
    speaker: "Prospect",
    content_enc: "We'd like to start as soon as possible, ideally within the next month. What does the training structure look like?",
    timestamp: new Date(Date.now() - 200000).toISOString()
  },
  {
    speaker: "Sales Rep",
    content_enc: "Perfect timing! We offer both instructor-led and self-paced options. For your team size, I'd recommend our Enterprise package which includes 80 hours of training, hands-on projects, and 6 months of ongoing support. The investment is $28,000 for your entire team.",
    timestamp: new Date(Date.now() - 180000).toISOString()
  },
  {
    speaker: "Prospect",
    content_enc: "That sounds comprehensive. What kind of results have you seen with similar companies?",
    timestamp: new Date(Date.now() - 160000).toISOString()
  },
  {
    speaker: "Sales Rep",
    content_enc: "Great question! Last quarter, we worked with MechDesign Corp - similar size to yours. They reduced their design cycle time by 35% and increased project throughput by 25%. I can share a case study with specific metrics if that would be helpful.",
    timestamp: new Date(Date.now() - 140000).toISOString()
  },
  {
    speaker: "Prospect",
    content_enc: "Yes, I'd love to see that. One concern I have is the budget - $28,000 is significant. Do you have any flexibility on pricing?",
    timestamp: new Date(Date.now() - 120000).toISOString()
  }
];

// Cookie jar to maintain session
let cookieJar = [];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    // Add cookies to request
    let cookieHeader = '';
    if (cookieJar.length > 0) {
      cookieHeader = cookieJar.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    }
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      }
    };
    
    if (cookieHeader) {
      requestOptions.headers['Cookie'] = cookieHeader;
    }
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Extract cookies from response
        const setCookieHeader = res.headers['set-cookie'];
        if (setCookieHeader) {
          setCookieHeader.forEach(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            if (name && value) {
              // Update or add cookie
              const existingIndex = cookieJar.findIndex(c => c.name === name.trim());
              if (existingIndex >= 0) {
                cookieJar[existingIndex].value = value.trim();
              } else {
                cookieJar.push({ name: name.trim(), value: value.trim() });
              }
            }
          });
        }
        
        try {
          const result = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(data); // Return raw data if not JSON
          }
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function createSupabaseUser() {
  console.log('👤 Creating test user account via Supabase...');
  
  try {
    // Use Supabase Auth API directly to create user
    const response = await makeRequest(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        data: {
          full_name: TEST_USER.full_name
        }
      })
    });
    
    console.log('✅ User account created successfully');
    console.log(`   User ID: ${response.user?.id}`);
    console.log(`   Email: ${response.user?.email}`);
    
    return response;
    
  } catch (error) {
    if (error.message.includes('User already registered')) {
      console.log('ℹ️  User already exists, will proceed with login...');
      return { user: { email: TEST_USER.email } };
    }
    throw error;
  }
}

async function authenticateWithNextAuth() {
  console.log('🔑 Authenticating with Next.js app...');
  
  // Step 1: Get the login page to establish session
  console.log('  📱 Getting login page...');
  await makeRequest(`${BASE_URL}/login`);
  
  // Step 2: Attempt login by calling Supabase auth endpoint through the app
  console.log('  🔐 Logging in...');
  
  // Try to sign in via Supabase directly and then establish app session
  try {
    const loginResponse = await makeRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    
    console.log('✅ Supabase login successful');
    
    // Step 3: Call the auth callback to establish session cookies
    console.log('  🍪 Establishing session cookies...');
    await makeRequest(`${BASE_URL}/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'SIGNED_IN',
        session: loginResponse
      })
    });
    
    console.log('✅ Session established with cookies');
    console.log(`   Cookies set: ${cookieJar.map(c => c.name).join(', ')}`);
    
    return loginResponse;
    
  } catch (error) {
    console.error('Failed to authenticate:', error.message);
    throw error;
  }
}

async function testAuthentication() {
  console.log('🔍 Testing authentication...');
  
  try {
    const result = await makeRequest(`${BASE_URL}/api/sessions?page=1&pageSize=5`);
    console.log('✅ Authentication test passed');
    console.log(`   Found ${result.sessions?.length || 0} existing sessions`);
    return true;
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
    return false;
  }
}

async function createTestSession() {
  console.log('🔄 Creating test session...');
  
  const sessionData = {
    type: 'sales_call',
    title: 'AutoCAD Training Sales Call - TechCorp Prospect'
  };
  
  const session = await makeRequest(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    body: JSON.stringify(sessionData)
  });
  
  console.log(`✅ Session created: ${session.id}`);
  return session;
}

async function addTranscripts(sessionId) {
  console.log('🔄 Adding transcript segments...');
  
  for (let i = 0; i < SAMPLE_TRANSCRIPTS.length; i++) {
    const transcript = SAMPLE_TRANSCRIPTS[i];
    console.log(`  Adding segment ${i + 1}/${SAMPLE_TRANSCRIPTS.length}: ${transcript.speaker}`);
    
    await makeRequest(`${BASE_URL}/api/transcripts`, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        speaker: transcript.speaker,
        content_enc: transcript.content_enc,
        timestamp: transcript.timestamp
      })
    });
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Added ${SAMPLE_TRANSCRIPTS.length} transcript segments`);
}

async function triggerReportGeneration(sessionId) {
  console.log('🔄 Triggering report generation...');
  
  const result = await makeRequest(`${BASE_URL}/api/sessions/${sessionId}/report-v3`, {
    method: 'POST'
  });
  
  console.log('✅ Report generation triggered:', result);
  return result;
}

async function pollForReport(sessionId, maxAttempts = 25) {
  console.log('🔄 Polling for report completion...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const report = await makeRequest(`${BASE_URL}/api/sessions/${sessionId}/report-v3`);
      
      if (report.status === 'ready' && report.report) {
        console.log('✅ Report generation completed!');
        return report.report;
      } else if (report.status === 'failed') {
        throw new Error(`Report generation failed: ${report.last_error}`);
      }
      
      console.log(`  Attempt ${attempt}/${maxAttempts}: Status is '${report.status}', waiting...`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`  Attempt ${attempt}/${maxAttempts}: ${error.message}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error('Report generation timed out');
}

function validateReportSchema(report) {
  console.log('🔄 Validating report schema...');
  
  // All expected fields from the schema
  const expectedFields = [
    'tp_title', 'tp_subtitle', 'tp_deal', 'tp_sessionId',
    'p1_exec_headline', 'p1_exec_synopsis', 'p1_meta_full', 'p1_key_points', 
    'p1_pains', 'p1_buying_signals', 'p1_objections_handled', 'p1_action_items', 'p1_deal_health',
    'p2_context_snapshot', 'p2_high_priority', 'p2_medium_priority', 'p2_info_items', 
    'p2_risks_concerns', 'p2_short_summary',
    'p3_deal_health_summary', 'p3_meddicc', 'p3_bant', 'p3_missed_opportunities', 
    'p3_improvements', 'p3_short_reco',
    'p4_stage_eval', 'p4_pivotal_points', 'p4_takeaway',
    'p5_stage_a', 'p5_stage_b', 'p6_stage_c', 'p6_stage_d', 'p7_stage_e', 'p7_stage_f',
    'p8_stage_g', 'p8_stage_h', 'p9_stage_i', 'p9_stage_j', 'p10_stage_k', 'p10_stage_l',
    'apx_scoring_rubric', 'apx_data_flags'
  ];
  
  const missingFields = [];
  const presentFields = [];
  const fieldSummary = {};
  
  for (const field of expectedFields) {
    if (!(field in report)) {
      missingFields.push(field);
    } else {
      presentFields.push(field);
      const value = report[field];
      
      if (Array.isArray(value)) {
        fieldSummary[field] = `Array[${value.length}]`;
      } else if (typeof value === 'object' && value !== null) {
        fieldSummary[field] = `Object{${Object.keys(value).length} keys}`;
      } else if (typeof value === 'string') {
        fieldSummary[field] = `String[${value.length} chars]`;
      } else {
        fieldSummary[field] = typeof value;
      }
    }
  }
  
  console.log('\n📊 REPORT SCHEMA VALIDATION RESULTS:');
  console.log('==========================================');
  
  if (missingFields.length === 0) {
    console.log('✅ SUCCESS: All required fields are present!');
  } else {
    console.log(`❌ MISSING FIELDS (${missingFields.length}):`);
    missingFields.forEach(field => console.log(`  - ${field}`));
  }
  
  console.log(`\n✅ PRESENT FIELDS (${presentFields.length}/${expectedFields.length}):`);
  Object.entries(fieldSummary).forEach(([field, summary]) => {
    console.log(`  ✓ ${field}: ${summary}`);
  });
  
  // Sample some field contents
  console.log('\n📝 SAMPLE FIELD CONTENTS:');
  console.log('==========================================');
  
  if (report.tp_title) {
    console.log(`📋 Title: ${report.tp_title}`);
  }
  
  if (report.p1_exec_headline) {
    console.log(`📈 Executive Headline: ${report.p1_exec_headline}`);
  }
  
  if (report.p1_key_points && report.p1_key_points.length > 0) {
    console.log(`🔑 Key Points (${report.p1_key_points.length}):`);
    report.p1_key_points.slice(0, 3).forEach((point, i) => {
      console.log(`  ${i + 1}. ${point}`);
    });
  }
  
  if (report.p1_deal_health && report.p1_deal_health.score) {
    console.log(`💚 Deal Health Score: ${report.p1_deal_health.score}/100`);
  }
  
  if (report.apx_data_flags && report.apx_data_flags.length > 0) {
    console.log(`⚠️  Data Flags: ${report.apx_data_flags.join(', ')}`);
  }
  
  return {
    success: missingFields.length === 0,
    missingFields,
    presentFields,
    fieldSummary,
    totalFields: expectedFields.length
  };
}

async function main() {
  console.log('🚀 Starting Browser-Based Report Generation Test');
  console.log('===============================================\n');
  
  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables:');
    if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('\nPlease check your .env.local file');
    process.exit(1);
  }
  
  let sessionId = null;
  
  try {
    // Step 1: Create test user
    await createSupabaseUser();
    
    // Step 2: Authenticate with Next.js app
    await authenticateWithNextAuth();
    
    // Step 3: Test authentication
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      throw new Error('Authentication failed - cannot proceed with API calls');
    }
    
    // Step 4: Create test session
    const session = await createTestSession();
    sessionId = session.id;
    
    // Step 5: Add transcript segments
    await addTranscripts(sessionId);
    
    // Step 6: Trigger report generation
    await triggerReportGeneration(sessionId);
    
    // Step 7: Wait for report completion
    const report = await pollForReport(sessionId);
    
    // Step 8: Validate schema
    const validation = validateReportSchema(report);
    
    // Step 9: Summary
    console.log('\n🎯 COMPLETE TEST SUMMARY:');
    console.log('=========================');
    console.log(`Test User: ${TEST_USER.email}`);
    console.log(`Password: ${TEST_USER.password}`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Transcripts Added: ${SAMPLE_TRANSCRIPTS.length}`);
    console.log(`Schema Validation: ${validation.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Fields Present: ${validation.presentFields.length}/${validation.totalFields}`);
    
    if (!validation.success) {
      console.log(`Missing Fields: ${validation.missingFields.join(', ')}`);
      console.log('\n💡 To make all fields mandatory for enterprise use:');
      console.log('   Update REPORT_V3_JSON_SCHEMA in src/server/services/report-v3.ts');
      console.log('   Change: required: [] → required: Object.keys(REPORT_V3_PROPERTIES)');
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📊 You can now:');
    console.log(`   1. Login to the dashboard: ${BASE_URL}/login`);
    console.log(`      Email: ${TEST_USER.email}`);
    console.log(`      Password: ${TEST_USER.password}`);
    console.log(`   2. View the generated report for session: ${sessionId}`);
    console.log('   3. Test the UI rendering of all report sections');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n💡 Troubleshooting auth issues:');
      console.error('   1. Make sure the Next.js dev server is running on port 3000');
      console.error('   2. Check if Supabase project settings allow signups');
      console.error('   3. Verify environment variables are correct');
    }
    
    if (error.message.includes('OPENROUTER')) {
      console.error('\n💡 Troubleshooting OpenRouter issues:');
      console.error('   1. Check OPENROUTER_API_KEY is set and valid');
      console.error('   2. Verify account has sufficient credits');
      console.error('   3. Check model availability');
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('3000')) {
      console.error('\n💡 Server connection issue:');
      console.error('   1. Start the dev server: npm run dev');
      console.error('   2. Wait for the server to be ready');
      console.error('   3. Check that port 3000 is available');
    }
    
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
