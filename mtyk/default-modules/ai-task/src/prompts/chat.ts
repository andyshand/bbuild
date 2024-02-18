import { ts } from '../transform'
import trimCode from '../util/trimCode'

export default async function simplifyStackedComponents({
  input,
  action
}: {
  input: string,
  action: string
}) {
  const theCode = input
  const split = [trimCode(theCode)]
  const out = await Promise.all(
    split.map(async piece => {
      const pieceCode = ts(trimCode(piece))
      // const result = await getChatCompletion([
      //   {
      //     role: 'system',
      //     content: `You are a coding assistant who responds only with code, surrounded by markdown code blocks, with no additional explanation.`,
      //   },
      //   {
      //     role: 'user',
      //     content: `Please respond by transforming the code using the following instruction: \"${action}\".\n\`\`\`typescript\n${pieceCode}\n\`\`\``,
      //   },
      // ])
      // return result
      //   .replace(/```typescript/g, '')
      //   .replace(/```/g, '')
      //   .trim()
      return ''
    })
  )
  process.stdout.write(out.join(''))
}
