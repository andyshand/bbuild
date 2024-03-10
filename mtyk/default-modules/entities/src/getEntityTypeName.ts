import { EntityTypable } from './EntityTypable'
import { entityType } from './entityType'

export function getEntityTypeName(e: any) {
  return entityType(e)
}

export function entityTypesEqual(a: EntityTypable, b: EntityTypable) {
  return getEntityTypeName(a) === getEntityTypeName(b)
}

export function getEntityTypeDisplayName(entity: EntityTypable) {
  return (
    getEntityTypeName(entity)
      .replace(/Entity$/, '')
      // split on capital letters
      .split(/(?=[A-Z])/)
      .join(' ')
      .toLowerCase()
      .replace(/^[a-z]/, (c) => c.toUpperCase())
  )
}
