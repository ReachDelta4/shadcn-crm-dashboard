#!/usr/bin/env node

/**
 * Complete test script that:
 * 1. Creates a test user account
 * 2. Gets an auth token 
 * 3. Runs the report generation test
 * 4. Validates all schema fields
 * 
 * Usage: node create-test-user-and-run.js
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
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

console.log('🔧 Test Configuration:');
console.log('======================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Supabase URL: ${SUPABASE_URL}`);
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
  },
  {
    speaker: "Sales Rep",
    content_enc: "I understand budget is always a consideration. Let me discuss the ROI with you - based on your team's hourly rates, the efficiency gains typically pay for the training within 4-5 months. However, if you can commit to starting this month, I can offer a 15% early-bird discount, bringing it down to $23,800.",
    timestamp: new Date(Date.now() - 100000).toISOString()
  },
  {
    speaker: "Prospect",
    content_enc: "That's more reasonable. I'd need to discuss this with my team lead and get approval from finance. What's the next step?",
    timestamp: new Date(Date.now() - 80000).toISOString()
  }
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            reject(new Error(`Invalid JSON response: ${data}`));
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
  console.log('👤 Creating test user account...');
  
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
    
    if (response.access_token) {
      console.log('✅ Access token obtained immediately');
      return {
        user: response.user,
        access_token: response.access_token,
        refresh_token: response.refresh_token
      };
    } else {
      console.log('⚠️  Email confirmation required - attempting sign in...');
      // Try to sign in anyway (some setups auto-confirm)
      return await signInUser();
    }
    
  } catch (error) {
    if (error.message.includes('User already registered')) {
      console.log('ℹ️  User already exists, attempting sign in...');
      return await signInUser();
    }
    throw error;
  }
}

async function signInUser() {
  console.log('🔑 Signing in test user...');
  
  const response = await makeRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
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
  
  console.log('✅ Successfully signed in');
  console.log(`   Access Token: ${response.access_token.substring(0, 20)}...`);
  
  return {
    user: response.user,
    access_token: response.access_token,
    refresh_token: response.refresh_token
  };
}

async function createTestSession(authToken) {
  console.log('🔄 Creating test session...');
  
  const sessionData = {
    type: 'sales_call',
    title: 'AutoCAD Training Sales Call - TechCorp Prospect'
  };
  
  const session = await makeRequest(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(sessionData)
  });
  
  console.log(`✅ Session created: ${session.id}`);
  return session;
}

async function addTranscripts(sessionId, authToken) {
  console.log('🔄 Adding transcript segments...');
  
  for (let i = 0; i < SAMPLE_TRANSCRIPTS.length; i++) {
    const transcript = SAMPLE_TRANSCRIPTS[i];
    console.log(`  Adding segment ${i + 1}/${SAMPLE_TRANSCRIPTS.length}: ${transcript.speaker}`);
    
    await makeRequest(`${BASE_URL}/api/transcripts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
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

async function triggerReportGeneration(sessionId, authToken) {
  console.log('🔄 Triggering report generation...');
  
  const result = await makeRequest(`${BASE_URL}/api/sessions/${sessionId}/report-v3`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  console.log('✅ Report generation triggered:', result);
  return result;
}

async function pollForReport(sessionId, authToken, maxAttempts = 25) {
  console.log('🔄 Polling for report completion...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const report = await makeRequest(`${BASE_URL}/api/sessions/${sessionId}/report-v3`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
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
  
  // All required fields from the schema
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

async function cleanupTestUser(authToken) {
  try {
    console.log('🧹 Cleaning up test user...');
    // Note: Supabase doesn't allow deleting users via API in most configurations
    // The test user will remain but can be manually cleaned up from Supabase dashboard
    console.log('ℹ️  Test user can be manually deleted from Supabase dashboard if needed');
  } catch (error) {
    console.log('⚠️  Cleanup note:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Complete Report Generation Test');
  console.log('===========================================\n');
  
  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables:');
    if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('\nPlease check your .env.local file');
    process.exit(1);
  }
  
  let authToken = null;
  let sessionId = null;
  
  try {
    // Step 1: Create test user and get auth token
    const authResult = await createSupabaseUser();
    authToken = authResult.access_token;
    
    // Step 2: Create test session
    const session = await createTestSession(authToken);
    sessionId = session.id;
    
    // Step 3: Add transcript segments
    await addTranscripts(sessionId, authToken);
    
    // Step 4: Trigger report generation
    await triggerReportGeneration(sessionId, authToken);
    
    // Step 5: Wait for report completion
    const report = await pollForReport(sessionId, authToken);
    
    // Step 6: Validate schema
    const validation = validateReportSchema(report);
    
    // Step 7: Summary
    console.log('\n🎯 COMPLETE TEST SUMMARY:');
    console.log('=========================');
    console.log(`Test User: ${TEST_USER.email}`);
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
    console.log(`   1. Login to the dashboard with: ${TEST_USER.email} / ${TEST_USER.password}`);
    console.log(`   2. View the generated report for session: ${sessionId}`);
    console.log('   3. Test the UI rendering of all report sections');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n💡 Troubleshooting auth issues:');
      console.error('   1. Check SUPABASE_URL and SUPABASE_ANON_KEY are correct');
      console.error('   2. Verify Supabase project allows signups');
      console.error('   3. Check if email confirmation is required');
    }
    
    if (error.message.includes('OPENROUTER')) {
      console.error('\n💡 Troubleshooting OpenRouter issues:');
      console.error('   1. Check OPENROUTER_API_KEY is set and valid');
      console.error('   2. Verify account has sufficient credits');
      console.error('   3. Check model availability');
    }
    
    process.exit(1);
  } finally {
    if (authToken) {
      await cleanupTestUser(authToken);
    }
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
