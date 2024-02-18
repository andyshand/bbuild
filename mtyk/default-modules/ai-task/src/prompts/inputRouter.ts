import fs from 'fs/promises'
import JSON5 from 'json5'
import { depFn, keyDep } from 'modules/deps'
import { objToKeyVals } from './aiforloop'
import { extractKeyValsAsObj } from './extractKeyVals'

const readertools = [
  {
    name: 'file',
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
 * read the file at ~/Desktop/home.txt
 * read the webpage at https://www.google.com
 */
export default async function inputRouter(opts: { input: string }) {
  const availableTools = readertools
    .map(tool => `${tool.name} - ${tool.description}`)
    .join('\n')

  const prompt = `Available tools:\n${availableTools}} `
  const out = await extractKeyValsAsObj({
    examples: [
      objToKeyVals({
        Command: 'read the file at ~/Desktop/home.txt',
        Tool: 'file',
        'Tool arguments': '{path: "~/Desktop/home.txt"}',
      }),
      objToKeyVals({
        Command: 'read the webpage at https://www.google.com',
        Tool: 'webpage',
        'Tool arguments': '{href: "https://www.google.com"}',
      }),
    ],
    input: opts.input,
    preamble: prompt,
  })

  const { Tool: toolName, 'Tool arguments': args } = out
  const argsParsed = JSON5.parse(args)
  const tool = readertools.find(t => t.name === toolName)

  if (!tool) {
    throw new Error('No tool found, got: ' + out)
  }

  const outt = await tool.input(argsParsed)
  console.log(outt)
}
