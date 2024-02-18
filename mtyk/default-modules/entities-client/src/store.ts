import { observable } from '@legendapp/state'
type HookId = string
const entityDataObservable = observable(
  {} as Record<
    HookId,
    { entity: any; id: string; type: string; entityObj: any }[]
  >
)
export const globalEntityDataObservable = observable(
  {} as Record<
    string,
    { entity: any; id: string; type: string; entityObj: any }
  >
)

export default entityDataObservable
