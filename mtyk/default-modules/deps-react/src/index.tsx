import { provideDepsSync } from 'modules/deps'
import React, { useContext } from 'react'

export const DepContext = React.createContext(null)

export function useDeps(specMap: any, extra?: any) {
  const ctx = useContext(DepContext)
  return provideDepsSync(specMap, extra, ctx ?? undefined)
}

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["deps-react"]) {
console.warn(`Duplicate module deps-react imported. This can lead to bugs.`);
}
globalStore["deps-react"] = true;
 
// --- END INJECTED CODE ---