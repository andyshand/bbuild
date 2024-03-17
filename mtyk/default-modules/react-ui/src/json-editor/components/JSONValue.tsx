import * as z from 'zod'
import { ErrorsForPath } from './ErrorsForPath'
import { JSONObject } from './JSONObject'
import { getRendererForValue } from './getRendererForValue'

export function JSONValue({ value, path, diff, schema, ...rest }: JSONValueProps) {
  const { component: Renderer, schema: schemaa } = getRendererForValue(value, schema)
  return (
    <div className="w-full">
      <Renderer value={value} path={path} diff={diff} schema={schemaa} {...rest} />
      {Renderer !== JSONObject && <ErrorsForPath path={path} />}
    </div>
  )
}
export interface JSONValueProps {
  multi?: boolean
  path: (string | number)[]
  value: any
  schema?: z.ZodType<any, any, any>
  className?: string
  onChange?: (path: (string | number)[], newValue: any) => void
  diff?: any
  collapsed?: boolean
  setCollapsed?: (collapsed: boolean) => void
}
