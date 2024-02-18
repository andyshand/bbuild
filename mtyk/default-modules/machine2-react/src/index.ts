import { StateMachine } from 'modules/machine2/StateMachineTransitions';
import { useState, useLayoutEffect } from 'react'

function useObservable(observable$, initialValue) {
  const [value, update] = useState(initialValue)
  useLayoutEffect(
    function () {
      const s = observable$.subscribe(update)
      return () => s.unsubscribe()
    },
    [observable$]
  )
  return value
}

export function useMachine2<T extends StateMachine<any, any, any>>(machine: T) {
  const _out = useObservable(machine.stateChanges$, machine)
  return machine
}