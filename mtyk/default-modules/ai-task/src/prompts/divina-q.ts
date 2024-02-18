import fse from 'fs-extra'
import { paged } from '.'
import { Model } from '../getCompletionNoStream'
import { runPromptChain } from '../runPrompt'
import splitList from '../util/splitList'
import { describeApiCalls } from './divina-page'
import { extractListSimple } from './extract'

export default async function divinaQ(opts: any) {
  const apiSlice = `/Volumes/andrewshand/Github/frontend-virtual-ER/emergency-room/src/features/core/slices/apiSlice.ts`
  const newApiSlice = fse.readFileSync(apiSlice, 'utf8').toString()

  const apiCalls = await describeApiCalls()
  const allmethods = apiCalls.map(apiCall => {
    const { method, path } = apiCall
    return `${method} ${path}`
  })

  const { output } = await runPromptChain(
    paged({
      input: newApiSlice,
      eachPage: `The following API calls are used in this page (format METHOD /path)? -\n`,
      summarise: `To summarise, this is a list of all API calls used in this file (format METHOD /path)? -\n`,
      task: `find out which API calls are used in this file`,
      model: Model.Davinci2,
    })
  )

  const extractList = splitList(output)
  console.log({ extractList, allmethods })

  const missing = await extractListSimple({
    input: `Here is a list of all possible API calls: 
${allmethods.join('\n')}
    
    The following API calls have been converted for the new API (format METHOD /path)?\n${allmethods.join(
      '\n'
    )}

    The following are missing:\n-`,
  })
}
