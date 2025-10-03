/**
 * Design Tokens - Single source of truth for spacing, density, and typography
 * Based on Shadcn UI principles and Tailwind CSS
 */

// Spacing Scale (Tailwind-based, in pixels)
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
} as const

// Density Settings
export const density = {
  compact: {
    padding: spacing.sm,
    gap: spacing.xs,
    lineHeight: 1.4,
  },
  comfortable: {
    padding: spacing.md,
    gap: spacing.sm,
    lineHeight: 1.6,
  },
  spacious: {
    padding: spacing.lg,
    gap: spacing.md,
    lineHeight: 1.8,
  },
} as const

// Typography Scale
export const typography = {
  display: {
    size: '2.25rem',  // 36px
    weight: '700',
    lineHeight: '2.5rem',
  },
  h1: {
    size: '1.875rem', // 30px
    weight: '700',
    lineHeight: '2.25rem',
  },
  h2: {
    size: '1.5rem',   // 24px
    weight: '600',
    lineHeight: '2rem',
  },
  h3: {
    size: '1.25rem',  // 20px
    weight: '600',
    lineHeight: '1.75rem',
  },
  h4: {
    size: '1.125rem', // 18px
    weight: '600',
    lineHeight: '1.75rem',
  },
  body: {
    size: '0.875rem', // 14px
    weight: '400',
    lineHeight: '1.25rem',
  },
  small: {
    size: '0.75rem',  // 12px
    weight: '400',
    lineHeight: '1rem',
  },
  caption: {
    size: '0.625rem', // 10px
    weight: '400',
    lineHeight: '0.875rem',
  },
} as const

// Card Variants
export const cardVariants = {
  default: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: '0.5rem',
  },
  compact: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: '0.375rem',
  },
  list: {
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: '0.25rem',
  },
} as const

// Dialog/Sheet Sizing
export const dialogSizes = {
  sm: '400px',
  md: '600px',
  lg: '900px',
  xl: '1200px',
  full: '100vw',
} as const

// Common CSS Classes (for consistency)
export const commonClasses = {
  pageContainer: 'flex flex-col gap-6 p-6',
  cardContainer: 'rounded-lg border bg-card p-6',
  formGrid: 'grid gap-4 sm:grid-cols-2 sm:gap-6',
  buttonGroup: 'flex items-center gap-2',
  stackVertical: 'flex flex-col gap-4',
  stackHorizontal: 'flex items-center gap-4',
} as const

// Z-index Scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
} as const

// Animation Durations (in ms)
export const animations = {
  fast: 150,
  normal: 200,
  slow: 300,
  drawer: 350,
} as const

// Export utility function for consistent class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
