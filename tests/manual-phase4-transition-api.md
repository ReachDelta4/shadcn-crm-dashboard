# Phase 4 — Transition API Manual Test Plan

## Prerequisites
- Server running: `npm run dev`
- User authenticated with valid session
- At least one test lead in database

## Test Cases

### 1. Valid Transition (new → contacted)
```bash
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -H "Cookie: {AUTH_COOKIES}" \
  -d '{"next_status":"contacted"}'
```
**Expected**: 200, lead.status updated, transition log created

### 2. Self-Transition (contacted → contacted)
```bash
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -H "Cookie: {AUTH_COOKIES}" \
  -d '{"next_status":"contacted"}'
```
**Expected**:
- If `LIFECYCLE_ENFORCEMENT_MODE=enforce`: 409 SELF_TRANSITION_FORBIDDEN
- If `log_only` or `off`: 200 with warning log

### 3. Idempotency Check
```bash
# First call
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -H "Cookie: {AUTH_COOKIES}" \
  -d '{"next_status":"qualified"}'

# Second call (same key)
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -H "Cookie: {AUTH_COOKIES}" \
  -d '{"next_status":"qualified"}'
```
**Expected**: Both return 200, only one transition log entry, same result

### 4. Override Without Justification (Rep role)
```bash
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -H "Cookie: {AUTH_COOKIES}" \
  -d '{"next_status":"won","override":true}'
```
**Expected**: 400 OVERRIDE_REASON_REQUIRED

### 5. Override With Short Reason
```bash
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -H "Cookie: {AUTH_COOKIES}" \
  -d '{"next_status":"won","override":true,"override_reason":"short"}'
```
**Expected**: 400 (reason too short, <15 chars)

### 6. Valid Override (Team Lead+ role)
```bash
# First set user role to 'lead' in user_roles table
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -H "Cookie: {AUTH_COOKIES}" \
  -d '{"next_status":"won","override":true,"override_reason":"Deal closed early after executive approval"}'
```
**Expected**: 200, override_flag=true in transition log

### 7. Unauthorized Access
```bash
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -d '{"next_status":"contacted"}'
```
**Expected**: 401 Unauthorized (no cookies)

### 8. Invalid Status
```bash
curl -X POST http://localhost:3000/api/leads/{LEAD_ID}/transition \
  -H "Content-Type: application/json" \
  -H "Cookie: {AUTH_COOKIES}" \
  -d '{"next_status":"invalid_status"}'
```
**Expected**: 400 INVALID_STATUS

## Verification Queries

### Check Transition Logs
```sql
SELECT * FROM lead_status_transitions 
WHERE lead_id = '{LEAD_ID}' 
ORDER BY created_at DESC;
```

### Check Lead Status
```sql
SELECT id, status, updated_at FROM leads WHERE id = '{LEAD_ID}';
```

### Check Idempotency
```sql
SELECT idempotency_key, COUNT(*) 
FROM lead_status_transitions 
WHERE idempotency_key IS NOT NULL 
GROUP BY idempotency_key 
HAVING COUNT(*) > 1;
```
**Expected**: No duplicates

## Pass Criteria
- ✅ All valid transitions succeed
- ✅ Self-transitions blocked in enforce mode
- ✅ Idempotency prevents duplicate transitions
- ✅ Override requires Team Lead+ role and justification
- ✅ Audit logs capture all fields correctly
- ✅ RBAC scope enforced (404 for out-of-scope leads)
