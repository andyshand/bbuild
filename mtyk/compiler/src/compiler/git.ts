import path from 'path'
import fs from 'fs'
import { uniq } from '@/util/dash'
import fse from 'fs-extra'
import os from 'os'


export function makeGitignore(files: string[], destinationPath: string) {
  const destinationFile = path.join(destinationPath, '.gitignore')
  const destinationFileExists = fs.existsSync(destinationFile)
  const destinationFileContents = destinationFileExists
    ? fs.readFileSync(destinationFile).toString()
    : ''

  const ignoredAlready = destinationFileContents.split('\n').map(s => s.trim())
  const newIgnored = uniq([...ignoredAlready, ...files])
  fs.writeFileSync(destinationFile, newIgnored.join('\n'))
}

function oneFolder(subpath: string = '.') {
  const folder = path.join(os.homedir(), '.one')
  fse.ensureDirSync(folder)
  return path.join(folder, subpath)
}

export async function cloneGithubFolder(
  repository: string,
  subdirectory: string
): Promise<string> {
  throw new Error('Git repo import unsupported atm')

  // console.log('Cloning', repository, 'to', subdirectory)
  // const codename = (repository + subdirectory).replace(/[^a-z0-9]/gi, '')
  // const targetFolder = oneFolder(codename)

  // if (!fse.existsSync(targetFolder)) {
  //   const cloneDir = fse.mkdtempSync(codename)

  //   // Clone the repository with minimum files, skip checkout
  //   await bash`git clone --depth 1 --single-branch --branch master --no-checkout ${repository} ${cloneDir}`

  //   // Checkout only the files we need
  //   await bash`cd ${cloneDir} && git checkout master -- "${subdirectory}/**/*"`

  //   // Copy files to target folder
  //   fse.copySync(path.join(cloneDir, subdirectory), targetFolder)

  //   // Delete tmp folder
  //   fse.removeSync(cloneDir)
  // }

  // return targetFolder
}

// cloneGithubFolder(
//   'git@github.com:andyshand/one.git',
//   'packages/core/modules/rpc'
// )