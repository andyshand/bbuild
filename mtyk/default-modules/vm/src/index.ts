import { _removeAllMTYK, allowedPackages } from './AllowedPackage'

import { TreeFile, TreeDirectory } from './FileTree'
import { run } from './run'

export { run, allowedPackages, TreeFile, TreeDirectory, _removeAllMTYK }

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["vm"]) {
console.warn(`Duplicate module vm imported. This can lead to bugs.`);
}
globalStore["vm"] = true;
 
// --- END INJECTED CODE ---