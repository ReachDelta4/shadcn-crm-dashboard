import { describe, it, expect, vi } from 'vitest'
import { NotificationService } from '@/server/services/notifications/notification-service'

function createFakeClient() {
  const inserts: Array<{ table: string; payload: any }> = []
  const client: any = {
    from(table: string) {
      if (table === 'notification_settings') {
        return {
          select() { return this },
          eq() { return this },
          async maybeSingle() {
            return { data: { inapp: true, email: false, push: false, reminder_24h: false, reminder_1h: false } }
          },
        }
      }
      if (table === 'notifications') {
        return {
          async insert(payload: any) { inserts.push({ table, payload }); return { error: null } },
        }
      }
      if (table === 'outbox_jobs') {
        return {
          async insert(_payload: any) { return { error: null } },
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }
  return { client, inserts }
}

describe('NotificationService with injected client', () => {
  it('uses provided client to insert in-app notification', async () => {
    const { client, inserts } = createFakeClient()
    const svc = new NotificationService(client)
    await svc.send({ type: 'status_change', user_id: 'user1', title: 'Lead Status Updated', message: 'm' })
    expect(inserts.length).toBe(1)
    expect(inserts[0].table).toBe('notifications')
    expect(inserts[0].payload.user_id).toBe('user1')
  })
})

