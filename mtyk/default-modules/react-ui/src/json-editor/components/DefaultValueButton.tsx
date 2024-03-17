import { SlReload } from 'react-icons/sl'
import * as z from 'zod'
import { useJSONContext } from './JSONEditor'

export function DefaultValueButton({
  path,
  schema,
}: {
  path: (string | number)[]
  schema: z.ZodType<any, any>
}) {
  const defaultValue = schema?._def?.defaultValue
  const ctx = useJSONContext()

  if (!defaultValue) {
    return null
  }

  return (
    <SlReload
      onClick={() => {
        ctx.handleChange(path, defaultValue)
      }}
    />
  )
}
