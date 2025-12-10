import { APIRequestContext, expect } from '@playwright/test'

const DEFAULT_INBUCKET_BASE_URL = 'http://127.0.0.1:54324'
const INBUCKET_BASE_URL =
	process.env.E2E_INBUCKET_BASE_URL && process.env.E2E_INBUCKET_BASE_URL.trim().length > 0
		? process.env.E2E_INBUCKET_BASE_URL.trim().replace(/\/+$/, '')
		: DEFAULT_INBUCKET_BASE_URL

/**
 * Best-effort check that the Inbucket inbox service is reachable.
 * We only care that the HTTP port is open; specific status codes are not enforced.
 */
export async function isInbucketAvailable(request: APIRequestContext): Promise<boolean> {
	try {
		const res = await request.get(`${INBUCKET_BASE_URL}/api/v1/health`)
		// Inbucket may not have a health endpoint; treat any HTTP response as "available"
		return res.status() > 0
	} catch {
		return false
	}
}

type WaitForEmailOptions = {
	timeoutMs?: number
	pollIntervalMs?: number
	subjectIncludes?: string
}

/**
 * Poll the local Inbucket mailbox for the given email and return the first confirmation link
 * found in the raw message body. This assumes Supabase local dev uses Inbucket.
 */
export async function waitForConfirmationLinkInbucket(
	request: APIRequestContext,
	email: string,
	options: WaitForEmailOptions = {},
): Promise<string> {
	const { timeoutMs = 60_000, pollIntervalMs = 2_000, subjectIncludes = 'Confirm' } = options
	const startedAt = Date.now()
	const [localPart] = email.split('@')
	const mailbox = encodeURIComponent(localPart)

	while (Date.now() - startedAt < timeoutMs) {
		let messages: any[] = []
		try {
			const res = await request.get(`${INBUCKET_BASE_URL}/api/v1/mailbox/${mailbox}`)
			if (!res.ok()) {
				// 404 or similar => mailbox empty; treat as no messages yet
				messages = []
			} else {
				const json = await res.json().catch(() => [])
				if (Array.isArray(json)) {
					messages = json
				}
			}
		} catch {
			// network error or JSON parse error; continue polling until timeout
		}

		// Look for the newest message that plausibly contains a confirmation link
		for (const msg of messages) {
			const id = msg.id || msg.ID || msg.Id || msg.key || msg.Key
			if (!id) continue
			const subject: string = msg.subject || msg.Subject || ''
			if (subjectIncludes && !subject.toLowerCase().includes(subjectIncludes.toLowerCase())) {
				continue
			}

			try {
				const rawRes = await request.get(
					`${INBUCKET_BASE_URL}/api/v1/raw/${mailbox}/${encodeURIComponent(String(id))}`,
				)
				if (!rawRes.ok()) continue
				const body = await rawRes.text()
				const link = extractConfirmationLink(body)
				if (link) {
					return link
				}
			} catch {
				// Ignore and continue polling
			}
		}

		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
	}

	throw new Error(
		`Timed out after ${timeoutMs}ms waiting for confirmation email for ${email} in Inbucket`,
	)
}

function extractConfirmationLink(body: string): string | null {
	// Basic URL extraction; look for links that contain our auth confirm path
	const urlRegex = /https?:\/\/[^\s'"]+/g
	const matches = body.match(urlRegex) || []
	for (const candidate of matches) {
		if (candidate.includes('/auth/confirm')) {
			return candidate
		}
	}
	return null
}

