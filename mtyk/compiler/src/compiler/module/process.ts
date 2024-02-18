import { PackageBuildContext } from '../context/packageBuildContext'

const runningStatusByName: Record<string, 'making' | 'requested'> = {};

export async function processModulesSequentiallyByName(
  context: PackageBuildContext,
  name: string,
  cb: () => Promise<void>
) {
  if (name in runningStatusByName) {
    runningStatusByName[name] = 'requested'
    // context.setMessage(`Requested to make ${name} but already making it`)
    return
  }

  runningStatusByName[name] = 'making'

  await cb()
  const wasRequested = runningStatusByName[name] === 'requested'
  delete runningStatusByName[name]
  if (wasRequested) {
    context.setMessage(`Requested again one at a time ${name}`)
    await processModulesSequentiallyByName(context, name, cb)
  }
}