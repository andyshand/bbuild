export * from './component'

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["files-client"]) {
console.warn(`Duplicate module files-client imported. This can lead to bugs.`);
}
globalStore["files-client"] = true;
 
// --- END INJECTED CODE ---