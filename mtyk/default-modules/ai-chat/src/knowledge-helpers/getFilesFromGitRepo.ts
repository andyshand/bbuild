import * as fs from 'fs'
import * as glob from 'glob'
import ignore from 'ignore'
import * as path from 'path'
import * as ts from 'typescript'
import { extractExports, extractImports, readGitIgnore } from './sourceFile2'
import { File } from './Export'
import { isIgnored } from './isIgnored'

export async function getFilesFromGitRepo(repoPath: string): Promise<File[]> {
  const ignoreFilter = ignore().add(readGitIgnore(repoPath))
  const tsFiles = glob
    .sync('**/*.+(ts|tsx)', {
      cwd: repoPath,
    })
    .filter((file) => !ignoreFilter.ignores(file))

  return (
    await Promise.all(
      tsFiles.map(async (file) => {
        return getFileFromGitRepo(repoPath, file)
      })
    )
  ).filter(Boolean) as File[]
}

export async function getFileFromGitRepo(
  repoPath: string,
  repoRelativePath: string
) {
  if (isIgnored(repoPath, repoRelativePath)) {
    console.log(`File ${repoRelativePath} is ignored by .gitignore`)
    return null
  }

  const fullPath = path.join(repoPath, repoRelativePath)
  const contents = fs.readFileSync(fullPath, 'utf-8')
  const sourceFile = ts.createSourceFile(
    repoRelativePath,
    contents,
    ts.ScriptTarget.Latest,
    true
  )
  const stats = fs.statSync(fullPath)

  return {
    path: repoRelativePath,
    contents,
    updatedAt: stats.mtime,
    createdAt: stats.birthtime,
    language: path.extname(repoRelativePath).substring(1),
    fileName: path.basename(repoRelativePath),
    exports: extractExports(sourceFile),
    imports: extractImports(sourceFile),
    modified: stats.mtime,
  }
}
