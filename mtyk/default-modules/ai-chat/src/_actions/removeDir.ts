import { depFn, globalDepContext, keyDep, typeDep } from 'modules/deps'
import { Deps } from '../Deps'
import fs from 'fs/promises'

import { addWSFunction } from 'modules/rpc-ws/server'

const removeDir = depFn(
  {
    path: keyDep<string>(),
  },
  async function removeDir({ path }) {
    try {
      await fs.rm(path, { recursive: true, force: true })
      console.log(`Directory removed: ${path}`)
      return `Directory removed: ${path}`
    } catch (error) {
      console.error(`Error removing directory: ${error}`)
      return `Error removing directory: ${error}`
    }
  }
)

export default addWSFunction(removeDir)
