import fse from 'fs-extra'

export async function writeJSON(path: string, data: any) {
  await fse.writeJSON(path, data, { spaces: 2 })
}

export async function readJSON(path: string) {
  const content = await fse.readFile(path, 'utf8')
  const moduleName = 'strip-json-comments'
  const stripJsonComments = (await import(moduleName)).default
  return JSON.parse(stripJsonComments(content))
}

