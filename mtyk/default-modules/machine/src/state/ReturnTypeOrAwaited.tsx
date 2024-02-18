export type ReturnTypeOrAwaited<T> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? R
  : T extends (...args: any[]) => infer R
  ? R
  : never
