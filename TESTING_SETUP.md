# Testing Setup Guide

## Unit Tests

### Prerequisites
The project includes unit tests for critical functionality. To run them, you'll need to set up Jest.

### Installation
```bash
npm install --save-dev jest @jest/globals @types/jest ts-jest
```

### Jest Configuration
Create `jest.config.js` in the project root:

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
}
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test normalize.test.ts
```

## Test Coverage

### Current Tests

#### Event Normalizer (`src/features/calendar/__tests__/normalize.test.ts`)
- ✅ Valid appointment normalization
- ✅ Missing required fields (id, start_at_utc, end_at_utc)
- ✅ Invalid date formats
- ✅ Inverted date ranges (clamping)
- ✅ Default timezone handling
- ✅ Provider title formatting
- ✅ Batch normalization with filtering
- ✅ Edge cases (empty array, null input, ordering)

**Coverage:** 15 test cases covering all edge cases

### Integration Testing Checklist

#### Invoice Creation with Payment Plans
- [ ] Create invoice with one-time product and no payment plan
- [ ] Create invoice with one-time product and payment plan
- [ ] Verify payment schedules are created correctly
- [ ] Verify recurring schedules are created for recurring products
- [ ] Test discount calculations (percent and amount)
- [ ] Test tax calculations

#### Appointments API
- [ ] Test rate limiting (60 requests/minute)
- [ ] Test date range validation
- [ ] Test maximum window enforcement (90 days)
- [ ] Test invalid date formats
- [ ] Test response headers (X-RateLimit-*)

### Accessibility Testing

Run accessibility checks on new components:

```bash
# Install axe-core for accessibility testing
npm install --save-dev @axe-core/react

# Manual testing with browser DevTools
# 1. Open Chrome DevTools
# 2. Go to Lighthouse tab
# 3. Select "Accessibility" only
# 4. Run audit on:
#    - New Invoice Dialog
#    - Product Picker
#    - Payment Plan Picker
#    - Date Range Picker
```

### Accessibility Checklist

#### Dialogs/Modals
- [ ] Focus traps work (can't tab outside)
- [ ] Escape key closes dialog
- [ ] Focus returns to trigger on close
- [ ] Proper ARIA labels (role="dialog", aria-labelledby)

#### Form Controls
- [ ] All inputs have associated labels
- [ ] Error messages have aria-live="polite"
- [ ] Required fields marked with aria-required
- [ ] Invalid fields have aria-invalid

#### Keyboard Navigation
- [ ] Tab order is logical
- [ ] Enter key submits forms
- [ ] Arrow keys work in dropdowns
- [ ] Spacebar toggles selections

#### Screen Reader Support
- [ ] All interactive elements have accessible names
- [ ] Status messages announced
- [ ] Loading states announced

## Continuous Integration

Add to your CI pipeline (e.g., GitHub Actions):

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --coverage
      - run: npx tsc --noEmit
```

## Manual Testing

See `VERIFICATION_CHECKLIST.md` for comprehensive manual testing procedures.
