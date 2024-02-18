import trimCode from '../util/trimCode'

export default function extractLogic({ input }: { input: string }) {
  const code = trimCode(input, {})

  process.stdout.write(code)
  // const out = getCompletionNoStream(``, {})
}
