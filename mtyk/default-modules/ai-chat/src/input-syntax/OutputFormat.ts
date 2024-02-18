import z from 'zod';
import { startCase, capitalize } from 'lodash'
import { createAIChatMessage } from '../attachments/AIDataType';
import zodSchemaToTypeString from '../zodSchemaToTypeString';
import { ParseMessage } from '../formattings/parseMessage';

const FileSchema = z.object({ path: z.string(), type: z.literal('file'), contents: z.string() })
const FilePathSchema = z.object({ path: z.string(), type: z.literal('file') })
const FileGroupSchema = z.object({ type: z.literal('file-group'), files: z.array(FileSchema) })
const FilePathGroupSchema = z.object({ type: z.literal('file-group'), files: z.array(FilePathSchema) })

const formatToZodSchema = {
  // 'file': FileSchema,
  'files': z.array(FileSchema),
  // 'file-path': FilePathSchema,
  'file-paths': z.array(FilePathSchema),
  // 'file-group': FileGroupSchema,
  'file-groups': z.array(FileGroupSchema),
  // 'file-path-group': FilePathGroupSchema,
  'file-path-groups': z.array(FilePathGroupSchema),
}

const dashCaseToTitleCase = (str: string) => startCase(str).replace(/\s/g, '').replace(/s$/g, '')

export default function getFormatPrompt(format?: string) {
  const schema = formatToZodSchema[format ?? '']
  if (!schema) {
    return ''
  }
  const typeString = zodSchemaToTypeString(schema._def.type, dashCaseToTitleCase(format ?? ''))
  return `\nFormat your response as a JSON array where each element conforms to ${typeString}. Ensure you include all required fields, including literal "type" strings. Do not include additional explanation. Only the JSON object will be accepted.`
}

export function createFormattedResult(format: string | undefined, result: any) {
  let parsedResult;
  try {
    parsedResult = ParseMessage.json(result)
  } catch (e) {
    console.error('Error parsing result to JSON:', e);
    parsedResult = result;
  }

  const schema = formatToZodSchema[format ?? '']
  try {
    if (schema) {
      return schema.parse(parsedResult)
    } else {
      return createAIChatMessage({ content: result, role: 'assistant' });
    }
  } catch (e) {
    console.error('Error parsing result to schema:', parsedResult, e);
    if (typeof parsedResult === 'string') {
      return createAIChatMessage({ content: parsedResult, role: 'assistant' });
    }
    else {
      return parsedResult
    }
  }
}

