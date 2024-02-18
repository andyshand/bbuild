import { depFn, globalDepContext, keyDep, typeDep } from 'modules/deps'
import { Deps } from '../Deps'
import fs from 'fs/promises'

import { addWSFunction } from 'modules/rpc-ws/server'

const mkdir = depFn(
  {
    path: keyDep<string>(),
  },
  async function mkdir({ path }) {
    try {
      try {
        const stat = await fs.stat(path)
        if (stat.isDirectory()) {
          console.log(`Directory already exists at: ${path}`)
          return `Directory already exists at: ${path}`
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error
        }
      }

      await fs.mkdir(path, { recursive: true })
      console.log(`Directory created at: ${path}`)
      return `Directory created at: ${path}`
    } catch (error) {
      console.error(`Error creating directory: ${error}`)
      return `Error creating directory: ${error}`
    }
  }
)

export default addWSFunction(mkdir)
