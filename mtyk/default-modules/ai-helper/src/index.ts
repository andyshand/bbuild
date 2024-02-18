import { Entity } from 'modules/entities'
import { FieldSpec } from 'modules/fields'
export { addContext, getContext } from './ContextManager'

export class AIHelperChat extends Entity {
  summary: string = ''
  messages: {
    role: 'user' | 'system' | 'assistant'
    content: string
  }[] = []

  async sendUserMessage(message: string) {
    this.messages.push({
      role: 'user',
      content: message,
    })
    // const completion = await getChatCompletion(this.messages);
    // this.messages.push({
    //   role: 'assistant',
    //   content: completion,
    // });
  }
}

export type ContextResult<R = any> = {
  name: string
  id: string
  getContext: (fieldData: any) => Promise<R>
  fields: FieldSpec[]
}
