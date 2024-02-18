import {
  UniverseContextItem,
  UniverseContextItemType,
} from './UniverseEntityContextItem'

type JSONObject = { [key: string]: JSONValue }
type JSONArray = JSONValue[]
type JSONValue = string | number | boolean | null | JSONObject | JSONArray
export type ContextProviderOptions = {
  query?: string
  id?: string
  environment?: JSONObject
}
export type ResolutionContext = {
  fullPath: string[] // full path passed at the beginning
  partialPath: string[] // path for this resolver

  environment?: JSONObject
  parent?: any // The parent of the current item being resolved
  filter?: ContextProviderOptions // The filter options passed to the `provide` method

  createContextItem: (opts: Partial<UniverseContextItem>) => UniverseContextItem
}
