export function applyPatchToObject(
  obj: Record<string, any>,
  path: (string | number)[],
  value: any
) {
  if (path.length === 1) {
    obj[path[0]] = value
  } else {
    if (!obj[path[0]]) {
      obj[path[0]] = {}
    }
    applyPatchToObject(obj[path[0]], path.slice(1), value)
  }
}
