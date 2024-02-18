import { ReactNode } from 'react'

export interface TabbedContentProps {
  children: ReactNode
  className?: string
}

export default function TabbedContent(props: TabbedContentProps) {
  const { children, className } = props
  return (
    <div className={`h-full flex flex-col p-5 ${className ?? ''}`}>
      {children}
    </div>
  )
}
