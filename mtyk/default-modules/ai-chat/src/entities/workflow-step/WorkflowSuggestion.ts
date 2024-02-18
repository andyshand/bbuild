import { globalDepContext } from 'modules/deps/index'
import Entity from 'modules/entities/Entity'
import EntityField from 'modules/entities/EntityField'
import EntityFunction from 'modules/entities/EntityFunction'
import { Deps } from '../../Deps'
import { Workflow } from './ChatWorkflowEntity'

export class WorkflowSuggestion extends Entity {
  @EntityField()
  workflow: string

  @EntityField()
  type: string

  @EntityField()
  data: any

  @EntityField()
  applied: boolean

  getWorkflow() {
    return this.manager.read(Workflow, this.workflow)
  }

  @EntityFunction()
  async apply() {
    const { getCompletion } = globalDepContext.provideSync({
      getCompletion: Deps.getCompletion,
    })

    // Each type of suggestion is applied in a different way

    this.applied = true
  }

  static generateSuggestionsForWorkflow({ workflow }: { workflow: Workflow }) {
    // Do the stuff
  }
}
