export type DepProvider<T> = any
export type TaskContext = {
  provider: DepProvider<any>
  /**
   * Ensure an action is only performed if the task is still valid?
   */
  perform: (action: any) => any
}
