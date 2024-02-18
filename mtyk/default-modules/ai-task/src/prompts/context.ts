import { getCompletionNoStream } from '../getCompletionNoStream'
import splitList from '../util/splitList'

const listQ = async ({ task }: { task: string }) => {
  const ret = await getCompletionNoStream(
    `${task}:
 /startlist
 -`,
    {
      stop: ['/endlist'],
    }
  )
  return splitList(ret)
}

const actionPrompt = ({ task }: { task: string }) => {
  return `${task}

Some questions that would be helpful to provide context for this task are:
/startlist
- 
  
  
  `
}

const factFinder = ({ task: string }) => {}

export default null
