export type PromptObj = {
  key?: string
  id: number
  type: 'gpt3'
  transformOut?: (str: string) => string
} & Record<string, any>
