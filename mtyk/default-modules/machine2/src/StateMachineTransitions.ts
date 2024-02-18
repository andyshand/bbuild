import { Observable, Subject } from 'rxjs'
import { TransitionStatus } from './Opts'

export type StateContext = any
export type StateCleanupFn = () => void | Promise<void>
export type IDisposable = { dispose: () => void }

type MaybePromise<T> = T | Promise<T>
type TransitionReturnInner =
  StateContext | Observable<StateContext>
  | [StateContext, StateCleanupFn | undefined]
  | [Observable<StateContext>, StateCleanupFn]

type TransitionReturn = MaybePromise<TransitionReturnInner>
export type StateTransition<TArgs, TState, GlobalState> = (
  args: TArgs,
  utils: {
    current: TState
    state: GlobalState
    registerDisposable: (disposable: IDisposable) => void
    transition: (newState: TState, args?: TArgs) => TransitionReturn
  }
) => TransitionReturn
export type StateMachineTransitions<TArgs, TState extends string, GlobalState> = {
  [K in TState]: StateTransition<TArgs, TState, GlobalState>
} & {
  priority?: Partial<Record<TState, number>>;
}

export type StateMachineLastError<TState extends string> = {
  stateName: TState,
  args: any,
  previousState: TState,
  previousContext: any,
  error: Error,
}

export type StateMachine<TArgs, TState extends string, GlobalState> = {
  currentState: TState
  lastError?: StateMachineLastError<TState>,
  currentContext: StateContext
  transitions: StateMachineTransitions<TArgs, TState, GlobalState>
  transitionTo: (newState: TState, args?: TArgs) => Promise<void>
  isTransitioning: boolean
  globalState: GlobalState
  stateChanges$: Observable<{ state: TState; context: StateContext, transitionStatus: TransitionStatus, lastError: StateMachineLastError<TState> }>
  _stateChanges$: Subject<Partial<{ state: TState; context: StateContext, transitionStatus: TransitionStatus, lastError: StateMachineLastError<TState> }>>
}
