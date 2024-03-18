import tokenizer from 'gpt-tokenizer'

type Message = {
  role: 'user' | 'system' | 'assistant'
  content: string
}

import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser'
const OPENAI_API_HOST = 'https://api.openai.com'

if (typeof fetch === 'undefined') {
  throw new Error(
    'OpenAI requires fetch to be available, are you using node 18+?'
  )
}

export enum Model {
  GPT4 = 'gpt-4',
  GPT4TurboPreview = 'gpt-4-1106-preview',
  GPT3TurboPreview = 'gpt-3.5-turbo-1106',
  ChatGPT = 'gpt-3.5-turbo',
  ChatGPT16k = 'gpt-3.5-turbo-16k',
}

export function getModelTokens(model: Model) {
  if (model.includes('1106')) {
    // return 2048 * 2 // I'm not sure about the below.. perhaps max_tokens is considered differently for the preview?
    return 128000
    // return 32000 // try 32k, since 128000 throws an error. even though it shouldn't. are we hitting an account limitation?
    // no, the above is false. the OUTPUT tokens limit is 4k for gpt-4-1106-preview, but the OVERALL tokens limit is 128k.
    // so we need to change the way we're calculating this at some point
  } else if (model.includes('16k') || model === Model.GPT3TurboPreview) {
    return 16 * 1024
  } else if (model.includes('32k')) {
    return 32 * 1024
  } else if (model.includes('64k')) {
    return 64 * 1024
  } else {
    return model.indexOf('gpt-4') >= 0 ? 2048 * 4 : 2048 * 2
  }
}

export const OpenAIStream = async (
  messages: Message[],
  settings: {
    model?: Model
    temperature?: number
  } = {}
) => {
  const model = settings?.model ?? Model.GPT4
  const inputTokens = tokenizer.encodeChat(
    messages,
    // The following fixes 16k version not being supported by tokenizer.encodeChat
    model.includes('gpt-3.5-turbo')
      ? 'gpt-3.5-turbo'
      : model.includes('gpt-4')
      ? 'gpt-4'
      : (model as any)
  ).length
  const maxOutputTokens = getModelTokens(model) - (inputTokens + 1)
  const modelSettings = {
    model,
    temperature: 0.5,
    max_tokens: maxOutputTokens,
    ...settings,
  }

  const abortController = new AbortController()
  const { signal } = abortController

  const res = await fetch(`${OPENAI_API_HOST}/v1/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      ...(process.env.OPENAI_ORGANIZATION && {
        'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
      }),
    },
    method: 'POST',
    body: JSON.stringify({
      messages,
      ...modelSettings,
      stream: true,
    }),
    signal,
  })

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  if (res.status !== 200) {
    const statusText = res.statusText
    const result = await res.body?.getReader().read()
    throw new Error(
      `OpenAI API returned an error: ${
        decoder.decode(result?.value) || statusText
      }`
    )
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data

          if (data === '[DONE]') {
            controller.close()
            return
          }

          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta.content
            console.log(text)
            const queue = encoder.encode(text)
            controller.enqueue(queue)
          } catch (e) {
            controller.error(e)
          }
        }
      }

      const parser = createParser(onParse)

      // Listen for abort event on the signal
      signal.addEventListener('abort', () => {
        console.log('abort event triggered')
        try {
          controller.close()
        } catch (e) {
          console.error(e)
        }
      })

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })

  return {
    stream,
    cancel: () => {
      console.log('cancelling')
      try {
        if (!abortController.signal.aborted) {
          abortController.abort()
        }
      } catch (e) {
        console.error(e)
      }
    },
  }
}

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["open-ai"]) {
console.warn(`Duplicate module open-ai imported. This can lead to bugs.`);
}
globalStore["open-ai"] = true;
 
// --- END INJECTED CODE ---