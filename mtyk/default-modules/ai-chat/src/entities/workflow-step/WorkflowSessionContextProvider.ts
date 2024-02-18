import { ContextProvider } from 'modules/context/ContextProvider'
import { Workflow } from './ChatWorkflowEntity'
import { WorkflowSession } from './WorkflowSession'

export class WorkflowSessionContextProvider extends ContextProvider<WorkflowSession> {
  matcher = (item: any) => item instanceof Workflow
  resolver = {}
}
