import { globalDepContext, keyDep } from 'modules/deps'
import {
  AnthropicChatEngine,
  GPTChatEngine,
  getChatCompletion,
  getChatCompletionStream,
} from 'modules/llm'
import {
  getJSONCompletion,
  getJSONCompletionStream,
} from 'modules/llm/engines/getChatCompletion'

export const Deps = {
  /**
   * @deprecated
   */
  getChatCompletion: keyDep<typeof getChatCompletion>('getChatCompletion'),
  getCompletion: keyDep<typeof getChatCompletion>('getCompletion'),
  getJSONCompletion: keyDep<typeof getJSONCompletion>('getJSONCompletion'),
  getJSONCompletionStream: keyDep<typeof getJSONCompletionStream>(
    'getJSONCompletionStream'
  ),
  getChatCompletionStream: keyDep<typeof getChatCompletionStream>(
    'getChatCompletionStream'
  ),
  gptChatEngine: keyDep<GPTChatEngine>('gptChatEngine'),
  anthropicChatEngine: keyDep<AnthropicChatEngine>('anthropicChatEngine'),
  tokenCounter: keyDep<any>('openai-gpt-token-counter'),
  fs: keyDep<typeof import('fs')>('fs'),
  path: keyDep<typeof import('path')>('path'),
  entityManagerDep:
    keyDep<import('modules/entities/IEntityManager').IEntityManager>(
      'entityManager'
    ),
  glob: keyDep<typeof import('glob')>('glob'),
}

export function resolveEngine(engine: string) {
  if (engine.startsWith('claude')) {
    return globalDepContext.provideDepsSync({
      anthropicChatEngine: Deps.anthropicChatEngine,
    }).anthropicChatEngine
  } else {
    return globalDepContext.provideDepsSync({
      gptChatEngine: Deps.gptChatEngine,
    }).gptChatEngine
  }
}
