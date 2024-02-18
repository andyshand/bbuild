export default function assert(
  val: boolean,
  msg?: string
): asserts val is true {
  if (!val) {
    throw new Error(msg ?? 'Assertion failed')
  }
}

type __ScopedName = any
export function assertType<
  T extends 'string' | 'number' | 'boolean' | 'object' | 'function'
>(
  val: unknown,
  type: T,
  msg?: string,
  name?: __ScopedName
): asserts val is T extends 'string'
  ? string
  : T extends 'number'
  ? number
  : T extends 'boolean'
  ? boolean
  : T extends 'object'
  ? object
  : T extends 'function'
  ? Function
  : never {
  assert(
    typeof val === type,
    msg ?? `Assertion failed: ${name} is not of type ${type}`
  )
}
