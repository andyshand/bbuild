//@ts-nocheck
import fs from 'fs'
import path from 'path'
function findWorkspaceRoot(p?: string) {
  if (!p) {
    p = process.cwd()
  }
  if (fs.existsSync(p + '/yarn.lock')) {
    return p
  }
  if (p === '/') {
    return null
  }
  return findWorkspaceRoot(p + '/..')
}

export function workspacePath(...rest: string[]) {
  return path.join(findWorkspaceRoot(process.cwd()), ...rest)
}

export function resolveModulePath(moduleName: string, startDir: string) {
  const possiblePath = path.join(startDir, 'node_modules', moduleName)
  if (fs.existsSync(possiblePath)) {
    return possiblePath
  } else {
    const nextDir = path.join(startDir, '..')
    if (nextDir === startDir) {
      throw new Error(`Could not find module ${moduleName}`)
    }
    return resolveModulePath(moduleName, nextDir)
  }
}

export function appPath(app: string) {
  return workspacePath('apps', app)
}

export function getApps() {
  const dir = workspacePath('apps')
  return fs.readdirSync(dir)
}
