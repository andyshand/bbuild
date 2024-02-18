import { ContextProvider } from 'modules/context'
import { UniverseContextItemBase } from 'modules/context/UniverseEntityContextItem'
import { Workflow } from './ChatWorkflowEntity'

export interface WorkflowNodeContextItem extends UniverseContextItemBase {
  url: string
  id: string
  type: string
  label: string
}

export class WorkflowContextProvider extends ContextProvider<Workflow> {
  resolver = {}
  provideImpl = async (item, filter) => {
    return []
    // const nodeToContextItem = (node: WorkflowNode): WorkflowNodeContextItem => {
    //   const { inputs, outputs } = node.data as WorkflowNodeInputOutputData
    //   return {
    //     url: `workflow#${item.id}#/node#${node.id}`,
    //     id: node.id,
    //     type: 'workflow-node',
    //     label: `Node ${node.id}`,
    //   }
    // }

    // if (!filter) {
    //   // return all nodes
    //   return item.nodes.map(nodeToContextItem)
    // }

    // // TODO actually filter somehow, currently nodes have no name
    // return item.nodes.map(nodeToContextItem)
  }

  matcher = (item: any) => item instanceof Workflow
}
