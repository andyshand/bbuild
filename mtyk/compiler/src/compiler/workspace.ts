import * as fs from 'fs'
import path from 'path'

export function findNearestWorkspace(p: string): string | null {
  const yarnlock = path.join(p, 'yarn.lock')
  if (fs.existsSync(yarnlock)) {
    return p
  }
  const parent = path.dirname(p)
  if (parent === p) {
    return null
  }
  return findNearestWorkspace(parent)
}
