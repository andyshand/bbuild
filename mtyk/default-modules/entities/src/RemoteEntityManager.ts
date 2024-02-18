import { Observable } from 'rxjs'
import BaseEntityManager from './BaseEntityManager'
import Entity from './Entity'
import { CreatedEntity, EntityType, IEntityManager } from './IEntityManager'
import { UnknownEntity } from './UnknownEntity'
import { entityTypesEqual } from './getEntityTypeName'
import { Constructor } from 'type-fest'

let nextId = 0

export abstract class RemoteEntityManager extends BaseEntityManager implements IEntityManager {
  instances: Map<string, Entity> = new Map()
  id: string = (++nextId).toString()

  findEntityClass(entityType: string) {
    return this.entities.find((e) => entityTypesEqual(entityType, e))
  }

  protected createEntityInstance(entityType: any, data: any): any {
    let instance = this.instances.get(data.id)
    if (!instance) {
      const EntityClass = this.findEntityClass(entityType)
      if (!EntityClass) {
        instance = new UnknownEntity(this, data.id, data)
      } else {
        instance = new EntityClass(this, data.id, data)
      }
    } else {
      if ('revisionNumber' in data && data.revisionNumber > instance.revisionNumber) {
        const { revisionNumber, ...updates } = data
        return instance.applyWatchUpdate(updates, revisionNumber)
      }
    }
    // instance.revisionNumber = Math.max(data.revisionNumber ?? instance.revisionNumber, instance.revisionNumber);
    this.instances.set(data.id, instance)
    return instance
  }
  // protected createEntityInstance(entityType: string, data: any): any {
  //   const EntityClass = this.findEntityClass(entityType)
  //   if (!EntityClass) {
  //     const e = new UnknownEntity(this, data.id, data);
  //     e.unknownType = entityType;
  //     e.unknownData = data;
  //     return e
  //   }
  //   return new EntityClass(this, data.id, data);
  // }

  abstract create<T extends EntityType = any>(
    entityType: Constructor<T>,
    entity: any,
  ): Promise<CreatedEntity<T>>
  abstract read(entityType: string, id: string): Promise<any>
  abstract update(
    entityType: string,
    id: string,
    updates: any,
    revisionNumber: number,
  ): Promise<any>
  abstract delete(entityType: string, id: string): Promise<any>
  abstract find(entityType: string, query: any): Promise<any>
  abstract watch(entityType: string, options: { id: string }): Observable<any>
  abstract call(entityType: string, id: string, method: string, args: any[]): Promise<any>
}
