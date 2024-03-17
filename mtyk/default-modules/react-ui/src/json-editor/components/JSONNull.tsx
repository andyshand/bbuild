import { JSONValueProps } from './JSONValue'

export function JSONNull({ path, value, onChange, diff }: JSONValueProps) {
  return <div className="json-null">null</div>
}
