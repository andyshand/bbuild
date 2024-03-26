import RPCClient from 'modules/rpc-ws/client'
import { Constructor } from 'modules/types'
import { Observable, Subject, firstValueFrom, share } from 'rxjs'
import { WebsocketProvider } from 'y-websocket'
import Entity from './Entity'
import { CreatedEntity } from './IEntityManager'
import { RemoteEntityManager } from './RemoteEntityManager'
import { UnknownEntity } from './UnknownEntity'
import { getEntityTypeName } from './getEntityTypeName'
import { initializeYjsSyncProvider } from './yjs/wsProvider'

export class RPCEntityManager extends RemoteEntityManager {
  client: any
  public readonly isRPC = true
  private wsProviders = new Map<string, WebsocketProvider>()
  public invalidateSubject: Subject<any>

  constructor(protected entities: Constructor<Entity>[], protected path: string) {
    super(entities)

    // Assume we're on the client
    if (typeof window === 'undefined') {
      throw new Error('RPCEntityManager is only supported on the client')
    }
    const url = new URL(window.location.href)
    const currPort = url.port || 80

    this.client = new RPCClient(`ws://${url.hostname}:${currPort}${path}`)
    this.initializeInvalidateSubject()
  }

  async initializeInvalidateSubject() {
    this.invalidateSubject = await this.client.getInvalidateObserver({
      args: [],
    })
  }

  id: string = Math.random().toString(36).substring(7)

  obsToPromise<T>(obs: Observable<T>): Promise<T> {
    return firstValueFrom(obs)
  }

  protected createEntityInstance(entityType: any, data: any): any {
    if (!data) return
    let instance = this.instances.get(data.id)

    if (!instance) {
      const EntityClass = this.findEntityClass(entityType)
      if (!EntityClass) {
        instance = new UnknownEntity(this, data.id, data)
      } else {
        instance = new EntityClass(this, data.id, data)
      }
    }

    this.instances.set(data.id, instance)
    return instance
  }

  call(entityType: string, id: string, method: string, args: any[]): Promise<any> {
    // The idea is that calls are executed remotely, so no need for an implementation here
    throw new Error('Method not implemented.')
  }

  async executeRemote(
    entityType: string,
    id: string,
    method: string,
    args: any[]
  ): Promise<any> {
    // You can define how to call the remote method using the RPCClient instance (`this.client`)
    // For example, if the RPCClient has a "call" method:
    const result = await this.obsToPromise(
      this.client.call({ args: [entityType, id, method, args] })
    )
    return result
  }

  async create<T>(entityType: Constructor<T>, entity: any): Promise<CreatedEntity<any>> {
    const result = (await this.obsToPromise(
      this.client.create({ args: [getEntityTypeName(entityType), entity] })
    )) as any

    const id = result.id

    const newEntity = this.createEntityInstance(entityType, { id })
    const wsProvider = initializeYjsSyncProvider(id, newEntity.yDoc)
    this.wsProviders.set(id, wsProvider)

    const syncPromise = new Promise<void>((resolve) => {
      wsProvider.once('sync', () => {
        resolve()
      })
    })

    await syncPromise

    return newEntity
  }

  async read(entityType: string, id: string): Promise<any> {
    if (this.instances.has(id)) {
      return this.instances.get(id)
    }

    const data = (await this.obsToPromise(this.client.read({ args: [entityType, id] }))) as any
    const entity = this.createEntityInstance(entityType, { id, ...data })
    const wsProvider = initializeYjsSyncProvider(id, entity.yDoc)
    this.wsProviders.set(id, wsProvider)
    const syncPromise = new Promise<void>((resolve) => {
      wsProvider.once('sync', () => {
        resolve()
      })
    })
    await syncPromise
    return entity
  }

  async update(entityType: string, id: string, updates: any): Promise<any> {
    this.client.update({ args: [entityType, id, updates] })
  }

  async delete(entityType: string, id: string): Promise<any> {
    try {
      this.obsToPromise(this.client.delete({ args: [entityType, id] }))
      this.instances.delete(id)
      const wsProvider = this.wsProviders.get(id)
      if (wsProvider) {
        wsProvider.doc.destroy()
        wsProvider.destroy()
      }
    } catch (e) {
      console.error(e)
    }
  }

  async find(entityType: string, query: any): Promise<any> {
    const ids = (await this.obsToPromise(
      this.client.findIds({ args: [entityType, query] })
    )) as [{ id: string }]

    return Promise.all(ids.map(({ id }) => this.read(entityType, id)))
  }

  private observablesMap: Map<string, Subject<any>> = new Map()

  /**
   * @deprecated Deprecation warning: triggerObservers() will be possibly removed in a future releases. Use initializeYjsSyncProvider() instead to sync Entity.
   */
  triggerObservers(entityType: string, id: string, data: any) {
    const observable = this.observablesMap.get(id)
    if (observable) {
      observable.next(data)
    }
  }

  /**
   * @deprecated Deprecation warning: watch() will be possibly removed in a future releases. Use initializeYjsSyncProvider() instead to sync Entity.
   */
  watch(entityType: string, options: { id: string }): Observable<any> {
    const { id } = options
    if (!this.observablesMap.has(id)) {
      const subject = new Subject<any>()
      this.observablesMap.set(id, subject)
      this.client
        .watch({ args: [entityType, options] })
        .pipe(share()) // add share operator to automatically unsubscribe when last subscriber unsubscribes
        .subscribe((data) => {
          subject.next(data)
        })
    }

    return this.observablesMap.get(id)!
  }
}
