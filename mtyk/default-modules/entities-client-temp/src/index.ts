/**
 * Temporary file, hardcoded for ai-chat stuff rn
 */
import {
  Entities,
  ChatEntity,
  Workflow,
  WorkflowSession,
} from 'modules/ai-chat'

import { globalHooksDep } from 'modules/ai-chat/ui/config/deps'
import { setGlobalHooks } from 'modules/ai-chat/ui/hooks/globalHooks'
import { globalDepContext } from 'modules/deps'
import { createEntitiesClient } from 'modules/entities-client'
import RPCClient from 'modules/rpc-ws/client'
import { useQuery } from 'react-query'
import { lastValueFrom } from 'rxjs'

const client = createEntitiesClient([], Entities as any)

globalDepContext.add2(globalHooksDep, client)
setGlobalHooks(client)
export default client

const {
  createEntity,
  useEntities,
  useEntity,
  deleteEntity,
  useEntityRelation,
  query,
  _getManagers,
} = client

export {
  _getManagers,
  createEntity,
  deleteEntity,
  query,
  useEntities,
  useEntity,
  useEntityRelation,
}

export function useWSQuery(method: string, args: any, deps = []) {
  const rpcManager = RPCClient.getSingleton()
  return useQuery([JSON.stringify({ method, args, deps })], () =>
    lastValueFrom(rpcManager.callFunction(method, args))
  )
}

export function useWSAction(method: string) {
  const rpcManager = RPCClient.getSingleton()
  return [
    (args: any) => lastValueFrom(rpcManager.callFunction(method, args)),
  ] as const
}

export { ChatEntity, Workflow, WorkflowSession }
