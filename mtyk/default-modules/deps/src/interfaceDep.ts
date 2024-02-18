import { InterfaceDepSpec, MachineDepSpec } from './TokenDepSpec'

export const interfaceDep = <T>() => {
  return { interface: null } as InterfaceDepSpec<T>
}

export const actorIDep = <T>() => {
  return { interface: null, isActor: true } as InterfaceDepSpec<T>
}

export const machineDep = <T>(machine: T) => {
  return { machine, isActor: true } as MachineDepSpec<T>
}
