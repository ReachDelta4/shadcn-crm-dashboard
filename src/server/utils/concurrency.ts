export class StaleStateError extends Error {
	constructor(message: string = 'Stale state detected') {
		super(message)
		this.name = 'StaleStateError'
	}
}

export function ensureFreshState(
	currentUpdatedAt: string | Date | null,
	expectedUpdatedAt: string | Date | null
): void {
	if (!currentUpdatedAt || !expectedUpdatedAt) {
		// If either is missing, skip check (backward compatibility)
		return
	}

	const current = new Date(currentUpdatedAt).getTime()
	const expected = new Date(expectedUpdatedAt).getTime()

	if (current !== expected) {
		throw new StaleStateError('Resource has been modified by another request')
	}
}
