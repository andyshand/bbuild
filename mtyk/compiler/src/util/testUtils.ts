import fs from 'fs/promises'

export async function withTempTestDir(fn: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp('/tmp/test-')
  try {
    await fn(dir)
  } catch (e) {
    throw e
  } finally {
    await fs.rmdir(dir, { recursive: true })
  }
}

export function tempTest(fn: (dir) => Promise<void>) {
  return () => withTempTestDir(fn)
}
