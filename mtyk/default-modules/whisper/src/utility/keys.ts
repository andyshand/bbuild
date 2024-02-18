// Only for objects known at compile time
export const keys = Object.keys as <T>(o: T) => Extract<keyof T, string>[];