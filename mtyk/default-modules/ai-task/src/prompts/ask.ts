import paged from './paged'
import { getCompletionNoStream, Model } from '../getCompletionNoStream'
import { runPromptChain } from '../runPrompt'

const ask = async (opts: {
  input: string
  assertion: string
  model?: string
}) => {
  const { input, assertion } = opts
  const prompt = `${input}\n\n${assertion}, true or false?\n`
  const completion = await getCompletionNoStream(
    prompt,
    {},
    { responseTokens: 10 }
  )
  const answer = completion.trim().toLowerCase().includes('true')
  return answer
}

export default ask

export const pagedAsk = async (opts: {
  input: string
  assertion?: string
  task?: string
  eachPage?: string
  asQuestion?: string
  model?: Model
  stop?: string
}) => {
  const { asQuestion, task, assertion, input, ...rest } = opts
  return await runPromptChain(
    paged({
      ...rest,
      input,
      task: task ?? `find out whether ${assertion!}`,
      summarise: `Based on my notes for each page, ${asQuestion}:\n`,
    })
  )
}
