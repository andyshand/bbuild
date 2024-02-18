type Permissions = {
  type: string
}
interface SuggestedAction {
  action: string
}

export interface Actionresult {
  success: boolean
  needsPermissions?: Permissions[]
  result: any
  suggested?: SuggestedAction[]
}
