import { Observable } from 'rxjs'
import { IEntityManager } from './IEntityManager'

export class MockEntityManager implements IEntityManager {
  yDoc: any
  create(entityType: any, entity: any): Promise<any> {
    throw new Error('Method not implemented.')
  }
  read(entityType: any, id: any): Promise<any> {
    throw new Error('Method not implemented.')
  }
  update(
    entityType: any,
    id: any,
    updates: any,
    revisionNumber?: number
  ): Promise<any> {
    // throw new Error("Method not implemented.");
    return null as any
  }
  delete(entityType: any, id: any): Promise<any> {
    // throw new Error("Method not implemented.");
    return null as any
  }
  find(entityType: any, query: any): Promise<any> {
    throw new Error('Method not implemented.')
  }
  watch(entityType: any, opts: { id: string }): Observable<any> {
    throw new Error('Method not implemented.')
  }
  call(entityType: any, id: any, method: any, args: any): Promise<any> {
    throw new Error('Method not implemented.')
  }
  id: string
}
