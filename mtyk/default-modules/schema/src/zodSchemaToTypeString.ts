import * as z from 'zod'

export default function zodSchemaToTypeString(schema: z.ZodTypeAny, typeName: string): string {
  const parents: any[] = []
  function processZodType(
    zodType: z.ZodTypeAny,
    ctx?: {
      inArray?: boolean
      inObject?: boolean
    }
  ): string {
    if (!zodType) {
      return 'any'
    }
    const typeName = zodType.constructor.name
    const description = zodType._def.description ?? null
    const maybeAddDescriptionAsComment = (str) =>
      `${str}${description ? ` // ${description}` : ''}`

    if (typeName === 'ZodString') {
      return maybeAddDescriptionAsComment('string')
    } else if (typeName === 'ZodNumber') {
      return maybeAddDescriptionAsComment('number')
    } else if (typeName === 'ZodBoolean') {
      return maybeAddDescriptionAsComment('boolean')
    } else if (typeName === 'ZodDate') {
      return maybeAddDescriptionAsComment('Date')
    } else if (typeName === 'ZodUndefined') {
      return 'undefined'
    } else if (typeName === 'ZodNull') {
      return 'null'
    } else if (typeName === 'ZodArray') {
      return `${processZodType((zodType as z.ZodArray<any>)._def.type as any, {
        inArray: true,
      })}[]`
    } else if (typeName === 'ZodEnum') {
      const enumValues = (zodType as z.ZodEnum<any>)._def.values.map((value) => `"${value}"`)
      return enumValues.join(' | ')
    } else if (typeName === 'ZodTuple') {
      const tupleTypes = (zodType as z.ZodTuple<any>)._def.items.map((item) =>
        processZodType(item)
      )
      return `[${tupleTypes.join(', ')}]`
    } else if (typeName === 'ZodObject') {
      const fieldStrings = Object.entries((zodType as z.ZodObject<any>).shape).map(
        ([fieldName, fieldSchema]: any) => {
          let optional = fieldSchema._def.isOptional ? '?' : ''
          let fieldType = processZodType(fieldSchema as any, { inObject: true })
          if (fieldType.includes('| undefined')) {
            optional = '?'
            fieldType = fieldType.replace(' | undefined', '').trim()
          }
          return `${fieldName}${optional}: ${fieldType}`
        }
      )
      return `{${fieldStrings.join(', ')}}`
    } else if (typeName === 'ZodMap') {
      const keyType = processZodType((zodType as z.ZodMap<any>)._def.keyType)
      const valueType = processZodType((zodType as z.ZodMap<any>)._def.valueType)
      return `Map<${keyType}, ${valueType}>`
    } else if (typeName === 'ZodRecord') {
      const valueType = processZodType((zodType as z.ZodRecord<any>)._def.valueType)
      return `Record<string, ${valueType}>`
    } else if (typeName === 'ZodUnion') {
      const unionTypes = (zodType as z.ZodUnion<any>)._def.options.map((option) =>
        processZodType(option)
      )
      return unionTypes.join(' | ')
    } else if (typeName === 'ZodIntersection') {
      const leftType = processZodType((zodType as z.ZodIntersection<any, any>)._def.left)
      const rightType = processZodType((zodType as z.ZodIntersection<any, any>)._def.right)
      return `${leftType} & ${rightType}`
    } else if (typeName === 'ZodLiteral') {
      const literalValue = (zodType as z.ZodLiteral<any>)._def.value
      return typeof literalValue === 'string' ? `"${literalValue}"` : `${literalValue}`
    } else if (typeName === 'ZodOptional') {
      const optionalType = processZodType((zodType as z.ZodOptional<any>)._def.innerType)
      return `${optionalType} | undefined`
    } else if (typeName === 'ZodLazy') {
      if (parents.includes(zodType)) {
        return zodType._def.getter()?.constructor?.name ?? 'unknown'
      }
      parents.push(zodType)
      const lazyType = processZodType((zodType as z.ZodLazy<any>)._def.getter())
      parents.pop()
      return lazyType
    } else if (typeName === 'ZodEffects') {
      const effectsType = processZodType((zodType as z.ZodEffects<any>)._def.schema)
      return effectsType
    } else {
      console.log(`Unknown zod type: ${typeName}`, schema)
      return 'unknown'
    }
  }

  const typeString = processZodType(schema)
  return `type ${typeName} = ${typeString};`
}
