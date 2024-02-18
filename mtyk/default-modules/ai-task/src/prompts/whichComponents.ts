import extractImportedNames from '../babel/extractImportedNames'
import { runPromptChain } from '../runPrompt'
import paged from './paged'
import { splitList } from '../util/splitList'

export const whichComponents = async (
  trimmedInput: string,
  component?: string
) => {
  if (component) {
    return { all: [component], imported: [] }
  }

  // const imported = await extractList({
  //   assertion: `The following components have been imported from other files:\n-`,
  //   input: trimmedInput.slice(0, 800),
  //   responseTokens: 500,
  // })
  const imported = extractImportedNames(trimmedInput)
  console.log({ imported })
  const { outputsByKey } = await runPromptChain(
    paged({
      // Replace all leading whitespace with nothing
      input: trimmedInput,
      task: `extract the names of all top-level React components declared inside a file`,
      eachPage: (page, i) =>
        `I can see the following top-level React components declared on this page:\n-`,
      summarise: `After seeing all the pages, please find a complete list below, sorted by most relevant first:\n-`,
    })
  )

  return { all: splitList(outputsByKey.output), imported }
}

export default whichComponents
