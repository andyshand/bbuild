import * as path from 'path'

export function projectPath(...subpath: string[]) {
  return path.join(process.cwd(), ...subpath)
}

export function pathMaker(folder: string) {
  return (...subpath: string[]) => path.join(folder, ...subpath)
}

export function projectRelative(subpath: string) {
  return path.relative(projectPath(), subpath)
}

export function projectName() {
  return path.basename(projectPath())
}
