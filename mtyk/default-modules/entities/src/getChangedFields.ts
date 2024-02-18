import Entity from './Entity'

export default function getChangedFields(entity1: Entity, entity2: Entity) {
  const entityFields1 = entity1.getEntityFields()
  const entityFields2 = entity2.getEntityFields()
  const commonEntityFields = entityFields1.filter((field) =>
    entityFields2.includes(field)
  )

  const changedFields = {}

  for (const field of commonEntityFields) {
    if (entity1[field] !== entity2[field]) {
      changedFields[field] = entity2[field]
    }
  }

  return changedFields
}
