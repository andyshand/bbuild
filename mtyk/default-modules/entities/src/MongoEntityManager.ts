import { invariant, publicInvariant } from 'modules/errors/index'
import { addWSHandler } from 'modules/rpc-ws/server'
import { Constructor } from 'modules/types'
import { Collection, MongoClient, ObjectId } from 'mongodb'
import net from 'net'
import 'reflect-metadata'
import { clone } from 'remeda'
import { Observable, ReplaySubject, Subject } from 'rxjs'
import { WebsocketProvider } from 'y-websocket'
import { DbEntityManager } from './DBEntityManager'
import Entity from './Entity'
import { EntityTypable } from './EntityTypable'
import {
  CreatedEntity,
  EntityType,
  IEntityManager,
  IEntityManagerFindOpts,
} from './IEntityManager'
import { getEntityTypeName } from './getEntityTypeName'
import { ChangeStreamBatcher } from './mongo/ChangeStreamBatcher'
import { Queue } from './structs'
import { initializeYjsSyncProvider } from './yjs/wsProvider'

async function runYJSServer() {
  const { $, execa } = await eval('import("execa")')
  // Resolve bin path for y-websocket
  const yWebsocket = require.resolve('y-websocket')
  const path = yWebsocket.split('/node_modules')[0]

  try {
    await execa(process.execPath, [`${path}/node_modules/y-websocket/bin/server.js`], {
      cwd: path,
      env: {
        PORT: 1234,
      },
    })
  } catch (e) {
    console.error(e)
  }
}

addWSHandler('/ws/yjs', async (req, socket, head) => {
  // Establish a connection to the target
  const proxySocket = net.connect(1234, 'localhost', () => {
    // Construct and send the HTTP request line and headers to the target
    const requestLine = `GET ${req.url} HTTP/1.1\r\n`
    const headers = Object.entries(req.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n')
    proxySocket.write(requestLine + headers + '\r\n\r\n')
    // Immediately write the head of the request to the target
    proxySocket.write(head)
    // Establish data flow between the client and the target
    socket.pipe(proxySocket).pipe(socket)
  })

  proxySocket.on('error', (err) => {
    console.error('Proxy socket error:', err)
    // socket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.end()
  })
})

setTimeout(runYJSServer, 1000)

interface UpdateData {
  type: EntityTypable
  id: string
  updates: any
}

export class MongoEntityManager extends DbEntityManager implements IEntityManager {
  private client: MongoClient
  private collections: Map<string, Collection> = new Map()
  id: string = Math.random().toString(36)
  private updateQueues: Map<string, Queue<UpdateData>> = new Map()
  private isProcessingMap: Record<string, boolean> = {}
  private wsProviders = new Map<string, WebsocketProvider>()
  private invalidateSubject = new Subject<any>()
  private connectedSubject = new ReplaySubject<any>(1)

  batcher: ChangeStreamBatcher

  constructor(private uri: string, private dbName: string, entities: Constructor<Entity>[]) {
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
    return isMasterResult.setName ? new MongoClient(this.uri) : new MongoClient(this.uri)
  }

  async connect() {
    console.log(`Connecting to MongoDB at ${this.uri}/${this.dbName}...`)

    const connection = await this.getDbConnection()
    this.client = await connection.connect()

    console.log(`Connected to MongoDB at ${this.uri}/${this.dbName} (em ${this.id})`)

    this.connectedSubject.next(this.id)
  }

  awaitConnection() {
    return new Promise<void>((resolve) => {
      this.connectedSubject.subscribe((id) => {
        if (id === this.id) {
          resolve()
        }
      })
    })
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
      await this.applySerializableOptions(entity, entityType, 'onSave')
    )
    const collection = this.getCollection(entityType)
    const result = await collection.insertOne(preparedData)
    const newDoc = await collection.findOne({ _id: result.insertedId })

    // Set id as str to simplify matching in superclass
    await collection.updateOne({ _id: newDoc._id }, { $set: { id: newDoc._id.toString() } })

    invariant(newDoc, 'Failed to create entity')
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
      await this.applySerializableOptions(data, entityType, 'onLoad')
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

  public async update(type: EntityTypable, id: string, updates: any): Promise<any> {
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
    const existing = await this.read(updateData.type, updateData.id)
    if (!existing) {
      throw new Error('Entity not found')
    }

    const preparedData = await this.applySerializableOptions(
      { ...updateData.updates, id: updateData.id },
      entityType,
      'onSave'
    )

    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(updateData.id) },
        { $set: preparedData }
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

  async find<T extends EntityType = any>(
    type: EntityTypable | Constructor<T>,
    qq: any,
    opts?: IEntityManagerFindOpts
  ): Promise<CreatedEntity<T>[]> {
    this.assertClientReady()
    const { limit, skip } = opts ?? {}

    const entityType = getEntityTypeName(type)
    const ids = await this.findIds(entityType, qq)

    return Promise.all(ids.map((id) => this.read(entityType, id.id.toString())))
  }

  async findIds(
    type: EntityTypable,
    qq: any
  ): Promise<
    {
      id: string
    }[]
  > {
    this.assertClientReady()

    const query = clone(qq)
    if ('_id' in query) {
      // Convert strings to ObjectIds, quick fix
      if (typeof query._id === 'object' && query && '$in' in query._id) {
        publicInvariant(Array.isArray(query._id.$in), 'query._id.$in must be an array')
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
    return (await collection.find(query, { projection: { _id: 1 } }).toArray()).map((e) => ({
      id: e._id.toString(),
    }))
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
    const changeStreamObs = this.batcher.getMongoDBChangeStream(entityType, opts)
    return changeStreamObs
  }

  getInvalidateObserver(): Observable<any> {
    this.assertClientReady()
    return this.invalidateSubject
  }
}

export default MongoEntityManager
