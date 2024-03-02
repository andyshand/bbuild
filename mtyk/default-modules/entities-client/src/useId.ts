import * as nano from 'nanoid'
import { useRef } from 'react'

export const useId = (obj) => {
  const objKey = JSON.stringify(obj)
  const ref = useRef(nano.nanoid())
  return String(ref.current) + objKey
}
