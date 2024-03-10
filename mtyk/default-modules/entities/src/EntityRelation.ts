import 'reflect-metadata'
import { EntityFieldMetadata, setEntityFieldMetadata } from './EntityFieldMetadata'
import { getEntityTypeName } from './getEntityTypeName'

export function EntityRelation<T>(innerType: T) {
  return function (target: any, propertyKey: string) {
    setEntityFieldMetadata(target, EntityFieldMetadata.ENTITY_FIELD_LIST, propertyKey, {
      relatedEntity: getEntityTypeName(innerType),
    })
  }
}

export default EntityRelation
