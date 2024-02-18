import { runPromptObj } from './runPromptObj'
import { splitPrompt } from './splitPrompt'

export async function runPrompt(prompt: string) {
  return runPromptChain([prompt])
}

export async function runPromptChain(prompts: string[]) {
  let outputsByKey: Record<string, string> = {}
  let keyI = 0

  for (const prompt of prompts) {
    // Look for objects inbetween split sequences
    // Prase objects
    // Run each split section up until the next object through the prompt
    // Run the object through the prompt
    const split = splitPrompt(prompt)

    let soFar = ''
    for (const section of split) {
      let key = ++keyI

      if (typeof section === 'object') {
        const out = await runPromptObj(section, { soFar, outputsByKey })
        if (section.key) {
          outputsByKey[section.key] = section.transformOut?.(out) ?? out
        }
        process.stdout.write(out)
        outputsByKey[key] = out
        soFar += out
      } else if (typeof section === 'string') {
        outputsByKey[key] = section
        soFar += section
        process.stdout.write(section)
      }
    }

    // console.log('outputsByKey', outputsByKey, soFar)
  }

  return { outputsByKey, output: outputsByKey['output'] }
}
