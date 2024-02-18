import ignore from 'ignore';
import { readGitIgnore } from './sourceFile2';

const gitIgnoreCache: { [repoPath: string]: ReturnType<typeof ignore>; } = {};
function getGitIgnoreFilter(repoPath: string): ReturnType<typeof ignore> {
  if (!gitIgnoreCache[repoPath]) {
    gitIgnoreCache[repoPath] = ignore().add(readGitIgnore(repoPath));
  }
  return gitIgnoreCache[repoPath];
}

export function isIgnored(repoPath: string, filePath: string): boolean {
  const ignoreFilter = getGitIgnoreFilter(repoPath);
  return ignoreFilter.ignores(filePath);
}
