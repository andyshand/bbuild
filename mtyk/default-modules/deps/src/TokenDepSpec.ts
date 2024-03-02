import { Observable } from 'rxjs'
import { PackageType } from './packageDep'

export type GetProvidedDep<T> = T extends (...args: any[]) => infer R
  ? R
  : T extends Observable<infer R>
  ? R
  : T extends TokenDepSpec<infer X, infer XX>
  ? T['optional'] extends true
    ? XX | undefined
    : XX
  : T extends PackageDepSpec<infer T, infer TT>
  ? PackageType<T>
  : T

export type GetProvidedDeps<T> = {
  [K in keyof T]: GetProvidedDep<T[K]>
}
export type DepMap = Record<string, any>
export type DepProvider<T> = DepTokenProvider<any, any>
export type DepTokenProvider<DT extends DepType, TT> = {
  token: DT
  value?: TT
  provide?: (() => TT) | (() => Promise<TT> | TT)
}
export type TokenDepSpec<T extends string, TT, Optional extends boolean = boolean> = {
  token?: T
  specType: 'token'
  runtimeType?: any
  optional?: Optional
  __meta: { type: TT }
}

export type PackageDepSpec<T, TT> = {
  package: T
  specType: 'package'
  __meta: { type: TT }
}

export type InterfaceDepSpec<T> = {
  interface: T
  specType: 'interface'
  /**
   * Whether this interface should belong to the actor
   * in the running task context.
   */
  isActor?: boolean
}

export type MachineDepSpec<T> = {
  machine: T
  /**
   * Whether this interface should belong to the actor
   * in the running task context.
   */
  isActor?: boolean
  specType: 'machine'
}

type DepTypeBase =
  | TokenDepSpec<any, any>
  | InterfaceDepSpec<any>
  | MachineDepSpec<any>
  | PackageDepSpec<any, any>

export type DepTypeWithPrivate = {
  private?: boolean
}

export type DepType = DepTypeBase & DepTypeWithPrivate
