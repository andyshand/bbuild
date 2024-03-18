export * from './prettifyZodError'

export { default as zodSchemaToTypeString } from './zodSchemaToTypeString'
export { serialiseZodSchema, deserialiseZodSchema } from './serialise'

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["schema"]) {
console.warn(`Duplicate module schema imported. This can lead to bugs.`);
}
globalStore["schema"] = true;
 
// --- END INJECTED CODE ---