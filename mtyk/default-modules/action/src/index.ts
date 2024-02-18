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
