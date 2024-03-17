import { startCase } from 'modules/dash'
import MTYKSelect from '../../forms/components/MTYKSelect'
import { useJSONContext } from './JSONEditor'
import { JSONValueProps } from './JSONValue'

export function JSONEnum({ value, path, diff, schema, multi }: JSONValueProps) {
  const { handleChange } = useJSONContext()
  const opts = schema._def.values
  return (
    <MTYKSelect
      isMulti={multi}
      value={value}
      onChange={(newVal) => {
        if (multi) {
          handleChange(path, newVal)
        } else {
          handleChange(path, newVal[0])
        }
      }}
      options={opts.map((o) => ({ label: startCase(o), value: o }))}
    />
  )
}
