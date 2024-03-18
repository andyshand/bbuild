import { mapValues } from 'modules/dash'
import { profileAsync } from 'modules/profile'
import { PromisifyIfNotPromise } from 'modules/types'
import { DepType, GetProvidedDeps, TokenDepSpec } from './TokenDepSpec'
import { isDep } from './baseDep'
import { createDepContext, globalDepContext } from './createDepContext'
import { actorIDep, interfaceDep, machineDep } from './interfaceDep'
import { PackageType, packageDep } from './packageDep'
import { serverOnly } from './private'
import { provideDeps, provideDepsSync } from './provideDeps'
import { keyDep } from './tokenDep'
import { typeDep } from './typeDep'
import { zodDep } from './zodDep'

export type DepFn<T = any> = T & { __depFn: true }

const getFnName = (fn) => {
  return fn.name || fn.toString().match(/function\s*([^(]*)\(/)?.[1] || 'unknown'
}

export function depFn<
  T extends Record<string, DepType>,
  F extends (opts: GetProvidedDeps<T>) => Promise<any> | any
>(
  deps: T,
  fn: F
): (deps: Partial<GetProvidedDeps<T>>) => DepFn<PromisifyIfNotPromise<ReturnType<F>>> {
  const fnn = async function (input: Partial<GetProvidedDeps<T>>) {
    try {
      const wrapped = profileAsync(fn)
      const provided = await provideDeps(deps, input, globalDepContext)
      const result = await wrapped.call(this, provided)
      return result
    } catch (e) {
      console.log(`Error in depFn for ${fn.name}`, e)
      throw e
    }
  }

  fnn.deps = deps
  fnn.isDepFn = true
  fnn._name = getFnName(fn)
  // fnn.name = fn.name
  return fnn as any
}

export function getAsyncContext() {
  return null as any
}

export function depMap<T extends Record<string, DepType>>(map: T) {
  const configure = (
    providers: {
      [K in keyof T]: T[K] extends TokenDepSpec<any, infer V, any>
        ? V | { provide: () => Promise<V> | (() => V) }
        : never
    },
    ctx = globalDepContext
  ) => {
    const toProvide = mapValues(providers, (p, key) => {
      if (isDep(p)) {
        return p
      }
      return { provide: p, token: key }
    })
    for (const key in toProvide) {
      ctx.add(toProvide[key])
    }
  }

  return new Proxy(
    { ...map, configure },
    {
      get: function (target, prop: string, receiver) {
        if (prop === 'configure') {
          return configure
        }
        if (typeof target[prop] === 'object' && target[prop] !== null) {
          return new Proxy(target[prop], {
            get: function (innerTarget, innerProp, innerReceiver) {
              if (innerProp === 'get') {
                return async function () {
                  return (
                    await provideDeps(
                      {
                        [prop]: innerTarget,
                      },
                      {},
                      globalDepContext
                    )
                  )[prop]
                }
              }
              if (innerProp === 'getSync') {
                return function () {
                  return provideDepsSync(
                    {
                      [prop]: innerTarget,
                    },
                    {},
                    globalDepContext
                  )[prop]
                }
              }
              return Reflect.get(innerTarget, innerProp, innerReceiver)
            },
          })
        }
        return Reflect.get(target, prop, receiver)
      },
    }
  ) as {
    // all keys of T, but with get and getSync methods added to each key
    [K in keyof T]: T[K] & {
      get: () => Promise<GetProvidedDeps<T>[K]>
      getSync: () => GetProvidedDeps<T>[K]
    }
  } & {
    configure: typeof configure
  }
}

export {
  DepType,
  PackageType,
  actorIDep,
  createDepContext,
  globalDepContext,
  interfaceDep,
  keyDep as keyArg,
  keyDep,
  machineDep,
  packageDep,
  provideDeps,
  provideDepsSync,
  serverOnly,
  typeDep as typeArg,
  typeDep,
  zodDep,
}

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["deps"]) {
console.warn(`Duplicate module deps imported. This can lead to bugs.`);
}
globalStore["deps"] = true;
 
// --- END INJECTED CODE ---