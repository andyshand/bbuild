import fs from 'fs/promises'
import JSON5 from 'json5'
import { depFn, keyDep } from 'modules/deps'
import aiForLoop, { objToKeyVals } from './aiforloop'
import { extractKeyValsAsObj } from './extractKeyVals'

const readertools = [
  {
    name: 'single',
    description: 'read the file at ~/Desktop/home.txt',
    example: 'read the file at ~/Desktop/home.txt',
    input: depFn({ path: keyDep<string>() }, async ({ path }) => {
      return fs.readFile(path, 'utf8')
    }),
  },
]

/**
 * Example inputs
 *
 *
 * read the webpage at https://www.google.com
 */
export default async function commandRouter(opts: { input: string }) {
  const availableTools = readertools
    .map(tool => `${tool.name} - ${tool.description}`)
    .join('\n')

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
  } else if (toolName === 'iterator') {
    // Iterator command
    // const { Iterator, Subcommand } = await aiForLoop({ input: opts.input })
  }
  // if (!tool) {
  // throw new Error('No tool found, got: ' + out)
  // }

  // const outt = await tool.input(argsParsed)
  // console.log(outt)
}
