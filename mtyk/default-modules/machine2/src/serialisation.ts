import { createStateMachine } from "./createStateMachine"
import { Opts } from "./Opts"
import {
  StateContext,
  StateMachine,
  StateMachineTransitions,
} from './StateMachineTransitions'

export type SerializedStateMachine<TArgs, TState extends string, TGlobalState> = {
  currentState: string
  context: StateContext
  globalState: TGlobalState
}

export function serializeStateMachine<TArgs, TState extends string, TGlobalState>(
  stateMachine: StateMachine<TArgs, TState, TGlobalState>
): SerializedStateMachine<TArgs, TState, TGlobalState> {
  return {
    currentState: stateMachine.currentState,
    context: stateMachine.currentContext,
    globalState: stateMachine.globalState,
  }
}

export function deserializeStateMachine<TArgs, TState extends string, TGlobalState>(
  transitions: StateMachineTransitions<TArgs, TState, TGlobalState>,
  serializedStateMachine: SerializedStateMachine<TArgs, TState, TGlobalState>,
  opts: Opts<TGlobalState>
): StateMachine<TArgs, TState, TGlobalState> {
  const { currentState, context, globalState } = serializedStateMachine

  const stateMachine = createStateMachine(transitions, {
    initialState: currentState,
    initialContext: context,
    globalState,
    ...opts,
  })

  return stateMachine
}
