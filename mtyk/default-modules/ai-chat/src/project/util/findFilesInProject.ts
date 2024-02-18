
import { globalDepContext } from "modules/deps/createDepContext";
import { keyDep } from "modules/deps/tokenDep";
import projectDirs from './projectDirs';

export function findFilesInPath({ file, path }: { file: string; path: string }) {
  if (!file || !file.trim().length) {
    return []
  }

  const { fs, glob } = globalDepContext.provideSync({
    fs: keyDep('fs'),
    glob: keyDep('glob'),
  })

  try {
    if (file.startsWith('/') && fs.existsSync(file)) {
      // Just return the file if it exists
      return [file]
    }
  } catch (e) {
    console.error(e)
  }

  const fileNameIsh = file.split("/").pop()?.replace(/\.[a-z]+$/, "") ?? ''

  if (fileNameIsh) {
    const similar = glob.sync(`${path}/**/*${fileNameIsh}*.{js,ts,jsx,tsx}`, {
      // Case insensitive
      nocase: true,

      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.next/**",
        "**/.git/**",
        "**/.yarn/**",
        "**/built-modules/**",
        "**/.cache/**",
      ],
    })

    // Sort exact matches first
    similar.sort((a, b) => {
      const aExact = a.endsWith('/' + file)
      const bExact = b.endsWith('/' + file)
      if (aExact && !bExact) {
        return -1
      }
      if (!aExact && bExact) {
        return 1
      }
      return 0
    })
    return similar
  }
  return []
}

export default async function findFilesInProject({ project, file, diffContent }: { project: string, file: string, diffContent?: string }) {
  const projectPaths = projectDirs[project] ?? []
  const findings: { path: string; contentMatches: boolean, content: string }[] = []

  const { fs } = globalDepContext.provideSync({
    fs: keyDep('fs'),
  })

  for (const path of projectPaths) {
    const results = await findFilesInPath({ file, path })
    for (const result of results) {
      const content = fs.readFileSync(result, "utf8").toString()
      const contentMatches = content === diffContent
      findings.push({ path: result, content, contentMatches })
    }
  }
  return findings

}