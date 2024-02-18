export * from './createMachine'
export * from './IStateDesc'

export function getActionContext() {
  return {
    /**
     * Runs when the action is successful
     */
    cleanup: (fn: () => Promise<void>) => {
      // TODO
    },
  }
}
