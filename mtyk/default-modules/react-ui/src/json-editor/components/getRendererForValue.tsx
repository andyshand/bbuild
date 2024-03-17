import * as z from 'zod'
import { JSONArray } from './JSONArray'
import { JSONBoolean } from './JSONBoolean'
import { JSONEnum } from './JSONEnum'
import { JSONNull } from './JSONNull'
import { JSONNumber } from './JSONNumber'
import { JSONObject } from './JSONObject'
import { getRealSchema } from './getRealSchema'
import { JSONString } from './JSONString'
import { JSONFile } from './JSONFile'
import { JSONDate } from './JSONDate'

export function getRendererForValue(value: any, schema) {
  let component = null

  if (schema) {
    if (schema._customId) {
      let customType = schema['_customId']
      if (customType === 'file') {
        return { component: JSONFile, schema }
      }
    }
    if (schema instanceof z.ZodDefault || schema instanceof z.ZodOptional) {
      return getRendererForValue(value, getRealSchema(schema))
    }
    if (schema instanceof z.ZodObject || schema instanceof z.ZodRecord) {
      component = JSONObject
    } else if (schema instanceof z.ZodArray) {
      component = JSONArray
    } else if (schema instanceof z.ZodString) {
      component = JSONString
    } else if (schema instanceof z.ZodNumber) {
      component = JSONNumber
    } else if (schema instanceof z.ZodBoolean) {
      component = JSONBoolean
    } else if (schema instanceof z.ZodNull) {
      component = JSONNull
    } else if (schema instanceof z.ZodEnum) {
      component = JSONEnum
    } else if (schema instanceof z.ZodDate) {
      component = JSONDate
    }

    if (component) return { component, schema }
  }

  switch (typeof value) {
    case 'string':
      component = JSONString
      break
    case 'number':
      component = JSONNumber
      break
    case 'boolean':
      component = JSONBoolean
      break
    case 'object':
      if (Array.isArray(value)) {
        component = JSONArray
      } else if (value === null) {
        component = JSONNull
      } else {
        component = JSONObject
      }
      break
    default:
      throw new Error(`No renderer for ${typeof value}`)
  }

  return { component, schema: null }
}
