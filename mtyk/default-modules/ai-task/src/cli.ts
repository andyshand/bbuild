import fs from 'fs-extra'
import { assert } from 'modules/errors'
import { runPromptChain } from './runPrompt'
import * as prompts from './prompts'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))
const {
  _: [prompt],
  ...options
} = args
// console.log(prompt, options)
assert(
  prompt in prompts,
  `Prompt ${prompt} not found, available prompts: ${Object.keys(prompts).join(
    ', '
  )}`
)

const doIt = async () => {
  const { file, input, ...rest } = options
  const fileContents = file
    ? fs.readFileSync(options.file, 'utf8').toString()
    : ''

  let _input = input ?? fileContents
  // Check if we need to JSON.parse stringified input
  if (input && input.includes('\\n')) {
    _input = input.replace(/\\n/g, '\n')
  }

  const chain = prompts[prompt]({ input: _input, ...rest })

  if (!chain) {
    return
  }
  if (chain.then) {
    await chain
  } else {
    if (Array.isArray(chain)) {
      const { outputsByKey } = await runPromptChain(chain)
      process.stdout.write(outputsByKey.output)
      // console.log(outputsByKey)
    } else {
      const { outputsByKey } = await runPromptChain([chain])
      process.stdout.write(outputsByKey.output)
      // console.log(outputsByKey)
    }
  }
}

setTimeout(() => {
  doIt()
}, 2000)
