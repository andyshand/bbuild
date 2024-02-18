import fs from 'fs'
import path from 'path'

export function getRealPath(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    // If the file doesn't exist, further processing
    // will throw errors
    return filePath
  }

  const isSymlink = fs.lstatSync(filePath).isSymbolicLink()
  if (isSymlink) {
    return getRealPath(fs.realpathSync(filePath))
  }

  const realPath = fs.realpathSync(path.dirname(filePath))
  const fullPath = path.join(realPath, path.basename(filePath))
  return fullPath
}
