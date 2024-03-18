import { invariant } from 'modules/errors'
import {
  EntityFieldMetadata,
  getMetadataStore,
  setEntityFieldMetadata,
} from './EntityFieldMetadata'

function EntityField<T>(options?: {
  streamable?: boolean
  get?: () => T
  beforeSet?: (value: T, opts: { entity: any }) => void
  defaultValue?: T
}) {
  return function (target: any, propertyKey: string) {
    setEntityFieldMetadata(target, EntityFieldMetadata.ENTITY_FIELD, propertyKey, true)

    if (options?.streamable) {
      setEntityFieldMetadata(target, EntityFieldMetadata.STREAMABLE_FIELD, propertyKey, true)
    }

    if (options?.get) {
      // Assert no default value, won't take effect
      invariant(!options.defaultValue, '`get` will override `defaultValue`')
      setEntityFieldMetadata(
        target,
        EntityFieldMetadata.ENTITY_FIELD_GETTER,
        propertyKey,
        options.get
      )
    } else if (options?.defaultValue) {
      setEntityFieldMetadata(
        target,
        EntityFieldMetadata.ENTITY_FIELD_GETTER,
        propertyKey,
        () => options.defaultValue
      )
    }

    if (options?.beforeSet) {
      setEntityFieldMetadata(
        target,
        EntityFieldMetadata.ENTITY_FIELD_BEFORE_SET,
        propertyKey,
        options.beforeSet
      )
    }
  }
}

// Helper method to retrieve associated properties for each Reflect key
// including default value and type of the field if present
export function getEntityFieldMetadata(
  target: any,
  propertyKey: string
): {
  entityField: boolean | undefined
  streamableField: boolean | undefined
  entityFieldGetter: (() => any) | undefined
  entityFieldBeforeSet: ((value: any, opts: { entity: any }) => void) | undefined
  relation: string | undefined
  defaultValue: any | undefined
  entityFunction: boolean | undefined
  type: any | undefined
} {
  const constructorName = target.constructor.name
  const metadata = getMetadataStore()[constructorName]?.[propertyKey]

  return {
    relation: metadata?.[EntityFieldMetadata.ENTITY_RELATION]?.relatedEntity,
    entityField: metadata?.[EntityFieldMetadata.ENTITY_FIELD],
    streamableField: metadata?.[EntityFieldMetadata.STREAMABLE_FIELD],
    entityFieldGetter: metadata?.[EntityFieldMetadata.ENTITY_FIELD_GETTER],
    entityFieldBeforeSet: metadata?.[EntityFieldMetadata.ENTITY_FIELD_BEFORE_SET],
    defaultValue: metadata?.[EntityFieldMetadata.ENTITY_FIELD_GETTER]?.defaultValue,
    entityFunction: metadata?.[EntityFieldMetadata.ENTITY_FUNCTION],
    type: Reflect.getMetadata('design:type', target, propertyKey),
  }
}
export default EntityField
