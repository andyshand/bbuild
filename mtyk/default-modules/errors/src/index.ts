export class NotFoundError extends Error {
	constructor(message?: string) {
		super(message)
		this.name = "NotFoundError"
	}
}

export class ValidationError extends Error {
	constructor(message?: string) {
		super(message)
		this.name = "ValidationError"
	}
}

export class ConflictError extends Error {
	constructor(message?: string) {
		super(message)
		this.name = "ConflictError"
	}
}

export class BadRequestError extends Error {
	constructor(message?: string) {
		super(message)
		this.name = "BadRequestError"
	}
}

export class InternalServerError extends Error {
	constructor(message?: string) {
		super(message)
		this.name = "InternalServerError"
	}
}

export function assert(condition: boolean, message?: string): condition is true {
	if (!condition) {
		throw new Error(message ?? "Assertion failed")
	}
	return condition
}

export function assertIsDefined<T>(value: T | undefined, message?: string): value is T {
	return assert(typeof value !== undefined, message ?? "Value is undefined")
}

export class ApiError extends Error {
	status?: number
}

export function isApiError<E extends Error>(error: E) {
	return error instanceof ApiError
}

type Assert = (condition: unknown, message?: string, status?: number) => asserts condition

/** Use this if you want your assertion to be publically viewable in user-facing code */
export const apiAssert: Assert = (condition: boolean, message?: string, status?: number): asserts condition => {
	if (!condition) {
		const err = new ApiError(message ?? "Assertion failed")
		err.status = status
		throw err
	}
}

export const publicInvariant: Assert = apiAssert
export const invariant: Assert = assert
