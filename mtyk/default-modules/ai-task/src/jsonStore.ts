const os = require('os')
const home = os.homedir()
const { writeFileSync } = require('fs')
const dir = `${home}/.ai-task`

export function readJSON(key: string) {
  const path = `${dir}/${key}.json`
  try {
    return JSON.parse(path)
  } catch (e) {
    return {}
  }
}

export function writeJSON(key: string, data: any) {
  const json = JSON.stringify(data, null, 2)
  const path = `${dir}/${key}.json`
  writeFileSync(path, json)
}

export const makeStore = (key: string) => {
  return {
    read: () => readJSON(key),
    write: (data: any) => writeJSON(key, data),
  }
}
