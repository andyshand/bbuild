import { TokenDepSpec } from './TokenDepSpec'
import baseDep from './baseDep'

export const keyDep = <
  TT,
  Optional extends boolean = boolean,
  T extends string = string,
>(
  token?: T,
  opts: {
    optional?: Optional
  } = {}
) => {
  // If no token provided, should use from path of dep spec object
  return baseDep({
    token,
    specType: 'token',
    optional: opts?.optional,
  } as TokenDepSpec<T, TT, Optional>)
}

// AI: These generic args need to be kept in sync with above
// to keep typescript happy
export const privateDep = <
  TT,
  Optional extends boolean = boolean,
  T extends string = string,
>(
  token?: T,
  opts: {
    optional?: Optional
  } = {}
) => {
  return {
    ...keyDep<TT, Optional, T>(token, opts),
    private: true,
  }
}
export const keyArg = keyDep
