import splitCode from '../babel/splitBabel'
// import { getChatCompletion } from '../getChatCompletion'
import { ts } from '../transform'
import trimCode from '../util/trimCode'

export default async function simplifyStackedComponents({
  input,
  pieces,
}: {
  input: string
  pieces: number
}) {
  const theCode = input

  const trailingComment = theCode.split('//').slice(-1)[0]
  const withoutTrailingComment = theCode.split('//').slice(0, -1).join('//')
  const split =
    typeof pieces === 'number'
      ? splitCode(withoutTrailingComment, pieces)
      : [withoutTrailingComment]
  const out = await Promise.all(
    split.map(async piece => {
      const pieceCode = ts(trimCode(piece))
      // const result = await getChatCompletion([
      //   {
      //     role: 'system',
      //     content: `The following is a question/answer pair between a user and its intelligent coding assistant. The coding assistant responds only with code, surrounded by markdown code blocks, with no additional explanation.`,
      //   },
      //   {
      //     role: 'user',
      //     content: `Please return me the transformed code using the following instruction: \"${trailingComment}\". The code is as follows:\n\`\`\`typescript\n${pieceCode}\n\`\`\``,
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
