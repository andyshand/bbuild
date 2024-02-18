import { projectPath } from "@/compiler/path";
import glob from 'glob'
import path from 'path'

export function findNextJSProjects() {
  const projects = glob.sync(projectPath('**/next.config.js'))
  return projects.map((p) => path.dirname(p))
}
