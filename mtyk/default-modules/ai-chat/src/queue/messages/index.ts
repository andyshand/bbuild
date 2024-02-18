export type QueueMessage = {
  type: string
  content: any
}

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type ChatMessageQueueMessage = {
  type: 'chat-message'
  content: {
    chatId: string
    messages: ChatMessage[]
    model: string
    parameters: any
  }
}
