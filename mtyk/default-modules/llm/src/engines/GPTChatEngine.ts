import tokenizer from 'gpt-tokenizer'
import { Model, getModelTokens } from 'modules/open-ai'
import { OpenAIStream } from 'modules/open-ai'
import { Observable } from 'rxjs'
import { ChatEngine } from './ChatEngine'

export class GPTChatEngine
  implements
    ChatEngine<'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-0314' | 'gpt-3.5-turbo-16k'>
{
  countTokens(text: string): number {
    return tokenizer.encode(text).length
  }

  countChatTokens(
    chat: { role: 'user' | 'system' | 'assistant'; content: string }[],
    model = 'gpt-4'
  ): number {
    // Remove the version/16k suffix
    let modelForTokenizer: any = model.includes('gpt-4')
      ? 'gpt-4'
      : model.includes('gpt-3.5-turbo')
      ? 'gpt-3.5-turbo'
      : model
    return tokenizer.encodeChat(chat, modelForTokenizer).length
  }

  getMaxContentLength(model: string): number {
    return getModelTokens(model as Model)
  }

  async getCompletionCost(messages, settings) {
    return {
      likelyCost: 0, // TODO
      maxPossibleCost: 0, // TODO
    }
  }

  async getChatCompletion(_messages, settings) {
    const messages = Array.isArray(_messages)
      ? _messages
      : [{ role: 'user', content: _messages }]

    const { stream, cancel } = await OpenAIStream(messages, settings)

    let content = ''
    const messagesObservable = new Observable<
      { role: 'user' | 'system' | 'assistant'; content: string }[]
    >((subscriber) => {
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      reader
        .read()
        .then(function process({ done, value }) {
          if (done) {
            subscriber.complete()
            return
          }

          content += decoder.decode(value)
          subscriber.next([{ role: 'assistant', content }])
          reader
            .read()
            .then(process)
            .catch((error) => {
              subscriber.error(error)
            })
        })
        .catch((error) => {
          subscriber.error(error)
        })

      return () => {
        // cancel();
      }
    })

    return {
      messages: messagesObservable,
      cancel,
    }
  }
}

const gptChatEngine = new GPTChatEngine()
export default gptChatEngine
