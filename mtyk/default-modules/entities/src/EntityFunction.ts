import { EntityFieldMetadata, setEntityFieldMetadata } from './EntityFieldMetadata'

export function EntityFunction() {
  return function (target: any, propertyKey: string) {
    setEntityFieldMetadata(target, EntityFieldMetadata.ENTITY_FUNCTION, propertyKey, true)
  }
}

export default EntityFunction
