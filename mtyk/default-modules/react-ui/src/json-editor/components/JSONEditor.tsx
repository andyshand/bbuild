import { cloneDeep, set } from 'modules/dash'
import { createContext, useContext, useMemo, useState } from 'react'
import * as z from 'zod'
import { JSONObject } from './JSONObject'
import { JSONValueProps } from './JSONValue'
import { createSchemaFromObject } from './createSchemaFromObject'

interface JSONEditorProps {
  json: any
  schema?: z.ZodType<any, any, any>
  customRenderers?: Record<string, (props: JSONValueProps) => JSX.Element>
  onParsed?: (json: any) => void
}

type ZodError = { path: (string | number)[]; message: string }
interface JSONContextProps {
  json: any
  errors: ZodError[]
  handleChange: (path: (string | number)[], newValue: any) => void
}

const JSONContext = createContext<JSONContextProps | undefined>(undefined)

function JSONEditor({
  json,
  schema: _schema,
  customRenderers = {},
  onParsed,
}: JSONEditorProps) {
  const [errors, setErrors] = useState<any[]>([])
  const [localJson, setLocalJson] = useState<any>(json)
  const schema = useMemo(() => {
    setLocalJson(json)
    if (!_schema) {
      return createSchemaFromObject(json)
    } else {
      return _schema
    }
  }, [_schema, JSON.stringify(json)])

  const handleChange = (path: (string | number)[], newValue: any) => {
    const newJson = updateJson(json, path, newValue)
    setLocalJson(newJson)

    try {
      if (schema) {
        schema.parse(newJson)
      }

      onParsed?.(newJson)
      setErrors([])
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error.errors)
      } else {
        throw error
      }
    }
  }

  const updateJson = (json: any, path: (string | number)[], newValue: any): any => {
    if (path.length === 0) {
      return newValue
    }

    const cloned = cloneDeep(json)
    set(cloned, path, newValue)
    return cloned
  }

  return (
    <JSONContext.Provider value={{ json: localJson, errors, handleChange }}>
      <div className="json-editor">
        <JSONObject path={[]} value={localJson ?? {}} schema={schema as z.ZodObject<any>} />
      </div>
    </JSONContext.Provider>
  )
}

export const useJSONContext = () => {
  const context = useContext(JSONContext)
  if (!context) {
    throw new Error('useJSONContext must be used within a JSONContextProvider')
  }
  return context
}

export default JSONEditor
