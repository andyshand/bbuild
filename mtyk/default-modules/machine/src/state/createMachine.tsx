import { assert, uniqueId } from '@mtyk/util'
import { clone } from 'remeda'
import { map, ReplaySubject } from 'rxjs'

import {
  getStateTransitionFn,
  getStateTransitionInfo,
  IMachine,
  IStateDesc,
  MachineStateObj,
  StateContextForKey,
  TransitionHandle,
} from './IStateDesc'
import { MachineOpts } from './MachineOpts'

export function createMachine<S extends IStateDesc>(
  states: S,
  opts: MachineOpts<S> = {}
): IMachine<S> {
  const currState = new ReplaySubject<MachineStateObj<S>>(1)
  const progress = new ReplaySubject<number>(1)
  const inTransitionTo = new ReplaySubject<string>(1)
  const isTransitioning = new ReplaySubject<boolean>(1)
  let latestValue: MachineStateObj<S> = {
    state: 'uninitialized',
    context: {} as any,
    args: {},
  }

  const setValue = (obj: MachineStateObj<S>) => {
    latestValue = obj
    currState.next(obj)
    return obj
  }

  let transitioning = false
  const setTransitioning = (val: boolean) => {
    transitioning = val
    isTransitioning.next(val)
  }
  const queuedTransitions: { stateName: string, data: any }[] = []

  const api = {
    id: uniqueId(),
    state: currState,
    update: data => {
      return api.transition(latestValue.state, data)
    },

    transition: async <K extends keyof S>(
      stateName: K,
      data: StateContextForKey<S, K>
    ) => {
      assert(!transitioning, 'Already transitioning')
      inTransitionTo.next(stateName.toString())

      const transitioningFrom = clone(latestValue)

      setTransitioning(true)
      const transitionValOrFn = getStateTransitionFn(states[stateName])

      const currInfo = getStateTransitionInfo(states[latestValue.state])
      assert(
        !currInfo?.final,
        `Current state is final: ${latestValue.state.toString()} -> ${String(
          stateName
        )}`
      )

      const info = getStateTransitionInfo(states[stateName])
      if (info.from) {
        // Check that we're in the correct state
        assert(
          info.from.includes(latestValue.state.toString()),
          `Invalid state transition: ${latestValue.state.toString()} -> ${String(
            stateName
          )}`
        )
      }

      let didInnerTransition = false
      try {
        if (typeof transitionValOrFn === 'function') {
          let dataMaybeInjected = data

          const handle = {
            currentState: latestValue,
            // Incase we want to transition to a new state from within,
            // we pass a handle to an inner transition function
            transition: ((...args: any[]) => {
              setTransitioning(false)
              didInnerTransition = true
              return (api.transition as any)(...args)
            }) as any, // TODO work out implementation

            progress: opts => {
              progress.next(opts.progress)
            },
          } as TransitionHandle<S>

          const newState = await transitionValOrFn(dataMaybeInjected, handle)
          if (didInnerTransition) {
            return newState
          }

          return setValue({ state: stateName, context: newState, args: data })
        } else {
          return setValue({
            state: stateName,
            context: transitionValOrFn,
            args: data,
          })
        }
      } catch (e) {
        // If we error during a transition, go to the error state
        console.error(e)
        setValue({
          // TODO add this state to the type system
          state: transitioningFrom.state,
          context: {
            ...transitioningFrom.context,
            error: { error: e, transition: { state: stateName, data } },
          } as any,
          args: data,
        })
      } finally {
        setTransitioning(false)
        if (queuedTransitions.length > 0) {
          const next = queuedTransitions.shift()!
          api.transition(next.stateName, next.data)
        }
      }
    },
    queueTransition: (stateName, data) => {
      // Wait for the current transition to finish
      queuedTransitions.push({ stateName, data })
    },
    is: (...stateNames) => currState.pipe(map(p => stateNames.includes(p))),
    isIn: (...stateNames) =>
      inTransitionTo.pipe(map(p => stateNames.includes(p))),
    get _state() {
      return latestValue
    },
    states,
    forceUpdate: state => {
      setValue(state)
    },
    progress,
    _isTransitioning: () => transitioning,
    isTransitioning,
    inTransitionTo,
  }

  return api
}
