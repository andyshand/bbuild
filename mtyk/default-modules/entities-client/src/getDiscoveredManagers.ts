import { RPCEntityManager } from 'modules/entities/RPCEntityManager'
import { pubSub } from 'modules/rpc-ws/central/client'
import { Observable } from 'rxjs'
import { cacheMap } from './cacheMap'

let discoveredManagers: RPCEntityManager[] = []
let managersPromiseResolve: ((value: RPCEntityManager[]) => void) | null = null
let isPromiseResolved = false // Add this flag

const managersPromise = new Promise<RPCEntityManager[]>((resolve) => {
  managersPromiseResolve = resolve
})

const managers$ = pubSub.subscribe('entityManagersChannel').pipe(
  cacheMap((name) => {
    return new RPCEntityManager([], name)
  })
) as Observable<RPCEntityManager[]>

managers$.subscribe((managers) => {
  discoveredManagers = managers
  if (managersPromiseResolve && !isPromiseResolved) {
    // Check if the promise has been resolved
    managersPromiseResolve(discoveredManagers)
    managersPromiseResolve = null
    isPromiseResolved = true // Set the flag to true when the promise is resolved
  }
})

export function getDiscoveredManagers(): Promise<RPCEntityManager[]> {
  if (discoveredManagers.length > 0 || isPromiseResolved) {
    return Promise.resolve(discoveredManagers)
  } else {
    return managersPromise
  }
}
