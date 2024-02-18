import { getCompletionNoStream } from './getCompletionNoStream'
import { infoById } from './infoById'
import { PromptObj } from './PromptObj'

export const runPromptObj = async (
  obj: PromptObj,
  ctx: { soFar: string; outputsByKey: { [key: string]: string } }
) => {
  const fullInfo = { ...obj, ...infoById[obj.id] }
  if (fullInfo.type === 'gpt3') {
    return await getCompletionNoStream(ctx.soFar, (fullInfo as any).gpt)
  } else if (fullInfo.type === 'get-output') {
    return ctx.outputsByKey[fullInfo.outputKey]
  } else {
    throw new Error('Unknown prompt type')
  }
}
