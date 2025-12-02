import { getUserAndScope, type UserScope } from './getUserAndScope'

export class ForbiddenError extends Error {
	status: number

	constructor(message = 'God access required') {
		super(message)
		this.name = 'ForbiddenError'
		this.status = 403
	}
}

/**
 * Ensure the current user is a God admin.
 * Throws ForbiddenError when the role is not "god".
 */
export async function requireGod(): Promise<UserScope> {
	const scope = await getUserAndScope()
	if (scope.role !== 'god') {
		throw new ForbiddenError()
	}
	return scope
}
