import { getCompletionNoStream } from '../getCompletionNoStream'

export default async function extractKeyVals<
  T extends { key: string; value: string }
>(opts: { examples: T[][]; input: string; preamble?: string }): Promise<T[]> {
  const { examples, preamble, input } = opts
  const keys = examples[0].map(e => e.key)

  const exampleToStr = (e: T[]) => {
    return e.map(ee => `${ee.key}: ${ee.value}`).join('\n')
  }

  const paragraphs = examples.map(exampleToStr).join('\n\n')
  const prompt =
    preamble +
    paragraphs +
    '\n\n' +
    keys[0] +
    ': ' +
    input +
    '\n' +
    keys[1] +
    ':'

  const result = await getCompletionNoStream(prompt, {
    stop: ['\n\n', keys[0]],
  })

  function parseResult(result: string) {
    const lines = result.trim().split('\n')
    const keyVals = lines.map((line, i) => {
      if (i === 0) {
        // First line
        return { key: keys[1], value: line.trim() }
      }

      const [key, ...value] = line.split(':')
      const val = value.join(':')
      return { key: key.trim(), value: val.trim() }
    })

    return [{ key: keys[0], value: input }, ...keyVals] as T[]
  }

  return parseResult(result)
}

export async function extractKeyValsAsObj<
  T extends { key: string; value: string }
>(opts: {
  examples: T[][]
  input: string
  preamble?: string
}): Promise<Record<string, string>> {
  const keyVals = await extractKeyVals(opts)
  return keyVals.reduce((acc, { key, value }) => {
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
}
