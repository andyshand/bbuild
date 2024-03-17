import * as z from 'zod'
import { getRealSchema } from './getRealSchema'
import { JSONEnum } from './JSONEnum'
import { JSONValueProps } from './JSONValue'
import { getRendererForValue } from './getRendererForValue'

interface JSONArrayProps extends JSONValueProps {
  schema?: z.ZodArray<any>
}
export function JSONArray({ value, onChange, path, diff, schema }: JSONArrayProps) {
  const handleAdd = () => {
    const newItem = schema?.element?.default()
    onChange(path, [...value, newItem])
  }

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(path, newValue)
  }

  const innerType = schema?._def.type
  const realInner = getRealSchema(innerType)
  if (realInner instanceof z.ZodEnum) {
    return <JSONEnum {...{ value, onChange, path, diff, schema: realInner, multi: true }} />
  }

  const arr = Array.isArray(value) ? value : []

  return (
    <div className="json-array">
      {arr.map((item, index) => {
        const { component: Renderer, schema: sschema2 } = getRendererForValue(
          item,
          schema.element
        )
        return (
          <div key={index} className="array-item">
            <Renderer
              path={[...path, index]}
              value={item}
              onChange={onChange}
              diff={diff?.children?.[index]}
              schema={sschema2}
            />
            <button onClick={() => handleRemove(index)}>-</button>
          </div>
        )
      })}
      <button onClick={handleAdd}>+</button>
    </div>
  )
}
