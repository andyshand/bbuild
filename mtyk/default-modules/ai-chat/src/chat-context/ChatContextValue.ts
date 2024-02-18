import { Location } from "../actions/Action"

export type ChatContextValue = {
  type: 'file',
  path: Location,
  name: string
}