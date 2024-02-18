import { Entity, EntityField, EntityFunction } from 'modules/entities'
import * as z from 'zod'
import { ZodTypeAny, ZodObject, ZodOptional, ZodUnion } from 'zod'
import zodSchemaToTypeString from '../zodSchemaToTypeString'

type ZodResult<T> = T | undefined

export class CommandEntity extends Entity {
  @EntityField()
  zodSchema: string = ''

  @EntityField()
  command: string = ''

  @EntityField()
  example: string = ''

  @EntityField()
  description: string | string[] = ''

  @EntityField()
  note: string = ''

  @EntityField()
  paramsDescription: {
    [key: string]: string
  }

  @EntityFunction()
  getPrompt(): string {
    return `You are a contextual action generating AI designed to generate JSON for actions, each of which must conform to a strict schema. You will be provided context, from which you are to extract the relevant information to construct the action based on a specific user "hint" or "query".

    The schema for the action is
    type ${this.command} = ${this.zodSchema}
    
    Respond with only JSON conforming to the ${this.command} type. Do not include any additional information. Only JSON will be accepted.
    
    The user query for this specific request is: `
  }

  //   You are a contextual action generating AI designed to generate JSON for actions, each of which must conform to a strict schema. You will be provided context, from which you are to extract the relevant information to construct the action based on a specific user "hint" or "query".

  // The schema for the action is
  // type WriteFiles = {
  //   /* ...fields... */
  // }

  // You have the following previous message content to extract context from:
  // AI: blah blah
  // User: blah blah blah
  // AI: blah

  // The user query for this specific request is:
  // {{user query goes here}}

  // Respond with only JSON conforming to the `WriteFiles` type. Do not include any additional information. Only JSON will be accepted.

  // @EntityFunction()
  // getPrompt(): string {
  //   return `Ensure to complete the command fully (e.g., '/file' requires the full file path and contents). Please return a JSON object without any additional notes. It's important that your response strictly adheres to the following schema: ${
  //     this.zodSchema
  //   }.
  //   command: ${this.command}.
  //   description: ${this.description}.
  //   paramsDescription: ${JSON.stringify(this.paramsDescription)}.
  //   example: ${this.example}.
  //   note: ${this.note}.

  //   The command will autocomplete based on my query with parameters: (${Object.keys(
  //     this.paramsDescription
  //   ).join(', ')}, which may vary depending on the query).`
  // }

  private zodSchemaToString(schema: ZodTypeAny): string {
    function objectFieldsToString(shape: {
      [key: string]: ZodTypeAny
    }): string {
      let fields = Object.keys(shape)
        .map((key) => {
          return `${key}: ${zodTypeToString(shape[key])}`
        })
        .join(', ')
      return `{${fields}}`
    }

    function zodTypeToString(type: ZodTypeAny): string {
      console.log(type)
      const typeDef = type._def

      switch (typeDef.typeName) {
        case 'ZodString':
          return typeDef.isOptional ? 'z.string().optional()' : 'z.string()'
        case 'ZodNumber':
          return typeDef.isOptional ? 'z.number().optional()' : 'z.number()'
        case 'ZodBoolean':
          return typeDef.isOptional ? 'z.boolean().optional()' : 'z.boolean()'
        case 'ZodLiteral':
          return `z.literal('${typeDef.value}')`
        case 'ZodObject':
          return `z.object(${objectFieldsToString(typeDef.shape())})`
        case 'ZodArray':
          return `z.array(${zodTypeToString(typeDef.type)})`
        case 'ZodOptional':
          const innerTypeStr = zodTypeToString(typeDef.innerType)
          return `${innerTypeStr}.optional()`
        case 'ZodRecord':
          return 'z.record()'
        case 'ZodUnion':
          const unionTypes = typeDef.options.map(zodTypeToString).join(' | ')
          return `z.union([${unionTypes}])`
        // Add more cases as needed

        default:
          throw new Error(`Unsupported Zod type: ${typeDef.typeName}`)
      }
    }

    return zodTypeToString(schema)
  }

  // Function to parse individual schema values - parseZodSchemaString
  private parseSchemaValue = (valueString: string) => {
    valueString = valueString.trim()

    if (valueString.startsWith('z.string()')) {
      return valueString.endsWith('.optional()') ? z.string().optional() : z.string()
    }
    if (valueString.startsWith('z.number()')) {
      return valueString.endsWith('.optional()') ? z.number().optional() : z.number()
    }
    if (valueString.startsWith('z.boolean()')) {
      return valueString.endsWith('.optional()') ? z.boolean().optional() : z.boolean()
    }
    if (valueString.startsWith('z.literal(')) {
      const match = valueString.match(/^z\.literal\((.*)\)$/)
      if (!match) throw new Error('Invalid literal format')

      let literalValue = match[1].trim()
      if (literalValue.startsWith(`'`) && literalValue.endsWith(`'`)) {
        literalValue = literalValue.slice(1, -1)
      }

      return z.literal(literalValue)
    }
    if (valueString.startsWith('z.object(')) {
      return this.parseObjectSchema(valueString)
    }
    if (valueString.startsWith('z.array(')) {
      return this.parseArraySchema(valueString)
    }
    if (valueString.startsWith('z.record(')) {
      return z.record(z.any(), z.any())
    }
    if (valueString.startsWith('z.union(')) {
      return this.parseUnionSchema(valueString)
    }
    if (valueString.startsWith('[')) {
      return this.parseBracketedArraySchema(valueString)
    }

    // Add additional cases for other Zod types if necessary

    throw new Error(`Unsupported schema value: ${valueString}`)
  }

  // Function to parse object schemas - parseZodSchemaString
  private parseObjectSchema = (objectSchemaString) => {
    const fields = objectSchemaString.match(/\{(.*)\}/s)?.[1].trim()
    if (!fields) {
      throw new Error('Invalid object schema format')
    }

    const fieldPairs = fields.split(',').map((field) => field.trim())
    const schemaFields = {}

    fieldPairs.forEach((pair) => {
      const [key, value] = pair.split(/:(.+)/).map((part) => part.trim())
      if (key && value) {
        schemaFields[key] = this.parseSchemaValue(value)
      } else {
        throw new Error(`Malformed field pair: ${pair}`)
      }
    })

    return z.object(schemaFields).strict() // Apply strict here to each object in the union
  }

  // Function to parse array schemas - parseZodSchemaString
  private parseArraySchema = (arraySchemaString: string) => {
    const innerTypeString = arraySchemaString.match(/\((.*)\)/s)?.[1].trim()
    if (!innerTypeString) {
      throw new Error('Invalid array schema format')
    }

    const innerType = this.parseSchemaValue(innerTypeString)
    return z.array(innerType)
  }

  // Function to parse union schemas - parseZodSchemaString
  private parseUnionSchema = (unionSchemaString) => {
    const typesString = unionSchemaString.match(/\[(.*)\]/s)?.[1].trim()
    if (!typesString) {
      throw new Error('Invalid union schema format')
    }

    const typeStrings = this.splitUnionTypes(typesString)
    const types = typeStrings.map((typeStr) => this.parseSchemaValue(typeStr))

    return z.union(types)
  }

  // Function to split the union types at the correct points - parseZodSchemaString
  private splitUnionTypes = (typesString) => {
    const typeStrings: string[] = []
    let depth = 0,
      lastIndex = 0,
      inString = false

    for (let i = 0; i < typesString.length; i++) {
      const char = typesString[i]
      if (char === '"' && typesString[i - 1] !== '\\') {
        inString = !inString
      }
      if (!inString) {
        if (char === '{') depth++
        if (char === '}') depth--
      }
      if (char === '|' && depth === 0 && !inString) {
        typeStrings.push(typesString.slice(lastIndex, i).trim())
        lastIndex = i + 1
      }
    }
    typeStrings.push(typesString.slice(lastIndex).trim()) // Add the last segment

    return typeStrings
  }
  // Function - parseZodSchemaString
  private parseBracketedArraySchema = (arraySchemaString: string) => {
    let innerTypeString = ''
    let bracketLevel = 0
    let start = false

    for (let char of arraySchemaString) {
      if (char === '[') {
        bracketLevel++
        if (bracketLevel === 1) {
          start = true
          continue
        }
      } else if (char === ']') {
        bracketLevel--
        if (bracketLevel === 0) {
          break
        }
      }

      if (start && bracketLevel > 0) {
        innerTypeString += char
      }
    }

    if (!innerTypeString) {
      throw new Error('Invalid bracketed array schema format')
    }

    const innerType = this.parseSchemaValue(innerTypeString.trim())
    return z.array(innerType)
  }

  private parseZodSchemaString(schemaString: string) {
    return this.parseSchemaValue(schemaString)
  }

  private zodSchemaToReadable(schema: ZodTypeAny): string {
    switch (schema._def.typeName) {
      case 'ZodString':
        return schema.isOptional() ? 'string | undefined' : 'string'

      case 'ZodNumber':
        return schema.isOptional() ? 'number | undefined' : 'number'

      case 'ZodBoolean':
        return schema.isOptional() ? 'boolean | undefined' : 'boolean'

      case 'ZodDate':
        return schema.isOptional() ? 'Date | undefined' : 'Date'

      case 'ZodLiteral':
        const literalValue = schema._def.value
        return typeof literalValue === 'string' ? `'${literalValue}'` : String(literalValue)

      case 'ZodObject':
        const objectSchema = schema as ZodObject<any>
        const objectFields = Object.entries(objectSchema.shape).map(
          ([key, value]) => `${key}: ${this.zodSchemaToReadable(value as ZodTypeAny)}`,
        )
        return `{ ${objectFields.join(', ')} }`

      case 'ZodArray':
        const arrayElementSchema = schema._def.type
        return `${this.zodSchemaToReadable(arrayElementSchema)}[]`

      case 'ZodOptional':
        const optionalSchema = schema as ZodOptional<ZodTypeAny>
        return `${this.zodSchemaToReadable(optionalSchema.unwrap())} | undefined`

      case 'ZodUnion':
        // Assuming schema is ZodUnion, but casting to a more specific type
        const unionSchema = schema as ZodUnion<[ZodTypeAny, ...ZodTypeAny[]]>
        const unionOptions = unionSchema._def.options.map((option) =>
          this.zodSchemaToReadable(option as ZodTypeAny),
        )
        return unionOptions.join(' | ')

      // Add more cases as needed for other Zod types like ZodRecord, ZodTuple, etc.

      default:
        throw new Error(`Unsupported Zod type: ${schema._def.typeName}`)
    }
  }

  // Function to convert a string to its correct type - processCliString
  private convertToCorrectType(value: any): any {
    if (typeof value === 'string') {
      if (!isNaN(parseFloat(value)) && isFinite(value as any)) {
        return parseFloat(value)
      } else if (value.toLowerCase() === 'true') {
        return true
      } else if (value.toLowerCase() === 'false') {
        return false
      }
      return value // return as string if none of the above conditions are true
    } else {
      // Handle the case where value is not a string
      // You may need to handle other data types here depending on your application's needs
      return value
    }
  }

  // Function to build the parameters object - processCliString
  private buildParamsObject(params: any[], keys: string[]): any {
    return keys.reduce((obj, key, index) => {
      obj[key] = this.convertToCorrectType(params[index])
      return obj
    }, {})
  }

  // Function to extract parameters from a commandString - processCliString
  private extractAndConvertParameters(commandString: string): any[] {
    const parameters: any[] = []
    if (typeof commandString !== 'string') {
      return parameters
    }
    const matches = commandString.match(/\/\w+|"[^"]+"/g)
    if (matches) {
      matches.forEach((match, index) => {
        if (index === 0) {
          return
        } // Skip the command itself
        const stripped = match.replace(/"/g, '')
        parameters.push(this.convertToCorrectType(stripped))
      })
    }
    return parameters
  }

  @EntityFunction()
  processCliString(commandString: string): ZodResult<object> {
    const schema = this.getZod()

    // Extract parameters
    const parameters = this.extractAndConvertParameters(commandString)

    // Match parameters to schema
    if (schema instanceof ZodUnion) {
      for (const option of schema.options) {
        const optionKeys = Object.keys(option.shape)
        if (parameters.length === optionKeys.length) {
          const result = this.buildParamsObject(parameters, optionKeys)
          if (schema.safeParse(result).success) {
            return result
          }
        }
      }
    } else if (schema instanceof ZodObject) {
      const schemaKeys = Object.keys(schema.shape)
      if (parameters.length === schemaKeys.length) {
        const result = this.buildParamsObject(parameters, schemaKeys)
        if (schema.safeParse(result).success) {
          return result
        }
      }
    }

    // If no schema matches or validation fails, return undefined
    return undefined
  }

  // @EntityFunction()
  setZod(schema: string | ZodTypeAny) {
    if (typeof schema === 'string') {
      this.zodSchema = schema
    } else {
      this.zodSchema = this.zodSchemaToString(schema)
    }
  }

  // @EntityFunction()
  getZod(): ZodTypeAny {
    zodSchemaToTypeString
    return this.parseZodSchemaString(this.zodSchema)
  }

  @EntityFunction()
  getReadableSchema(): string {
    return this.zodSchemaToReadable(this.parseZodSchemaString(this.zodSchema))
  }
}
