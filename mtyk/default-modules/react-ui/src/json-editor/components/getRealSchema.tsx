import * as z from 'zod'

export function getRealSchema(schema) {
  if (schema instanceof z.ZodDefault) {
    return getRealSchema(schema._def.innerType)
  }
  if (schema instanceof z.ZodOptional) {
    return getRealSchema(schema._def.innerType)
  }

  return schema
}
