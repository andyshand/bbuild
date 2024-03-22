import 'reflect-metadata'
import { Observable } from 'rxjs'
import BaseEntityManager from './BaseEntityManager'
import Entity from './Entity'
import { getEntityFieldMetadata } from './EntityField'
import { IEntityManager } from './IEntityManager'

export abstract class DbEntityManager extends BaseEntityManager implements IEntityManager {
  instances: Map<string, Entity> = new Map()

  abstract create(entityType, entity): Promise<any>
  abstract read(entityType, id): Promise<any>
  abstract update(entityType, id, updates, revisionNumber: number): Promise<any>
  abstract delete(entityType, id): Promise<any>
  abstract find(entityType, query): Promise<any>
  abstract watch(entityType, opts: { id: string }): Observable<any>

  async call(entityType: any, id: any, method: any, args: any): Promise<any> {
    const entity = await this.read(entityType, id)
    if (!entity) {
      throw new Error(`Entity not found: ${entityType} ${id}`)
    }

    if (!entity[method]) {
      throw new Error(`Method not found: ${method}`)
    }

    return entity[method](...args)
  }

  protected async saveOrUpdateRelatedEntities(entity: any, entityType: string): Promise<any> {
    const entityClass = this.findEntityClass(entityType)
    if (!entityClass) {
      throw new Error(`Unknown entity type: ${entityType}`)
    }

    const instance = new entityClass()
    const updatedData = { ...entity }

    for (const key of Object.getOwnPropertyNames(instance)) {
      const relatedEntityType = Reflect.getMetadata('relation', instance, key)
      if (relatedEntityType) {
        const relatedEntities = entity[key] as Entity[]

        const relatedEntityIds: string[] = []
        for (const relatedEntity of relatedEntities) {
          if (relatedEntity.isNew) {
            const createdEntity = await this.create(relatedEntityType, relatedEntity)
            relatedEntityIds.push(createdEntity.id)
          } else if (relatedEntity.isDirty) {
            await this.update(
              relatedEntityType,
              relatedEntity.id,
              relatedEntity.getUpdates(),
              relatedEntity.revisionNumber
            )
            relatedEntityIds.push(relatedEntity.id)
          } else {
            relatedEntityIds.push(relatedEntity.id)
          }
        }

        updatedData[key] = relatedEntityIds
      }
    }

    return updatedData
  }

  protected async applySerializableOptions(
    entity: any,
    entityType: string,
    direction: 'onSave' | 'onLoad' | 'onCreate'
  ): Promise<any> {
    const entityClass = this.findEntityClass(entityType)
    if (!entityClass) {
      throw new Error(`Unknown entity type: ${entityType}`)
    }

    const transientInstance = this.createEntityInstance(entityType, entity, true)
    const updatedData = { ...entity }

    for (const field of transientInstance.getEntityFields()) {
      const metadata = getEntityFieldMetadata(transientInstance, field)

      if (direction === 'onSave' || direction === 'onCreate') {
        if (metadata.unique) {
          // Make sure there are no duplicates in the db
          const uniqueValue = entity[field]
          const [existingEntity] = await this.find(entityType, {
            [field]: uniqueValue,
            ...('id' in entity && { id: { $ne: entity.id } }),
          })
          if (existingEntity) {
            throw new Error(`Entity with ${field} ${uniqueValue} already exists`)
          }
        }

        if (
          !metadata.defaultValue &&
          entity[field] === undefined &&
          direction === 'onCreate'
        ) {
          throw new Error(`Missing required field: ${field}`)
        } else if (metadata.defaultValue && entity[field] === undefined) {
          updatedData[field] = metadata.defaultValue
        }
      }
    }

    return updatedData
  }

  async populate(entityType: string, entity: any): Promise<any> {
    const fieldsWithRelationMetadata = Object.getOwnPropertyNames(entity).map((key) => {
      return {
        field: key,
        metadata: Reflect.getMetadata('entityRelation', entity, key),
      }
    })
    const fields = fieldsWithRelationMetadata.filter((field) => field.metadata)
    const populatedEntity = { ...entity }

    for (const { metadata, field } of fields) {
      const innerType = metadata
      if (Array.isArray(entity[field])) {
        try {
          populatedEntity[field] = await Promise.all(
            entity[field].map((id) => this.read(innerType, id))
          )
        } catch (e) {
          console.error(e)
        }
      } else if (typeof entity[field] === 'string') {
        try {
          populatedEntity[field] = await this.read(innerType, entity[field])
        } catch (e) {
          console.error(e)
        }
      }
    }

    return populatedEntity
  }
}
