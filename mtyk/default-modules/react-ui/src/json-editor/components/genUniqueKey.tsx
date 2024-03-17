export function genUniqueKey(obj: object) {
  let key = 'NEW_KEY'
  let index = 1
  while (key in obj) {
    key = `NEW_KEY_${index}`
    index++
  }
  return key
}
