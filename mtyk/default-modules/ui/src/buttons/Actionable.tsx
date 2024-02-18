import cloneAndAddProps from 'modules/react/elements/cloneAndAddProps'
import React from 'react'
import useActionable from '../hooks/useActionable'
export type ButtonProps = Parameters<typeof useActionable>[0] & {
  children: any
}
export interface ButtonRefHandle {}

export default function Actionable(props: ButtonProps) {
  const { children } = props
  const actionableProps = useActionable(props)
  return <>{cloneAndAddProps(children, actionableProps)}</>
}
