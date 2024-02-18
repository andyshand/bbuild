
export default async function transformNew({
  input,
  transform,
}: {
  input: string
  transform: string
}) {
  // const code = trimCode(input, {})

  // const out = await getChatCompletion([
  //   {
  //     role: 'system',
  //     content: `The following is a question/answer pair between a user and its intelligent coding assistant. The coding assistant responds only with code, surrounded by markdown code blocks, with no additional explanation.`,
  //   },
  //   {
  //     role: 'user',
  //     content: `Please return me the transformed (and formatted) code using the following instruction: "${transform}". The code is as follows:\n\n${ts(
  //       code
  //     )}`,
  //   },
  // ])

  // const stripped = out
  //   .replace(/```typescript/g, '')
  //   .replace(/```/g, '')
  //   .trim()

  // process.stdout.write(stripped)
}
