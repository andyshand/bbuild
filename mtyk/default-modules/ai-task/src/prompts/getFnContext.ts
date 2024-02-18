import fetch from 'node-fetch'
import JSON5 from 'json5'
import { objToKeyVals } from './aiforloop'
import { extractKeyValsAsObj } from './extractKeyVals'
import axios from 'axios'

function tryAllPossibleParse(str: string) {
  while (str.length > 0) {
    try {
      return JSON5.parse(str)
    } catch (e) {
      str = str.slice(0, -1)
    }
  }
  throw new Error('Could not parse')
}

export default async function getFnContext(opts: { input: string }) {
  const { input } = opts

  const vscode = (await axios('http://localhost:5555/active-editor'))
    .data as any

  const vscodeContext = {
    activeFileName: vscode.fileName,
    project: vscode.project,
    selectedText: vscode.selectedText,
  }

  const out = await extractKeyValsAsObj({
    examples: [
      objToKeyVals({
        Fn: `export default async function ({ activeFile }) {console.log(activeFile)}`,
        Args: JSON5.stringify({ activeFile: vscodeContext.activeFileName }),
      }),
    ],
    input,
    preamble: `Available Context: ${JSON5.stringify({
      vscode: vscodeContext,
    })}\n\n`,
  })

  return tryAllPossibleParse(out.Args)
}
