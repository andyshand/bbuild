import React, { forwardRef } from 'react'
import { Observable } from 'rxjs'
import useActionable from '../hooks/useActionable'

export interface ActionProps<T> {
  action: () => Promise<T> | Observable<T> | T
  id?: string
  disabled?: boolean
  label: string
  [key: string]: any
}

export default function makeActionable<
  P,
  C extends React.FC<P & ActionProps<any>>
>(Component: C) {
  return forwardRef((props: P & ActionProps<any>, ref) => {
    const actionable = useActionable(props)
    const C = Component as any
    return <C {...props} {...actionable.props} ref={ref} />
  })
}
