import fs from 'fs/promises'
import git, { GitRepoInfo } from 'git-repo-info'

export default async function fileInfo(filePath: string): Promise<{
  size: number,
  permissions: string,
  git: GitRepoInfo,
  path: string,
  createdAt: Date,
  updatedAt: Date
}> {
  const gitInfo = git()
  const stats = await fs.stat(filePath)

  return {
    size: stats.size,
    permissions: 'rw-r--r--',
    git: gitInfo,
    path: filePath,
    createdAt: stats.birthtime,
    updatedAt: stats.mtime
  }
}