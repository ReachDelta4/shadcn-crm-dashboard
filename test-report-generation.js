#!/usr/bin/env node

/**
 * Test script to create a session with transcripts and verify report generation
 * with all schema fields populated properly.
 * 
 * Usage: node test-report-generation.js
 */

import fetch from 'node-fetch';
import 'dotenv/config';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock auth token (in real scenario, you'd need to authenticate)
// For testing, you might need to temporarily disable auth or use a test user
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
};

// Sample transcript segments for a realistic sales call
const SAMPLE_TRANSCRIPTS = [
  {
    speaker: "Sales Rep",
    content_enc: "Hi, good morning! This is Sarah from TechCorp Solutions. I understand you're interested in learning more about our AutoCAD training program?",
    timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
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
  },
  {
    speaker: "Sales Rep",
    content_enc: "Perfect! I'll send you the case study, a detailed proposal with the discounted pricing, and our implementation timeline. Would Thursday at 2 PM work for a follow-up call to discuss any questions your team might have?",
    timestamp: new Date(Date.now() - 60000).toISOString()
  },
  {
    speaker: "Prospect",
    content_enc: "Thursday at 2 PM works great. Please send those materials to my email. I'm looking forward to reviewing everything.",
    timestamp: new Date(Date.now() - 40000).toISOString()
  },
  {
    speaker: "Sales Rep",
    content_enc: "Excellent! You'll have everything in your inbox within the hour. Thank you for your time today, and I look forward to speaking with you Thursday. Have a great day!",
    timestamp: new Date(Date.now() - 20000).toISOString()
  }
];

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers,
      ...options
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Request failed for ${url}:`, error.message);
    throw error;
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

async function pollForReport(sessionId, maxAttempts = 20) {
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

async function main() {
  console.log('🚀 Starting Report Generation Test');
  console.log('==================================\n');
  
  try {
    // Step 1: Create test session
    const session = await createTestSession();
    
    // Step 2: Add transcript segments
    await addTranscripts(session.id);
    
    // Step 3: Trigger report generation
    await triggerReportGeneration(session.id);
    
    // Step 4: Wait for report completion
    const report = await pollForReport(session.id);
    
    // Step 5: Validate schema
    const validation = validateReportSchema(report);
    
    console.log('\n🎯 TEST SUMMARY:');
    console.log('================');
    console.log(`Session ID: ${session.id}`);
    console.log(`Transcripts Added: ${SAMPLE_TRANSCRIPTS.length}`);
    console.log(`Schema Validation: ${validation.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Fields Present: ${validation.presentFields.length}/${validation.totalFields}`);
    
    if (!validation.success) {
      console.log(`Missing Fields: ${validation.missingFields.join(', ')}`);
      process.exit(1);
    }
    
    console.log('\n🎉 All tests passed! Report generation is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as testReportGeneration };
