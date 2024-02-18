import { useMachine2 } from '.'
import { StateMachine } from '../../machine2/src/StateMachineTransitions'

export interface MachineDebugProps {
  machine: StateMachine<any, any, any>
}
export interface MachineDebugRefHandle {
 
}

export default function MachineDebug(props: MachineDebugProps) {
  const machine = useMachine2(props.machine)
  return <div style={{
    whiteSpace: 'pre-wrap'
  }}>
    currentstate: {machine.currentState}<br />
    currentcontext: {JSON.stringify(machine.currentContext, null, 2)}<br />
    lasterror: {JSON.stringify(machine.lastError, null, 2)}<br />
  </div>
}