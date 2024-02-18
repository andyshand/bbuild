import { useMemo } from 'react'
import { globalDepContext, keyDep } from 'modules/deps'

function useEntitiesHooks() {
  return useMemo(
    () =>
      globalDepContext.provideSync({
        globalHooks: keyDep('globalHooks'),
      }).globalHooks,
    [],
  )
}

export default useEntitiesHooks
