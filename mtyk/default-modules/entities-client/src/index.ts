import { beginBatch, endBatch } from '@legendapp/state'
import { Entity, IEntityManager, entityType } from 'modules/entities'
import { getEntityRelation } from 'modules/entities/EntityRelation'
import { RPCEntityManager } from 'modules/entities/RPCEntityManager'
import { UnknownEntity } from 'modules/entities/UnknownEntity'
import { invariant } from 'modules/errors'
import { pubSub } from 'modules/rpc-ws/central/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { uniq } from 'remeda'
import { ReplaySubject, Subject } from 'rxjs'
import { tap } from 'rxjs/operators'
import type { Constructor } from 'type-fest'
import * as Y from 'yjs'
import { queryFromAllManagers } from './allManagers'
import { cacheMap } from './cacheMap'
import { getLatestValue } from './getLatestValue'
import entityDataObservable, { globalEntityDataObservable } from './store'

let nextId = 0
const useId = () => {
  const ref = useRef(null)
  if (ref.current === null) {
    ref.current = ++nextId
  }
  return ref.current
}

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
    const entity = globalEntityDataObservable[id].peek()
    if (entity) {
      globalEntityDataObservable[id].assign({ [key]: data })
    }
    propagateChangesToAllHooks([{ id, type }])
  }

  function addEntitySubscription(entity: Entity<any>) {
    const id = entity.id
    const key = id
    const subscriptionInfo = entitySubscriptions.get(key)
    if (!subscriptionInfo || !subscriptionInfo.observerFunction) {
      const observerFunction = (event: Y.YMapEvent<any>) => {
        beginBatch()
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'add' || change.action === 'update') {
            // entityDataObservable[id][key].set(entity.yMap.get(key))
            updateEntityKey(
              entityType(entity as any),
              id,
              key,
              entity.yMap.get(key)
            )
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
      globalEntityDataObservable[id].assign({
        entity: entityData,
        id,
        type: entityType(entity as any),
        entityObj: entity,
      })
      propagateChangesToAllHooks([{ id, type: entityType(entity as any) }])

      entity.yMap.observe(observerFunction)

      entitySubscriptions.set(key, {
        observerFunction: observerFunction,
        count: subscriptionInfo?.count || 1,
      })
    } else {
      const subscriptionInfo = entitySubscriptions.get(key)
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

      if (subscriptionInfo.count === 0 && subscriptionInfo.observerFunction) {
        removeSubscription(type, id)
      }
    }
  }

  function removeSubscription(type: string, id: string) {
    // const key = id
    // const subscriptionInfo = entitySubscriptions.get(key)
    // if (subscriptionInfo && subscriptionInfo.observerFunction) {
    //   let checkCount = 0
    //   const maxCheckCount = 3
    //   const checkInterval = 300
    //   const intervalId = setInterval(() => {
    //     checkCount++
    //     const currentSubscriptionInfo = entitySubscriptions.get(key)
    //     if (currentSubscriptionInfo.count === 0) {
    //       if (checkCount >= maxCheckCount) {
    //         removeSubscriptionForce(type, id)
    //         clearInterval(intervalId)
    //       }
    //     } else {
    //       clearInterval(intervalId)
    //     }
    //   }, checkInterval)
    // }
  }

  async function removeSubscriptionForce(type: string, id: string) {
    // const key = id
    // const subscriptionInfo = entitySubscriptions.get(key)
    // if (subscriptionInfo && subscriptionInfo.observerFunction) {
    //   console.log(`$${id} unsubscribed`)
    //   const managers = [...(await getLatestValue(subject)), ...extraMan]
    //   const tt = entityType(type)
    //   for (const manager of managers) {
    //     try {
    //       const entity = await manager.read(tt, id)
    //       if (entity.yMap)
    //         entity.yMap.unobserve(subscriptionInfo.observerFunction)
    //       entitySubscriptions.delete(key)
    //       const legendObject = Object.keys(entityDataObservable[id])
    //       beginBatch()
    //       for (const field of legendObject) {
    //         entityDataObservable[id][field].delete()
    //       }
    //       endBatch()
    //     } catch (e) {
    //       console.error(e)
    //     }
    //   }
    // }
  }

  function invalidate<T extends Entity<any>>(
    type: Constructor<T> | string,
    id?: string
  ) {
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
                    return newManagers.some(
                      (managerB) => managerA.id === managerB.id
                    )
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

  function getNestedProperty(obj: any, propPath: string) {
    const keys = propPath.split('.')
    let result = obj
    for (const key of keys) {
      if (result && key in result) {
        result = result[key]
      } else {
        return undefined
      }
    }
    return result
  }

  const useEntity = <T extends Entity<any>>(
    type: Constructor<T> | string,
    id: string
  ) => {
    const entities = useEntities(type, { _id: id })
    return entities?.[0]
  }

  const useLegendArr = (id: string) => {
    if (!entityDataObservable[id].peek()) {
      entityDataObservable[id].set([])
    }

    return { array: entityDataObservable[id].get('shallow') }
    // return { array: entityDataObservable[id].get() }
  }

  const propagateChangesToAllHooks = (
    arr: { id: string; type: string }[],
    hookId?: string
  ) => {
    const repopulateId = (key: string) => {
      const inIds = entityDataObservable[key].peek().map((e) => e.id)
      entityDataObservable[key].set(
        entityDataObservable[key]
          .peek()
          .map((e) => {
            const inNewArr = arr.find((a) => a.id === e.id && a.type === e.type)
            if (inNewArr) {
              // Needs updating
              const latestD = globalEntityDataObservable[inNewArr.id].peek()
              return {
                ...inNewArr,
                entity: latestD.entity,
                entityObj: latestD.entityObj,
              }
            } else {
              return e
            }
          }) // add new entities
          .concat(
            arr
              .filter(
                (a) =>
                  !inIds.includes(a.id) &&
                  !!globalEntityDataObservable[a.id].peek()
              )
              .map((a) => ({
                id: a.id,
                type: a.type,
                entity: globalEntityDataObservable[a.id].peek().entity,
                entityObj: globalEntityDataObservable[a.id].peek().entityObj,
              }))
          )
      )
    }

    if (hookId) {
      return repopulateId(hookId)
    } else {
      // for all keys in entityDataObservable
      for (const key in entityDataObservable.peek()) {
        repopulateId(key)
      }
    }
  }

  const wrapEntityArr = (entities: { id; entity; type; entityObj }[]) => {
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

          return e.entity[prop]
        },
      })
    })
  }

  const useEntities = <T extends Entity<any>>(
    type: Constructor<T> | string,
    query: any,
    opts?: { noWatch?: boolean }
  ): T[] => {
    const subscriptions = useRef<string[]>([])
    const tt = entityType(type)
    const hookId = useId()
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

    return wrapEntityArr(arr.array) as any as T[]
  }

  /**
   * @deprecated This hook is deprecated and will be removed in future releases. Use useEntity instead.
   */
  const useStableEntity = <T extends Entity>(
    type: Constructor<T> | string,
    id: string
  ) => {
    const ret = useEntity(type, id)
    const getEntity = useCallback(() => {
      return ret
    }, [ret])
    return [ret, { getEntity }] as const
  }

  const useEntityRelation = <T extends Entity>(
    entity: T,
    relation: keyof T & string
  ): T[] => {
    const type =
      (entity ? entity.getRelationInfo(relation) : UnknownEntity) ??
      UnknownEntity
    invariant(
      type !== UnknownEntity || !entity,
      `Unknown entity type for relation ${relation}. Are you missing an @EntityRelation decorator?`
    )
    const query = !entity
      ? { _id: { $in: [] } }
      : {
          _id: {
            $in: Array.isArray(entity[relation])
              ? entity[relation]
              : entity[relation]
              ? [entity[relation]]
              : [],
          },
        }

    return useEntities(type as any, query) as T[]
  }

  const createEntity = async <T extends Entity>(
    type: Constructor<T> | string,
    data: any
  ) => {
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

  const deleteEntity = async <T extends Entity>(
    type: Constructor<T> | string,
    id: string
  ) => {
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

  const updateEntity = async <T extends Entity>(
    type: Constructor<T> | string,
    id: string,
    data: any,
    revisionNumber?: number
  ) => {
    const managers = [...(await getLatestValue(subject)), ...extraMan]
    for (const manager of managers) {
      try {
        await manager.update(entityType(type), id, data)
        entityDataObservable[id].assign({ ...data })
      } catch (e) {
        console.error(e)
      }
    }
  }

  return {
    useEntity,
    invalidate,
    useStableEntity,
    useEntities,
    createEntity,
    deleteEntity,
    updateEntity,
    useEntityRelation,
    _getManagers: () => getLatestValue(subject),
    query: (type, query) =>
      queryFromAllManagers(getLatestValue(subject), type, query),
  }
}
