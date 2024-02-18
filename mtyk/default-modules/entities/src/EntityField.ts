import { invariant } from 'modules/errors'
export enum EntityFieldMetadata {
  ENTITY_FIELD = 'entityField',
  ENTITY_FIELD_GETTER = 'entityFieldGetter',
  ENTITY_FIELD_BEFORE_SET = 'entityFieldSetter',
  STREAMABLE_FIELD = 'streamableField',
}

function EntityField<T>(options?: {
  streamable?: boolean
  get?: () => T
  beforeSet?: (value: T, opts: { entity: any }) => void
  defaultValue?: T
}) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(EntityFieldMetadata.ENTITY_FIELD, true, target, propertyKey)

    if (options?.streamable) {
      Reflect.defineMetadata(EntityFieldMetadata.STREAMABLE_FIELD, true, target, propertyKey)
    }

    if (options?.get) {
      // Assert no default value, won't take effect
      invariant(!options.defaultValue, '`get` will override `defaultValue`')
      Reflect.defineMetadata(
        EntityFieldMetadata.ENTITY_FIELD_GETTER,
        options.get,
        target,
        propertyKey,
      )
    } else if (options?.defaultValue) {
      Reflect.defineMetadata(
        EntityFieldMetadata.ENTITY_FIELD_GETTER,
        ({ value }) => value ?? options.defaultValue,
        target,
        propertyKey,
      )
    }

    if (options?.beforeSet) {
      Reflect.defineMetadata(
        EntityFieldMetadata.ENTITY_FIELD_BEFORE_SET,
        options.beforeSet,
        target,
        propertyKey,
      )
    }
  }
}

// Helper method to retrieve associated properties for each Reflect key
// including default value and type of the field if present
export function getEntityFieldMetadata(
  target: any,
  propertyKey: string,
): {
  entityField: boolean | undefined
  streamableField: boolean | undefined
  entityFieldGetter: (() => any) | undefined
  entityFieldBeforeSet: ((value: any, opts: { entity: any }) => void) | undefined
  defaultValue: any | undefined
  type: any | undefined
} {
  return {
    entityField: Reflect.getMetadata(EntityFieldMetadata.ENTITY_FIELD, target, propertyKey),
    streamableField: Reflect.getMetadata(
      EntityFieldMetadata.STREAMABLE_FIELD,
      target,
      propertyKey,
    ),
    entityFieldGetter: Reflect.getMetadata(
      EntityFieldMetadata.ENTITY_FIELD_GETTER,
      target,
      propertyKey,
    ),
    entityFieldBeforeSet: Reflect.getMetadata(
      EntityFieldMetadata.ENTITY_FIELD_BEFORE_SET,
      target,
      propertyKey,
    ),
    defaultValue: Reflect.getMetadata(
      EntityFieldMetadata.ENTITY_FIELD_GETTER,
      target,
      propertyKey,
    )?.defaultValue,
    type: Reflect.getMetadata('design:type', target, propertyKey),
  }
}

export default EntityField
