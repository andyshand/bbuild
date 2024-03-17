import { ChangeEvent } from 'react'
import { useJSONContext } from './JSONEditor'
import { JSONValueProps } from './JSONValue'
import { Input } from './InputProps'
import { DefaultValueButton } from './DefaultValueButton'

export function JSONNumber({ value, path, diff, schema }: JSONValueProps) {
  const { handleChange } = useJSONContext()
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleChange(path, parseFloat(event.target.value))
  }
  return (
    <div className="w-full">
      <Input type="number" value={value} onChange={onChange} />
      {/* <ErrorsForPath path={path} /> */}

      <DefaultValueButton path={path} schema={schema} />
    </div>
  )
}
