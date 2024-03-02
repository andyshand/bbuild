export default function baseDep<T>(dep: T) {
  return { ...dep, __baseDep: true }
}

export function isDep<T>(dep: any): dep is T {
  return typeof dep === 'object' && !!dep && (dep as any).__baseDep === true
}
