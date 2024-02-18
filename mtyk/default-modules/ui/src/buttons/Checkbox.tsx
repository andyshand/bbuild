import React from 'react'
export interface CheckboxProps {
  children: any
  action: any
}
export interface CheckboxRefHandle {}

export default function Checkbox(props: CheckboxProps) {
  const { children, action } = props
  return <button onClick={action}>{children}</button>
}
