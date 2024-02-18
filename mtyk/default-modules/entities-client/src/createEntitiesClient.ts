// import { Entity, IEntityManager, entityType } from 'modules/entities'
// import { getEntityRelation } from 'modules/entities/EntityRelation'
// import { RPCEntityManager } from 'modules/entities/RPCEntityManager'
// import { UnknownEntity } from 'modules/entities/UnknownEntity'
// import { invariant } from 'modules/errors'
// import { pubSub } from 'modules/rpc-ws/central/client'
// import { useCallback, useEffect, useRef, useState } from 'react'
// import { ReplaySubject, Subject, Subscription } from 'rxjs'
// import { filter, tap } from 'rxjs/operators'
// import type { Constructor } from 'type-fest'
// import { queryFromAllManagers } from './allManagers'
// import { cacheMap } from './cacheMap'
// import { getLatestValue } from './getLatestValue'
// import entityDataObservable from './store'
// import isEqual from 'lodash/isEqual'

// export function createEntitiesClient<M extends IEntityManager[]>(
//   extraMan: M[],
//   entities: Constructor<Entity>[] = []
// ) {
//   const subject = new ReplaySubject<string[]>(1)
//   const managers$ = pubSub.subscribe('entityManagersChannel').pipe(
//     cacheMap((name) => {
//       return new RPCEntityManager(entities, name)
//     })
//   )
//   managers$.subscribe(subject)

//   type EntitySubscriptionInfo = {
//     subscription: Subscription
//     refCount: number
//   }

//   const entitySubscriptions = new Map<string, EntitySubscriptionInfo>()
//   const entityRevisionNumbers = new Map<string, number>()

//   function getEntitySubscription(manager: any, entityType: string, id: string) {
//     const key = `${entityType}-${id}`

//     if (!entitySubscriptions.has(key)) {
//       const observable = manager.watch(entityType, { id })
//       const subscription = observable.subscribe((data) => {
//         if ((entityRevisionNumbers.get(id) || -1) >= data.revisionNumber) return
//         entityRevisionNumbers.set(id, data.revisionNumber)
//         entityDataObservable[id].assign({ ...data })
//       })

//       entitySubscriptions.set(key, {
//         subscription: subscription,
//         refCount: 1,
//       })
//     } else {
//       const subscriptionInfo = entitySubscriptions.get(key)
//       if (subscriptionInfo) {
//         subscriptionInfo.refCount += 1
//       } else {
//         // Handle the unexpected undefined case, possibly with an error or a default value
//         console.error(`Expected subscriptionInfo to be defined for key: ${key}`)
//       }
//     }
//   }

//   function decrementSubscriptionRefCount(entityType: string, id: string) {
//     const key = `${entityType}-${id}`
//     const subscriptionInfo = entitySubscriptions.get(key)

//     if (subscriptionInfo) {
//       subscriptionInfo.refCount -= 1

//       if (
//         subscriptionInfo.refCount <= 0 &&
//         !subscriptionInfo.subscription.closed
//       ) {
//         console.debug(`${entityType}-${id} unsubscribed`, key)
//         // Unsubscribe from the subscription
//         subscriptionInfo.subscription.unsubscribe()
//         entitySubscriptions.delete(key)
//       }
//     }
//   }

//   function removeSubscription(entityType: string, id: string) {
//     const key = `${entityType}-${id}`
//     const subscriptionInfo = entitySubscriptions.get(key)
//     if (subscriptionInfo && !subscriptionInfo.subscription.closed) {
//       console.debug(`${entityType}-${id} unsubscribed`, key)
//       subscriptionInfo.subscription.unsubscribe()
//       entitySubscriptions.delete(key)
//     }
//   }

//   const invalidateSubject = new Subject()

//   function invalidate<T extends Entity<any>>(type: Constructor<T> | string) {
//     const tt = entityType(type)
//     invalidateSubject.next(tt)
//   }

//   const useDiscoverManagers = () => {
//     const [allManagers, setAllManagers] = useState<RPCEntityManager[]>([])

//     useEffect(() => {
//       // Set allManagers
//       const subscription = managers$
//         .pipe(
//           tap((managersFromObservable: any[]) => {
//             const newManagers = [...managersFromObservable, ...extraMan]
//             if (newManagers.length === 0 || isEqual(allManagers, newManagers))
//               return
//             setAllManagers(newManagers)
//           })
//         )
//         .subscribe()

//       // Cleanup the subscription on unmount
//       return () => subscription.unsubscribe()
//     }, [extraMan])

//     return allManagers
//   }

//   function stripMethods(obj) {
//     return Object.entries(obj)
//       .filter(([key, value]) => typeof value !== 'function')
//       .reduce((acc, [key, value]) => {
//         acc[key] = value
//         return acc
//       }, {})
//   }

//   const legendWrapper = <T extends Entity>(
//     entity: T,
//     legendEntity: (typeof entityDataObservable)['id'],
//     tt: string
//   ): T => {
//     const legendEntityObject = legendEntity.peek()

//     const proxyHandler = {
//       get(target, prop, receiver) {
//         const isEntityFunc = (entity as any).isEntityFunction(prop)

//         const value =
//           prop in legendEntityObject
//             ? legendEntity[prop].get()
//             : Reflect.get(target, prop, receiver)

//         if (isEntityFunc) {
//           return async function (...args: any[]) {
//             let result
//             const managers = [...(await getLatestValue(subject)), ...extraMan]

//             for (const manager of managers) {
//               try {
//                 const updatedEntity = (await manager.read(tt, entity.id)) as T
//                 const method = updatedEntity[prop] as unknown as Function
//                 result = await method.apply(updatedEntity, args)
//               } catch (error) {
//                 console.error('Error reading the entity:', error)
//                 throw error // Or handle the error as appropriate
//               }
//             }

//             return result
//           }
//         }

//         return value
//       },
//     }

//     const legendInstance = new Proxy<T>(entity, proxyHandler)

//     return legendInstance
//   }

//   const useEntity = <T extends Entity<any>>(
//     type: Constructor<T> | string,
//     id: string
//   ) => {
//     const [entityData, setEntityData] = useState<T | null>(null)
//     const subscriptions = useRef<string[]>([])
//     const tt = entityType(type)
//     const allManagers = useDiscoverManagers()

//     useEffect(() => {
//       if (!id || allManagers.length < 1) {
//         return setEntityData(null)
//       }

//       allManagers.forEach(async (manager) => {
//         try {
//           const entity = (await manager.read(tt, id)) as T
//           if (!entity) return setEntityData(null)
//           if (entityRevisionNumbers.get(id) || -1 < entity.revisionNumber) {
//             entityRevisionNumbers.set(id, entity.revisionNumber)
//             // Set the entity in the legend observable
//             entityDataObservable.assign({
//               [id]: stripMethods(entity),
//             })
//           }

//           // Wrap entity and entityDataObservable into proxy
//           setEntityData(legendWrapper(entity, entityDataObservable[id], tt))
//           getEntitySubscription(manager, tt, id)
//           subscriptions.current.push(id)
//         } catch (error) {
//           console.error('Error reading the entity:', error)
//         }
//       })

//       // Cleanup the subscription on unmount and entityDataObservable
//       return () => {
//         subscriptions.current.forEach((id) =>
//           decrementSubscriptionRefCount(tt, id)
//         )
//         subscriptions.current = []
//       }
//     }, [allManagers, id])
//     return entityData
//   }

//   const useEntities = <T extends Entity<any>>(
//     type: Constructor<T> | string,
//     query: any,
//     opts?: { noWatch?: boolean }
//   ): T[] => {
//     const [entityData, setEntityData] = useState<T[]>([])
//     const subscriptions = useRef<string[]>([])
//     const [refreshTrigger, setRefreshTrigger] = useState(0) // State to trigger refresh
//     const tt = entityType(type)
//     const allManagers = useDiscoverManagers()

//     useEffect(() => {
//       if (allManagers.length < 1) return setEntityData([])
//       allManagers.forEach(async (manager) => {
//         try {
//           const entities = await manager.find(tt, query)
//           if (entities.length < 1) return setEntityData([])

//           // Set the entity in the legend observable
//           const entitiesObject = entities.reduce((acc, entity) => {
//             const id = entity.id
//             if (entityRevisionNumbers.get(id) || -1 < entity.revisionNumber) {
//               acc[entity.id] = stripMethods(entity)
//               entityRevisionNumbers.set(id, entity.revisionNumber)
//             }
//             return acc
//           }, {})
//           if (Object.keys(entitiesObject).length > 0) {
//             entityDataObservable.assign({
//               ...entitiesObject,
//             })
//           }

//           // Wrap entity and entityDataObservable into proxy
//           setEntityData(
//             entities.map((entity) => {
//               return legendWrapper(entity, entityDataObservable[entity.id], tt)
//             })
//           )
//           // Watch the entity and update
//           if (!opts?.noWatch) {
//             entities.forEach((entity) => {
//               const id = entity.id
//               getEntitySubscription(manager, tt, id)

//               subscriptions.current.push(id)
//             })
//           }
//         } catch (error) {
//           console.error('Error reading the entity:', error)
//           // setError(error)
//         }
//       })

//       // Cleanup the subscription on unmount and entityDataObservable
//       return () => {
//         subscriptions.current.forEach((id) => {
//           decrementSubscriptionRefCount(tt, id)
//         })
//         subscriptions.current = []
//       }
//     }, [allManagers, tt, JSON.stringify(query), refreshTrigger])

//     // Subscribe to invalidateSubject
//     useEffect(() => {
//       const subscription = invalidateSubject
//         .pipe(filter((invalidateType) => invalidateType === tt))
//         .subscribe({
//           next: (_) => {
//             // Trigger the first useEffect to re-run
//             setRefreshTrigger((prev) => prev + 1)
//           },
//         })

//       return () => subscription.unsubscribe()
//     }, [type])

//     return entityData
//   }

//   const useStableEntity = <T extends Entity>(
//     type: Constructor<T> | string,
//     id: string
//   ) => {
//     const ret = useEntity(type, id)
//     const getEntity = useCallback(() => {
//       return ret
//     }, [ret])
//     return [ret, { getEntity }] as const
//   }

//   const useEntityRelation = <T extends Entity>(
//     entity: T,
//     relation: keyof T & string
//   ): T[] => {
//     const type =
//       (entity ? getEntityRelation(entity, relation) : UnknownEntity) ??
//       UnknownEntity
//     invariant(
//       type !== UnknownEntity || !entity,
//       `Unknown entity type for relation ${relation}. Are you missing an @EntityRelation decorator?`
//     )
//     const query = !entity
//       ? { _id: { $in: [] } }
//       : {
//           _id: {
//             $in: Array.isArray(entity[relation])
//               ? entity[relation]
//               : entity[relation]
//               ? [entity[relation]]
//               : [],
//           },
//         }

//     return useEntities(type as any, query) as T[]
//   }

//   const createEntity = async <T extends Entity>(
//     type: Constructor<T> | string,
//     data: any
//   ) => {
//     const managers = [...(await getLatestValue(subject)), ...extraMan] as any
//     let entity: T | undefined = undefined
//     const tt = entityType(type)

//     for (const manager of managers) {
//       try {
//         const some = (await manager.create(entityType(type), data)) as T
//         entityDataObservable.assign({
//           [some.id]: stripMethods(some),
//         })

//         entity = legendWrapper(some, entityDataObservable[some.id], tt)
//         getEntitySubscription(manager, tt, some.id)
//       } catch (e) {
//         console.error(e)
//       }
//     }

//     return entity
//   }

//   const deleteEntity = async <T extends Entity>(
//     type: Constructor<T> | string,
//     id: string
//   ) => {
//     const managers = [...getLatestValue(subject), ...extraMan]
//     const tt = entityType(type)
//     for (const manager of managers) {
//       try {
//         // entityDataObservable[id].delete()
//         await manager.delete(entityType(type), id)
//         // TODO
//         // entityDataObservable[id].assign({})
//         // removeSubscription(tt, id)
//       } catch (e) {
//         console.error(e)
//       }
//     }
//   }

//   const updateEntity = async <T extends Entity>(
//     type: Constructor<T> | string,
//     id: string,
//     data: any,
//     revisionNumber?: number
//   ) => {
//     const managers = [...getLatestValue(subject), ...extraMan]
//     for (const manager of managers) {
//       try {
//         await manager.update(entityType(type), id, data, revisionNumber)
//         entityDataObservable[id].assign({ ...data })
//       } catch (e) {
//         console.error(e)
//       }
//     }
//   }

//   return {
//     useEntity,
//     invalidate,
//     useStableEntity,
//     useEntities,
//     createEntity,
//     deleteEntity,
//     updateEntity,
//     useEntityRelation,
//     _getManagers: () => getLatestValue(subject),
//     query: (type, query) =>
//       queryFromAllManagers(getLatestValue(subject), type, query),
//   }
// }
