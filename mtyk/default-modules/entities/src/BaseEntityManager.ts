import { Constructor } from 'modules/types'
import Entity from './Entity'
import { entityTypesEqual, getEntityTypeName } from './getEntityTypeName'
import { UnknownEntity } from './UnknownEntity'
import { IEntityManager } from './IEntityManager'
import { Observable } from 'rxjs'
import { EntityTypable } from './EntityTypable'

export default abstract class BaseEntityManager implements IEntityManager {
  yDoc: any
  instances: Map<string, Entity> = new Map()
  constructor(protected entities: Constructor<Entity>[]) {}
  abstract create(entityType: any, entity: any): Promise<any>
  abstract read(entityType: any, id: any): Promise<any>
  abstract update(entityType: any, id: any, updates: any, revisionNumber?: number)

  abstract delete(entityType: any, id: any): Promise<any>
  abstract find(entityType: any, query: any): Promise<any>
  abstract watch(entityType: any, opts: { id: string }): Observable<any>
  abstract call(entityType: any, id: any, method: any, args: any): Promise<any>
  id: string

  findEntityClass(typeable: EntityTypable) {
    const entityType = getEntityTypeName(typeable)
    return this.entities.find((e) => entityTypesEqual(entityType, e))
  }

  protected createEntityInstance(entityType: string, data: any, transient = false): Entity {
    let instance = transient ? null : this.instances.get(data.id)
    if (!instance) {
      const EntityClass = this.findEntityClass(entityType)
      if (!EntityClass) {
        instance = new UnknownEntity(this, data.id, data)
      } else {
        instance = new EntityClass(this, data.id, data)
      }
    }
    if (!transient) {
      this.instances.set(data.id, instance!)
    }
    return instance
  }
}
