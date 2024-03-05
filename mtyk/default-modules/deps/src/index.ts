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
  return (
    fn.name || fn.toString().match(/function\s*([^(]*)\(/)?.[1] || 'unknown'
  )
}

export function depFn<
  T extends Record<string, DepType>,
  F extends (opts: GetProvidedDeps<T>) => Promise<any> | any,
>(
  deps: T,
  fn: F
): (
  deps: Partial<GetProvidedDeps<T>>
) => DepFn<PromisifyIfNotPromise<ReturnType<F>>> {
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
  return {
    ...(map as any as T),
    configure: (
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
    },
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
