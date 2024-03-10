import { getEntityTypeName } from './getEntityTypeName'

export enum EntityFieldMetadata {
  // Per entity
  ENTITY_FIELD_LIST = 'entityFieldList',

  // Per field
  ENTITY_FIELD = 'entityField',
  ENTITY_FIELD_GETTER = 'entityFieldGetter',
  ENTITY_RELATION = 'entityRelation',
  ENTITY_FIELD_BEFORE_SET = 'entityFieldSetter',
  STREAMABLE_FIELD = 'streamableField',
  ENTITY_FUNCTION = 'entityFunction',
}

type EntityFieldList = string[]
type EntityField = boolean
type EntityFieldGetter = () => any
type EntityRelation = {
  relatedEntity: string
}
type EntityFieldBeforeSet = (value: any, opts: { entity: any }) => void
type StreamableField = boolean
type EntityFunction = boolean
type AllEntityFieldMetadata =
  | EntityField
  | EntityFieldGetter
  | EntityFieldBeforeSet
  | StreamableField
  | EntityFunction
  | EntityFieldList
  | EntityRelation
type MetadataForKey<T extends EntityFieldMetadata> = T extends EntityFieldMetadata.ENTITY_FIELD
  ? EntityField
  : T extends EntityFieldMetadata.ENTITY_FIELD_GETTER
  ? EntityFieldGetter
  : T extends EntityFieldMetadata.ENTITY_FIELD_BEFORE_SET
  ? EntityFieldBeforeSet
  : T extends EntityFieldMetadata.STREAMABLE_FIELD
  ? StreamableField
  : T extends EntityFieldMetadata.ENTITY_FUNCTION
  ? EntityFunction
  : T extends EntityFieldMetadata.ENTITY_FIELD_LIST
  ? EntityFieldList
  : T extends EntityFieldMetadata.ENTITY_RELATION
  ? EntityRelation
  : never

export const metadataStore: Record<string, Record<string, AllEntityFieldMetadata>> = {}

export function getEntityTargetName(target: any) {
  return getEntityTypeName(target)
}

/**
 * @deprecated duplicated in EntityField?
 */
export function getEntityMetadata(target: any): { fieldList: EntityFieldList } {
  return {
    fieldList: (metadataStore[getEntityTargetName(target)]?.[
      EntityFieldMetadata.ENTITY_FIELD_LIST
    ] ?? []) as EntityFieldList,
  }
}

export function setEntityFieldMetadata<E>(
  target: any,
  type: EntityFieldMetadata,
  field: keyof E,
  value: MetadataForKey<typeof type>
): void {
  const entityTypeName = getEntityTargetName(target)

  if (!metadataStore[entityTypeName]) {
    metadataStore[entityTypeName] = {}
  }

  if (!metadataStore[entityTypeName][field as string]) {
    // TODO fix typing?
    metadataStore[entityTypeName][field as any] = {} as any
  }

  if (!metadataStore[entityTypeName][EntityFieldMetadata.ENTITY_FIELD_LIST]) {
    metadataStore[entityTypeName][EntityFieldMetadata.ENTITY_FIELD_LIST] = []
  }

  if (type === EntityFieldMetadata.ENTITY_FIELD) {
    ;(
      metadataStore[entityTypeName][EntityFieldMetadata.ENTITY_FIELD_LIST] as EntityFieldList
    ).push(field as string)
  }

  metadataStore[entityTypeName][field][type] = value
}
