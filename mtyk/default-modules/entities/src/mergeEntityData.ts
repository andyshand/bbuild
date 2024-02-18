
// export function wrapEntityData<T extends BaseEntity>(
//   entityType: string,
//   entityData: { [key: string]: any }
// ): T {
//   return new Proxy(entityData, {
//     get(target, prop: string) {
//       if (!(prop in target)) {
//         return async (...args: any[]) => {
//           const entityManagers = this.entityManagers
//           const results = await Promise.all(
//             entityManagers.map(em => em.invokeMethod(target, prop, args))
//           )
//           return results[0]
//         }
//       } else {
//         return target[prop]
//       }
//     },
//     set(target: BaseEntity, prop: string, value: any) {
//       target[prop] = value
//       return true
//     },
//   }) as T
// }
// export function mergeEntityData<T extends BaseEntity>(
//   entityType: string,
//   entityData: { [key: string]: any }[]
// ): any {
//   return entityData.reduce((acc, cur) => {
//     return { ...acc, ...cur }
//   }, {})
// }
