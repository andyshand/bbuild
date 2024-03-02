import { mapValues } from 'modules/dash'

export const serverOnly = <T>(deps: T): T => {
  return mapValues(deps, (dep: any) => {
    return {
      ...dep,
      private: true,
    }
  })
}
