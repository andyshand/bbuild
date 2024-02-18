import { resolveModulePath, workspacePath } from 'modules/core'
import { readJson } from 'modules/json'
import { execSync } from 'child_process'
import fs from 'fs'

export function tryAssignConfig(
  config: { path: any; configExists: boolean; configPath: string },
  appFolder: string,
  outObj: {} = {}
) {
  try {
    const output = execSync(
      `node -e "console.log(JSON.stringify(require('${config.configPath}').default))"`,
      {
        // Run from app folder, as if we were running the app
        cwd: appFolder,
        // Inherit env
        env: { ...process.env, ONE_CONFIG_SILENT: 'true' },
      }
    ).toString()

    const parsed = JSON.parse(output)
    Object.assign(outObj, parsed)
  } catch (e) {
    console.log('error', e)
    console.error(
      `Failed to load config for ${config.path}, are required env variables set?`
    )
    throw e
  }
  return outObj
}

export async function getNodeModulesWithConfigForApp(name: string) {
  const appFolder = workspacePath('apps', name)
  const packageJSON = await readJson(`${appFolder}/package.json`)
  const allDependencies = Object.keys({
    ...(packageJSON.dependencies ?? {}),
    ...(packageJSON.devDependencies ?? {}),
  })
  const oneModules = allDependencies.filter((dep) => dep.startsWith('@one/'))
  // console.log('oneModules', oneModules)
  const withConfig = await Promise.all(
    oneModules.map(async (dep) => {
      const path = await resolveModulePath(dep, appFolder)
      const configPath = `${path}/dist/cjs/config.js`
      const configExists = fs.existsSync(configPath)
      // console.log({ path, configExists, configPath })
      return { path, configExists, configPath }
    })
  ).then((results) => results.filter((r) => r.configExists))
  return { withConfig, appFolder }
}
