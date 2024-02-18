import { lastValueFrom } from 'rxjs'
import resolveEngine from '../util/resolveEngine'
import { ChatCompletionMessage, CompletionSettings } from './ChatEngine'

export async function getChatCompletionStream(
  _messages: ChatCompletionMessage[] | string,
  modelSettings?: Partial<CompletionSettings>,
  config?: { tries?: number; responseTokens?: number }
) {
  const messages = Array.isArray(_messages)
    ? _messages
    : [{ role: 'user', content: _messages }]

  let tries = 0
  while (tries < (config?.tries ?? 6)) {
    try {
      const engine =
        typeof modelSettings?.model === 'string' || !modelSettings?.model
          ? resolveEngine(((modelSettings as any)?.model as string) ?? 'gpt-4')
          : modelSettings.model!
      return await engine.getChatCompletion(messages, modelSettings)
    } catch (e) {
      if (e.message.includes('context length')) {
        throw new Error('Context length too long')
      }
      console.error(e)
      tries++
    }
  }

  throw new Error('Used up all tries')
}

export default async function getChatCompletion(
  _messages: ChatCompletionMessage[] | string,
  modelSettings?: Partial<CompletionSettings>,
  config?: { tries?: number; responseTokens?: number }
) {
  const resp = await getChatCompletionStream(_messages, modelSettings, config)
  const messages = await lastValueFrom(resp.messages)
  const lastMsg = messages[messages.length - 1]
  return lastMsg.content
}

export function getSingleChatCompletion(
  message: string,
  settings?: Partial<CompletionSettings>
) {
  return getChatCompletionStream(
    [
      {
        role: 'user',
        content: message,
      },
    ],
    settings
  )
}

export async function getJSONCompletion(
  input,
  settings?: Partial<CompletionSettings>
) {
  const out = await getChatCompletion(input, {
    ...settings,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(out)
}

export function getJSONCompletionStream(
  input,
  settings?: Partial<CompletionSettings>
) {
  return getChatCompletionStream(input, {
    ...settings,
    response_format: { type: 'json_object' },
  })
}
