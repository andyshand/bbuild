import * as _Entities from './entities'
export * from './entities'

export const Entities = Object.values(_Entities)

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["ai-chat"]) {
console.warn(`Duplicate module ai-chat imported. This can lead to bugs.`);
}
globalStore["ai-chat"] = true;
 
// --- END INJECTED CODE ---