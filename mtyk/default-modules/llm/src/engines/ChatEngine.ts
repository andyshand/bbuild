import { Observable } from 'rxjs'

export type CompletionSettings<Models extends string = string> = {
  temperature?: number
  max_tokens?: number
  top_p?: number
  response_format?: { type: 'json_object' }
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
  model: string | ChatEngine
}
export type ChatCompletionMessage = { role: string; content: string }

export interface ChatEngine<Models extends string = string> {
  getCompletionCost(
    completionCost: number,
    messages: ChatCompletionMessage[],
    settings: Pick<CompletionSettings<Models>, 'model' | 'max_tokens'>
  ): Promise<{
    likelyCost: number
    maxPossibleCost: number
  }>

  getChatCompletion(
    _messages: ChatCompletionMessage[],
    settings?: Partial<CompletionSettings<Models>>
  ): Promise<{
    messages: Observable<
      { role: 'user' | 'system' | 'assistant'; content: string }[]
    >
    cancel: () => void
  }>

  countChatTokens(
    chat: { role: 'user' | 'system' | 'assistant'; content: string }[],
    model: Models
  ): number
  countTokens(text: string): number

  getMaxContentLength(model: Models): number
}
