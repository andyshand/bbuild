import { projectPath } from './path'
import glob from 'glob'

export default async function docker() {
  // Find all dockerfiles with globl sync
  const dockerfiles = glob.sync('**/Dockerfile', {
    cwd: projectPath(),
    ignore: ['**/node_modules/**'],
  })
  console.log(dockerfiles)
}
