import { depFn } from 'modules/deps/index'
import Entity from 'modules/entities/Entity'
import EntityField from 'modules/entities/EntityField'
import EntityFunction from 'modules/entities/EntityFunction'
import { Deps } from '../../Deps'
import {
  ChatWorkflowStepInput,
  ChatWorkflowStepOutput,
  ChatWorkflowStepType,
  ChatWorkflowStepData,
} from './ChatWorkflowStepInput'

export class WorkflowStep extends Entity {
  @EntityField({ defaultValue: [] })
  inputs: ChatWorkflowStepInput[] = []

  @EntityField({ defaultValue: [] })
  outputs: ChatWorkflowStepOutput[] = []

  @EntityField({ defaultValue: 'code' })
  type: ChatWorkflowStepType = 'code'

  @EntityField({
    defaultValue: { type: 'code', language: 'typescript', code: '' },
  })
  data: ChatWorkflowStepData

  /**
   * Id of the workflow
   */
  @EntityField()
  workflow: string

  @EntityFunction()
  writeCode = depFn(
    {
      getCompletion: Deps.getCompletion,
    },
    async function ({ getCompletion }) {
      const prompt = `I need you to write typescript code to accomplish the following: ${this.data.description}



`
    },
  )
}
