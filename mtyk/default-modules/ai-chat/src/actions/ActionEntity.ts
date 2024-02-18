import { Entity, EntityField } from 'modules/entities'
import {
  ActionLogMessage,
  ISuggestedAction,
  InputSourceWithTransform,
} from './ISuggestedAction'

export class ActionEntity extends Entity {
  @EntityField()
  selectedActionType: string = ''

  @EntityField()
  parameters: {
    [key: string]: any
  } = {}

  @EntityField()
  inputs: InputSourceWithTransform[] = []

  @EntityField()
  suggestedActions: ISuggestedAction[] = []

  /**
   * User search string/query
   */
  @EntityField()
  actionQuery: string = ''

  @EntityField()
  state: 'idle' | 'loading' | 'error' | 'complete' = 'idle'

  @EntityField()
  logs: ActionLogMessage[] = []

  @EntityField()
  output: any = null

  async run() {
    // Set state to loading
    this.state = 'loading'

    try {
      // Run the action
      // Replace this with your actual action execution logic
      this.output = await new Promise((resolve) =>
        setTimeout(() => resolve('Action output'), 1000)
      )

      // Set state to complete
      this.state = 'complete'
    } catch (error) {
      // Log the error and set state to error
      this.logs.push({ type: 'error', message: error.message })
      this.state = 'error'
    }
  }

  async generateActionSuggestions() {
    // Send off all action types to GPT
    // Replace this with your actual GPT logic
    this.suggestedActions = await new Promise((resolve) =>
      setTimeout(
        () =>
          resolve([
            {
              action: 'exampleAction',
              parameterSuggestions: [
                {
                  exampleParameter: ['suggestedValue1', 'suggestedValue2'],
                },
              ],
            },
          ]),
        1000
      )
    )
  }

  async generateParameterSuggestions() {
    // Send off parameter schema to GPT
    // Replace this with your actual GPT logic
    this.parameters = await new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            exampleParameter: 'suggestedValue',
          }),
        1000
      )
    )
  }
}
