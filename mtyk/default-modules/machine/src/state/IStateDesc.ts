import { Observable, ReplaySubject } from 'rxjs'
import type { UnionToIntersection } from 'type-fest'
import { ReturnTypeOrAwaited } from './ReturnTypeOrAwaited'

export interface TransitionHandle<
  S extends IStateDesc = any,
  K extends keyof S = keyof S
> {
  currentState: MachineStateObj<S, K>
  /**
   * If called inside a transition, will skip straight to the specified state.
   *
   * If you call this, you must return from the calling transition function
   * straight away
   */
  transition: MachineTransitionFn<S>

  /**
   * Record progress information partway through a transition
   */
  progress: (progressUpdateOpts: { progress: number }) => void
}

export type StateTransitionFn<
  S extends IStateDesc,
  K extends keyof S = keyof S,
  NewContext = any,
  ArgsOrDeps = any
> = (
  args: ArgsOrDeps,
  existingState: TransitionHandle<S, K>
) => Promise<NewContext> | Observable<NewContext> | NewContext

export type IStateDescValObj<
  Desc extends IStateDesc = any,
  K extends keyof Desc = keyof Desc
> = {
  transition: StateTransitionFn<Desc, K>
  /**
   * Valid states to transition from
   */
  from?: string[]

  /**
   * Is this the final state? If a final state is reached, no further transitions
   * can be made
   */
  final?: boolean
}

export type IStateDescVal<S extends IStateDesc = any> =
  | IStateDescValObj<S>
  | StateTransitionFn<S>

export type GetTransitionType<T> = T extends { transition: infer R } ? R : T

export type IStateDesc = { [key: string]: IStateDescVal }
export type StateArgsForKey<
  S extends IStateDesc,
  K extends keyof S
> = Parameters<GetTransitionType<S[K]>>[0]
export type StateContextForKey<
  S extends IStateDesc,
  K extends keyof S
> = ReturnTypeOrAwaited<GetTransitionType<S[K]>> & Record<string, any>

export type StateTransitionArgsForKey<
  S extends IStateDesc,
  K extends keyof S
> = Parameters<GetTransitionType<S[K]>>[0]

export type StateContextUnion<S extends IStateDesc> = StateContextForKey<
  S,
  keyof S
>
type TransitionToState = { _transition: any[] }

export type TransitionReturn<S extends IStateDesc> =
  | StateContextUnion<S>
  | TransitionToState

export type ITransitionInitiator = { id: string }

export type TransitionRequirements<
  S extends IStateDesc = any,
  K extends keyof S = keyof S & string
> = {
  state: K
  initiator?: ITransitionInitiator
  data: StateTransitionArgsForKey<S, K>
}

export type TransitionData<
  S extends IStateDesc,
  K extends keyof S
> = TransitionRequirements<S, K>

export type MachineTransitionFn<S extends IStateDesc> = <K extends keyof S>(
  key: K,
  data: StateArgsForKey<S, K>
) => Promise<MachineStateObj<S>>

export type MachineStateObj<
  S extends IStateDesc,
  K extends keyof S = keyof S
> = {
  state: K
  context: StateContextUnion<S>

  /**
   * The args that were passed to the transition fn
   */
  args: any
}

export type IMachine<S extends IStateDesc = any> = {
  /**
   * Unique id that represents this machine
   */
  id: string

  state: ReplaySubject<MachineStateObj<S>>
  _state: MachineStateObj<S>
  isTransitioning: Observable<boolean>
  progress: Observable<number>

  forceUpdate: (state: MachineStateObj<S>) => void

  transition: MachineTransitionFn<S>
  queueTransition: (key: keyof S, data: any) => void
  update: (state: MachineStateObj<S>['context']) => void

  is: (...stateNames: (keyof S)[]) => Observable<boolean>

  states: S
}

export function getStateTransitionFn<S extends IStateDesc>(
  val: S[keyof S]
): StateTransitionFn<any> {
  if (typeof val === 'function') {
    return val
  }
  return val?.transition
}
export function getStateTransitionInfo<S extends IStateDesc>(
  val: S[keyof S]
): IStateDescValObj {
  if (typeof val === 'function') {
    return { transition: val }
  }
  return val
}

export function getStateTransitionFn2<
  S extends IMachine<any>
  // Desc = S extends IMachine<infer X> ? X : never
>(s: S, val: keyof S['states']): StateTransitionFn<any> {
  // TODO fix bad types here
  return getStateTransitionFn(s.states[val] as any)
}

export type MachineStateDesc<I extends IMachine> = I extends IMachine<infer X>
  ? X
  : never

export type MachineState<
  M extends IMachine<any>,
  Key extends keyof M['states']
> = M extends IMachine<infer S> ? StateContextForKey<S, Key> : never

export type GetMachineStateKeys<M extends IMachine<any>> = M extends IMachine<
  infer X
>
  ? keyof X
  : never

export type GetAllMachineStates<M extends IMachine<any>> = M extends IMachine<
  infer S
>
  ? StateContextUnion<S>
  : never

/**
 * Extracts all possible transition functions for a given machine.
 */
export type GetAllMachineTransitions<M extends IMachine<any>> =
  M extends IMachine<infer S>
    ? {
        [K in keyof S]: (
          args: StateTransitionArgsForKey<S, K>
        ) => Promise<StateContextForKey<MachineStateDesc<M>, K>>
      }
    : never

export type IEntityMachineMap = {
  [entityType: string]: { [machineName: string]: IMachine<any> }
}

/**
 * Extracts all possible transition functions for all machines in a given machine map
 */
export type GetAllMachineMapTransitions<EM extends IEntityMachineMap> = {
  // The return type is an object that maps each entity type in EM to the union of all transition functions for that entity type.
  [E in keyof EM]: UnionToIntersection<
    GetAllMachineTransitions<EM[E][keyof EM[E]]>
  >
}

export type GetAllMachineMapStates<EM extends IEntityMachineMap> = {
  [E in keyof EM]: UnionToIntersection<
    ReturnTypeOrAwaited<GetAllMachineTransitions<EM[E][keyof EM[E]]>>
  >
}

/**
 * Merges the properties of all keys in an object.
 * @template T An object type.
 */
export type MergeProperties<T extends object> = {
  // The return type is an object that has a union of all properties of all keys in T.
  [K in keyof T]: T[K]
}

export type MergeEntityMachineMapsToTransitions<
  EM extends IEntityMachineMap[]
> = UnionToIntersection<
  MergeProperties<GetAllMachineMapTransitions<EM[number]>>
>
export type MergeEntityMachineMaps<EM extends IEntityMachineMap[]> =
  UnionToIntersection<MergeProperties<EM[number]>>
