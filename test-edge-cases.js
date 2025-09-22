#!/usr/bin/env node

/**
 * Test Edge Cases for Report JSON Parsing
 * 
 * This script tests specific edge cases that might occur with real AI responses:
 * 1. Malformed JSON responses
 * 2. Partial responses
 * 3. Extra text wrapping
 * 4. Schema violations and auto-correction
 */

const fs = require('fs');

// Import our test functions
const { 
  tryParseJsonFlexible, 
  validateRequiredFields, 
  normalizeReportV3, 
  generateMockAIResponse 
} = require('./test-report-json-parsing.js');

function testMalformedJSONEdgeCases() {
  console.log('🔧 Testing Malformed JSON Edge Cases...\n');
  
  const baseResponse = generateMockAIResponse();
  const baseJSON = JSON.stringify(baseResponse);
  
  const testCases = [
    {
      name: "AI response with explanation prefix",
      input: `Here's the comprehensive sales call analysis:

${baseJSON}

This analysis shows strong potential for closing.`,
      shouldWork: true
    },
    {
      name: "AI response with code block markers",
      input: `\`\`\`json
${baseJSON}
\`\`\``,
      shouldWork: true
    },
    {
      name: "AI response with trailing comma error",
      input: baseJSON.replace(/}$/, '},}'),
      shouldWork: false
    },
    {
      name: "AI response missing closing brace",
      input: baseJSON.slice(0, -2),
      shouldWork: false
    },
    {
      name: "AI response with escaped quotes",
      input: baseJSON.replace(/"/g, '\\"'),
      shouldWork: false
    },
    {
      name: "AI response with extra nested JSON",
      input: `{"wrapper": ${baseJSON}, "extra": "data"}`,
      shouldWork: false // Because our parser looks for the main object structure
    },
    {
      name: "AI response with markdown formatting",
      input: `## Sales Call Analysis

The analysis results are:

${baseJSON}

### Key Insights
- Strong lead potential
- Clear pain points identified`,
      shouldWork: true
    }
  ];
  
  testCases.forEach(({ name, input, shouldWork }) => {
    const result = tryParseJsonFlexible(input);
    const success = result && typeof result === 'object' && result.tp_title;
    const status = success ? '✅ SUCCESS' : '❌ FAILED';
    const expected = shouldWork ? 'Expected to work' : 'Expected to fail';
    const matches = success === shouldWork ? '✓' : '✗';
    
    console.log(`${status} ${name}: ${expected} ${matches}`);
    
    if (success && result.tp_title) {
      console.log(`   → Parsed title: "${result.tp_title.substring(0, 50)}..."`);
    }
  });
}

function testSchemaNormalizationEdgeCases() {
  console.log('\n🔄 Testing Schema Normalization Edge Cases...\n');
  
  const testCases = [
    {
      name: "Empty response object",
      input: {},
      description: "Should fill all required fields with defaults"
    },
    {
      name: "Response with wrong types",
      input: {
        tp_title: 123, // Should be string
        p1_key_points: "not an array", // Should be array
        p1_deal_health: "not an object", // Should be object
        p4_stage_eval: [1, 2, 3] // Wrong structure
      },
      description: "Should normalize types and structures"
    },
    {
      name: "Response with invalid scores",
      input: {
        tp_title: "Test",
        p1_deal_health: { score: 150, rationale: "test" }, // Score > 100
        p4_stage_eval: [
          { stage: "Test", handled: "yes", score: -5 }, // Negative score
          { stage: "Test2", handled: "maybe", score: 15 } // Invalid handled value, score > 10
        ]
      },
      description: "Should clamp scores and fix enum values"
    },
    {
      name: "Response with insufficient array lengths",
      input: {
        tp_title: "Test",
        p1_key_points: ["one"], // Needs 3
        p1_pains: [], // Needs 2
        p1_buying_signals: ["signal"], // Needs 2
        p4_stage_eval: [
          { stage: "Only one", handled: "yes", score: 5 }
        ] // Needs 11
      },
      description: "Should pad arrays to minimum lengths"
    }
  ];
  
  testCases.forEach(({ name, input, description }) => {
    console.log(`🧪 ${name}:`);
    console.log(`   ${description}`);
    
    try {
      const normalized = normalizeReportV3(input);
      
      // Test specific normalizations
      const tests = [
        {
          check: "Title exists",
          result: !!normalized.tp_title && typeof normalized.tp_title === 'string'
        },
        {
          check: "Key points array min length",
          result: Array.isArray(normalized.p1_key_points) && normalized.p1_key_points.length >= 3
        },
        {
          check: "Deal health score valid",
          result: normalized.p1_deal_health && 
                 typeof normalized.p1_deal_health.score === 'number' &&
                 normalized.p1_deal_health.score >= 0 && 
                 normalized.p1_deal_health.score <= 100
        },
        {
          check: "Stage eval exactly 11 items",
          result: Array.isArray(normalized.p4_stage_eval) && normalized.p4_stage_eval.length === 11
        },
        {
          check: "Stage eval valid structure",
          result: normalized.p4_stage_eval.every(stage => 
            stage.stage && 
            ['yes', 'no', 'partial'].includes(stage.handled) &&
            typeof stage.score === 'number' &&
            stage.score >= 0 && stage.score <= 10
          )
        }
      ];
      
      tests.forEach(({ check, result }) => {
        console.log(`   ${result ? '✅' : '❌'} ${check}`);
      });
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  });
}

function testUICompatibilityWithEdgeCases() {
  console.log('🎨 Testing UI Compatibility with Edge Cases...\n');
  
  // Test with minimal normalized report
  const minimalReport = normalizeReportV3({});
  
  console.log('Testing UI rendering with minimal normalized report:');
  
  // Test sections that the UI specifically depends on
  const uiDependencies = [
    {
      section: "Title page",
      test: () => minimalReport.tp_title && minimalReport.tp_subtitle
    },
    {
      section: "Executive summary",
      test: () => minimalReport.p1_exec_headline && minimalReport.p1_exec_synopsis
    },
    {
      section: "Session metadata",
      test: () => minimalReport.p1_meta_full && 
                 minimalReport.p1_meta_full.rep &&
                 minimalReport.p1_meta_full.prospect
    },
    {
      section: "Action items list",
      test: () => Array.isArray(minimalReport.p1_action_items) &&
                 minimalReport.p1_action_items.every(item => item.id && item.title)
    },
    {
      section: "Stage evaluation table",
      test: () => Array.isArray(minimalReport.p4_stage_eval) &&
                 minimalReport.p4_stage_eval.length === 11 &&
                 minimalReport.p4_stage_eval.every(stage => 
                   stage.stage && stage.handled && typeof stage.score === 'number')
    },
    {
      section: "MEDDICC framework",
      test: () => minimalReport.p3_meddicc &&
                 minimalReport.p3_meddicc.metrics &&
                 minimalReport.p3_meddicc.economicBuyer
    },
    {
      section: "BANT qualification",
      test: () => minimalReport.p3_bant &&
                 Array.isArray(minimalReport.p3_bant.rows) &&
                 minimalReport.p3_bant.rows.length >= 4
    }
  ];
  
  uiDependencies.forEach(({ section, test }) => {
    try {
      const result = test();
      console.log(`${result ? '✅' : '❌'} ${section}: ${result ? 'Compatible' : 'Missing required structure'}`);
    } catch (error) {
      console.log(`❌ ${section}: Error - ${error.message}`);
    }
  });
}

function simulateRealAIResponseFlow() {
  console.log('\n🤖 Simulating Real AI Response Flow...\n');
  
  // Simulate a realistic AI response that might have issues
  const realisticAIResponse = `I'll analyze this sales call and provide a comprehensive report:

{
  "tp_title": "Sales Discovery Call - Cloud Platform Migration",
  "tp_subtitle": "Enterprise Infrastructure Assessment",
  "tp_deal": "CloudTech Enterprise License - $120K ARR",
  "tp_sessionId": "CT-2024-01-15-002",
  "p1_exec_headline": "Highly qualified enterprise prospect with urgent migration needs and established budget.",
  "p1_exec_synopsis": "CTO of 500-person company needs cloud migration within 6 months due to datacenter lease expiry. Strong technical alignment and budget authority confirmed.",
  "p1_meta_full": {
    "date": "2024-01-15",
    "time": "2:00 PM EST",
    "duration": "45 minutes",
    "rep": {
      "name": "Michael Chen",
      "role": "Enterprise Account Executive",
      "team": "Cloud Solutions"
    },
    "prospect": {
      "name": "Jennifer Williams",
      "role": "Chief Technology Officer",
      "company": "DataFlow Industries"
    },
    "channel": "Video call",
    "transcriptQuality": "Excellent - clear audio, technical discussion"
  },
  "p1_key_points": [
    "Datacenter lease expires Q3 2024 - hard deadline",
    "500 employees, 50TB data, complex compliance requirements",
    "Budget approved $100-150K for cloud migration",
    "Previous cloud vendor (AWS) had performance issues",
    "Need hybrid cloud solution with on-premise backup"
  ],
  "p1_pains": [
    "Urgent timeline pressure due to datacenter lease expiry",
    "Complex compliance requirements (SOC2, HIPAA)",
    "Previous bad experience with cloud performance"
  ],
  "p1_buying_signals": [
    "Budget already approved and allocated",
    "Asked for detailed technical architecture proposal",
    "Wants to schedule follow-up with engineering team"
  ],
  "p1_objections_handled": [
    { "label": "Performance concerns from previous vendor", "handled": "yes" },
    { "label": "Compliance complexity", "handled": "partial" }
  ],
  "p1_action_items": [
    { "id": "a1", "title": "Prepare technical architecture proposal", "owner": "Michael", "due": "48h", "priority": "High" },
    { "id": "a2", "title": "Schedule engineering team technical deep-dive", "owner": "Michael", "due": "72h", "priority": "High" },
    { "id": "a3", "title": "Provide compliance documentation (SOC2, HIPAA)", "owner": "Michael", "due": "24h", "priority": "High" }
  ],
  "p1_deal_health": {
    "score": 92,
    "rationale": "Urgent timeline, approved budget, technical authority, clear pain points"
  },
  "p2_context_snapshot": "Exceptional discovery call with technical decision maker facing urgent deadline",
  "p2_high_priority": [
    "Technical architecture proposal with hybrid cloud design",
    "Compliance documentation and certification proof",
    "Performance benchmarks vs previous AWS experience"
  ],
  "p2_medium_priority": [
    "Migration timeline and project plan",
    "Training and support packages"
  ],
  "p2_info_items": [
    "Company size: 500 employees",
    "Data volume: 50TB current, growing 20% annually",
    "Compliance: SOC2 Type II, HIPAA required",
    "Timeline: Must complete Q3 2024"
  ],
  "p2_risks_concerns": [
    { "area": "Timeline pressure", "impact": "High", "likelihood": "Medium", "rationale": "Hard deadline but realistic with proper planning" },
    { "area": "Technical complexity", "impact": "Medium", "likelihood": "Low", "rationale": "Strong technical team, good requirements clarity" },
    { "area": "Compliance approval", "impact": "High", "likelihood": "Low", "rationale": "Well-defined requirements, established process" }
  ],
  "p2_short_summary": "Proceed immediately with technical proposal and compliance documentation; high-probability close",
  "p3_deal_health_summary": {
    "score": 92,
    "status": "Highly Qualified - Fast Track"
  },
  "p3_meddicc": {
    "metrics": { "value": ["$2M annual savings vs current datacenter", "50% faster deployment", "99.9% uptime SLA"] },
    "economicBuyer": { "value": "CTO Jennifer Williams - confirmed budget authority" },
    "decisionCriteria": { "value": ["Performance vs AWS", "Compliance certifications", "Migration timeline", "Total cost of ownership"] },
    "decisionProcess": { "value": "CTO decision with engineering team technical approval" },
    "identifyPain": { "value": "Urgent datacenter lease expiry with complex compliance requirements" },
    "competition": { "value": ["AWS (previous negative experience)", "Azure", "Status quo (datacenter renewal)"] },
    "champion": { "value": "CTO Jennifer Williams - highly engaged and supportive" }
  },
  "p3_bant": {
    "rows": [
      { "key": "Budget", "status": "Confirmed", "notes": "$100-150K approved and allocated" },
      { "key": "Authority", "status": "Confirmed", "notes": "CTO with budget authority" },
      { "key": "Need", "status": "Urgent", "notes": "Datacenter lease expires Q3 2024" },
      { "key": "Timeline", "status": "Defined", "notes": "Must complete by Q3 2024" }
    ]
  },
  "p3_missed_opportunities": [
    "Could have explored additional services (monitoring, security)",
    "Didn't discuss multi-year contract incentives"
  ],
  "p3_improvements": [
    "Probe deeper on additional use cases beyond migration",
    "Explore enterprise support and professional services needs"
  ],
  "p3_short_reco": "Fast-track with technical proposal and immediate follow-up meeting",
  "p4_stage_eval": [
    { "stage": "Greetings", "handled": "yes", "note": "Professional video call setup", "score": 9 },
    { "stage": "Introduction", "handled": "yes", "note": "Clear agenda and time confirmation", "score": 9 },
    { "stage": "Customer Success Stories", "handled": "yes", "note": "Referenced similar enterprise migrations", "score": 8 },
    { "stage": "Discovery", "handled": "yes", "note": "Excellent technical discovery", "score": 10 },
    { "stage": "Product Details", "handled": "yes", "note": "Technical architecture discussion", "score": 9 },
    { "stage": "Trust Building", "handled": "yes", "note": "Compliance certifications and case studies", "score": 9 },
    { "stage": "Objection Handling", "handled": "yes", "note": "Addressed AWS performance concerns", "score": 8 },
    { "stage": "Buying‑Signal Capitalization", "handled": "yes", "note": "Confirmed budget and timeline urgency", "score": 9 },
    { "stage": "Negotiation", "handled": "no", "note": "Focused on technical fit first", "score": 0 },
    { "stage": "Timeline", "handled": "yes", "note": "Clear next steps and urgency", "score": 8 },
    { "stage": "Closing / Registration", "handled": "partial", "note": "Technical follow-up scheduled", "score": 6 }
  ],
  "p4_pivotal_points": [
    { "ts": "15:30", "reason": "Budget confirmation", "quote": "We have $100-150K approved specifically for this migration project" },
    { "ts": "32:45", "reason": "Timeline urgency revealed", "quote": "Our datacenter lease expires end of Q3, so we absolutely must have this completed by then" }
  ],
  "p4_takeaway": "Exceptional prospect with all BANT criteria met; focus on technical excellence and fast execution",
  "p5_stage_a": [{ "stageName": "Greetings", "objective": "Professional opening", "indicators": ["Video setup", "Agenda setting"], "observed": ["Professional setup", "Clear agenda"], "score": 90, "weight": 10, "mistakes": [], "whatToSay": ["Perfect execution"], "positives": ["Professional approach"], "coaching": ["Continue this standard"], "quickFix": "Already excellent" }],
  "p5_stage_b": [{ "stageName": "Introduction", "objective": "Set context", "indicators": ["Time confirmation", "Role clarity"], "observed": ["Time confirmed", "Roles clear"], "score": 90, "weight": 10, "mistakes": [], "whatToSay": ["Well executed"], "positives": ["Clear communication"], "coaching": ["Maintain this approach"], "quickFix": "Already strong" }],
  "p6_stage_c": [{ "stageName": "Customer Success", "objective": "Build credibility", "indicators": ["Relevant examples"], "observed": ["Similar migration stories"], "score": 80, "weight": 15, "mistakes": [], "whatToSay": ["Good relevance"], "positives": ["Industry-specific examples"], "coaching": ["Continue with proof"], "quickFix": "Well done" }],
  "p6_stage_d": [{ "stageName": "Discovery", "objective": "Technical requirements", "indicators": ["Technical depth"], "observed": ["Excellent technical discovery"], "score": 100, "weight": 25, "mistakes": [], "whatToSay": ["Outstanding discovery"], "positives": ["Technical depth"], "coaching": ["Model for others"], "quickFix": "Perfect execution" }],
  "p7_stage_e": [{ "stageName": "Product Details", "objective": "Technical alignment", "indicators": ["Architecture discussion"], "observed": ["Detailed technical discussion"], "score": 90, "weight": 15, "mistakes": [], "whatToSay": ["Strong technical alignment"], "positives": ["Architecture clarity"], "coaching": ["Continue technical focus"], "quickFix": "Excellent" }],
  "p7_stage_f": [{ "stageName": "Trust Building", "objective": "Credibility establishment", "indicators": ["Compliance proof"], "observed": ["Certifications discussed"], "score": 90, "weight": 15, "mistakes": [], "whatToSay": ["Strong credibility"], "positives": ["Compliance expertise"], "coaching": ["Continue with proof"], "quickFix": "Well executed" }],
  "p8_stage_g": [{ "stageName": "Objection Handling", "objective": "Address concerns", "indicators": ["Previous vendor issues"], "observed": ["AWS concerns addressed"], "score": 80, "weight": 10, "mistakes": [], "whatToSay": ["Good resolution"], "positives": ["Specific examples"], "coaching": ["Differentiation clear"], "quickFix": "Well handled" }],
  "p8_stage_h": [{ "stageName": "Buying Signals", "objective": "Recognize interest", "indicators": ["Budget confirmation"], "observed": ["Strong buying signals"], "score": 90, "weight": 10, "mistakes": [], "whatToSay": ["Excellent recognition"], "positives": ["Signal capture"], "coaching": ["Continue recognition"], "quickFix": "Outstanding" }],
  "p9_stage_i": [{ "stageName": "Negotiation", "objective": "Value discussion", "indicators": ["Price discussion"], "observed": ["No pricing yet"], "score": 0, "weight": 5, "mistakes": ["Technical first approach"], "whatToSay": ["Appropriate for technical call"], "positives": [], "coaching": ["Good sequencing"], "quickFix": "Correct approach" }],
  "p9_stage_j": [{ "stageName": "Timeline", "objective": "Next steps", "indicators": ["Follow-up clarity"], "observed": ["Clear next steps"], "score": 80, "weight": 5, "mistakes": [], "whatToSay": ["Good follow-up"], "positives": ["Clear timeline"], "coaching": ["Continue structure"], "quickFix": "Well planned" }],
  "p10_stage_k": [{ "stageName": "Closing", "objective": "Technical commitment", "indicators": ["Follow-up meetings"], "observed": ["Technical meeting scheduled"], "score": 60, "weight": 5, "mistakes": [], "whatToSay": ["Appropriate for discovery"], "positives": ["Meeting scheduled"], "coaching": ["Good progression"], "quickFix": "Good approach" }],
  "p10_stage_l": [{ "stageName": "Handoff", "objective": "Next steps clarity", "indicators": ["Clear actions"], "observed": ["Action items defined"], "score": 80, "weight": 5, "mistakes": [], "whatToSay": ["Clear handoff"], "positives": ["Defined actions"], "coaching": ["Continue clarity"], "quickFix": "Well executed" }],
  "apx_scoring_rubric": [
    "90-100%: Exceptional execution - model for other reps",
    "80-89%: Strong execution with minor optimization opportunities",
    "70-79%: Good execution meeting core requirements",
    "60-69%: Adequate execution with improvement areas"
  ],
  "apx_data_flags": [
    "High-quality technical discussion",
    "Clear business requirements captured",
    "Strong buying signals throughout call"
  ]
}

This analysis shows an exceptionally well-qualified prospect with urgent needs and confirmed budget.`;

  console.log('🔄 Step 1: Parse AI response...');
  const parsed = tryParseJsonFlexible(realisticAIResponse);
  console.log(parsed ? '✅ Successfully parsed JSON from AI response' : '❌ Failed to parse JSON');
  
  if (parsed) {
    console.log('\n🔄 Step 2: Validate schema compliance...');
    const schema = {
      required: ['tp_title', 'tp_subtitle', 'p1_exec_headline', 'p1_meta_full', 'p4_stage_eval']
    };
    const missing = validateRequiredFields(parsed, schema);
    console.log(missing.length === 0 ? '✅ Schema validation passed' : `❌ Missing fields: ${missing.join(', ')}`);
    
    console.log('\n🔄 Step 3: Normalize and validate...');
    const normalized = normalizeReportV3(parsed);
    console.log('✅ Report normalized successfully');
    
    console.log('\n📊 Final Report Stats:');
    console.log(`   - Title: "${normalized.tp_title}"`);
    console.log(`   - Deal Health Score: ${normalized.p1_deal_health?.score || 'N/A'}`);
    console.log(`   - Key Points: ${normalized.p1_key_points?.length || 0}`);
    console.log(`   - Stage Evaluations: ${normalized.p4_stage_eval?.length || 0}`);
    console.log(`   - Action Items: ${normalized.p1_action_items?.length || 0}`);
    
    // Save this realistic example
    fs.writeFileSync('realistic-ai-response-test.json', JSON.stringify({
      original_ai_response: realisticAIResponse,
      parsed_json: parsed,
      normalized_report: normalized,
      test_timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log('\n💾 Realistic test saved to: realistic-ai-response-test.json');
  }
}

function runEdgeCaseTests() {
  console.log('🔬 Report JSON Parsing - Edge Case Tests\n');
  console.log('='.repeat(60));
  
  testMalformedJSONEdgeCases();
  testSchemaNormalizationEdgeCases();
  testUICompatibilityWithEdgeCases();
  simulateRealAIResponseFlow();
  
  console.log('\n🎯 Edge case testing completed!');
  console.log('📁 Check these files for detailed results:');
  console.log('   - sample-report-output.json (basic test)');
  console.log('   - realistic-ai-response-test.json (realistic AI response)');
}

// Run the edge case tests
if (require.main === module) {
  runEdgeCaseTests();
}








