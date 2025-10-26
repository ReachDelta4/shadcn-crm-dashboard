import type { SupabaseClient } from '@supabase/supabase-js'
import { flags } from '@/server/config/flags'

export type NotificationType = 'appointment_reminder' | 'status_change' | 'invoice_sent' | 'invoice_paid' | 'system'

export interface NotificationPayload {
	type: NotificationType
	user_id: string
	title: string
	message: string
	entity_type?: string
	entity_id?: string
	metadata?: Record<string, any>
}

interface NotificationSettings {
	inapp: boolean
	email: boolean
	push: boolean
	reminder_24h: boolean
	reminder_1h: boolean
}

// In-memory throttle cache (production: use Redis)
const throttleCache = new Map<string, number>()

export class NotificationService {
	constructor(private readonly client: SupabaseClient) {}

	/**
	 * Send notification with throttling
	 */
	async send(payload: NotificationPayload): Promise<void> {
		// Throttle check
		const throttleKey = `${payload.user_id}:${payload.type}:${payload.entity_id || 'global'}`
		const lastSent = throttleCache.get(throttleKey)
		const now = Date.now()
		
		if (lastSent && (now - lastSent) < flags.notificationsThrottleMs) {
			console.log(`[notification] Throttled: ${throttleKey}`)
			return
		}

		// Get user settings
		const settings = await this.getUserSettings(payload.user_id)

		// Send to enabled channels
		const promises: Promise<any>[] = []

		if (settings.inapp) {
			promises.push(this.sendInApp(payload))
		}

		if (settings.email) {
			promises.push(this.sendEmail(payload))
		}

		if (settings.push) {
			promises.push(this.sendPush(payload))
		}

		await Promise.allSettled(promises)

		// Update throttle cache
		throttleCache.set(throttleKey, now)
	}

	/**
	 * Schedule appointment reminders
	 */
	async scheduleAppointmentReminders(appointmentId: string, userId: string, startAtUtc: string): Promise<void> {
		const settings = await this.getUserSettings(userId)
		const startTime = new Date(startAtUtc).getTime()
		const now = Date.now()

		// 24h reminder
		if (settings.reminder_24h) {
			const reminder24h = startTime - (24 * 60 * 60 * 1000)
			if (reminder24h > now) {
				await this.createOutboxJob({
					job_type: 'notification',
					payload: {
						type: 'appointment_reminder',
						user_id: userId,
						title: 'Appointment in 24 hours',
						message: 'You have an appointment scheduled for tomorrow',
						entity_type: 'appointment',
						entity_id: appointmentId,
					},
					next_run_at: new Date(reminder24h).toISOString(),
				})
			}
		}

		// 1h reminder
		if (settings.reminder_1h) {
			const reminder1h = startTime - (60 * 60 * 1000)
			if (reminder1h > now) {
				await this.createOutboxJob({
					job_type: 'notification',
					payload: {
						type: 'appointment_reminder',
						user_id: userId,
						title: 'Appointment in 1 hour',
						message: 'Your appointment starts in 1 hour',
						entity_type: 'appointment',
						entity_id: appointmentId,
					},
					next_run_at: new Date(reminder1h).toISOString(),
				})
			}
		}
	}

	/**
	 * In-app notification (store in DB)
	 */
	private async sendInApp(payload: NotificationPayload): Promise<void> {
		const { error } = await this.client.from('notifications').insert({
			user_id: payload.user_id,
			type: payload.type,
			title: payload.title,
			message: payload.message,
			entity_type: payload.entity_type,
			entity_id: payload.entity_id,
			metadata: payload.metadata,
			read: false,
		})
		if (error) console.error('[notification] In-app failed:', error)
	}

	/**
	 * Email notification (via outbox)
	 */
	private async sendEmail(payload: NotificationPayload): Promise<void> {
		await this.createOutboxJob({
			job_type: 'email',
			payload: {
				to: payload.user_id, // In production, fetch user email
				subject: payload.title,
				body: payload.message,
			},
			next_run_at: new Date().toISOString(),
		})
	}

	/**
	 * Push notification (via outbox)
	 */
	private async sendPush(payload: NotificationPayload): Promise<void> {
		await this.createOutboxJob({
			job_type: 'push',
			payload: {
				user_id: payload.user_id,
				title: payload.title,
				body: payload.message,
			},
			next_run_at: new Date().toISOString(),
		})
	}

	/**
	 * Get user notification settings (with defaults)
	 */
	private async getUserSettings(userId: string): Promise<NotificationSettings> {
		const { data } = await this.client
			.from('notification_settings')
			.select('*')
			.eq('owner_id', userId)
			.maybeSingle()

		return {
			inapp: data?.inapp ?? true,
			email: data?.email ?? false,
			push: data?.push ?? false,
			reminder_24h: data?.reminder_24h ?? true,
			reminder_1h: data?.reminder_1h ?? true,
		}
	}

	/**
	 * Create outbox job for async processing
	 */
	private async createOutboxJob(job: { job_type: string; payload: any; next_run_at: string }): Promise<void> {
		const { error } = await this.client.from('outbox_jobs').insert({
			job_type: job.job_type,
			payload: job.payload,
			status: 'pending',
			attempts: 0,
			next_run_at: job.next_run_at,
		})
		if (error) console.error('[notification] Outbox job failed:', error)
	}

	/**
	 * Clear throttle cache (for testing)
	 */
	static clearThrottleCache(): void {
		throttleCache.clear()
	}
}
