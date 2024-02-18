import React from 'react'
export interface ButtonProps {
  children: any
  action: any
}
export interface ButtonRefHandle {}

export default function Button(props: ButtonProps) {
  const { children, action } = props
  return <button onClick={action}>{children}</button>
}
