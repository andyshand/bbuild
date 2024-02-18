import { watch } from 'chokidar'
import { execSync } from 'child_process'
import { execSyncInherit } from '@/util/exec'

let installing = false

export default function getInstallWatcher() {
  // Create a watcher for all ts/tsx files in the repo. Gather imports for all changed files.
  // If we see a new import, add it to the pending to install list.
  // If a yarn install isn't currently running, add all pending packages with `yarn add`
  const pendingToInstall: string[] = []

  watch('./**/*.{ts,tsx}', { ignoreInitial: true })
    .on('add', (path) => {
      // Gather imports for all changed files
      const imports = getFileImports(path)

      // If we see a new import, add it to the pending to install list.
      for (let i = 0; i < imports.length; i++) {
        if (!pendingToInstall.includes(imports[i])) {
          pendingToInstall.push(imports[i])
        }
      }
    })
    .on('ready', () => {})

  function tryInstallPending() {
    // If a yarn install isn't currently running, add all pending packages with `yarn add`
    if (!isYarnInstallRunning()) {
      installing = true
      execSyncInherit(`yarn add ${pendingToInstall.join(' ')}`)
      installing = false
    }
  }

  function getFileImports(path: string): string[] {
    // Code to parse file to get imports
    // ...
    return []
  }

  function isYarnInstallRunning(): boolean {
    // Code to check if yarn install is running
    // ...
    return installing
  }
}
