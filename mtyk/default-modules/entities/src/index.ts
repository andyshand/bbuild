import 'reflect-metadata'
import Entity from './Entity'
import { IEntityManager } from './IEntityManager'

export { default as Entity } from './Entity'
export { default as EntityField } from './EntityField'
export { default as EntityFunction } from './EntityFunction'
export { default as EntityRelation } from './EntityRelation'
export type { EntityTypable } from './EntityTypable'
export type { IEntityManager } from './IEntityManager'
export { Serialisable, serializableMetadataKey } from './Serialisable'
export { entityType } from './entityType'
export { MemoryEntityManager } from './MemoryEntityManager'
export { getEntityTypeName, entityTypesEqual } from './getEntityTypeName'

export const upsert =
  (entityManager: IEntityManager) =>
  async <T extends Entity>(
    entityType: string,
    query: any,
    data = query
  ): Promise<T> => {
    const [existing] = await entityManager.find(entityType, query)
    if (existing) {
      return entityManager.update(
        entityType,
        existing.id,
        data,
        (existing.revisionNumber ?? 0) + 1
      )
    } else {
      return entityManager.create(entityType as any, data)
    }
  }
