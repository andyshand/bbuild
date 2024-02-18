import { TokenDepSpec } from './TokenDepSpec'

export const keyDep = <
  TT,
  Optional extends boolean = boolean,
  T extends string = string
>(
  token?: T,
  opts: {
    optional?: Optional
  } = {}
) => {
  // If no token provided, should use from path of dep spec object
  return { token, specType: 'token', optional: opts?.optional } as TokenDepSpec<
    T,
    TT,
    Optional
  >
}

export const keyArg = keyDep
