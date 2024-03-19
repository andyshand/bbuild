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
export { serialiseResult } from './serialiseResult'

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

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["entities"]) {
console.warn(`Duplicate module entities imported. This can lead to bugs.`);
}
globalStore["entities"] = true;
 
// --- END INJECTED CODE ---