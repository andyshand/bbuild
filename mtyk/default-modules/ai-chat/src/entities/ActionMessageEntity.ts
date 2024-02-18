import {
  Entity,
  EntityField,
  EntityFunction,
  EntityRelation,
} from 'modules/entities'
export class ActionMessageEntity extends Entity {
  @EntityField()
  content: string = ''

  @EntityField()
  query: string = ''

  @EntityRelation('CommandEntity')
  @EntityField()
  command: string = ''

  @EntityField()
  status: 'idle' | 'loading' = 'idle'

  @EntityFunction()
  runAction(content = this.content) {
    console.log(
      'Running action with content:',
      content,
      'and command:',
      this.command
    )
    return `Running action with content: ${content} and command: ${this.command}`
  }

  @EntityFunction()
  undoAction(): void {
    console.log(
      'Undoing action with content:',
      this.content,
      'and command:',
      this.command
    )
  }
}

export type ActionMessageEntityParams = {
  content?: string
  id?: string
  command: string
  status?: string
}
