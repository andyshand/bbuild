import { zodSchemaToTypeString } from 'modules/schema'
import { globalDepContext, keyDep } from 'modules/deps'
import { ParseMessage } from './ParseMessage'
import { ZodSchema } from 'zod'
import getChatCompletion from './engines/getChatCompletion'

export async function getZodCompletion<T>(
  { schema, name }: { schema: ZodSchema<T>; name: string },
  prompt: string,
  ...rest: any[]
): Promise<T> {
  const type = zodSchemaToTypeString(schema, name)
  let tries = 0
  const maxtries = 3
  const amendedPrompt = `${prompt}

Format your response as JSON conforming to the following type:
${type}

Do not include any explanation or other text in your response, only the JSON. No other response will be accepted.`

  while (tries < maxtries) {
    tries++
    const result = await getChatCompletion(amendedPrompt, ...rest)

    // try parse
    try {
      const parsed = ParseMessage.json(result)
      const validated = schema.parse(parsed)
      return validated
    } catch (e) {
      console.log(e)
      console.log('Invalid JSON, try again')
    }
  }

  throw new Error(`Invalid JSON after ${maxtries} tries`)
}
