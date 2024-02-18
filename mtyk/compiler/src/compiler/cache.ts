import { makeCacheHashFromGlob } from './file/glob';

const lastCacheHashes: { [key: string]: string } = {}

export function hasCacheChanged(glob: string, options = {}, id?: string) {
  const key = id ?? glob
  const cacheHash = makeCacheHashFromGlob(glob, options)
  // console.log('cacheHash for ' + glob, cacheHash)
  if (lastCacheHashes[key] !== cacheHash) {
    lastCacheHashes[key] = cacheHash
    return true
  }
  return false
}
