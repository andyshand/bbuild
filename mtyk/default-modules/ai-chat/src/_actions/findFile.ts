import { depFn, keyDep } from 'modules/deps/index'
import { addWSFunction } from 'modules/rpc-ws/server'
import findFilesInProject from '../project/util/findFilesInProject'

const findFile = depFn(
  {
    file: keyDep<string>(),
    project: keyDep<string>(),
    diffContent: keyDep<string>('diffContent', {
      optional: true,
    }),
  },
  async function findFile({ file, project, diffContent }) {
    const [result] = await findFilesInProject({ file, project, diffContent })

    if (result) {
      return result
    }

    return null
  }
)

export default addWSFunction(findFile)
