import { DepContext, globalDepContext } from './createDepContext'
import { DepMap, GetProvidedDeps } from './TokenDepSpec'

export const provideDeps = <Deps extends DepMap, R>(
  deps: Deps,
  extra: Partial<GetProvidedDeps<Deps>>,
  context: DepContext = globalDepContext
) => {
  const provided = context.provide(deps, extra)
  return provided as GetProvidedDeps<Deps>
}

export const provideDepsSync = <Deps extends DepMap, R>(
  deps: Deps,
  extra: Partial<GetProvidedDeps<Deps>>,
  context: DepContext = globalDepContext
) => {
  const provided = context.provideSync(deps, extra)
  return provided as GetProvidedDeps<Deps>
}
