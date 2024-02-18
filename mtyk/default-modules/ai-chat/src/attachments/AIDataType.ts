export type AIFile = {
  type: 'file',
  data: {
    path: string,
    content?: string
  }
}

export type AIFileGroup = {
  type: 'file-group',
  data: AIFile[]
}

export type AIChatMessage = {
  type: 'chat-message',
  data: {
    role: 'user' | 'assistant' | 'system'
    content: string,
  }
}

export type AIDataObject = AIFile | AIFileGroup | AIChatMessage

export function createAIFile({ path, content }: { path: string; content?: string }): AIFile {
  return {
    type: 'file',
    data: {
      path,
      content
    }
  }
}

export function createAIFileGroup(files: AIFile[]): AIFileGroup {
  return {
    type: 'file-group',
    data: files
  }
}

export function createAIChatMessage({ role, content }: { role: 'user' | 'assistant'; content: string }): AIChatMessage {
  return {
    type: 'chat-message',
    data: {
      role,
      content
    }
  }
}
