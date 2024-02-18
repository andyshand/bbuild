import { EntityTypable } from './EntityTypable'
import { entityType } from './entityType'

export function getEntityTypeName(e: any) {
  return entityType(e)
}

export function entityTypesEqual(a: EntityTypable, b: EntityTypable) {
  return getEntityTypeName(a) === getEntityTypeName(b)
}
