import { ContextFormatter } from './ContextFormatter'
import {
  ContextProvider,
  ContextResolverMap,
  ContextResolver,
} from './ContextProvider'
import parseContext from './parseContext'
import { UniverseContextItem } from './UniverseEntityContextItem'

export {
  ContextFormatter,
  ContextProvider,
  ContextResolverMap,
  ContextResolver,
  parseContext,
  UniverseContextItem,
}

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["context"]) {
console.warn(`Duplicate module context imported. This can lead to bugs.`);
}
globalStore["context"] = true;
 
// --- END INJECTED CODE ---