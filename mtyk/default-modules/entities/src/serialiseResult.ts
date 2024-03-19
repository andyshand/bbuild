import { Observable, map } from 'rxjs'
import Entity from './Entity'
import { getEntityTypeName } from './getEntityTypeName'

export const serialiseResult = (value: any) => {
  if (Array.isArray(value)) {
    return value.map(serialiseResult)
  }
  if (value instanceof Entity) {
    return {
      ...value.getEntityFieldValues(),
      revisionNumber: value.revisionNumber,
      type: getEntityTypeName(value),
    }
  } else if (value instanceof Observable) {
    // make sure we pipe serialised results
    return value.pipe(map(serialiseResult))
  } else {
    return value
  }
}
