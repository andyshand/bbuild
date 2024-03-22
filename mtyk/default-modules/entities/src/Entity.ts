import { Constructor } from 'modules/types'
import * as Y from 'yjs'
import { EntityConfig } from './EntityConfig'
import EntityField, { getEntityFieldMetadata } from './EntityField'
import { getEntityMetadata } from './EntityFieldMetadata'
import { EntityTypable } from './EntityTypable'
import type { IEntityManager } from './IEntityManager'
import { MockEntityManager } from './MockEntityManager'
import type { RPCEntityManager } from './RPCEntityManager'
import { formatters } from './formatters'
import { entityTypesEqual, getEntityTypeName } from './getEntityTypeName'

if (typeof window !== 'undefined') {
  const w = window as any
  w.devtoolsFormatters = formatters
}

export default abstract class Entity<Fields extends Record<string, any> = any> {
  static type = 'string'
  public yDoc: Y.Doc
  public yMap: Y.Map<any>
  static createdIds: string[] = []
  static displayName: string = 'Entity'

  readonly id: string
  public revisionNumber: number = 0
  private readonly config?: EntityConfig

  @EntityField()
  owner?: string

  @EntityField({ defaultValue: [] })
  collaborators: { id: string; role: string }[] = []

  // If we use EntityField decorator here, for some reason this breaks.
  // So we hardcode them as entity fields by concating their names further down below
  createdAt: Date = new Date()
  updatedAt: number = Date.now()
  draft: Y.Map<any>

  patches: any[] = []

  get isNew() {
    return !this.id
  }

  get isDirty() {
    return !!this.patches.length
  }

  _proxy: any

  onHydrated() {}

  update(
    _opts:
      | {
          stealth?: boolean
        }
      | ((draft: { [key: string]: any }) => void)
      | Partial<Fields>,
    _callback?: (draft: { [key: string]: any }) => void | Partial<Fields>
  ) {
    const callbackOrObj = _callback ?? _opts
    const opts = typeof _opts !== 'function' ? _opts : {}

    if (typeof callbackOrObj === 'function') {
      const draft = this.yMap.toJSON()

      callbackOrObj(draft)
      this.yDoc.transact(() => {
        for (const key in draft) {
          if (this.yMap.get(key) !== draft[key]) {
            this.yMap.set(key, draft[key])
          }
        }
        if (!opts.stealth) {
          this.yMap.set('updatedAt', new Date().toISOString())
          if (!draft.createdAt) {
            this.yMap.set('createdAt', new Date().toISOString())
          }
        }
      })
    } else {
      this.yDoc.transact(() => {
        Object.entries(callbackOrObj).forEach(([key, value]) => {
          this.yMap.set(key, value)
        })
        if (!opts.stealth) {
          this.yMap.set('updatedAt', new Date().toISOString())
          if (!this.yMap.get('createdAt')) {
            this.yMap.set('createdAt', new Date().toISOString())
          }
        }
      })
    }
  }

  updateObject(field: string, value: any) {
    this[field] = { ...this[field], ...value }
  }

  updateArray(field: string, index: number | ((item: any) => boolean), value: any) {
    if (typeof index === 'number') {
      this[field] = [...this[field].slice(0, index), value, ...this[field].slice(index + 1)]
    } else {
      const itemIndex = this[field].findIndex(index)
      if (itemIndex !== -1) {
        this[field] = [
          ...this[field].slice(0, itemIndex),
          value,
          ...this[field].slice(itemIndex + 1),
        ]
      }
    }
  }

  private _cachedEntityFields: string[] = []
  isEntityField(field: string) {
    if (this._cachedEntityFields.length === 0) {
      this._cachedEntityFields = this.getEntityFields()
    }
    return this._cachedEntityFields.includes(field)
  }

  getEntityFunctions() {
    return Object.getOwnPropertyNames(this).filter((name) => this.isEntityFunction(name))
  }

  constructor(
    public readonly manager: IEntityManager,
    id?: string,
    data?: any,
    config?: EntityConfig
  ) {
    if (id) {
      this.id = id
    }

    this.revisionNumber = data?.revisionNumber || 0
    this.config = config
    this.yDoc = data?.yDoc || new Y.Doc()
    this.yMap = this.yDoc.getMap('entity')

    if (this.manager.constructor.name === 'MongoEntityManager') {
      this.yMap.observe((event) => {
        let updates = {}
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'add' || change.action === 'update') {
            updates[key] = this.yMap.get(key)
          } else if (change.action === 'delete') {
            updates[key] = null
          }
        })

        this.manager
          .update(this.constructor.name, this.id, updates)
          .then(() => {
            /*noop*/
          })
          .catch((e) => {
            console.error(e)
          })
      })
    }

    const proxy = new Proxy(this, {
      set: (target, property, _value) => {
        let value = _value

        const isTrackableProperty = this.isEntityField(property as string)

        if (!isTrackableProperty) {
          target[property] = value
          return true
        }

        const setter = getEntityFieldMetadata(this, property as string).entityFieldBeforeSet
        if (setter) {
          const newVal = setter.call(this, value, { entity: this })
          _value = newVal
        }

        this.update({ [property]: _value })

        return true
      },

      apply: (target, thisArg, argumentsList) => {
        const methodName = (target as any as Function).name
        const entityType = getEntityTypeName(this)

        const isEntityFunction = this.isEntityFunction(methodName)

        if ('isRPC' in this.manager && isEntityFunction) {
          const rpc = this.manager as RPCEntityManager
          // Executes the method remotely
          return rpc.executeRemote(entityType, this.id, methodName, argumentsList)
        } else if (isEntityFunction) {
          return this.wrapPersistingUpdates(
            (target as any as Function).bind(thisArg, ...argumentsList)
          )
        }

        // Executes the method locally
        return (target as any as Function).apply(thisArg, argumentsList)
      },

      // Also need to handle get when returend value is a function
      get: (target, property, receiver) => {
        const value = target[property]

        const isEntityField = this.isEntityField(property as string)
        if (isEntityField) {
          const getter = getEntityFieldMetadata(this, property as string).entityFieldGetter
          if (getter) {
            return getter.call(this, {
              value: this.yMap.get(property as string),
            })
          }

          return this.yMap.get(property as string)
        }

        if (typeof value === 'function') {
          // If the method is a remote method, execute it remotely
          const isEntityFn = this.isEntityFunction(property as string)
          if (isEntityFn) {
            if ('isRPC' in this.manager) {
              const man = this.manager as RPCEntityManager
              return (...args: any[]) => {
                return man.executeRemote(
                  getEntityTypeName(this),
                  this.id,
                  property as string,
                  args
                )
              }
            } else {
              return this.wrapPersistingUpdates(value)
            }
          } else {
            // Check if arrow function. If not arrow function, bind this. If arrow function, bind nothing
            return this.bindIfNonArrowFunction(value)
          }
        }

        return value
      },
    })

    this._proxy = proxy
    this.onHydrated.call(proxy)
    return proxy
  }

  bindIfNonArrowFunction(fn: Function) {
    const functionindex = fn.toString().indexOf('function')
    const arrowIndex = fn.toString().indexOf('=>')
    if (arrowIndex >= 0 && functionindex > arrowIndex) {
      // assume it's an arrow fn
      return fn
    }
    return fn.bind(this._proxy)
  }

  wrapPersistingUpdates(fn: (...args: any[]) => Promise<void>) {
    return async (...args: any[]) => {
      const result = await this.bindIfNonArrowFunction(fn)(...args)
      // await this.writePendingUpdates()
      return result
    }
  }

  getUpdates() {
    return this.yMap.toJSON()
  }
  // Add an instance method to get all entityFunction names
  getAllEntityFunctionNames() {
    const entityFunctionNames: string[] = []
    for (const property of Object.getOwnPropertyNames(this)) {
      if (this.isEntityFunction(property)) {
        entityFunctionNames.push(property)
      }
    }
    return entityFunctionNames
  }

  isEntityFunction(name: string) {
    return !!getEntityFieldMetadata(this, name).entityFunction
  }

  static staticFields = ['createdAt', 'updatedAt', 'owner', 'collaborators']

  static getFields(type: EntityTypable) {
    const fields = getEntityMetadata(type)?.fieldList ?? []
    return fields
  }

  getEntityFields() {
    return (getEntityMetadata(this)?.fieldList ?? []).concat(Entity.staticFields)
  }

  // Add a new property to store the subscribers
  subscribers: Map<string, Set<() => void>> = new Map()

  // Add a method to subscribe to property changes
  subscribe(property: string, callback: () => void) {
    if (!this.subscribers.has(property)) {
      this.subscribers.set(property, new Set())
    }
    this.subscribers.get(property)!.add(callback)
  }

  // Add a method to unsubscribe from property changes
  unsubscribe(property: string, callback: () => void) {
    if (this.subscribers.has(property)) {
      this.subscribers.get(property)!.delete(callback)
    }
  }

  getEntityFieldValues() {
    const fields = this.getEntityFields()
    const values = {
      id: this.id,
    }
    for (const field of fields) {
      values[field] = this.yMap.get(field)
    }
    return values as Fields & { id: string }
  }

  writePendingUpdates() {
    throw new Error('Method not implemented.')
  }

  applyWatchUpdate(_, __) {
    throw new Error('Method not implemented.')
  }

  markClean() {
    this.patches = []
  }

  /**
   * Temp solution for the fact that deep objects are not tracked (I don't think?)
   */
  _editArrField<T>(field: string, fn: (arr: T[]) => T[]) {
    const arr = this[field] as T[]
    const decs = Object.getOwnPropertyDescriptor(this, field)
    if (decs?.writable) {
      this[field as any] = [...fn(arr.map((a) => ({ ...a })))]
      return
    } else {
      throw new Error('Cannot edit array field on non-writable property ' + field)
    }
  }

  static temp(
    classs: Constructor<Entity>,
    fields: any,
    manager: IEntityManager = new MockEntityManager()
  ) {
    const entity = new classs(manager, Math.random().toString(36).substring(7), fields)
    return entity
  }

  async getRelation<T extends Entity>(relationName: string): Promise<Entity | null> {
    const relation = this.getRelationInfo(relationName)
    if (!relation) {
      throw new Error(`No relation found for ${relationName}`)
    }
    if (this[relationName] === undefined) {
      return null
    }
    const entity = await this.manager.read(relation, this[relationName])
    return entity
  }

  getRelationInfo(relationName: string) {
    const relation = getEntityFieldMetadata(this, relationName).relation
    if (!relation) {
      throw new Error(`No relation found for ${relationName}`)
    }
    return relation
  }

  matchesType(type: EntityTypable) {
    return entityTypesEqual(this as any, type)
  }
}
