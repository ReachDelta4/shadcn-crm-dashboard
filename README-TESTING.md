# Report Generation Testing

This document explains how to test the report generation system to verify that all schema fields are populated properly.

## Test Scripts

Two test scripts are provided:

1. **`test-report.js`** - CommonJS version (recommended)
2. **`test-report-generation.js`** - ES modules version

## Prerequisites

1. **Environment Setup**: Ensure your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   # Optional for running external tests:
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Development Server**: Start the Next.js development server:
   ```bash
   npm run dev
   ```

3. **Authentication**: The test requires authentication. You have two options:
   - **Option A**: Temporarily disable auth in the API routes for testing
   - **Option B**: Create a test user and obtain an auth token

## Running the Test

### Method 1: Using the Test Script

```bash
# From the project root
node test-report.js
```

### Method 2: Manual Testing via API

You can also test manually using curl or a tool like Postman:

```bash
# 1. Create a session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"type": "sales_call", "title": "Test Sales Call"}'

# 2. Add transcripts (replace SESSION_ID)
curl -X POST http://localhost:3000/api/transcripts \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "speaker": "Sales Rep",
    "content_enc": "Hello, this is a test transcript segment."
  }'

# 3. Trigger report generation
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/report-v3

# 4. Check report status
curl http://localhost:3000/api/sessions/SESSION_ID/report-v3
```

## What the Test Does

1. **Creates a Test Session**: A sales call session with realistic metadata
2. **Adds Transcript Segments**: 10 realistic conversation exchanges between a sales rep and prospect
3. **Triggers Report Generation**: Calls the OpenRouter API with the current schema
4. **Polls for Completion**: Waits for the report to be generated (up to 60 seconds)
5. **Validates Schema**: Checks that all expected fields are present in the response

## Expected Fields

The test validates the presence of these fields:

### Title Page
- `tp_title`, `tp_subtitle`, `tp_deal`, `tp_sessionId`

### Page 1 - Executive Summary
- `p1_exec_headline`, `p1_exec_synopsis`, `p1_meta_full`
- `p1_key_points`, `p1_pains`, `p1_buying_signals`
- `p1_objections_handled`, `p1_action_items`, `p1_deal_health`

### Page 2 - Discussion Highlights
- `p2_context_snapshot`, `p2_high_priority`, `p2_medium_priority`
- `p2_info_items`, `p2_risks_concerns`, `p2_short_summary`

### Page 3 - Deal Health & Outcomes
- `p3_deal_health_summary`, `p3_meddicc`, `p3_bant`
- `p3_missed_opportunities`, `p3_improvements`, `p3_short_reco`

### Page 4 - Call Stages Overview
- `p4_stage_eval`, `p4_pivotal_points`, `p4_takeaway`

### Pages 5-10 - Stage Analysis
- `p5_stage_a`, `p5_stage_b`, `p6_stage_c`, `p6_stage_d`
- `p7_stage_e`, `p7_stage_f`, `p8_stage_g`, `p8_stage_h`
- `p9_stage_i`, `p9_stage_j`, `p10_stage_k`, `p10_stage_l`

### Appendix
- `apx_scoring_rubric`, `apx_data_flags`

## Current Schema Status

⚠️ **Note**: As of the latest changes, the schema has `required: []`, meaning all fields are optional. The OpenRouter API may not populate all fields if they cannot be derived from the transcript data.

For enterprise-grade consistency, consider setting all fields as required by changing:
```javascript
required: Object.keys(REPORT_V3_PROPERTIES)
```

## Sample Output

When the test runs successfully, you'll see:

```
🚀 Starting Report Generation Test
==================================

🔄 Creating test session...
✅ Session created: 12345-abcdef-67890

🔄 Adding transcript segments...
  Adding segment 1/10: Sales Rep
  Adding segment 2/10: Prospect
  ...
✅ Added 10 transcript segments

🔄 Triggering report generation...
✅ Report generation triggered: { accepted: true }

🔄 Polling for report completion...
  Attempt 1/20: Status is 'running', waiting...
  Attempt 2/20: Status is 'running', waiting...
✅ Report generation completed!

📊 REPORT SCHEMA VALIDATION RESULTS:
==========================================
✅ SUCCESS: All required fields are present!

✅ PRESENT FIELDS (37/37):
  ✓ tp_title: String[45 chars]
  ✓ p1_exec_headline: String[82 chars]
  ✓ p1_key_points: Array[5]
  ...

🎯 TEST SUMMARY:
================
Session ID: 12345-abcdef-67890
Transcripts Added: 10
Schema Validation: ✅ PASSED
Fields Present: 37/37

🎉 All tests passed! Report generation is working correctly.
```

## Troubleshooting

### Authentication Issues
If you get 401 Unauthorized errors, you need to:
1. Create a test user account
2. Get an auth token
3. Set `TEST_AUTH_TOKEN` environment variable

### OpenRouter Issues
If report generation fails:
1. Check your `OPENROUTER_API_KEY` is valid
2. Verify the model `qwen/qwen3-next-80b-a3b-thinking` is available
3. Check OpenRouter account balance/limits

### Missing Fields
If some fields are missing:
1. This is expected with `required: []` - fields are optional
2. Check the system prompt encourages populating all fields
3. Consider making fields required for enterprise consistency

### Timeout Issues
If polling times out:
1. Check OpenRouter API response times
2. Increase `maxAttempts` in the test script
3. Check server logs for errors

## Making Fields Mandatory

To ensure all fields are always populated (enterprise requirement), update the schema in `src/server/services/report-v3.ts`:

```javascript
const REPORT_V3_JSON_SCHEMA: any = {
  type: 'object',
  additionalProperties: false,
  required: Object.keys(REPORT_V3_PROPERTIES), // Make all fields required
  properties: REPORT_V3_PROPERTIES
}
```

And strengthen the system prompt:
```javascript
'Populate every field defined in the json_schema. If a field cannot be derived, use an empty array [], empty object {}, or a short placeholder string. Never omit any field.'
```
