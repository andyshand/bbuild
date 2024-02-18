import { createEntitiesClient } from 'modules/entities-client'

let globalHooks: any | null = null

export function setGlobalHooks(hooks: ReturnType<typeof createEntitiesClient>) {
  globalHooks = hooks
}

export default new Proxy(
  {},
  {
    get: function (target, prop, receiver) {
      if (globalHooks) {
        return globalHooks[prop as string]
      } else {
        throw new Error('global hooks not set')
      }
    },
  }
) as any
