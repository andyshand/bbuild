import { observable } from '@legendapp/state'
import { omit } from 'remeda'

export type IUserFlow = {
  id: string
  type: string
  data: any
  entities: IActedEntity[]

  /**
   * Where did this user flow originate from?
   */
  source?: {
    id: string
    type: string
  }

  /**
   * Where is this displayed on screen
   */
  ui?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export type IActedEntity = {
  id: string
  type: string
}

export const userFlows$ = observable(
  {} as Record<
    string, // string is user flow id
    IUserFlow
  >
)

export function createUserFlow(userFlow: IUserFlow) {
  userFlows$.assign({ [userFlow.id]: userFlow })
}

export function addEntityToUserFlow(userFlowId: string, entity: IActedEntity) {
  const userFlow = userFlows$[userFlowId]
  if (userFlow) {
    userFlow.assign({ entities: [...userFlow.entities.peek(), entity] })
  }
}

export function removeEntityFromUserFlow(userFlowId: string, entityId: string) {
  const userFlow = userFlows$[userFlowId]
  if (userFlow) {
    userFlow.assign({
      entities: userFlow.entities.filter(
        (entity) => entity.id.peek() !== entityId
      ) as any,
    })
  }
}

export function removeUserFlow(userFlowId: string) {
  userFlows$.set({ ...omit(userFlows$.peek(), [userFlowId]) })
}

export function getEntitiesInUserFlow(userFlowId: string) {
  const userFlow = userFlows$[userFlowId]?.peek()
  return userFlow ? userFlow.entities : []
}

export function getUserFlowsWithEntity(entityId: string) {
  const userFlowsWithEntity: any[] = []
  for (let id in userFlows$) {
    if (
      userFlows$[id].entities.some((entity) => entity.id.peek() === entityId)
    ) {
      userFlowsWithEntity.push(userFlows$[id])
    }
  }
  return userFlowsWithEntity
}
