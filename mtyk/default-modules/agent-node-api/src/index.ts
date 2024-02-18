import { publicInvariant } from 'modules/errors'
const globalObj = typeof window === 'undefined' ? global : window
import { getDiscoveredManagers } from 'modules/entities-client/getDiscoveredManagers'

const { workflowId } = globalObj.AGENT_WORKFLOW_API as {
  workflowId: string
}
publicInvariant(!!workflowId, 'workflowId not set')

export const Node = {
  latestValue: (nodeId: string) => {
    throw new Error('Not implemented')
  },
  run: async (id: string, input) => {
    const [manager] = await getDiscoveredManagers()

    await manager.executeRemote('ChatWorkflowEntity', workflowId, 'run', [
      {
        nodes: [
          {
            id,
            input,
          },
        ],
      },
    ])
  },
}
