import { assert, publicInvariant } from 'modules/errors/index'
import { Constructor } from 'modules/types'
import { Collection, MongoClient, ObjectId, Binary } from 'mongodb'
import 'reflect-metadata'
import { clone } from 'remeda'
import { Observable, Subject } from 'rxjs'
import { DbEntityManager } from './DBEntityManager'
import Entity from './Entity'
import { EntityTypable } from './EntityTypable'
import { IEntityManager, IEntityManagerFindOpts } from './IEntityManager'
import { getEntityTypeName } from './getEntityTypeName'
import { ChangeStreamBatcher } from './mongo/ChangeStreamBatcher'

import { initializeYjsSyncProvider } from './yjs/wsProvider'
import { Queue } from './structs'
import { WebsocketProvider } from 'y-websocket'

interface UpdateData {
  type: EntityTypable
  id: string
  updates: any
}

export class MongoEntityManager
  extends DbEntityManager
  implements IEntityManager
{
  private client: MongoClient
  private collections: Map<string, Collection> = new Map()
  id: string = Math.random().toString(36)
  private updateQueues: Map<string, Queue<UpdateData>> = new Map()
  private isProcessingMap: Record<string, boolean> = {}
  private wsProviders = new Map<string, WebsocketProvider>()
  private invalidateSubject = new Subject<any>()

  batcher: ChangeStreamBatcher

  constructor(
    private uri: string,
    private dbName: string,
    entities: Constructor<Entity>[]
  ) {
    super(entities)
    this.batcher = new ChangeStreamBatcher(this)
    this.connect()
  }

  assertClientReady() {
    if (!this.client) {
      throw new Error(
        'Client is not ready. Please ensure connection is setup. You may have just called this method too early... be slower :)'
      )
    }
  }

  async getDbConnection() {
    const temporaryClient = new MongoClient(this.uri)
    await temporaryClient.connect()
    const adminDb = temporaryClient.db('admin')
    const isMasterResult = await adminDb.command({ isMaster: 1 })
    temporaryClient.close()

    console.log(`MongoDB replica set name: ${isMasterResult.setName ?? 'N/A'}`)
    return isMasterResult.setName
      ? new MongoClient(this.uri)
      : new MongoClient(this.uri)
  }

  async connect() {
    console.log(`Connecting to MongoDB at ${this.uri}/${this.dbName}...`)

    const connection = await this.getDbConnection()
    this.client = await connection.connect()

    console.log(
      `Connected to MongoDB at ${this.uri}/${this.dbName} (em ${this.id})`
    )
  }
  async disconnect() {
    this.assertClientReady()

    await this.client.close()
  }

  getCollection(entityType: string): Collection {
    this.assertClientReady()

    if (!this.collections.has(entityType)) {
      const collection = this.client.db(this.dbName).collection(entityType)
      this.collections.set(entityType, collection)
    }

    return this.collections.get(entityType)!
  }

  // Prepare data by mapping id to _id
  private prepareData(data: any): any {
    if (data.id) {
      data = { ...data, _id: new ObjectId(data.id), yMap: null }
      delete data.id
    }
    return data
  }

  // Restore data by mapping _id to id
  private restoreData(data: any): any {
    if (data._id) {
      data = { ...data, id: data._id.toString() }
      delete data._id
    }
    return data
  }

  async create(type: EntityTypable, entity: any): Promise<any> {
    this.assertClientReady()

    const entityType = getEntityTypeName(type)
    const preparedData = this.prepareData(
      this.applySerializableOptions(entity, entityType, 'onSave')
    )
    const collection = this.getCollection(entityType)
    const result = await collection.insertOne(preparedData)
    const newDoc = await collection.findOne({ _id: result.insertedId })

    const id = newDoc._id.toString()

    const newEntity = this.createEntityInstance(entityType, {
      id,
    })

    try {
      newEntity.yDoc.transact(() => {
        newEntity.yMap.set('id', id)

        delete preparedData._id

        Object.keys(preparedData).forEach((key) => {
          newEntity.yMap.set(key, preparedData[key])
        })
      })
    } catch (e) {
      console.log(e)
    }
    const wsProvider = initializeYjsSyncProvider(newEntity.id, newEntity.yDoc)
    this.wsProviders.set(newEntity.id, wsProvider)

    this.invalidateSubject.next(entityType)

    return newEntity
  }

  async read(type: EntityTypable, id: string): Promise<any> {
    this.assertClientReady()
    const entity = this.instances.get(id)

    if (entity) {
      return entity
    }

    const entityType = getEntityTypeName(type)
    const collection = this.getCollection(entityType)
    const data = await collection.findOne({ _id: new ObjectId(id) })
    const restoredData = this.restoreData(
      this.applySerializableOptions(data, entityType, 'onLoad')
    )
    const newEntity = this.createEntityInstance(entityType, { id })
    try {
      Object.keys(restoredData).forEach((key) => {
        newEntity.yDoc.transact(() => {
          newEntity.yMap.set(key, restoredData[key])
        })
      })
    } catch (e) {
      console.log(e)
    }

    const wsProvider = initializeYjsSyncProvider(id, newEntity.yDoc)
    this.wsProviders.set(newEntity.id, wsProvider)

    return newEntity
  }

  public async update(
    type: EntityTypable,
    id: string,
    updates: any
  ): Promise<any> {
    this.assertClientReady()

    this.enqueueUpdate(type, id, updates)
  }

  private enqueueUpdate(type: EntityTypable, id: string, updates: any): void {
    const key = `${type}:${id}`
    if (!this.updateQueues.has(key)) {
      this.updateQueues.set(key, new Queue<UpdateData>())
    }

    const queue = this.updateQueues.get(key)!
    queue.enqueue({ type, id, updates })

    if (queue.length() === 1 && !this.isProcessingMap[key]) {
      this.processQueue(key)
    }
  }

  private async processQueue(key: string): Promise<void> {
    if (this.isProcessingMap[key]) {
      return
    }

    this.isProcessingMap[key] = true

    const queue = this.updateQueues.get(key)

    while (queue && !queue.isEmpty()) {
      const updateData = queue.dequeue()

      if (updateData) {
        await this._update(updateData)
      }
    }

    this.isProcessingMap[key] = false
  }

  public async _update(updateData: UpdateData): Promise<any> {
    this.assertClientReady()

    const entityType = getEntityTypeName(updateData.type)
    const collection = this.getCollection(entityType)

    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(updateData.id) },
        { $set: updateData.updates }
      )

      if (result.matchedCount === 0) {
        throw new Error('Update failed - document not found')
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async delete(type: EntityTypable, id: string) {
    this.assertClientReady()

    const entityType = getEntityTypeName(type)
    const collection = this.getCollection(entityType)

    try {
      await collection.deleteOne({ _id: new ObjectId(id) })
      this.instances.delete(id)
      const wsProvider = this.wsProviders.get(id)
      if (wsProvider) {
        wsProvider.destroy()
        this.wsProviders.delete(id)
      }

      this.invalidateSubject.next(entityType)
    } catch (error) {
      console.error('Error in delete operation:', error)
      throw error
    }
  }

  async find(
    type: EntityTypable,
    qq: any,
    opts?: IEntityManagerFindOpts
  ): Promise<any> {
    this.assertClientReady()
    const { limit, skip } = opts ?? {}

    const entityType = getEntityTypeName(type)
    const ids = await this.findIds(type, qq)

    return Promise.all(
      ids.map((id) => this.read(entityType, id._id.toString()))
    )
  }

  async findIds(type: EntityTypable, qq: any): Promise<any> {
    this.assertClientReady()

    const query = clone(qq)
    if ('_id' in query) {
      // Convert strings to ObjectIds, quick fix
      if (typeof query._id === 'object' && query && '$in' in query._id) {
        publicInvariant(
          Array.isArray(query._id.$in),
          'query._id.$in must be an array'
        )
        query._id.$in = query._id.$in.map((id) => new ObjectId(id))
      } else {
        if (Array.isArray(query._id)) {
          query._id = query._id.map((id) => new ObjectId(id))
        } else {
          query._id = new ObjectId(query._id)
        }
      }
    }

    const entityType = getEntityTypeName(type)
    const collection = this.getCollection(entityType)
    return await collection.find(query, { projection: { _id: 1 } }).toArray()
  }

  async readIds(type: EntityTypable, ids: string[]): Promise<any> {
    this.assertClientReady()

    const entityType = getEntityTypeName(type)

    return Promise.all(ids.map((id) => this.read(entityType, id)))
  }

  /**
   * @deprecated Deprecation warning: watch() will be possibly removed in a future releases. Use initializeYjsSyncProvider() instead to sync Entity.
   */
  watch(type: EntityTypable, opts: { id: string }): Observable<any> {
    this.assertClientReady()
    const entityType = getEntityTypeName(type)
    const changeStreamObs = this.batcher.getMongoDBChangeStream(
      entityType,
      opts
    )
    return changeStreamObs
  }

  getInvalidateObserver(): Observable<any> {
    this.assertClientReady()
    return this.invalidateSubject
  }
}

export default MongoEntityManager
