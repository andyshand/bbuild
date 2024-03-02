import 'reflect-metadata'
import Entity from './Entity'
import { IEntityManager } from './IEntityManager'

export { default as Entity } from './Entity'
export { default as EntityField } from './EntityField'
export { default as EntityFunction } from './EntityFunction'
export { default as EntityRelation } from './EntityRelation'

export type { EntityTypable } from './EntityTypable'

export { Serialisable, serializableMetadataKey } from './Serialisable'
export { entityType } from './entityType'
export { entityTypesEqual, getEntityTypeName } from './getEntityTypeName'

// Entity managers
export type { IEntityManager } from './IEntityManager'
export { MemoryEntityManager } from './MemoryEntityManager'
export { RPCEntityManager } from './RPCEntityManager'
export { RemoteEntityManager } from './RemoteEntityManager'

export const upsert =
  (entityManager: IEntityManager) =>
  async <T extends Entity>(entityType: string, query: any, data = query): Promise<T> => {
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
