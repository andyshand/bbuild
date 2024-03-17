import { omit, startCase } from 'modules/dash'
import { useState } from 'react'
import { FaMinusCircle } from 'react-icons/fa'
import * as z from 'zod'
import { Container } from './Container'
import { useJSONContext } from './JSONEditor'
import { JSONValueProps } from './JSONValue'
import { Input } from './InputProps'
import { SchemaHelp } from './SchemaHelp'
import { genUniqueKey } from './genUniqueKey'
import { AddButton } from './AddButton'
import { JSONValue } from './JSONValue'
import { getRealSchema } from './getRealSchema'

export function JSONObject(props: JSONObjectProps) {
  const { value: _value, path, schema, className, ...rest } = props
  const value = typeof _value === 'object' && _value !== null ? _value : {}

  const { handleChange } = useJSONContext()
  const onChange = (path: (string | number)[], newValue: any) => {
    handleChange(path, newValue)
  }

  const realSchema = getRealSchema(schema)
  const shape = realSchema?.shape ?? {}

  const [editingKey, setEditingKey] = useState(null)
  const [tempKey, setTempKey] = useState('')
  const [expandedKeys, setExpandedKeys] = useState([])

  const handleAdd = () => {
    const newKey = genUniqueKey(value)
    try {
      const newValue =
        shape?.[newKey]?.parse() ??
        ('valueType' in schema._def ? (schema._def.valueType as any)?.parse() : null) ??
        Object.values(schema.parse({}))[0] ??
        ''
      onChange(path, { ...value, [newKey]: newValue })
    } catch (e) {
      onChange(path, { ...value, [newKey]: {} })
      console.error(e)
    }
    setExpandedKeys([...expandedKeys, newKey])
  }

  const handleRemove = (key: string) => {
    const { [key]: removed, ...newValue } = value
    onChange(path, newValue)
  }

  const handleBlur = (oldKey: string) => {
    if (tempKey && tempKey !== oldKey) {
      const updatedValue = { ...value }
      updatedValue[tempKey] = updatedValue[oldKey]
      delete updatedValue[oldKey]
      onChange(path, updatedValue)
    }
    setEditingKey(null)
  }

  const handleKeyChange = (key: string) => {
    setTempKey(key)
  }

  const canAddNew = getRealSchema(schema) instanceof z.ZodRecord
  const topLevel = path.length === 0
  return (
    <Container
      topLevel={topLevel}
      setCollapsed={props.setCollapsed}
      path={path}
      label={`${path.join('.')}`}
      type="Object"
      className={`${className}`}
      {...rest}
    >
      {Object.entries(schema?.shape ?? value).map(([key, schemaVal]) => {
        const val = value[key]

        const editableKey = getRealSchema(schema) instanceof z.ZodRecord
        const removable = schema?.safeParse(omit(value, key)).success
        const isExpanded =
          expandedKeys.includes(key) ||
          // Object.keys(value).length <= 1 ||
          path.length === 0 ||
          typeof val === 'string' ||
          typeof val === 'number' ||
          typeof val === 'boolean'

        const isOptional = schemaVal instanceof z.ZodOptional

        const valueSchema =
          Object.keys(shape).length === 0
            ? // it's a record, so use value from _def
              (schema._def as any).valueType
            : schemaVal

        return (
          <div key={key} className="flex flex-row gap-2 items-start px-1 py-1 w-full">
            <div>
              <div
                className={`${
                  topLevel ? 'w-[10em]' : 'w-[8em]'
                } flex-shrink-0 flex flex-row gap-1 sticky top-0`}
              >
                {/* {removable && <button onClick={() => handleRemove(key)}>-</button>} */}
                {editableKey ? (
                  <Input
                    className="w-full inline-block"
                    value={editingKey === key ? tempKey : key}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    onBlur={() => handleBlur(key)}
                    readOnly={!editableKey}
                    onFocus={() => {
                      handleKeyChange(key)
                      setEditingKey(key)
                    }}
                  />
                ) : (
                  <span
                    className={` ${
                      topLevel ? `font-medium text-[0.91em]` : `font-semibold text-[0.85em]`
                    }`}
                  >
                    {startCase(key)} {!isOptional && <span className="text-red-500">*</span>}
                  </span>
                )}
                <SchemaHelp schema={valueSchema} />
              </div>
            </div>
            {editableKey && (
              <FaMinusCircle
                onClick={() => handleRemove(key)}
                className={`text-red-500 text-sm cursor-pointer relative top-2`}
              />
            )}

            <JSONValue
              path={[...path, key]}
              value={val ?? ''}
              schema={valueSchema}
              collapsed={!isExpanded}
              setCollapsed={(collapsed) => {
                if (collapsed) {
                  setExpandedKeys(expandedKeys.filter((k) => k !== key))
                } else {
                  setExpandedKeys([...expandedKeys, key])
                }
              }}
              className="flex-grow"
            />
          </div>
        )
      })}
      {canAddNew && <AddButton className="mt-2" onClick={handleAdd} />}
    </Container>
  )
}
export interface JSONObjectProps extends JSONValueProps {
  schema?: z.ZodObject<any>
}
