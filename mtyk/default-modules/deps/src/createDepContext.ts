import { invariant } from 'modules/errors'
import { prettifyZodError } from 'modules/schema'
import { DepProvider, DepType, GetProvidedDeps } from './TokenDepSpec'

export type ProviderMiddleware = (
  dep: DepType,
  isSync: boolean
) => any | Promise<any> | undefined

export const createDepContext = (
  middlewares?: ProviderMiddleware[],
  middlewaresSync?: ProviderMiddleware[]
) => {
  let providers: DepProvider<any>[] = []
  const providerMiddlewares = middlewares || []
  const providerMiddlewaresSync = middlewaresSync || []

  const getDeps = <T extends Record<string, DepType>>(
    deps: T,
    extra: Partial<GetProvidedDeps<T>> = {},
    isSync: boolean
  ): GetProvidedDeps<T> | Promise<GetProvidedDeps<T>> => {
    const output: any = {}

    const getDepFromMiddlewares = async (dep: DepType) => {
      const middlewaresToUse = isSync ? providerMiddlewaresSync : providerMiddlewares
      for (const middleware of middlewaresToUse) {
        const result = await middleware(dep, isSync)
        if (result !== undefined) {
          return result
        }
      }
      return undefined
    }

    const getDepFromStore = (key: string, dep: DepType) => {
      if (dep.specType !== 'token') {
        return undefined
      }

      const tokenMatch = providers.find((p) => p.token === dep.token)
      const keyMatch = providers.find((p) => p.token === key)
      const match = tokenMatch ?? keyMatch

      if (!match) {
        if (!dep.optional) {
          throw new Error(
            `No provider found for token: ${dep.token} key: ${key} (type: ${dep.specType})`
          )
        }
      } else {
        if (match.provide && typeof match.provide !== 'function') {
          return match.provide
        }
        return match.provide?.() ?? match.value
      }
    }

    const canAddFromExtra = (dep: DepType, key: string) => {
      if (dep.private) {
        return false
      }
      if (key in extra) {
        return true
      }

      return false
    }

    const processDeps = async () => {
      for (const key in deps) {
        const dep = deps[key]

        if (canAddFromExtra(dep, key)) {
          output[key] = extra[key]
        } else {
          const middlewareResult = await getDepFromMiddlewares(dep)
          if (middlewareResult !== undefined) {
            output[key] = isSync ? middlewareResult : await middlewareResult
          } else {
            output[key] = await getDepFromStore(key, dep)
          }
        }

        if (dep.specType === 'token' && 'runtimeType' in dep) {
          // verify type
          if (dep.runtimeType === 'zod') {
            // Validate value against the Zod schema if specified
            const { schema } = dep as any as DepType & { schema: any }
            let result: {
              success: boolean
              data?: any
              error?: any
            }
            try {
              result = schema.safeParse(output[key])
            } catch (e) {
              result = { success: false, error: e, data: undefined }
            }

            invariant(
              result.success || (dep.optional && typeof output[key] === 'undefined'),
              `Validation failed for key: ${key}: ${
                result.error ? prettifyZodError(result.error, output[key]) : 'Unknown error'
              }`
            )
            if (result.success) {
              output[key] = result.data
            } else {
              output[key] = undefined
            }
          } else {
            invariant(
              !!(
                typeof output[key] === dep.runtimeType ||
                (typeof output[key] === 'undefined' && dep.optional)
              ),
              `Type mismatch for dep ${key}: expected ${
                dep.runtimeType
              } but got ${typeof output[key]}`
            )
          }
        }
      }
    }

    const processSyncDeps = () => {
      for (const key in deps) {
        const dep = deps[key]
        if (canAddFromExtra(dep, key)) {
          output[key] = extra[key]
          continue
        }

        output[key] = getDepFromStore(key, dep)
      }
    }

    if (isSync) {
      processSyncDeps()
      return output
    } else {
      return processDeps().then(() => output)
    }
  }

  const api = {
    providers,
    provideDeps: async <T extends Record<string, DepType>>(
      deps: T,
      extra: Partial<GetProvidedDeps<T>> = {}
    ): Promise<GetProvidedDeps<T>> => {
      return getDeps(deps, extra, false) as Promise<GetProvidedDeps<T>>
    },
    provideDepsSync: <T extends Record<string, DepType>>(
      deps: T,
      extra: Partial<GetProvidedDeps<T>> = {}
    ): GetProvidedDeps<T> => {
      return getDeps(deps, extra, true) as GetProvidedDeps<T>
    },
    add: <T>(provider: DepProvider<T>) => {
      providers.push(provider)
    },
    add2: (dep: DepType, provider: any) => {
      if (dep.specType === 'token') {
        providers.push({ token: dep.token, value: provider })
      } else {
        throw new Error('Unsupported dep spec type: ' + dep.specType)
      }
    },
    addMiddleware: (middleware: ProviderMiddleware, isSync: boolean) => {
      if (isSync) {
        providerMiddlewaresSync.push(middleware)
      } else {
        providerMiddlewares.push(middleware)
      }
    },
  }

  return { ...api, provide: api.provideDeps, provideSync: api.provideDepsSync }
}

// export function createDepContext2<D extends Record<string, DepType>>(
//   providers: D,
//   middlewares?: ProviderMiddleware[],
//   middlewaresSync?: ProviderMiddleware[]
// ): DepContext2<D> {
//   const ctx = createDepContext(middlewares, middlewaresSync)
//   ctx.providers = Object.entries(providers).map(([token, value]) => ({ token, value }))
//   return {
//     ...ctx,
//     resolve: async <K extends keyof D>(key: K) => {
//       const provider = ctx.providers.find((p) => p.token === key)
//       if (!provider) {
//         throw new Error(`Provider for key "${String(key)}" not found`)
//       }
//       return ctx.provideDeps({ [key]: provider.value }) as Promise<D[K]>
//     },
//     resolveSync: <K extends keyof D>(key: K) => {
//       const provider = ctx.providers.find((p) => p.token === key)
//       if (!provider) {
//         throw new Error(`Provider for key "${String(key)}" not found`)
//       }
//       return ctx.provideDepsSync({ [key]: provider.value }) as D[K]
//     },
//   }
// }

export type DepContext = {
  /**
   * @deprecated
   */
  provideDeps: ReturnType<typeof createDepContext>['provideDeps']

  /**
   * @deprecated
   */
  provideDepsSync: ReturnType<typeof createDepContext>['provideDepsSync']

  provide: ReturnType<typeof createDepContext>['provideDeps']
  provideSync: ReturnType<typeof createDepContext>['provideDepsSync']
  add: <T>(provider: DepProvider<T>) => void
  add2: (dep: DepType, provider: any) => void
  addMiddleware: (middleware: ProviderMiddleware, isSync: boolean) => void
}

// export type DepContext2<D extends Record<string, DepType>> = DepContext & {
//   resolve: <K extends keyof D>(key: K) => Promise<D[K]>
//   resolveSync: <K extends keyof D>(key: K) => D[K]
// }

const globalObject = typeof global !== 'undefined' ? global : window
if (typeof globalObject !== 'undefined') {
  // Check  global context hasn't already been created, if so, warn
  if (globalObject.__depContext) {
    console.warn(
      'Global dep context already exists, have you imported two different versions of deps?'
    )
  } else {
    globalObject.__depContext = createDepContext()
  }
}

export const globalDepContext: DepContext = globalObject.__depContext as DepContext
