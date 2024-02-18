import { createContainer } from './dockerode'
import { TreeDirectory } from './FileTree'
import fs from 'fs'
import { writeFiles } from './writeFiles'
import { findAllowedPackage } from './AllowedPackage'
import os from 'os'
import path from 'path'
import * as viteFiles from './viteFiles'
import { viteContainerYarnCache, runSh } from './viteFiles'

type PackageSpec = {
  name: string
}

export async function runImmediate(opts: {
  type: 'node'
  files: TreeDirectory
  packages: PackageSpec[]
}): Promise<any> {
  const containerInfo = await run(opts)

  // Run and wait
  const result = await containerInfo.handle.runAndWait()

  // Clean up temp directory
  await fs.promises.rmdir(containerInfo.tmpDir, { recursive: true })

  return result
}

const localYarnCachePath = os.homedir().includes('andrewshand')
  ? '/Users/andrewshand/.yarn'
  : null

/**
 * This function runs a specified type of code in a container.
 * For 'node' type, it requires an 'index.js' file in the file tree.
 * For 'bash' type, it requires a 'run.sh' file in the file tree.
 */
export async function run(opts: {
  type: 'node' | 'vite' | 'bash'
  ports?: number[]
  files: TreeDirectory
  packages: PackageSpec[]
  binds?: string[]
  wait?: boolean
}) {
  // Create temp directory to store files
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mtyk-vm-project-'))
  const fileTree = opts.files

  const ports = opts.ports ?? [3000]
  const packagesHashStr = opts.packages
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => `${p.name}`)
    .join(',')

  // Check if a backup of node_modules exists for the current package hash
  const backupNodeModulesPath = path.join(os.tmpdir(), `agent_node_modules_${packagesHashStr}`)
  if (fs.existsSync(backupNodeModulesPath)) {
    // If backup exists, copy it to the new tmp directory
    await fs.promises.cp(backupNodeModulesPath, path.join(tmpDir, 'node_modules'), {
      recursive: true,
    })
  } else {
    await fs.promises.mkdir(backupNodeModulesPath)
  }

  const runner = {
    node: async () => {
      // Add package.json with allowed packages
      const packageJson = {
        name: 'mtyk-vm-project',
        type: 'module',
        version: '1.0.0',
        description: '',
        main: 'index.js',
        dependencies: {},
      }

      // Add dependencies from allowed packages
      const dependencies = opts.packages.reduce(
        (acc, pkg) => {
          const allowedPackage = findAllowedPackage(pkg.name)
          if (!allowedPackage) {
            // TODO improve this obvs, use npm package for it
            const isBuiltIn = ['fs', 'path', 'os'].includes(pkg.name)

            if (isBuiltIn) {
              return acc
            }
            throw new Error(`No allowed version for package found: ${pkg.name}`)
          }
          acc[pkg.name] = allowedPackage.version
          return acc
        },
        {} as Record<string, string>,
      )
      packageJson.dependencies = dependencies

      fileTree.files['package.json'] = {
        type: 'file',
        name: 'package.json',
        content: JSON.stringify(packageJson, null, 2),
      }
      fileTree.files['run.sh'] = {
        type: 'file',
        name: 'run.sh',
        content: `#!/bin/bash
yarn set version berry
# if node_modules exists, skip install
if [ ! -d "./node_modules" ]; then
  YARN_CACHE_FOLDER=${viteContainerYarnCache} yarn
  touch .installed
fi
node index.js`,
      }
      fileTree.files['.yarnrc.yml'] = {
        type: 'file',
        name: '.yarnrc.yml',
        content: viteFiles.yarnRC,
      }

      // Write files to temp directory
      await writeFiles(fileTree, tmpDir)

      const container = await createContainer({
        imageName: 'node:18.16.1',
        ports,
        projectDir: tmpDir,
        binds: [
          ...(opts.binds ?? []),
          ...(localYarnCachePath ? [`${localYarnCachePath}:/root/.yarn`] : []),
        ],
        command: ['bash', '-c', `cd app && chmod +x ./run.sh && PORT=${ports[0]} ./run.sh`],
      })

      // Start an interval that backs up node_modules to a tmp folder
      // TODO fix container stopped check
      const startNodeModulesBackup = async () => {
        const installedPath = path.join(tmpDir, '.installed')
        if (fs.existsSync(installedPath)) {
          const nodeModulesPath = path.join(tmpDir, 'node_modules')
          // ensure directory exists

          await fs.promises.cp(nodeModulesPath, backupNodeModulesPath, {
            recursive: true,
          })
          return
        }

        // if (container.dockerodeContainer.inspect().State.Running === false) {
        //   return
        // }

        setTimeout(startNodeModulesBackup, 1000)
      }

      setTimeout(startNodeModulesBackup, 1000)

      return { handle: container }
    },
    vite: async () => {
      // Add files to file tree
      fileTree.files['package.json'] = {
        type: 'file',
        name: 'package.json',
        content: viteFiles.packageJson,
      }
      fileTree.files['tailwind.config.js'] = {
        type: 'file',
        name: 'tailwind.config.js',
        content: viteFiles.tailwindConfig,
      }
      fileTree.files['vite.config.ts'] = {
        type: 'file',
        name: 'vite.config.ts',
        content: viteFiles.viteConfig,
      }
      fileTree.files['index.html'] = {
        type: 'file',
        name: 'index.html',
        content: viteFiles.indexHtml,
      }
      fileTree.files['run.sh'] = {
        type: 'file',
        name: 'run.sh',
        content: viteFiles.runSh,
      }
      fileTree.files['.yarnrc.yml'] = {
        type: 'file',
        name: '.yarnrc.yml',
        content: viteFiles.yarnRC,
      }

      // Write files to temp directory
      await writeFiles(fileTree, tmpDir)
      const container = await createContainer({
        imageName: 'node:18.16.1',
        ports,
        projectDir: tmpDir,
        volumes: localYarnCachePath
          ? {
              [viteFiles.viteContainerYarnCachePath]: {},
            }
          : {},
        binds: [
          ...(opts.binds ?? []),
          ...(localYarnCachePath ? [`${localYarnCachePath}:/root/.yarn`] : []),
        ],
        command: ['bash', '-c', `cd app && chmod +x ./run.sh && PORT=${ports[0]} ./run.sh`],
      })
      return { handle: container }
    },
    bash: async () => {
      // Write files to temp directory
      await writeFiles(fileTree, tmpDir)
      const container = await createContainer({
        imageName: 'bash:latest',
        ports,
        projectDir: tmpDir,
        command: ['bash', '-c', 'cd app && ./run.sh'],
      })
      return { handle: container }
    },
  }

  const runnerFn = runner[opts.type]
  if (!runnerFn) throw new Error(`Unsupported type: ${opts.type}`)

  // Get result from runner
  const returned = await runnerFn()

  // Wrap writeFiles to write to the tmpDir
  const writeFilesWrapper = async (fileTree: TreeDirectory) => {
    await writeFiles(fileTree, tmpDir)
  }

  return { ...returned, tmpDir, writeFiles: writeFilesWrapper }
}
