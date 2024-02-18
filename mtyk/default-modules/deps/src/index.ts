import { DepType, GetProvidedDeps } from './TokenDepSpec'
import { profileAsync } from 'modules/profile'
import { createDepContext, globalDepContext } from './createDepContext'
import { actorIDep, interfaceDep, machineDep } from './interfaceDep'
import { PackageType, packageDep } from './packageDep'
import { provideDeps, provideDepsSync } from './provideDeps'
import { keyDep } from './tokenDep'
import { typeDep } from './typeDep'
import { zodDep } from './zodDep'
import { PromisifyIfNotPromise } from 'modules/types'

export type DepFn<T = any> = T & { __depFn: true }

const getFnName = (fn) => {
  return fn.name || fn.toString().match(/function\s*([^(]*)\(/)?.[1] || 'unknown'
}

export function depFn<
  T extends Record<string, DepType>,
  F extends (opts: GetProvidedDeps<T>) => Promise<any> | any,
>(
  deps: T,
  fn: F,
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

export {
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
  typeDep as typeArg,
  typeDep,
  zodDep,
  DepType,
}
