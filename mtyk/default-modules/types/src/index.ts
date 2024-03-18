export type PromisifyIfNotPromise<T> = T extends Promise<any> ? T : Promise<T>
export type Constructor<T> = new (...args: any[]) => T

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["types"]) {
console.warn(`Duplicate module types imported. This can lead to bugs.`);
}
globalStore["types"] = true;
 
// --- END INJECTED CODE ---