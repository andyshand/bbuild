import fs from 'fs'

import path from 'path'
import { TreeFile, TreeDirectory } from './FileTree'

export async function writeFiles(
  fileTree: TreeDirectory,
  rootDir: string
): Promise<void> {
  for (const [, file] of Object.entries(fileTree.files)) {
    const filePath = path.join(rootDir, file.name)
    if ('type' in file && file.type === 'file') {
      await fs.promises.writeFile(filePath, file.content)
    } else if ('type' in file && file.type === 'directory') {
      await fs.promises.mkdir(filePath, { recursive: true })
      await writeFiles(file as TreeDirectory, filePath)
    }
  }
}

export function findFile(
  fileTree: TreeDirectory,
  filter: (file: TreeFile) => boolean
): TreeFile | undefined {
  for (const [, file] of Object.entries(fileTree.files)) {
    if ('type' in file && file.type === 'file' && filter(file as TreeFile)) {
      return file as TreeFile
    } else if ('type' in file && file.type === 'directory') {
      const foundFile = findFile(file as TreeDirectory, filter)
      if (foundFile) {
        return foundFile
      }
    }
  }
  return undefined
}
