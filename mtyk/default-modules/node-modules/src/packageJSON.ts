import { uniq } from 'modules/dash'

export type RemoveUndefined<T> = T extends undefined ? never : T

// A type that gets all the keys matching `substr` from an interface
export type KeysMatching<T, substr extends string> = RemoveUndefined<
  {
    [K in keyof T]: K extends string
      ? Lowercase<K> extends `${string}${Lowercase<substr>}${string}`
        ? K
        : never
      : never
  }[keyof T]
>

export interface PackageJSON extends Record<string, any> {
  name: string
  version: string
  description?: string
  keywords?: string[]
  homepage?: string
  bugs?: string | { email?: string; url?: string }
  workspaces?: string[]
  license?: string
  author?: string | { name?: string; email?: string; url?: string }
  contributors?: Array<string | { name?: string; email?: string; url?: string }>
  files?: string[]
  main?: string
  types?: string
  typings?: string
  bin?: string | { [key: string]: string }
  module?: string
  index?: string
  dependencies?: { [key: string]: string }
  devDependencies?: { [key: string]: string }
  peerDependencies?: { [key: string]: string }
  optionalDependencies?: { [key: string]: string }
  bundledDependencies?: string[]
  scripts?: { [key: string]: string }
}

function mergeDeps<T extends KeysMatching<PackageJSON, 'dependencies'>>(
  source: PackageJSON,
  destination: PackageJSON,
  key: any
) {
  if (key in source) {
    if (!destination[key]) {
      destination[key] = {}
    }
    for (const depKey of Object.keys(source[key]!)) {
      destination[key]![depKey] = source[key]![depKey]
    }
  }
}

export function mergePackageJSON(
  destination: PackageJSON,
  source: PackageJSON
) {
  for (const key of Object.keys(source)) {
    if (/dependencies/i.test(key)) {
      mergeDeps(source, destination, key as any)
    } else if (key === 'workspaces') {
      // Ensure a unique array
      destination[key] = uniq([
        ...(destination[key] ?? []),
        ...(source[key] ?? []),
      ])
    } else {
      destination[key] = source[key]
    }
  }

  return destination
}
