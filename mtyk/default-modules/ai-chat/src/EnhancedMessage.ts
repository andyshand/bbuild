import { Action } from './actions/Action'
import { UserWindow } from './entities/new-entities/UserSession'

export type MessageCodeBlock = {
  content: string
  language?: string
  summary?: string
  index: number
  fileName?: string
}

export type EnhancedMessage = {
  /**
   * Only optional for backwards compatibility
   */
  id?: string
  role: 'assistant' | 'user' | 'system'

  commands?: {
    command: string
    args: any[]
    result?: any
  }[]

  engine?: string
  content: string
  error?: {
    message: string
    stack?: string
  }
  tries?: number

  /**
   * Optional again for backwards compatibility
   */
  createdAt?: Date

  /**
   * Lexical node tree representing input, if any
   */
  json?: any
  favourited?: boolean
  actions?: Action[]
  entities?: { name: string; url: string }[]
  codeBlocks?: MessageCodeBlock[]
  threads: string[]

  windows?: UserWindow[]
}
