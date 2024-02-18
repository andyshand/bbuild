// import { BehaviorSubject, Observable } from 'rxjs'
// import { BaseEntity } from './BaseEntity'
// import { IEntityManager } from './IEntityManager'
// import { mergeEntityData, wrapEntityData } from './mergeEntityData'

// type EntityClientConfig = {
//   entityManagers: IEntityManager[]
// }

// export class EntityClient {
//   entityManagers: IEntityManager[]

//   constructor({ entityManagers }: EntityClientConfig) {
//     this.entityManagers = entityManagers
//   }

//   async getEntities<T extends BaseEntity>(
//     entityType: string,
//     query?: { [key: string]: any }
//   ): Promise<T[]> {
//     const entityDataById: { [key: string]: any } = {}

//     for (const entityManager of this.entityManagers) {
//       const entitiesForMan = await entityManager.find(entityType, query)

//       for (const entity of entitiesForMan) {
//         Object.assign(entityDataById, {
//           [entity.id]: mergeEntityData(entityType, [
//             entityDataById[entity.id],
//             entity,
//           ]),
//         })
//       }
//     }

//     return Object.values(entityDataById).map(ed =>
//       wrapEntityData<T>(entityType, ed)
//     )
//   }

//   async getEntityById<T extends BaseEntity>(
//     entityType: string,
//     id: string
//   ): Promise<T> {
//     const [entity] = await this.getEntities<T>(entityType, { id })
//     return entity
//   }

//   async createEntity<T extends BaseEntity>(
//     entityType: string,
//     entityData: { [key: string]: any }
//   ): Promise<T> {
//     const createdEntityDataList = await Promise.all(
//       this.entityManagers.map(em => em.create(entityType, entityData))
//     )

//     const createdEntityData = createdEntityDataList.find(
//       ed => ed !== null && ed !== undefined
//     )

//     if (!createdEntityData) {
//       throw new Error(`Failed to create entity`)
//     }

//     return wrapEntityData<T>(entityType, createdEntityData)
//   }
//   async deleteEntity<T extends BaseEntity>(
//     entityType: string,
//     id: string
//   ): Promise<void> {
//     for (const em of this.entityManagers) {
//       const entity = await em.read(entityType, id)

//       if (entity) {
//         await em.delete(entityType, id)
//       }
//     }
//   }

//   async updateEntity<T extends BaseEntity>(
//     entityType: string,
//     id: string,
//     updateData: { [key: string]: any }
//   ): Promise<T> {
//     for (const em of this.entityManagers) {
//       const entity = await em.read(entityType, id)

//       if (entity) {
//         await em.update(entityType, id, updateData)
//       }
//     }

//     return this.getEntityById<T>(entityType, id)
//   }

//   private watchSubjects: { [key: string]: BehaviorSubject<any> } = {}
//   watchEntities<T extends BaseEntity>(entityType: string): Observable<T[]> {
//     if (!this.watchSubjects[entityType]) {
//       const initialData = []
//       this.getEntities<T>(entityType).then(data => {
//         initialData.push(...data)
//         this.watchSubjects[entityType].next(initialData)
//       })
//       this.watchSubjects[entityType] = new BehaviorSubject(initialData)
//       this.entityManagers.forEach(em => {
//         em.watch<T>(entityType).subscribe(data => {
//           const entityData = wrapEntityData<T>(entityType, data)
//           const subject = this.watchSubjects[entityType]
//           const index = subject.value.findIndex(
//             (d: T) => d.id === entityData.id
//           )
//           if (index >= 0) {
//             const newData = [...subject.value]
//             newData.splice(index, 1, entityData)
//             subject.next(newData)
//           } else {
//             subject.next([...subject.value, entityData])
//           }
//         })
//       })
//     }
//     return this.watchSubjects[entityType].pipe(
//       filter(data => Array.isArray(data))
//     )
//   }
// }
