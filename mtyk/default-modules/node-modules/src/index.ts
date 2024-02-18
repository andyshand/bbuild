import fs from 'fs/promises'
import path from 'path'
import { workspacePath } from 'modules/core'
import { cloneDeep } from 'modules/dash'
import { writeJson } from 'modules/json'
export type NodeModuleFile = { contents: string }

export interface MakeCJSNodeModuleConfig {
  module: {
    name: string
    exports: { [path: string]: NodeModuleFile }
    version: string
  }

  /**
   * workspace = node_modules folder in the root of the workspace
   * path = path to a specific folder to output files in
   */
  saveTo: { path: string } | 'workspace'
}

export async function makeCJSNodeModule(config: MakeCJSNodeModuleConfig) {
  const { module } = config
  const packageJsonWorking = cloneDeep(config.module)
  const nodeModOutPath =
    config.saveTo === 'workspace'
      ? workspacePath('node_modules', module.name)
      : config.saveTo.path

  for (const [exPath, info] of Object.entries(config.module.exports)) {
    await fs.mkdir(path.dirname(exPath), { recursive: true })
    await fs.writeFile(exPath, info.contents)
    packageJsonWorking.exports[exPath] = './' + exPath
  }

  packageJsonWorking.exports['./package.json'] = './package.json'
  await writeJson(path.join(nodeModOutPath, 'package.json'), packageJsonWorking)
}
