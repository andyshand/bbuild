import baseDep from './baseDep'
import { keyDep } from './tokenDep'

type Types = typeof String | typeof Number | typeof Boolean | typeof Function

type InferType<T extends Types> = T extends typeof String
  ? string
  : T extends typeof Number
  ? number
  : T extends typeof Boolean
  ? boolean
  : T extends typeof Function
  ? Function
  : never

/**
 * @deprecated probably best using zodDep, very restrictive
 * @example
 * const depString = typeDep(String);
 * const depNumber = typeDep(Number);
 * const depBoolean = typeDep(Boolean);
 */
export const typeDep = <
  T extends Types,
  Optional extends boolean = boolean,
  Token extends string = string
>(
  typeConstructor: T,
  opts: {
    token?: Token
    optional?: Optional
  } = {}
) => {
  const dep = keyDep<InferType<T>, Optional, Token>(opts.token, opts)
  const asString = typeConstructor.name.toLowerCase()
  return baseDep({ ...dep, runtimeType: asString })
}
