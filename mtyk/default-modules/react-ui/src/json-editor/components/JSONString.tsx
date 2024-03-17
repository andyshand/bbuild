import { ChangeEvent } from 'react'
import { useJSONContext } from './JSONEditor'
import { JSONValueProps } from './JSONValue'
import { Input } from './InputProps'
import { usePathErrors } from './usePathErrors'

export function JSONString({ value, className, path, schema, diff }: JSONValueProps) {
  const { handleChange } = useJSONContext()
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleChange(path, event.target.value)
  }

  const schemaDefault = schema?.['_def']?.defaultValue
  const errors = usePathErrors(path)

  return (
    <div className="w-full">
      <Input
        textarea
        type="text"
        value={value}
        onChange={onChange}
        className={`${className} ${errors.length > 0 ? 'border-red-500' : ''}`}
      />
      {/* <ErrorsForPath path={path} /> */}
    </div>
  )
}
