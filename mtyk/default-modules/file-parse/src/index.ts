import fs from 'fs/promises'
import path from 'path'
import { assert } from 'modules/errors'
import _fs from 'fs'
import fse from 'fs-extra'

export interface FilterParserConfigArgs<T> {
  read: (fileContents: string) => T
  write: (obj: T) => string
}

async function readWriteSfately<T>(path: string, cb: () => Promise<T>) {
  try {
    return await cb()
  } catch (e) {
    console.error(`Error reading/writing to file at ${path}`)
    throw e
  }
}

export function makeFilterParsers<T>(config: FilterParserConfigArgs<T>) {
  const ret = {
    read: async (file: string) => {
      return readWriteSfately(file, async () => {
        const contents = await fs.readFile(file)
        return config.read(contents.toString())
      })
    },
    readSync: (file: string) => {
      const contents = _fs.readFileSync(file)
      return config.read(contents.toString())
    },
    write: async (file: string, obj: T) => {
      return readWriteSfately(file, async () => {
        const contents = config.write(obj)
        await fs.writeFile(file, contents)
      })
    },
    /**
     * @param create If true, will create the file if it doesn't exist
     */
    edit: async (file: string, edit: (obj: T) => T, create = false) => {
      const exists = _fs.existsSync(file)
      assert(exists || create, 'File does not exist and create param is false')

      return readWriteSfately(file, async () => {
        let obj: any = {}
        if (exists) {
          obj = await ret.read(file)
        }

        if (create) {
          // Ensure dir exists
          fse.ensureDirSync(path.dirname(file))
        }

        const newObj = edit(obj)
        assert(
          typeof newObj !== 'undefined',
          `Edit function must return a value, got ${newObj}`
        )
        await ret.write(file, newObj)
      })
    },
  }
  return ret
}
