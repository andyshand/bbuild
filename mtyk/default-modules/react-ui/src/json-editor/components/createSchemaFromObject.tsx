import * as z from 'zod'

export function createSchemaFromObject(obj: any): z.ZodType<any, any> {
  const schema: any = {}
  for (const key in obj) {
    switch (typeof obj[key]) {
      case 'string':
        // is it an ISO string?
        // if (obj[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        // schema[key] = z.date()
        // } else {
        schema[key] = z.string()
        // }
        break
      case 'number':
        schema[key] = z.number()
        break
      case 'boolean':
        schema[key] = z.boolean()
        break
      case 'object':
        if (Array.isArray(obj[key])) {
          schema[key] = z.array(createSchemaFromObject(obj[key][0]))
        } else if (obj[key] === null) {
          schema[key] = z.null()
        } else {
          schema[key] = createSchemaFromObject(obj[key])
        }
        break
      default:
        schema[key] = z.any()
    }
  }
  return z.object(schema)
}
