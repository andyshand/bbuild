import { depFn } from 'modules/deps'
import type { DepType, DepFn } from 'modules/deps'
import { GetProvidedDeps } from 'modules/deps/TokenDepSpec'
import type { PromisifyIfNotPromise } from 'modules/types'
import { profileAsync } from 'modules/profile'

export function action<
  T extends Record<string, DepType>,
  F extends (opts: GetProvidedDeps<T>) => Promise<any> | any,
>(
  deps: T,
  fn: F,
): (deps: Partial<GetProvidedDeps<T>>) => DepFn<PromisifyIfNotPromise<ReturnType<F>>> {
  const wrapped = depFn(
    deps,
    profileAsync(async (params) => {
      const result = await fn(params)
      return result
    }),
  ) as any
  return wrapped
}

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["action"]) {
console.warn(`Duplicate module action imported. This can lead to bugs.`);
}
globalStore["action"] = true;
 
// --- END INJECTED CODE ---