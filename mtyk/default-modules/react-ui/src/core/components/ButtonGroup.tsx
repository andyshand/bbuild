import { ReactNode } from 'react'

export interface ButtonGroupProps {
  children: ReactNode
  className?: string
}

export default function ButtonGroup(props: ButtonGroupProps) {
  const { children, className } = props
  return <div className={`flex flex-row gap-2 ${className} `}>{children}</div>
}
