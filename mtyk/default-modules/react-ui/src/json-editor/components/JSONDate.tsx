import { format } from 'date-fns'
import { ChangeEvent } from 'react'
import { DefaultValueButton } from './DefaultValueButton'
import { Input } from './InputProps'
import { useJSONContext } from './JSONEditor'
import { JSONValueProps } from './JSONValue'

export function JSONDate({ value: _value, path, diff, schema }: JSONValueProps) {
  const { handleChange } = useJSONContext()
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    // coerce yyyy-MM-dd back to a Date
    try {
      const date = new Date(event.target.value)
      if (date.toString() === 'Invalid Date') {
        throw new Error('Invalid date')
      }
      handleChange(path, date)
    } catch (e) {
      console.error(e)
      // handleChange(path, event.target.value)
    }
  }
  let value = _value
  try {
    if (typeof value === 'string') {
      value = format(new Date(value), 'yyyy-MM-dd')
    }
  } catch (e) {
    console.error(e)
  }

  return (
    <div className="w-full">
      <Input type="date" value={value} onChange={onChange} />
      {/* <ErrorsForPath path={path} /> */}

      <DefaultValueButton path={path} schema={schema} />
    </div>
  )
}
