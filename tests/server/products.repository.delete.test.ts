import { describe, it, expect } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key'

// dynamic import to allow env to be set first
const importRepo = () => import('@/server/repositories/products')

function makeClient({ invoiceActiveCount = 0, schedulePendingCount = 0, deleteOk = true }: { invoiceActiveCount?: number; schedulePendingCount?: number; deleteOk?: boolean }) {
  const from = (table: string) => {
    if (table === 'invoice_lines') {
      return {
        select: (_cols: string, _opts: any) => ({
          eq: (_col: string, _val: string) => ({
            eq: (_col2: string, _val2: string) => Promise.resolve({ count: invoiceActiveCount, error: null, data: null }),
          }),
        }),
      }
    }
    if (table === 'invoice_payment_schedules') {
      return {
        select: (_cols: string, _opts: any) => ({
          eq: (_col: string, _val: string) => ({
            eq: (_col2: string, _val2: string) => Promise.resolve({ count: schedulePendingCount, error: null, data: null }),
          }),
        }),
      }
    }
    if (table === 'products') {
      return {
        update: (_row: any) => ({
          eq: (_col: string, _val: string) => ({
            eq: (_col2: string, _val2: any) => Promise.resolve({ error: deleteOk ? null : { message: 'db error' } }),
          }),
        }),
      }
    }
    throw new Error(`Unexpected table: ${table}`)
  }
  return { from }
}

describe('ProductsRepository.delete safeguards', () => {
  it('throws PRODUCT_IN_USE when invoice lines exist', async () => {
    const client = makeClient({ invoiceActiveCount: 3 }) as any
    const { ProductsRepository } = await importRepo()
    const repo = new ProductsRepository(client)
    await expect(repo.delete('prod-1', 'owner-1', null, 'manager')).rejects.toMatchObject({ code: 'PRODUCT_IN_USE' })
  })

  it('deletes when no invoice lines exist', async () => {
    const client = makeClient({ invoiceActiveCount: 0, schedulePendingCount: 0, deleteOk: true }) as any
    const { ProductsRepository } = await importRepo()
    const repo = new ProductsRepository(client)
    await expect(repo.delete('prod-1', 'owner-1', null, 'manager')).resolves.toBeUndefined()
  })

  it('throws PRODUCT_IN_USE when pending payment schedules exist', async () => {
    const client = makeClient({ invoiceActiveCount: 0, schedulePendingCount: 2 }) as any
    const { ProductsRepository } = await importRepo()
    const repo = new ProductsRepository(client)
    await expect(repo.delete('prod-2', 'owner-1', null, 'manager')).rejects.toMatchObject({ code: 'PRODUCT_IN_USE' })
  })
})
