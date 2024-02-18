import { getCompletionNoStream, Model } from '../getCompletionNoStream'
import { ts } from '../transform'
import { splitList } from '../util/splitList'

type ExtractOpts = {
  input: string
  assertion: string
  model?: Model
  responseTokens?: number
}

const extract = async (opts: ExtractOpts) => {
  const { input, assertion, model, responseTokens } = opts
  const prompt = `${ts(
    input
  )}\n\nUsing the above code as a reference, ${assertion}`
  const completion = await getCompletionNoStream(
    prompt,
    model ? { model } : {},
    responseTokens ? { responseTokens } : {}
  )

  const answer = completion.replaceAll('```', '').trim()
  return answer
}

export const extractListSimple = async (opts: {
  input: string
  model?: Model
  responseTokens?: number
}) => {
  const { input, model, responseTokens } = opts
  const completion = await getCompletionNoStream(
    input,
    model ? { model } : {},
    responseTokens ? { responseTokens } : {}
  )

  const answer = splitList(completion.replaceAll('```', '').trim())
  return answer
}

export default extract

export const extractList = async (opts: ExtractOpts) => {
  const out = await extract(opts)
  return splitList(out)
}

export const extractCode = async (str: string) => {
  if (str.indexOf('```') === -1) {
    return str
  }
  return str.split('```')[0].trim()
}
