import Entity from 'modules/entities/Entity'
import { ZodSchema } from 'zod'
import EntityField from 'modules/entities/EntityField'
import zodSchemaToTypeString from '../../zodSchemaToTypeString'
import { IEntityManager } from 'modules/entities/IEntityManager'
import { globalDepContext } from 'modules/deps/createDepContext'
import { Deps } from '../../Deps'
import { ParseMessage } from 'modules/llm/ParseMessage'

export class TranslationFunction extends Entity {
  @EntityField()
  functionString: string

  @EntityField()
  inputSchema: string

  @EntityField()
  outputSchema: string

  @EntityField()
  name: string

  translate(input: any) {
    const newFunction = new Function('output', this.functionString)
    const result = newFunction(input)
    return result
  }

  static async find(entityManager: IEntityManager, input: any, output: any) {
    const functions = await entityManager.find(TranslationFunction, {
      inputSchema: zodSchemaToTypeString(input, 'Input'),
      outputSchema: zodSchemaToTypeString(output, 'Output'),
    })

    return functions[0]
  }

  static async findOrCreate(
    entityManager: IEntityManager,
    input: any,
    output: any,
    name: string
  ) {
    const existing = await TranslationFunction.find(
      entityManager,
      input,
      output
    )
    if (existing) {
      return existing
    }

    return TranslationFunction.create(entityManager, input, output, name)
  }

  static async create(
    entityManager: IEntityManager,
    inputSchema: ZodSchema,
    outputSchema: ZodSchema,
    name: string
  ) {
    const inputTypeStr = zodSchemaToTypeString(inputSchema, 'Input')
    const outputTypeStr = zodSchemaToTypeString(outputSchema, 'Output')

    const { getCompletion } = globalDepContext.provideSync({
      getCompletion: Deps.getCompletion,
    })

    const prompt = `Write a NodeJS, ES6 function to convert the input to the output. The input is a ${inputTypeStr} and the output should be a ${outputTypeStr}.

The function should be a pure function, with no side effects. Do not use any external libraries.

Only include the function code, with no additional explanation or comments.`

    const result = await getCompletion(prompt, { model: 'gpt-4' })
    const parsed = ParseMessage.code(result)

    // TODO validate it actually works before saving
    return entityManager.create(TranslationFunction, {
      inputSchema: inputTypeStr,
      outputSchema: outputTypeStr,
      name,
      functionString: parsed,
    })
  }
}
