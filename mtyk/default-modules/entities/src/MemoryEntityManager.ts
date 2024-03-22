import { Observable, Subject } from 'rxjs'
import { get } from 'modules/dash'
import { Constructor } from 'type-fest'
import { v4 as uuidv4 } from 'uuid'

import { DbEntityManager } from './DBEntityManager'
import Entity from './Entity'
import { EntityTypable } from './EntityTypable'
import { CreatedEntity, EntityType, IEntityManager } from './IEntityManager'
import { getEntityTypeName } from './getEntityTypeName'

export class MemoryEntityManager extends DbEntityManager implements IEntityManager {
  private data: Map<string, Map<string, any>> = new Map()

  constructor(entities: Constructor<Entity>[]) {
    super(entities)
  }

  /**
   * @internal
   * @todo should this be available on all EMs?
   * No way to type-safe this
   */
  _addEntity(entity: Constructor<Entity>) {
    const entityType = getEntityTypeName(entity)
    this.data.set(entityType, new Map())
  }

  private getStore(t: EntityTypable): Map<string, any> {
    const entityType = getEntityTypeName(t)
    if (!this.data.has(entityType)) {
      this.data.set(entityType, new Map())
    }

    return this.data.get(entityType)!
  }

  async create(entityType: EntityTypable, entity: any): Promise<any> {
    const id = uuidv4()
    const store = this.getStore(entityType)
    const typeStr = getEntityTypeName(entityType)
    store.set(id, { ...entity, id, revisionNumber: 0 })
    this.notifyWatchers(entityType, id)
    return this.createEntityInstance(typeStr, store.get(id))
  }

  async read<T extends EntityType = any>(
    entityType: EntityTypable<T>,
    id: string
  ): Promise<CreatedEntity<T>> {
    const type = getEntityTypeName(entityType)
    const store = this.getStore(type)
    return this.createEntityInstance(type, store.get(id)) as any
  }

  async update(
    entityType: string,
    id: string,
    updates: any,
    revisionNumber: number
  ): Promise<any> {
    const store = this.getStore(entityType)
    const currentData = store.get(id)
    store.set(id, { ...currentData, ...updates, revisionNumber })
    this.notifyWatchers(entityType, id)
    const instance = (await this.read(entityType, id)) as Entity
    instance.applyWatchUpdate(updates, revisionNumber)
    return instance
  }

  async delete(entityType: string, id: string): Promise<any> {
    const store = this.getStore(entityType)
    const deletedEntity = await this.read(entityType, id)
    store.delete(id)
    this.notifyWatchers(entityType, id)
    return deletedEntity
  }

  async find(entityType: string, query: any): Promise<any> {
    const store = this.getStore(entityType)
    const data = Array.from(store.values()).filter((item) => this.matchQuery(item, query))
    return data.map((item) => this.createEntityInstance(entityType, item))
  }

  private matchQuery(item: any, query: any): boolean {
    return Object.keys(query).every((key) => {
      const value = get(item, key)
      const queryValue = get(query, key)

      if (typeof queryValue === 'object' && !Array.isArray(queryValue)) {
        return this.matchQueryOperators(value, queryValue)
      }

      return value === queryValue
    })
  }

  private matchQueryOperators(value: any, queryValue: any): boolean {
    return Object.keys(queryValue).every((operator) => {
      switch (operator) {
        case '$eq':
          return value === queryValue[operator]
        case '$ne':
          return value !== queryValue[operator]
        case '$in':
          return queryValue[operator].includes(value)
        case '$nin':
          return !queryValue[operator].includes(value)
        case '$gt':
          return value > queryValue[operator]
        case '$gte':
          return value >= queryValue[operator]
        case '$lt':
          return value < queryValue[operator]
        case '$lte':
          return value <= queryValue[operator]
        default:
          return false
      }
    })
  }

  private subjects: Map<string, Map<string, Subject<any>>> = new Map()

  watch(_entityType: EntityTypable, opts: { id: string }): Observable<any> {
    const entityType = getEntityTypeName(_entityType)
    if (!this.subjects.has(entityType)) {
      this.subjects.set(entityType, new Map())
    }

    let subjectsMap = this.subjects.get(entityType)!

    if (!subjectsMap.has(opts.id)) {
      const subject = new Subject<any>()
      subjectsMap.set(opts.id, subject)
    }

    const subject = subjectsMap.get(opts.id)!

    return new Observable((observer) => {
      const subscription = subject.subscribe(observer)
      return () => {
        subscription.unsubscribe()
        if (subject.observers.length === 0) {
          subjectsMap.delete(opts.id)
          if (subjectsMap.size === 0) {
            this.subjects.delete(entityType)
          }
        }
      }
    })
  }

  private async notifyWatchers(entityType: EntityTypable, id: string) {
    const typeName = getEntityTypeName(entityType)
    const subjectsMap = this.subjects.get(typeName)
    if (subjectsMap && subjectsMap.has(id)) {
      subjectsMap.get(id)?.next(await this.read(entityType, id))
    }
  }
}

export default MemoryEntityManager
