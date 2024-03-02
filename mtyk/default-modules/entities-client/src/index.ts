import { beginBatch, endBatch, opaqueObject } from '@legendapp/state'
import { Entity, IEntityManager, entityType } from 'modules/entities'
import { RPCEntityManager } from 'modules/entities/RPCEntityManager'
import { UnknownEntity } from 'modules/entities/UnknownEntity'
import { invariant } from 'modules/errors'
import { pubSub } from 'modules/rpc-ws/central/client'
import * as nano from 'nanoid'
import { useEffect, useRef, useState } from 'react'
import { uniq } from 'remeda'
import { ReplaySubject, Subject } from 'rxjs'
import { tap } from 'rxjs/operators'
import type { Constructor } from 'type-fest'
import * as Y from 'yjs'
import { queryFromAllManagers } from './allManagers'
import { cacheMap } from './cacheMap'
import { getLatestValue } from './getLatestValue'
import entityDataObservable, { globalEntityDataObservable } from './store'

const useId = (obj) => {
  const objKey = JSON.stringify(obj)
  const ref = useRef(nano.nanoid())
  return String(ref.current) + objKey
}

const getGlobalEntityKey = (entity) => `${entityType(entity.type)}:${entity.id}`

export function createEntitiesClient<M extends IEntityManager[]>(
  extraMan: M[],
  entities: Constructor<Entity>[] = []
) {
  const subject = new ReplaySubject<string[]>(1)
  let globalInvalidationSubject: Subject<any>
  const invalidateSubject = new Subject()

  const managers$ = pubSub.subscribe('entityManagersChannel').pipe(
    cacheMap((name) => {
      return new RPCEntityManager(entities, name)
    })
  )
  managers$.subscribe(subject)

  type EntitySubscriptionInfo = {
    observerFunction: (event: Y.YMapEvent<any>) => void
    count: number
  }

  const entitySubscriptions = new Map<string, EntitySubscriptionInfo>()

  const updateEntityKey = (type, id, key, data) => {
    const globalKey = getGlobalEntityKey({ id, type })
    const entity = globalEntityDataObservable[globalKey].peek()
    if (entity) {
      globalEntityDataObservable[globalKey].entity.assign({ [key]: data })
    }
    propagateChangesToAllHooks([{ id, type }])
  }

  function addEntitySubscription(entity: Entity<any>) {
    const id = entity.id
    const key = id
    const subscriptionInfo = entitySubscriptions.get(key)
    const globalKey = getGlobalEntityKey({
      id,
      type: entityType(entity as any),
    })
    if (!subscriptionInfo || !subscriptionInfo.observerFunction) {
      const observerFunction = (event: Y.YMapEvent<any>) => {
        beginBatch()
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'add' || change.action === 'update') {
            // entityDataObservable[id][key].set(entity.yMap.get(key))
            updateEntityKey(entityType(entity as any), id, key, entity.yMap.get(key))
          }
          if (change.action === 'delete') {
            // entityDataObservable[id][key].delete()
            updateEntityKey(entityType(entity as any), id, key, undefined)
          }
        })
        endBatch()
      }

      // Update global obj with initial entity data
      const entityData = entity.yMap.toJSON()
      globalEntityDataObservable[globalKey].assign({
        entity: entityData,
        id,
        type: entityType(entity as any),
        entityObj: opaqueObject(entity),
      })
      propagateChangesToAllHooks([{ id, type: entityType(entity as any) }])

      entity.yMap.observe(observerFunction)

      entitySubscriptions.set(key, {
        observerFunction: observerFunction,
        count: subscriptionInfo?.count || 1,
      })
    } else if (subscriptionInfo) {
      subscriptionInfo.count += 1
      entitySubscriptions.set(key, subscriptionInfo)
    }
  }

  function decrementSubscriptionCount(type: string, id: string) {
    const key = id
    const subscriptionInfo = entitySubscriptions.get(key)

    if (subscriptionInfo) {
      subscriptionInfo.count -= 1
      entitySubscriptions.set(key, subscriptionInfo)

      if (subscriptionInfo.count === 0 && !!subscriptionInfo.observerFunction) {
        negateSubscription(type, id)
      }
    }
  }

  function negateSubscription(type: string, id: string) {
    const key = id
    const subscriptionInfo = entitySubscriptions.get(key)
    if (subscriptionInfo && subscriptionInfo.observerFunction) {
      let checkCount = 0
      const maxCheckCount = 3
      const checkInterval = 300
      const intervalId = setInterval(() => {
        checkCount++
        const currentSubscriptionInfo = entitySubscriptions.get(key)
        if (currentSubscriptionInfo.count === 0) {
          if (checkCount >= maxCheckCount) {
            removeSubscriptionForce(type, id)
            clearInterval(intervalId)
          }
        } else {
          clearInterval(intervalId)
        }
      }, checkInterval)
    }
  }

  async function removeSubscriptionForce(type: string, id: string) {
    const key = id
    const subscriptionInfo = entitySubscriptions.get(key)
    if (subscriptionInfo && subscriptionInfo.observerFunction) {
      console.log(`$${id} unsubscribed`)
      const managers = [...(await getLatestValue(subject)), ...extraMan]
      const tt = entityType(type)
      for (const manager of managers) {
        try {
          const entity = await manager.read(tt, id)
          if (entity.yMap) entity.yMap.unobserve(subscriptionInfo.observerFunction)
          entitySubscriptions.delete(key)
          const legendObject = Object.keys(entityDataObservable[id])
          beginBatch()
          for (const field of legendObject) {
            entityDataObservable[id][field].delete()
          }
          endBatch()
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  function invalidate<T extends Entity<any>>(type: Constructor<T> | string, id?: string) {
    const tt = entityType(type)
    invalidateSubject.next({ type: tt, id })
  }

  const discoverManagers = () => {
    const [allManagers, setAllManagers] = useState<RPCEntityManager[]>([])

    useEffect(() => {
      const subscription = managers$
        .pipe(
          tap((managersFromObservable: any[]) => {
            if (managersFromObservable.length > 0 || extraMan.length > 0) {
              const newManagers = [...managersFromObservable, ...extraMan]
              if (newManagers.length === 0) return

              if (allManagers.length === newManagers.length) {
                if (
                  allManagers.every((managerA) => {
                    return newManagers.some((managerB) => managerA.id === managerB.id)
                  })
                )
                  return
              }

              if (!globalInvalidationSubject) {
                initializeGlobalInvalidate(newManagers)
              }

              setAllManagers(newManagers)
            }
          })
        )
        .subscribe()

      return () => subscription.unsubscribe()
    }, [extraMan, globalInvalidationSubject])

    return allManagers
  }

  async function initializeGlobalInvalidate(managers: RPCEntityManager[]) {
    for (const manager of managers) {
      try {
        globalInvalidationSubject = manager.invalidateSubject
        globalInvalidationSubject.subscribe((e) => invalidate(e))
      } catch (e) {
        console.error(e)
      }
    }
  }

  const useEntity = <T extends Entity<any>>(type: Constructor<T> | string, id: string) => {
    const { data, ...rest } = useEntities(type, { id })
    return { data: data[0] as T | null, ...rest }
  }

  const useLegendArr = (hookId: string) => {
    const gotten = entityDataObservable[hookId].get()
    return { array: gotten ?? [] }
  }

  const propagateChangesToAllHooks = (
    arr: { id: string; type: string }[],
    createForHookId?: string
  ) => {
    const repopulateId = (innerHookId: string) => {
      // setTimeout(() => {
      const obsArr = entityDataObservable[innerHookId].peek() ?? []
      const inIds = obsArr.map((e) => e.id)

      entityDataObservable[innerHookId].set(
        obsArr
          .map((e) => {
            const inNewArr = arr.find((a) => a.id === e.id && a.type === e.type)
            if (inNewArr) {
              // Needs updating
              const globalKey = getGlobalEntityKey({
                id: inNewArr.id,
                type: inNewArr.type,
              })
              const latestD = globalEntityDataObservable[globalKey].peek()
              return {
                ...e,
                ...inNewArr,
                entity: latestD.entity,
                entityObj: latestD.entityObj,
              }
            } else {
              return e
            }
          })
          .concat(
            !createForHookId
              ? [] // Only add new entities if specified hookId, this is the initial "create" or "population" phase
              : arr
                  .filter((a) => {
                    const globalKey = getGlobalEntityKey({
                      id: a.id,
                      type: a.type,
                    })
                    return (
                      !inIds.includes(a.id) && !!globalEntityDataObservable[globalKey].peek()
                    )
                  })
                  .map((a) => {
                    const globalKey = getGlobalEntityKey({
                      id: a.id,
                      type: a.type,
                    })
                    return {
                      id: a.id,
                      type: a.type,
                      entity: globalEntityDataObservable[globalKey].peek().entity,
                      entityObj: globalEntityDataObservable[globalKey].peek().entityObj,
                    }
                  })
          )
      )
      // }, 500)
    }

    if (createForHookId) {
      return repopulateId(createForHookId)
    } else {
      // for all keys in entityDataObservable
      for (const hookId in entityDataObservable.peek()) {
        repopulateId(hookId)
      }
    }
  }

  const wrapEntityArr = (entities: { id; entity; type; entityObj }[], { hookId }) => {
    return entities.map((e) => {
      return new Proxy(e, {
        get(target, prop, receiver) {
          if (typeof e.entityObj[prop] === 'function') {
            return e.entityObj[prop].bind(e.entityObj)
          }

          // If is entity fn
          if (e.entityObj.isEntityFunction(prop)) {
            return e.entityObj[prop].bind(e.entityObj)
          }

          // Use reflect.apply to call the function with the correct context
          return Reflect.get(e.entity, prop, receiver)
        },
      })
    })
  }

  const useEntities = <T extends Entity<any>>(
    type: Constructor<T> | string,
    query: any,
    opts?: { noWatch?: boolean }
  ): { data: T[] } => {
    const subscriptions = useRef<string[]>([])
    const tt = entityType(type)
    // const hookId = useId({ type, query })
    const hookId = useId({})
    const allManagers = discoverManagers()
    const arr = useLegendArr(hookId)

    useEffect(() => {
      if (!allManagers.length) return

      const asyncStuff = async () => {
        // Find all entities that match the query
        const allEntities = (
          await Promise.all(
            allManagers.map(async (manager) => {
              try {
                const entities = await manager.find(tt, query)
                return entities
              } catch (error) {
                console.error('Error reading the entity:', error)
              }

              return []
            })
          )
        ).flat()

        // Subscribe to all entities
        for (const entity of allEntities) {
          if (entityType(entity) !== tt) {
            throw new Error('Entity type mismatch')
          }
          addEntitySubscription(entity)
          // Make sure we keep track, so we can unsubscribe on unmount
          subscriptions.current = uniq([...subscriptions.current, entity.id])
        }

        // Need to populate the arr initially, but from that point on, YJS will automatically find all docs in the tree and update
        propagateChangesToAllHooks(
          allEntities.map((e) => ({ id: e.id, type: tt })),
          hookId
        )
      }

      asyncStuff()

      // Cleanup the subscription on unmount and entityDataObservable
      return () => {
        subscriptions.current.forEach((id) => {
          decrementSubscriptionCount(tt, id)
        })
        subscriptions.current = []
      }
    }, [allManagers, tt, JSON.stringify(query), hookId])

    if (arr.array.filter((e) => e.type === tt).length !== arr.array.length) {
      throw new Error('Entity type mismatch')
    }
    return { data: wrapEntityArr(arr.array, { hookId }) as any as T[] }
  }

  const useEntityRelation = <T extends Entity>(entity: T, relation: keyof T & string) => {
    const type = (entity ? entity.getRelationInfo(relation) : UnknownEntity) ?? UnknownEntity
    invariant(
      type !== UnknownEntity || !entity,
      `Unknown entity type for relation ${relation}. Are you missing an @EntityRelation decorator?`
    )
    const query = !entity
      ? { id: { $in: [] } }
      : {
          id: {
            $in: Array.isArray(entity[relation])
              ? entity[relation]
              : entity[relation]
              ? [entity[relation]]
              : [],
          },
        }

    return useEntities(type as any, query)
  }

  const createEntity = async <T extends Entity>(type: Constructor<T> | string, data: any) => {
    const managers = [...(await getLatestValue(subject)), ...extraMan] as any
    let entity: T | undefined = undefined
    const tt = entityType(type)

    for (const manager of managers) {
      try {
        // It's props ok if we don't keep track of subscription, unlikely client will create millions of these?
        const newEntity = (await manager.create(entityType(type), data)) as T
        addEntitySubscription(newEntity)
      } catch (e) {
        console.error(e)
      }
    }

    return entity
  }

  const deleteEntity = async <T extends Entity>(type: Constructor<T> | string, id: string) => {
    const managers = [...(await getLatestValue(subject)), ...extraMan]
    const tt = entityType(type)
    for (const manager of managers) {
      try {
        await removeSubscriptionForce(tt, id)
        await manager.delete(entityType(type), id)
      } catch (e) {
        console.error(e)
      }
    }
  }

  return {
    useEntity,
    invalidate,
    useEntities,
    createEntity,
    deleteEntity,
    useEntityRelation,
    _getManagers: () => getLatestValue(subject),
    query: (type, query) => queryFromAllManagers(getLatestValue(subject), type, query),
  }
}
