export default null

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["rpc-ws"]) {
console.warn(`Duplicate module rpc-ws imported. This can lead to bugs.`);
}
globalStore["rpc-ws"] = true;
 
// --- END INJECTED CODE ---