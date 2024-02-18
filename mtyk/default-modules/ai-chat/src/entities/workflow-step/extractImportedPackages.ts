import { flattenDeep } from 'modules/dash'

/**
 * This function finds and returns all the import statements in a given file content.
 * It will find:
 * - Regular import statements (e.g., import { something } from 'somewhere')
 * - Simple import statements (e.g., import 'somewhere')
 * - Typescript specific 'import type' statements (e.g., import type { something } from 'somewhere')
 *
 * It will ignore:
 * - Relative import statements (those starting with '.' or '/')
 */
export default function findFileImports(fileContents: string) {
  const importRegex = /import[\s\w,]+{?[\s\w,]+}?[\s\w,]+from\s+['"]([^'"]+)['"]/g
  const simpleImportRegex = /import[\w\s\n*]+['"]([@a-zA-Z0-9-/]+)['"]/g
  // Match typescipt only 'import type' syntax
  const typeImportRegex = /import\s+type\s+{?[\s\w,]+}?[\s\w,]+from\s+['"]([^'"]+)['"]/g

  // Find all captured groups for both regex
  const imports = flattenDeep([
    ...[...fileContents.matchAll(importRegex)].map((m) => m[1]),
    ...[...fileContents.matchAll(simpleImportRegex)].map((m) => m[1]),
    ...[...fileContents.matchAll(typeImportRegex)].map((m) => m[1]),
  ])

  return imports
    .map((i: string) => i.trim())
    .filter((i: string) => !i.startsWith('.') && !i.startsWith('/'))
}
