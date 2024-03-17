import { ChangeEvent } from 'react'
import { Checkbox } from './Checkbox'
import { useJSONContext } from './JSONEditor'
import { JSONValueProps } from './JSONValue'

export function JSONBoolean({ value, path, diff }: JSONValueProps) {
  const { handleChange } = useJSONContext()
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleChange(path, event.target.checked)
  }

  return <Checkbox className="self-center" checked={value} onChange={onChange} />
}
