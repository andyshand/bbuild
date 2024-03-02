import { Observable } from 'rxjs'
import { Constructor } from 'modules/types'

export type IEntityManagerFindOpts = {
  limit?: number
  skip?: number
}

export type EntityType = Record<string, any>
export type CreatedEntity<T extends EntityType = any> = T & { id: string }
export type Id = string

export interface IEntityManager {
  yDoc: any
  create<T = any>(
    entityType: Constructor<T> | string,
    entity: Partial<T>
  ): Promise<CreatedEntity<T>>
  read<T extends EntityType = any>(
    entityType: Constructor<T> | string,
    id: Id
  ): Promise<CreatedEntity<T>>
  update(entityType, id, updates, revisionNumber?: number): Promise<CreatedEntity>
  delete(entityType, id): Promise<any>
  find<T extends EntityType = any>(
    entityType: Constructor<T> | string,
    query,
    opts?: IEntityManagerFindOpts
  ): Promise<CreatedEntity<T>[]>
  watch(entityType, opts: { id: string }): Observable<any>
  call(entityType, id, method, args): Promise<any>
  id: string
}
