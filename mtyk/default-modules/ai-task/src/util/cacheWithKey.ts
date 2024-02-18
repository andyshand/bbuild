import os from 'os'
import path from 'path'
import fse from 'fs-extra'
const cacheDir = path.join(os.homedir(), '.cache', 'ai-task')

const cacheWithKey = async (key: string, getter: () => Promise<any>) => {
  const cpath = path.join(cacheDir, key + '.json')
  if (fse.existsSync(cpath)) {
    return fse.readJSONSync(cpath, 'utf8')
  }

  const result = await getter()
  fse.ensureDirSync(cacheDir)
  fse.writeJSONSync(cpath, result)
  return result
}

export default cacheWithKey
