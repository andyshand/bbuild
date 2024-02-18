import { observable } from '@legendapp/state'

export type ISelectedEntity = {
  id: string
  type: string
  selectionSource?: {
    id: string
  }
}

export const selectedEntities$ = observable(
  {} as Record<
    string, // string is location
    ISelectedEntity
  >
)

export function addSelectedEntity(location: string, entity: ISelectedEntity) {
  // selectedEntities$.assign({ [location]: entity })
}

export function toggleSelectedEntity(location: string) {
  // if (selectedEntities$.has(location)) {
  //   selectedEntities$.delete(location)
  // } else {
  //   const entity = { id: location, type: 'default' }
  //   selectedEntities$.set(location, entity)
  // }
}

export function removeSelectedEntity(location: string) {
  // selectedEntities$.delete(location)
}
