import { depFn, keyDep } from 'modules/deps/index'
import { addWSFunction } from 'modules/rpc-ws/server'
import path from 'path'

const constructPath = depFn(
  {
    relativePath: keyDep<string>(),
  },
  function constructPath({ relativePath }) {
    const projectRoot = path.resolve(process.cwd(), '../../')
    return path.join(projectRoot, relativePath)
  }
)

export default addWSFunction(constructPath)
