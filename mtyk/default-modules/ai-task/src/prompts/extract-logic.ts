import { getCompletionNoStream } from '../getCompletionNoStream'
import { ts } from '../transform'
import trimCode from '../util/trimCode'

export default async function extractLogic({ input }: { input: string }) {
  const trimmed = trimCode(input)

  const prompt = `Extract this code down to the simplest possible pseudocode that conveys its logic:  
  ${ts(trimmed)}
Pseudocode:
typescript\`\`\`
`
  // process.stdout.write(code)
  const out = await getCompletionNoStream(prompt, {
    temperature: 0.25,
  })
  process.stdout.write(out)
}
