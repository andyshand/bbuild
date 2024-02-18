import fs from 'fs/promises'
import JSON5 from 'json5'
import { depFn, keyDep } from 'modules/deps'
import { objToKeyVals } from './aiforloop'
import { extractKeyValsAsObj } from './extractKeyVals'

export default async function commandSingle(opts: { input: string }) {
  // const prompt = `Available tools:\n${availableTools}} `
  const out = await extractKeyValsAsObj({
    examples: [
      objToKeyVals({
        Command: 'read the file at ~/Desktop/home.txt',
        Type: 'single',
      }),
      objToKeyVals({
        Command: 'read all files in my desktop',
        Tool: 'iterator',
      }),
    ],
    input: opts.input,
    // preamble: prompt,
  })

  const { Type: toolName } = out
  // const argsParsed = JSON5.parse(args)
  // const tool = readertools.find(t => t.name === toolName)

  if (toolName === 'single') {
    // Simple command

    commandSingle(opts)
  } else {
  }
  // if (!tool) {
  //   throw new Error('No tool found, got: ' + out)
  // }

  // const outt = await tool.input(argsParsed)
  // console.log(outt)
}
