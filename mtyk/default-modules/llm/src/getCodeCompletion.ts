import { ParseMessage } from './ParseMessage'
import getChatCompletion from './engines/getChatCompletion'

export async function getCodeCompletion(prompt: string, ...rest: any[]): Promise<string> {
  let tries = 0
  const maxtries = 3
  const amendedPrompt = `${prompt}

Format your response as a markdown code block. Do not include any explanation or other text in your response, only the code. No other response will be accepted.`

  while (tries < maxtries) {
    tries++
    const opts = {
      ...(rest[0] ?? {}),
    }
    const result = await getChatCompletion(amendedPrompt, opts, ...(rest ?? []).slice(1))

    // try parse
    try {
      const parsed = ParseMessage.code(result)
      return parsed
    } catch (e) {
      console.log(e)
      console.log('Invalid code block, try again')
    }
  }

  throw new Error(`Invalid code block after ${maxtries} tries`)
}
