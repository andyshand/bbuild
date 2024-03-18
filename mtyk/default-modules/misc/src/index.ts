import { nanoid } from 'nanoid'

export function uniqueId() {
  return nanoid()
}

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["misc"]) {
console.warn(`Duplicate module misc imported. This can lead to bugs.`);
}
globalStore["misc"] = true;
 
// --- END INJECTED CODE ---