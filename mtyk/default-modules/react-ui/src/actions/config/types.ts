type AllActions = {}

export type ActionKeys = keyof AllActions
export type ActionVals = AllActions[ActionKeys]

export type Action = ActionKeys
export type GetActionValForKey<T extends Action> = T extends Action ? AllActions[T] : never

export type GetActionParams<T extends Action> = T extends Action ? Parameters<GetActionValForKey<T>>[0] : never
export type GetActionReturn<T extends Action> = T extends Action ? ReturnType<GetActionValForKey<T>> : never
