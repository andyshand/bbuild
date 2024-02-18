import { Entity, Serialisable } from 'modules/entities'
// import { EntityAccess } from 'modules/entities/Entity'

/**
 * Task is designed to allow for
 * - System-wide monitoring of tasks. Like Activity Monitor on macOS, but specifically for program, and limited
 *   to the context of the current project (although can be global).
 * 
 * When spawning any kind of task in your application, you should be sure to associated it with a Task entity
 * so that it may be monitored and controlled by the user at any point.
 * 
 * Some example use cases:
 *  - Long running LLM completions that occur in the background 
 */
export class Task extends Entity {
  readonly command: string
  readonly args: string[]
  readonly cwd: string
  readonly env: { [key: string]: string }

  @Serialisable({
    onSave: value => value.toUpperCase(),
    onLoad: value => value.toLowerCase(),
  })
  readonly name: string

  // readonly state = createStateMachine(
  //   {
  //     Running: async (args, { state }) => {
  //       return [
  //         spawnObservableTask({
  //           cmd: state.command,
  //           args: state.args,
  //           cwd: state.cwd,
  //           env: state.env,
  //           name: state.name,
  //         }),
  //         undefined,
  //       ]
  //     },
  //   },
  //   {
  //     globalState: this,
  //   }
  // )

  // accessor = new EntityAccess<Task>({
  //   canAccess: field => {
  //     return true
  //   },
  // })
}
